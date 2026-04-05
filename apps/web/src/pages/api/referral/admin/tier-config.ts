import type { NextApiRequest, NextApiResponse } from 'next'
import { DEFAULT_ADMIN_TIER_BPS } from 'lib/server/referral/tierConfigConstants'
import {
  getAdminTierConfigStorageBackend,
  getTierConfigFileHint,
  readAdminTierBps,
  upsertAdminTierBps,
} from 'lib/server/referral/tierConfigStore'

function checkAuth(req: NextApiRequest): boolean {
  const secret = process.env.REFERRAL_ADMIN_SECRET
  if (!secret) return true
  const auth = req.headers.authorization
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : ''
  return token === secret
}

function clampBps(n: unknown): number {
  const x = Math.floor(Number(n))
  if (!Number.isFinite(x)) return 0
  return Math.min(10000, Math.max(0, x))
}

/**
 * GET：读取管理后台三级返佣基点。库中无记录时返回 configured:false，数值仍为默认 500/300/100（不写库）。
 * POST：写入或更新一条配置。
 * 若设置 REFERRAL_ADMIN_SECRET，需 Authorization: Bearer。
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const backend = getAdminTierConfigStorageBackend()

  if (req.method === 'GET') {
    try {
      const row = await readAdminTierBps()
      const dataFileHint =
        backend === 'postgresql'
          ? process.env.DATABASE_URL?.replace(/:[^:@/]+@/, ':****@')
          : getTierConfigFileHint()

      if (!row) {
        return res.status(200).json({
          configured: false,
          juniorBps: DEFAULT_ADMIN_TIER_BPS.juniorBps,
          secondaryBps: DEFAULT_ADMIN_TIER_BPS.secondaryBps,
          primaryBps: DEFAULT_ADMIN_TIER_BPS.primaryBps,
          updatedAt: null,
          storage: backend,
          dataFileHint,
        })
      }

      return res.status(200).json({
        configured: true,
        juniorBps: row.juniorBps,
        secondaryBps: row.secondaryBps,
        primaryBps: row.primaryBps,
        updatedAt: row.updatedAt,
        storage: backend,
        dataFileHint,
      })
    } catch (e) {
      console.error('[api/referral/admin/tier-config GET]', e)
      return res.status(503).json({
        error: 'Tier config storage unavailable',
        details: e instanceof Error ? e.message : String(e),
      })
    }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body as { juniorBps?: unknown; secondaryBps?: unknown; primaryBps?: unknown }
      const juniorBps = clampBps(body.juniorBps)
      const secondaryBps = clampBps(body.secondaryBps)
      const primaryBps = clampBps(body.primaryBps)
      const updatedAt = Date.now()
      await upsertAdminTierBps({ juniorBps, secondaryBps, primaryBps, updatedAt })
      return res.status(200).json({
        configured: true,
        juniorBps,
        secondaryBps,
        primaryBps,
        updatedAt,
        storage: backend,
      })
    } catch (e) {
      console.error('[api/referral/admin/tier-config POST]', e)
      return res.status(503).json({
        error: 'Tier config storage unavailable',
        details: e instanceof Error ? e.message : String(e),
      })
    }
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method not allowed' })
}
