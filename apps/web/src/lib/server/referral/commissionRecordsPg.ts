import type { PoolClient } from 'pg'
import { getReferralPool } from 'lib/server/referral/pgPool'
import type { CommissionPayoutStatus, CommissionRecord } from 'utils/nbcAdmin/agentReferral'

let schemaReady = false

type CommissionRowDb = {
  id: string
  created_at: string
  earner: string
  beneficiary: string
  tier_distance: string
  yield_amount: string
  commission_amount: string
  note: string | null
  payout_status: string | null
  payout_updated_at: string | null
  admin_payout_note: string | null
}

function rowToRecord(r: CommissionRowDb): CommissionRecord {
  const rec: CommissionRecord = {
    id: r.id,
    createdAt: Number(r.created_at),
    earner: r.earner.toLowerCase(),
    beneficiary: r.beneficiary.toLowerCase(),
    tierDistance: Number(r.tier_distance) as 1 | 2 | 3,
    yieldAmount: r.yield_amount,
    commissionAmount: r.commission_amount,
    note: r.note ?? undefined,
  }
  if (r.payout_status && ['pending', 'approved', 'rejected', 'paid'].includes(r.payout_status)) {
    rec.payoutStatus = r.payout_status as CommissionPayoutStatus
  }
  if (r.payout_updated_at != null && r.payout_updated_at !== '') {
    const n = Number(r.payout_updated_at)
    if (Number.isFinite(n)) rec.payoutUpdatedAt = n
  }
  if (r.admin_payout_note) rec.adminPayoutNote = r.admin_payout_note
  return rec
}

export async function ensureCommissionRecordsSchema(client: PoolClient): Promise<void> {
  if (schemaReady) return
  await client.query(`
    CREATE TABLE IF NOT EXISTS referral_commission_record (
      id TEXT PRIMARY KEY,
      created_at BIGINT NOT NULL,
      earner TEXT NOT NULL,
      beneficiary TEXT NOT NULL,
      tier_distance SMALLINT NOT NULL CHECK (tier_distance IN (1, 2, 3)),
      yield_amount TEXT NOT NULL,
      commission_amount TEXT NOT NULL,
      note TEXT
    );
  `)
  await client.query(`
    ALTER TABLE referral_commission_record
      ADD COLUMN IF NOT EXISTS payout_status TEXT NOT NULL DEFAULT 'pending';
  `)
  await client.query(`
    ALTER TABLE referral_commission_record
      ADD COLUMN IF NOT EXISTS payout_updated_at BIGINT;
  `)
  await client.query(`
    ALTER TABLE referral_commission_record
      ADD COLUMN IF NOT EXISTS admin_payout_note TEXT;
  `)
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_referral_commission_created ON referral_commission_record (created_at DESC);
  `)
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_referral_commission_beneficiary ON referral_commission_record (beneficiary);
  `)
  schemaReady = true
}

/** 在同一 DB 事务中插入返佣行（供质押索引与补跑共用） */
export async function insertCommissionRecordsWithClient(
  client: PoolClient,
  records: CommissionRecord[],
): Promise<number> {
  if (records.length === 0) return 0
  await ensureCommissionRecordsSchema(client)
  let n = 0
  for (const r of records) {
    const res = await client.query(
      `INSERT INTO referral_commission_record (
        id, created_at, earner, beneficiary, tier_distance, yield_amount, commission_amount, note
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO NOTHING`,
      [
        r.id.slice(0, 128),
        r.createdAt,
        r.earner.toLowerCase(),
        r.beneficiary.toLowerCase(),
        r.tierDistance,
        r.yieldAmount,
        r.commissionAmount,
        r.note ?? null,
      ],
    )
    n += res.rowCount ?? 0
  }
  return n
}

export async function listCommissionRecordsPg(limit: number): Promise<CommissionRecord[]> {
  const pool = getReferralPool()
  const client = await pool.connect()
  try {
    await ensureCommissionRecordsSchema(client)
    const lim = Math.min(Math.max(1, Math.floor(limit)), 2000)
    const { rows } = await client.query(
      `SELECT id, created_at, earner, beneficiary, tier_distance, yield_amount, commission_amount, note,
              payout_status, payout_updated_at, admin_payout_note
       FROM referral_commission_record
       ORDER BY created_at DESC
       LIMIT $1`,
      [lim],
    )
    return rows.map((r) => rowToRecord(r as CommissionRowDb))
  } finally {
    client.release()
  }
}

