import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import {
  appendCommissionRecords,
  countCommissionRecords,
  deleteAllCommissionRecords,
  getCommissionRecordsFileHint,
  getCommissionRecordsStorageBackend,
  listCommissionRecords,
  updateCommissionRecordPayout,
} from 'lib/server/referral/commissionRecordsStore'
import { isAddress } from 'viem'

function checkAuth(req: NextApiRequest): boolean {
  const secret = process.env.REFERRAL_ADMIN_SECRET
  if (!secret) return true
  const auth = req.headers.authorization
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : ''
  return token === secret
}

const rowSchema = z.object({
  id: z.string().min(1).max(128),
  createdAt: z.number().int().positive(),
  earner: z.string().refine((s) => isAddress(s.trim()), 'invalid earner'),
  beneficiary: z.string().refine((s) => isAddress(s.trim()), 'invalid beneficiary'),
  tierDistance: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  yieldAmount: z.string().min(1).max(128),
  commissionAmount: z.string().min(1).max(128),
  note: z.string().max(2000).optional(),
})

const postBodySchema = z.object({
  records: z.array(rowSchema).min(1).max(100),
})

const patchBodySchema = z.object({
  id: z.string().min(1).max(128),
  payoutStatus: z.enum(['pending', 'approved', 'rejected', 'paid']),
  /** 不传则不改写既有 admin 备注；传 null/空串可清空 */
  adminPayoutNote: z.string().max(2000).optional().nullable(),
})

function normalizeRow(r: z.infer<typeof rowSchema>) {
  return {
    id: r.id,
    createdAt: r.createdAt,
    earner: r.earner.trim().toLowerCase() as `0x${string}`,
    beneficiary: r.beneficiary.trim().toLowerCase() as `0x${string}`,
    tierDistance: r.tierDistance,
    yieldAmount: r.yieldAmount,
    commissionAmount: r.commissionAmount,
    note: r.note,
  }
}

/**
 * GET：返佣记账记录列表（最新在前）。需与 tier-config 相同鉴权。
 * POST：追加一批记录（运维脚本或迁移；日常返佣由 RewardPaid 索引自动写入）。
 * PATCH：更新单条返佣的发放状态（管理端决策）。
 * DELETE：清空全部返佣记录。
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const backend = getCommissionRecordsStorageBackend()
  const dataFileHint =
    backend === 'postgresql'
      ? process.env.DATABASE_URL?.replace(/:[^:@/]+@/, ':****@')
      : getCommissionRecordsFileHint()

  try {
    if (req.method === 'GET') {
      const limRaw = req.query.limit
      const limit = typeof limRaw === 'string' ? Number(limRaw) : 500
      const records = await listCommissionRecords(Number.isFinite(limit) ? limit : 500)
      const total = await countCommissionRecords()
      return res.status(200).json({
        records,
        total,
        storage: backend,
        dataFileHint,
      })
    }

    if (req.method === 'POST') {
      const parsed = postBodySchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() })
      }
      const normalized = parsed.data.records.map(normalizeRow)
      const inserted = await appendCommissionRecords(normalized)
      const total = await countCommissionRecords()
      return res.status(200).json({
        inserted,
        total,
        storage: backend,
      })
    }

    if (req.method === 'PATCH') {
      const parsed = patchBodySchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() })
      }
      const { id, payoutStatus, adminPayoutNote } = parsed.data
      const ok = await updateCommissionRecordPayout(id, payoutStatus, adminPayoutNote)
      if (!ok) {
        return res.status(404).json({ error: 'Record not found', id })
      }
      return res.status(200).json({ ok: true, storage: backend })
    }

    if (req.method === 'DELETE') {
      await deleteAllCommissionRecords()
      return res.status(200).json({ ok: true, storage: backend })
    }
  } catch (e) {
    console.error('[api/referral/admin/commission-records]', e)
    return res.status(503).json({
      error: 'Commission records storage unavailable',
      details: e instanceof Error ? e.message : String(e),
    })
  }

  res.setHeader('Allow', 'GET, POST, PATCH, DELETE')
  return res.status(405).json({ error: 'Method not allowed' })
}
