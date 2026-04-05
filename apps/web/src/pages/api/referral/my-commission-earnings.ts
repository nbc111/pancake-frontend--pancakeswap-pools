import type { NextApiRequest, NextApiResponse } from 'next'
import { isAddress } from 'viem'
import { getCommissionEarningsPageForBeneficiary } from 'lib/server/referral/commissionRecordsStore'

/**
 * GET：某地址作为收款人获得的返佣明细（分页）。
 * Query: beneficiary=0x...（必填）, limit（默认 5，最大 100）, offset（默认 0）
 * 响应：{ records, total, sumCommissionWei, limit, offset }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const raw = req.query.beneficiary
  const beneficiary = typeof raw === 'string' ? raw.trim() : ''
  if (!beneficiary || !isAddress(beneficiary)) {
    return res.status(400).json({ error: 'Invalid beneficiary address' })
  }

  const limRaw = req.query.limit
  const limit =
    typeof limRaw === 'string' && /^\d+$/.test(limRaw)
      ? Math.min(100, Math.max(1, parseInt(limRaw, 10)))
      : 5

  const offRaw = req.query.offset
  const offset =
    typeof offRaw === 'string' && /^\d+$/.test(offRaw) ? Math.max(0, parseInt(offRaw, 10)) : 0

  try {
    const { records, total, sumCommissionWei } = await getCommissionEarningsPageForBeneficiary(
      beneficiary,
      limit,
      offset,
    )
    return res.status(200).json({ records, total, sumCommissionWei, limit, offset })
  } catch (e) {
    console.error('[api/referral/my-commission-earnings]', e)
    return res.status(503).json({
      error: 'Commission earnings unavailable',
      details: e instanceof Error ? e.message : String(e),
    })
  }
}
