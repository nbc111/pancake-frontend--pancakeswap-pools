import { CHAIN_ID, STAKING_CONTRACT_ADDRESS } from 'config/staking/constants'
import { writeCommissionsForRewardClaim } from 'lib/server/referral/commissionFromRewardPaid'
import {
  countRewardPaidRowsPg,
  ensureStakingRewardIndexerSchema,
  getLastScannedToBlockPg,
  insertRewardPaidRowPg,
  setLastScannedToBlockPg,
  withReferralPool,
} from 'lib/server/staking/rewardPaidStorePg'
import { createPublicClient, decodeEventLog, defineChain, http, parseAbiItem } from 'viem'

const rewardPaidEvent = parseAbiItem(
  'event RewardPaid(uint256 indexed poolIndex, address indexed user, uint256 reward)',
)

const stakingRewardAbi = [rewardPaidEvent] as const

function getIndexerRpcUrl(): string {
  const u =
    process.env.NBC_STAKING_INDEXER_RPC_URL?.trim() ||
    process.env.NEXT_PUBLIC_NBC_RPC_URL?.trim() ||
    'https://rpc.nbcex.com'
  return u
}

/** NBC 公共 RPC 对 eth_getLogs 常限宽 ≤1024 块；可用 NBC_STAKING_INDEXER_BLOCK_CHUNK / CHUNK_MAX 调整 */
function getBlockChunkSize(): bigint {
  const chunk = Number(process.env.NBC_STAKING_INDEXER_BLOCK_CHUNK || '1000')
  const cap = Number(process.env.NBC_STAKING_INDEXER_BLOCK_CHUNK_MAX || '1024')
  const size = !Number.isFinite(chunk) || chunk < 1 ? 1000 : Math.floor(chunk)
  const max = !Number.isFinite(cap) || cap < 1 ? 1024 : Math.floor(cap)
  return BigInt(Math.min(size, max))
}

function getNbcPublicClient() {
  const rpcUrl = getIndexerRpcUrl()
  const chain = defineChain({
    id: CHAIN_ID,
    name: 'NBC',
    nativeCurrency: { name: 'NBC', symbol: 'NBC', decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } },
  })
  return createPublicClient({ chain, transport: http(rpcUrl) })
}

export type SyncRewardPaidResult = {
  rpcUrlHost: string
  fromBlock: string
  toBlock: string
  chunksProcessed: number
  logsSeen: number
  rowsInserted: number
  /** 本次新插入的 RewardPaid 行自动生成的返佣明细行数 */
  commissionRowsInserted: number
  lastScannedToBlock: string
  totalRowsInDb: number
}

export type SyncRewardPaidOptions = {
  /** 覆盖起始块（含）；若不设且无历史游标则用环境变量或 0 */
  fromBlock?: bigint
  /** 覆盖结束块（含）；默认链上最新块 */
  toBlock?: bigint
  /** 最多处理多少个块区间（防止 HTTP 超时） */
  maxChunks?: number
}

