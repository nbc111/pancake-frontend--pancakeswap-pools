import type { NextApiRequest, NextApiResponse } from 'next'
import { verifyMessage } from 'viem'
import { isAddress } from 'viem'
import { upsertReferral } from 'lib/server/referral/store'
import { buildReferralBindMessage } from 'utils/referralBinding'

const MAX_MESSAGE_AGE_MS = 15 * 60 * 1000

/** 设为 true 时恢复旧行为：必须提交被邀请人签名（更高防伪造，但需用户点签） */
function isInviteeSignatureRequired(): boolean {
  return process.env.REFERRAL_REQUIRE_INVITEE_SIGNATURE === 'true'
}

type Body = {
  invitee?: string
  referrer?: string
  timestamp?: number
  signature?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = req.body as Body
  const invitee = body.invitee?.trim()
  const referrer = body.referrer?.trim()
  const timestamp = typeof body.timestamp === 'number' ? body.timestamp : Number(body.timestamp)
  const signature = body.signature?.trim()

  if (!invitee || !referrer) {
    return res.status(400).json({ error: 'Missing invitee or referrer' })
  }

  if (!isAddress(invitee) || !isAddress(referrer)) {
    return res.status(400).json({ error: 'Invalid address' })
  }

  const il = invitee.toLowerCase() as `0x${string}`
  const rl = referrer.toLowerCase() as `0x${string}`

  if (il === rl) {
    return res.status(400).json({ error: 'Cannot self-refer' })
  }

  let storedSignature: string | undefined

  if (isInviteeSignatureRequired()) {
    if (!signature || !Number.isFinite(timestamp)) {
      return res.status(400).json({ error: 'Missing timestamp or signature (REFERRAL_REQUIRE_INVITEE_SIGNATURE=true)' })
    }

    const age = Math.abs(Date.now() - timestamp)
    if (age > MAX_MESSAGE_AGE_MS) {
      return res.status(400).json({ error: 'Timestamp expired' })
    }

    const message = buildReferralBindMessage(il, rl, timestamp)
    const ok = await verifyMessage({
      address: il,
      message,
      signature: signature as `0x${string}`,
    })

    if (!ok) {
      return res.status(401).json({ error: 'Invalid signature' })
    }
    storedSignature = signature
  }

  const result = await upsertReferral(il, {
    referrer: rl,
    boundAt: Date.now(),
    signature: storedSignature,
  })

  if (result === 'conflict') {
    return res.status(409).json({ error: 'Invitee already bound to another referrer' })
  }

  return res.status(200).json({ ok: true, status: result })
}
