import type { Pool, PoolClient } from 'pg'
import type { ServerReferralFile, ServerReferralRow } from './storeTypes'
import { getReferralPool } from './pgPool'

let schemaEnsured = false

async function ensureSchema(client: Pool | PoolClient): Promise<void> {
  if (schemaEnsured) return
  await client.query(`
    CREATE TABLE IF NOT EXISTS referral_binding (
      invitee TEXT PRIMARY KEY,
      referrer TEXT NOT NULL,
      bound_at BIGINT NOT NULL,
      signature TEXT
    );
  `)
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_referral_binding_referrer ON referral_binding (referrer);
  `)
  schemaEnsured = true
}

export async function readAllReferralsPg(): Promise<ServerReferralFile> {
  const pool = getReferralPool()
  const client = await pool.connect()
  try {
    await ensureSchema(client)
    const { rows } = await client.query<{
      invitee: string
      referrer: string
      bound_at: string
      signature: string | null
    }>('SELECT invitee, referrer, bound_at, signature FROM referral_binding')
    const out: ServerReferralFile = {}
    for (const r of rows) {
      out[r.invitee.toLowerCase()] = {
        referrer: r.referrer.toLowerCase() as `0x${string}`,
        boundAt: Number(r.bound_at),
        signature: r.signature ?? undefined,
      }
    }
    return out
  } finally {
    client.release()
  }
}

export async function getReferralForInviteePg(inviteeLower: string): Promise<ServerReferralRow | null> {
  const pool = getReferralPool()
  const client = await pool.connect()
  try {
    await ensureSchema(client)
    const { rows } = await client.query<{
      referrer: string
      bound_at: string
      signature: string | null
    }>('SELECT referrer, bound_at, signature FROM referral_binding WHERE invitee = $1', [
      inviteeLower.toLowerCase(),
    ])
    const r = rows[0]
    if (!r?.referrer) return null
    return {
      referrer: r.referrer.toLowerCase() as `0x${string}`,
      boundAt: Number(r.bound_at),
      signature: r.signature ?? undefined,
    }
  } finally {
    client.release()
  }
}

export async function upsertReferralPg(
  inviteeLower: string,
  row: ServerReferralRow,
): Promise<'created' | 'unchanged' | 'conflict'> {
  const pool = getReferralPool()
  const client = await pool.connect()
  try {
    await ensureSchema(client)
    const key = inviteeLower.toLowerCase()
    const existing = await client.query<{ referrer: string }>(
      'SELECT referrer FROM referral_binding WHERE invitee = $1',
      [key],
    )
    if (existing.rows[0]?.referrer) {
      const er = existing.rows[0].referrer
      if (er.toLowerCase() === row.referrer.toLowerCase()) {
        return 'unchanged'
      }
      return 'conflict'
    }
    await client.query(
      `INSERT INTO referral_binding (invitee, referrer, bound_at, signature)
       VALUES ($1, $2, $3, $4)`,
      [key, row.referrer.toLowerCase(), row.boundAt, row.signature ?? null],
    )
    return 'created'
  } finally {
    client.release()
  }
}
