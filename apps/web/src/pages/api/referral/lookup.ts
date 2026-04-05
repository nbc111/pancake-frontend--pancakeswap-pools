import type { NextApiRequest, NextApiResponse } from 'next'
import { isAddress } from 'viem'
import { getReferralForInvitee } from 'lib/server/referral/store'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const raw = req.query.invitee
  const invitee = typeof raw === 'string' ? raw.trim() : Array.isArray(raw) ? raw[0]?.trim() : ''

  if (!invitee || !isAddress(invitee)) {
    return res.status(400).json({ error: 'Invalid invitee' })
  }

  const row = await getReferralForInvitee(invitee.toLowerCase())
  if (!row) {
    return res.status(404).json({ error: 'Not found' })
  }

  return res.status(200).json({
    referrer: row.referrer,
    boundAt: row.boundAt,
  })
}
