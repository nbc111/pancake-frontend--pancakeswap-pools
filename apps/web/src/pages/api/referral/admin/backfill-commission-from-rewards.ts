import type { NextApiRequest, NextApiResponse } from 'next'
import { backfillCommissionsFromUnprocessedRewardPaid } from 'lib/server/referral/backfillCommissionFromRewardPaid'
import { isPostgresReferralEnabled } from 'lib/server/referral/pgPool'

function checkAuth(req: NextApiRequest): boolean {
  const secret = process.env.REFERRAL_ADMIN_SECRET
  if (!secret) return true
  const auth = req.headers.authorization
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : ''
  return token === secret
}

/**
 * POST：为 staking_reward_paid 中 commission_recorded=false 的行补写返佣记录（领取即记返佣的历史补跑）。
 * Body 可选：{ "limit": 500 }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (!isPostgresReferralEnabled()) {
    return res.status(503).json({
      error: 'PostgreSQL required',
      hint: 'Commission auto-rows require DATABASE_URL and staking_reward_paid table.',
    })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = (req.body || {}) as { limit?: unknown }
  const limit =
    body.limit !== undefined && Number.isFinite(Number(body.limit))
      ? Math.floor(Number(body.limit))
      : 500

  try {
    const result = await backfillCommissionsFromUnprocessedRewardPaid(limit)
    return res.status(200).json(result)
  } catch (e) {
    console.error('[api/referral/admin/backfill-commission-from-rewards]', e)
    return res.status(503).json({
      error: 'Backfill failed',
      details: e instanceof Error ? e.message : String(e),
    })
  }
}