/** 当前钱包作为收款人（上级代理）获得的返佣明细，最新在前 */
export async function listCommissionRecordsByBeneficiaryPg(
  beneficiary: string,
  limit: number,
  offset = 0,
): Promise<CommissionRecord[]> {
  const pool = getReferralPool()
  const client = await pool.connect()
  try {
    await ensureCommissionRecordsSchema(client)
    const lim = Math.min(Math.max(1, Math.floor(limit)), 500)
    const off = Math.max(0, Math.floor(offset))
    const b = beneficiary.toLowerCase()
    const { rows } = await client.query(
      `SELECT id, created_at, earner, beneficiary, tier_distance, yield_amount, commission_amount, note,
              payout_status, payout_updated_at, admin_payout_note
       FROM referral_commission_record
       WHERE beneficiary = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [b, lim, off],
    )
    return rows.map((r) => rowToRecord(r as CommissionRowDb))
  } finally {
    client.release()
  }
}

export async function getBeneficiaryCommissionMetaPg(
  beneficiary: string,
): Promise<{ total: number; sumCommissionWei: string }> {
  const pool = getReferralPool()
  const client = await pool.connect()
  try {
    await ensureCommissionRecordsSchema(client)
    const b = beneficiary.toLowerCase()
    const { rows } = await client.query<{ cnt: string; sum_amt: string }>(
      `SELECT
         COUNT(*)::text AS cnt,
         COALESCE(SUM(commission_amount::numeric), 0)::text AS sum_amt
       FROM referral_commission_record
       WHERE beneficiary = $1`,
      [b],
    )
    const row = rows[0]
    const total = Number(row?.cnt ?? 0)
    let sumCommissionWei = row?.sum_amt ?? '0'
    if (sumCommissionWei.includes('.')) {
      sumCommissionWei = sumCommissionWei.split('.')[0] || '0'
    }
    return { total, sumCommissionWei }
  } finally {
    client.release()
  }
}

export async function insertCommissionRecordsPg(records: CommissionRecord[]): Promise<number> {
  if (records.length === 0) return 0
  const pool = getReferralPool()
  const client = await pool.connect()
  try {
    return await insertCommissionRecordsWithClient(client, records)
  } finally {
    client.release()
  }
}

export async function deleteAllCommissionRecordsPg(): Promise<void> {
  const pool = getReferralPool()
  const client = await pool.connect()
  try {
    await ensureCommissionRecordsSchema(client)
    await client.query('DELETE FROM referral_commission_record')
  } finally {
    client.release()
  }
}

export async function countCommissionRecordsPg(): Promise<number> {
  const pool = getReferralPool()
  const client = await pool.connect()
  try {
    await ensureCommissionRecordsSchema(client)
    const { rows } = await client.query<{ c: string }>('SELECT COUNT(*)::text AS c FROM referral_commission_record')
    return Number(rows[0]?.c ?? 0)
  } finally {
    client.release()
  }
}

export async function updateCommissionRecordPayoutPg(
  id: string,
  payoutStatus: CommissionPayoutStatus,
  adminPayoutNote: string | null | undefined,
  payoutUpdatedAt: number,
): Promise<boolean> {
  const pool = getReferralPool()
  const client = await pool.connect()
  try {
    await ensureCommissionRecordsSchema(client)
    const note =
      adminPayoutNote === undefined
        ? undefined
        : adminPayoutNote == null || String(adminPayoutNote).trim() === ''
          ? null
          : String(adminPayoutNote).trim().slice(0, 2000)
    if (note === undefined) {
      const { rowCount } = await client.query(
        `UPDATE referral_commission_record
         SET payout_status = $2, payout_updated_at = $3
         WHERE id = $1`,
        [id.slice(0, 128), payoutStatus, payoutUpdatedAt],
      )
      return (rowCount ?? 0) > 0
    }
    const { rowCount } = await client.query(
      `UPDATE referral_commission_record
       SET payout_status = $2, payout_updated_at = $3, admin_payout_note = $4
       WHERE id = $1`,
      [id.slice(0, 128), payoutStatus, payoutUpdatedAt, note],
    )
    return (rowCount ?? 0) > 0
  } finally {
    client.release()
  }
}
