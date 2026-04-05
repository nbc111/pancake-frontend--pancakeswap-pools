import type { NextApiRequest, NextApiResponse } from 'next'
import { readAllReferrals } from 'lib/server/referral/store'

/**
 * 运营导出：需设置环境变量 REFERRAL_ADMIN_SECRET，请求头 Authorization: Bearer <secret>
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secret = process.env.REFERRAL_ADMIN_SECRET
  if (!secret) {
    return res.status(503).json({ error: 'REFERRAL_ADMIN_SECRET not configured' })
  }

  const auth = req.headers.authorization
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : ''
  if (token !== secret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const bindings = await readAllReferrals()
  return res.status(200).json({ count: Object.keys(bindings).length, bindings })
}
