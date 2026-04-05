import type { PoolClient } from 'pg'
import { getUplineChain } from 'lib/server/referral/graph'
import { readAllReferrals } from 'lib/server/referral/store'
import { DEFAULT_ADMIN_TIER_BPS } from 'lib/server/referral/tierConfigConstants'
import { readAdminTierBps } from 'lib/server/referral/tierConfigStore'
import {
  ensureCommissionRecordsSchema,
  insertCommissionRecordsWithClient,
} from 'lib/server/referral/commissionRecordsPg'
import type { CommissionRecord } from 'utils/nbcAdmin/agentReferral'

export type RewardClaimCommissionParams = {
  chainId: number
  txHash: string
  logIndex: number
  userAddress: string
  rewardAmount: string
  createdAt: number
}

async function markRewardPaidCommissionDone(
  client: PoolClient,
  p: Pick<RewardClaimCommissionParams, 'chainId' | 'txHash' | 'logIndex'>,
): Promise<void> {
  await client.query(
    `UPDATE staking_reward_paid
     SET commission_recorded = TRUE
     WHERE chain_id = $1 AND lower(tx_hash) = lower($2) AND log_index = $3`,
    [p.chainId, p.txHash, p.logIndex],
  )
}

/**
 * 用户领取质押奖励（RewardPaid）后：按服务端邀请绑定 + 管理端基点，写入 referral_commission_record。
 * 佣金与 yield 均使用奖励代币链上最小单位（与 reward_amount 同单位），避免浮点。
 */
export async function writeCommissionsForRewardClaim(
  client: PoolClient,
  p: RewardClaimCommissionParams,
): Promise<{ commissionRowsInserted: number }> {
  await ensureCommissionRecordsSchema(client)

  let rewardWei: bigint
  try {
    rewardWei = BigInt(p.rewardAmount)
  } catch {
    await markRewardPaidCommissionDone(client, p)
    return { commissionRowsInserted: 0 }
  }
  if (rewardWei <= 0n) {
    await markRewardPaidCommissionDone(client, p)
    return { commissionRowsInserted: 0 }
  }

  const bindings = await readAllReferrals()
  const tierRow = await readAdminTierBps()
  const bps: readonly [number, number, number] = [
    tierRow?.juniorBps ?? DEFAULT_ADMIN_TIER_BPS.juniorBps,
    tierRow?.secondaryBps ?? DEFAULT_ADMIN_TIER_BPS.secondaryBps,
    tierRow?.primaryBps ?? DEFAULT_ADMIN_TIER_BPS.primaryBps,
  ]

  const uplines = getUplineChain(bindings, p.userAddress)
  const tx = p.txHash.toLowerCase()
  const earner = p.userAddress.toLowerCase() as `0x${string}`

  const records: CommissionRecord[] = []
  for (let i = 0; i < 3; i++) {
    const rawBen = uplines[i]
    if (!rawBen) continue
    const rateBps = bps[i]
    if (rateBps <= 0) continue
    const commissionWei = (rewardWei * BigInt(rateBps)) / 10000n
    if (commissionWei === 0n) continue
    const id = `c-${p.chainId}-${tx}-${p.logIndex}-L${i + 1}`
    records.push({
      id: id.length > 128 ? id.slice(0, 128) : id,
      createdAt: p.createdAt,
      earner,
      beneficiary: rawBen.toLowerCase() as `0x${string}`,
      tierDistance: (i + 1) as 1 | 2 | 3,
      yieldAmount: p.rewardAmount,
      commissionAmount: commissionWei.toString(),
      note: 'auto:RewardPaid',
    })
  }

  const n = await insertCommissionRecordsWithClient(client, records)
  await markRewardPaidCommissionDone(client, p)
  return { commissionRowsInserted: n }
}