export async function syncStakingRewardPaidLogs(options: SyncRewardPaidOptions = {}): Promise<SyncRewardPaidResult> {
  const publicClient = getNbcPublicClient()
  const chunkSize = getBlockChunkSize()
  const maxChunks = options.maxChunks ?? 200

  const head = options.toBlock ?? (await publicClient.getBlockNumber())

  const rpcUrl = getIndexerRpcUrl()
  let rpcUrlHost: string
  try {
    rpcUrlHost = new URL(rpcUrl).host
  } catch {
    rpcUrlHost = '(invalid-url)'
  }

  return withReferralPool(async (pg) => {
    await ensureStakingRewardIndexerSchema(pg)

    let fromBlock: bigint
    if (options.fromBlock !== undefined) {
      fromBlock = options.fromBlock
    } else {
      const last = await getLastScannedToBlockPg(pg, CHAIN_ID)
      if (last !== null) {
        fromBlock = last + 1n
      } else {
        const envStart = process.env.NBC_STAKING_REWARD_INDEX_FROM_BLOCK?.trim()
        fromBlock = envStart && /^\d+$/.test(envStart) ? BigInt(envStart) : 0n
      }
    }

    if (fromBlock > head) {
      const totalRows = await countRewardPaidRowsPg(pg, CHAIN_ID)
      const lastStored = await getLastScannedToBlockPg(pg, CHAIN_ID)
      return {
        rpcUrlHost,
        fromBlock: fromBlock.toString(),
        toBlock: head.toString(),
        chunksProcessed: 0,
        logsSeen: 0,
        rowsInserted: 0,
        commissionRowsInserted: 0,
        lastScannedToBlock: (lastStored ?? head).toString(),
        totalRowsInDb: totalRows,
      }
    }

    let cursor = fromBlock
    let chunksProcessed = 0
    let logsSeen = 0
    let rowsInserted = 0
    let commissionRowsInserted = 0

    while (cursor <= head && chunksProcessed < maxChunks) {
      const chunkTo = cursor + chunkSize - 1n <= head ? cursor + chunkSize - 1n : head

      const logs = await publicClient.getLogs({
        address: STAKING_CONTRACT_ADDRESS,
        event: rewardPaidEvent,
        fromBlock: cursor,
        toBlock: chunkTo,
      })

      logsSeen += logs.length

      const blockNums = [...new Set(logs.map((l) => l.blockNumber))]
      const tsByBlock = new Map<bigint, bigint>()
      await Promise.all(
        blockNums.map(async (bn) => {
          const b = await publicClient.getBlock({ blockNumber: bn })
          if (b?.timestamp !== undefined) {
            tsByBlock.set(bn, b.timestamp)
          }
        }),
      )

      await pg.query('BEGIN')
      try {
        for (const log of logs) {
          let decoded: ReturnType<typeof decodeEventLog>
          try {
            decoded = decodeEventLog({
              abi: stakingRewardAbi,
              data: log.data,
              topics: log.topics,
            })
          } catch {
            continue
          }
          if (decoded.eventName !== 'RewardPaid') continue
          const { poolIndex, user, reward } = decoded.args as {
            poolIndex: bigint
            user: `0x${string}`
            reward: bigint
          }
          const claimNow = Date.now()
          const inserted = await insertRewardPaidRowPg(pg, {
            chainId: CHAIN_ID,
            txHash: log.transactionHash,
            logIndex: log.logIndex,
            blockNumber: log.blockNumber,
            blockTimestamp: tsByBlock.get(log.blockNumber) ?? null,
            poolIndex,
            userAddress: user,
            rewardAmount: reward.toString(),
            createdAtMs: claimNow,
          })
          if (inserted) {
            rowsInserted += 1
            const { commissionRowsInserted: cr } = await writeCommissionsForRewardClaim(pg, {
              chainId: CHAIN_ID,
              txHash: log.transactionHash,
              logIndex: log.logIndex,
              userAddress: user,
              rewardAmount: reward.toString(),
              createdAt: claimNow,
            })
            commissionRowsInserted += cr
          }
        }

        await setLastScannedToBlockPg(pg, CHAIN_ID, chunkTo)
        await pg.query('COMMIT')
      } catch (e) {
        await pg.query('ROLLBACK')
        throw e
      }

      chunksProcessed += 1
      cursor = chunkTo + 1n
    }

    const lastStored = await getLastScannedToBlockPg(pg, CHAIN_ID)
    const totalRows = await countRewardPaidRowsPg(pg, CHAIN_ID)

    return {
      rpcUrlHost,
      fromBlock: fromBlock.toString(),
      toBlock: head.toString(),
      chunksProcessed,
      logsSeen,
      rowsInserted,
      commissionRowsInserted,
      lastScannedToBlock: (lastStored ?? head).toString(),
      totalRowsInDb: totalRows,
    }
  })
}

export async function getStakingRewardIndexerStatus(): Promise<{
  lastScannedToBlock: string | null
  totalRows: number
  rpcUrlHost: string
}> {
  const rpcUrl = getIndexerRpcUrl()
  let rpcUrlHost: string
  try {
    rpcUrlHost = new URL(rpcUrl).host
  } catch {
    rpcUrlHost = '(invalid-url)'
  }
  return withReferralPool(async (pg) => {
    await ensureStakingRewardIndexerSchema(pg)
    const last = await getLastScannedToBlockPg(pg, CHAIN_ID)
    const totalRows = await countRewardPaidRowsPg(pg, CHAIN_ID)
    return {
      lastScannedToBlock: last !== null ? last.toString() : null,
      totalRows,
      rpcUrlHost,
    }
  })
}
