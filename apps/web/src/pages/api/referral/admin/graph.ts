import type { NextApiRequest, NextApiResponse } from 'next'
import { isAddress } from 'viem'
import { buildReferralGraphForAddress } from 'lib/server/referral/graph'
import { getReferralStorageBackend, readAllReferrals } from 'lib/server/referral/store'

type Body = {
  queryAddress?: string
}

/**
 * POST：查询服务端邀请关系图（三级上下上级）。
 * 不做签名校验：管理页本身仅合约 owner 可进入；生产环境请用网关 / IP 限制保护本接口。
 * 若设置 REFERRAL_ADMIN_SECRET，则与 /api/referral/list 相同，需 Authorization: Bearer。
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secret = process.env.REFERRAL_ADMIN_SECRET
  if (secret) {
    const auth = req.headers.authorization
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : ''
    if (token !== secret) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  const body = req.body as Body
  const queryAddress = body.queryAddress?.trim()

  if (!queryAddress || !isAddress(queryAddress)) {
    return res.status(400).json({ error: 'Invalid queryAddress' })
  }

  try {
    const bindings = await readAllReferrals()
    const graph = buildReferralGraphForAddress(bindings, queryAddress)
    const backend = getReferralStorageBackend()

    return res.status(200).json({
      storage: backend,
      dataFileHint:
        backend === 'postgresql'
          ? process.env.DATABASE_URL?.replace(/:[^:@/]+@/, ':****@')
          : process.env.REFERRAL_DATA_FILE || '.data/referral-bindings.json',
      ...graph,
    })
  } catch (e) {
    console.error('[api/referral/admin/graph]', e)
    const details = e instanceof Error ? e.message : String(e)
    const usingPg = Boolean(process.env.DATABASE_URL?.trim())
    return res.status(503).json({
      error: 'Referral storage unavailable',
      details,
      hint: usingPg
        ? 'DATABASE_URL is set but PostgreSQL is not reachable. From apps/web run pnpm referral:db:up, or remove/comment DATABASE_URL to use file storage (.data/referral-bindings.json).'
        : 'Check server logs for the underlying error.',
    })
  }
}
