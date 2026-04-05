#!/usr/bin/env node
/**
 * 本地冒烟：需已 `pnpm referral:db:up` 且 `pnpm dev` 在跑。
 * 用法：cd apps/web && pnpm referral:smoke
 * 可选：BASE_URL=http://localhost:3000 INVITEE=0x... REFERRER=0x... pnpm referral:smoke
 */
import { Client } from 'pg'

const base = process.env.BASE_URL || 'http://localhost:3000'
const invitee = process.env.INVITEE || '0x1111111111111111111111111111111111111111'
const referrer = process.env.REFERRER || '0x2222222222222222222222222222222222222222'

const dbUrl = process.env.DATABASE_URL || 'postgresql://referral:referral@127.0.0.1:5433/referral'

async function main() {
  console.log('[1] POST /api/referral/bind', { invitee, referrer })
  const res = await fetch(`${base}/api/referral/bind`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invitee, referrer }),
  })
  const text = await res.text()
  console.log('    status', res.status, text.slice(0, 300))

  console.log('[2] GET /api/referral/lookup?invitee=', invitee)
  const look = await fetch(`${base}/api/referral/lookup?invitee=${encodeURIComponent(invitee)}`)
  console.log('    status', look.status, await look.text())

  console.log('[3] PostgreSQL referral_binding count')
  const c = new Client({ connectionString: dbUrl })
  await c.connect()
  try {
    const r = await c.query(
      `SELECT invitee, referrer FROM referral_binding WHERE lower(invitee) = lower($1)`,
      [invitee],
    )
    console.log('    rows', r.rows)
  } catch (e) {
    console.error('    (表可能尚未创建，先访问一次 bind 或管理查询以触发建表)', e.message)
  } finally {
    await c.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
