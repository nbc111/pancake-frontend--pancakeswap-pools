import type { NextApiRequest, NextApiResponse } from 'next'
import { isPostgresReferralEnabled } from 'lib/server/referral/pgPool'
import { getStakingRewardIndexerStatus, syncStakingRewardPaidLogs } from 'lib/server/staking/syncRewardPaidLogs'

function checkAdminAuth(req: NextApiRequest): boolean {
  const secret = process.env.REFERRAL_ADMIN_SECRET
  if (!secret) return true
  const auth = req.headers.authorization
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : ''
  return token === secret
}

type PostBody = {
  fromBlock?: string
  toBlock?: string
  maxChunks?: number
}

/**
 * GET：索引游标与库内条数（需 PostgreSQL + 可选 REFERRAL_ADMIN_SECRET）。
 * POST：从链上拉取 RewardPaid 日志写入 staking_reward_paid（增量或指定区间）。
 *      每条**新插入**的领取记录会在同一事务内按邀请关系与基点写入 referral_commission_record，
 *      响应体含 commissionRowsInserted。历史已入库但未记佣的行请用 POST …/backfill-commission-from-rewards。
 *
 * 定时（自建服务器）：用 crontab 每日北京时间 12:00 调用 POST 本接口，例如
 *   apps/web/scripts/cron-sync-staking-reward-paid.sh（需 BASE_URL、REFERRAL_ADMIN_SECRET）。
 *
 * 环境变量：
 * - DATABASE_URL
 * - NBC_STAKING_INDEXER_RPC_URL（可选，默认 https://rpc.nbcex.com）
 * - NBC_STAKING_REWARD_INDEX_FROM_BLOCK（首次无游标时的起始块，默认 0）
 * - NBC_STAKING_INDEXER_BLOCK_CHUNK（每段扫描块数，默认 1000）
 * - NBC_STAKING_INDEXER_BLOCK_CHUNK_MAX（单段上限，默认 1024，适配 rpc.nbcex.com）
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (!isPostgresReferralEnabled()) {
    return res.status(503).json({
      error: 'PostgreSQL required',
      hint: 'Set DATABASE_URL and run referral DB; file-only mode does not persist staking logs.',
    })
  }

  if (req.method === 'GET') {
    try {
      const status = await getStakingRewardIndexerStatus()
      return res.status(200).json(status)
    } catch (e) {
      console.error('[api/referral/admin/sync-staking-reward-paid GET]', e)
      const details = e instanceof Error ? e.message : String(e)
      return res.status(503).json({ error: 'Indexer status unavailable', details })
    }
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = (req.body || {}) as PostBody
  let fromBlock: bigint | undefined
  let toBlock: bigint | undefined
  try {
    if (body.fromBlock !== undefined && body.fromBlock !== '') {
      if (!/^\d+$/.test(String(body.fromBlock))) {
        return res.status(400).json({ error: 'fromBlock must be a non-negative integer string' })
      }
      fromBlock = BigInt(body.fromBlock)
    }
    if (body.toBlock !== undefined && body.toBlock !== '') {
      if (!/^\d+$/.test(String(body.toBlock))) {
        return res.status(400).json({ error: 'toBlock must be a non-negative integer string' })
      }
      toBlock = BigInt(body.toBlock)
    }
  } catch {
    return res.status(400).json({ error: 'Invalid block range' })
  }

  const maxChunks =
    body.maxChunks !== undefined && Number.isFinite(Number(body.maxChunks))
      ? Math.min(Math.max(1, Math.floor(Number(body.maxChunks))), 2000)
      : undefined

  try {
    const result = await syncStakingRewardPaidLogs({ fromBlock, toBlock, maxChunks })
    return res.status(200).json(result)
  } catch (e) {
    console.error('[api/referral/admin/sync-staking-reward-paid POST]', e)
    const details = e instanceof Error ? e.message : String(e)
    return res.status(503).json({ error: 'Sync failed', details })
  }
}
