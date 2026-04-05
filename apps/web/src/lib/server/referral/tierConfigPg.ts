import type { Pool, PoolClient } from 'pg'
import type { AdminTierBpsRow } from './tierConfigConstants'
import { getReferralPool } from './pgPool'

let schemaReady = false

async function ensureSchema(client: Pool | PoolClient): Promise<void> {
  if (schemaReady) return
  await client.query(`
    CREATE TABLE IF NOT EXISTS referral_admin_tier_bps (
      id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      junior_bps INT NOT NULL,
      secondary_bps INT NOT NULL,
      primary_bps INT NOT NULL,
      updated_at BIGINT NOT NULL
    );
  `)
  schemaReady = true
}

export async function readAdminTierBpsPg(): Promise<AdminTierBpsRow | null> {
  const pool = getReferralPool()
  const client = await pool.connect()
  try {
    await ensureSchema(client)
    const { rows } = await client.query<{
      junior_bps: string
      secondary_bps: string
      primary_bps: string
      updated_at: string
    }>('SELECT junior_bps, secondary_bps, primary_bps, updated_at FROM referral_admin_tier_bps WHERE id = 1')
    const r = rows[0]
    if (!r) return null
    return {
      juniorBps: Math.min(10000, Math.max(0, Math.floor(Number(r.junior_bps)))),
      secondaryBps: Math.min(10000, Math.max(0, Math.floor(Number(r.secondary_bps)))),
      primaryBps: Math.min(10000, Math.max(0, Math.floor(Number(r.primary_bps)))),
      updatedAt: Math.floor(Number(r.updated_at)),
    }
  } finally {
    client.release()
  }
}

export async function upsertAdminTierBpsPg(row: AdminTierBpsRow): Promise<void> {
  const pool = getReferralPool()
  const client = await pool.connect()
  try {
    await ensureSchema(client)
    await client.query(
      `INSERT INTO referral_admin_tier_bps (id, junior_bps, secondary_bps, primary_bps, updated_at)
       VALUES (1, $1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         junior_bps = EXCLUDED.junior_bps,
         secondary_bps = EXCLUDED.secondary_bps,
         primary_bps = EXCLUDED.primary_bps,
         updated_at = EXCLUDED.updated_at`,
      [row.juniorBps, row.secondaryBps, row.primaryBps, row.updatedAt],
    )
  } finally {
    client.release()
  }
}
