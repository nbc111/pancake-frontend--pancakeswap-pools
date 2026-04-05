#!/usr/bin/env node
/**
 * 为 staking_reward_paid 中 commission_recorded=false 的行补写 referral_commission_record。
 * 用于上线自动记佣前已入库的历史领取记录。
 *
 * cd apps/web && pnpm staking:backfill-commission
 * BASE_URL=http://localhost:3000 REFERRAL_ADMIN_SECRET=xxx LIMIT=500 pnpm staking:backfill-commission
 */
const base = process.env.BASE_URL || 'http://localhost:3000'
const secret = process.env.REFERRAL_ADMIN_SECRET || ''
const limit = process.env.LIMIT ? Number(process.env.LIMIT) : 500

function authHeaders() {
  const h = { 'Content-Type': 'application/json' }
  if (secret) {
    h.Authorization = `Bearer ${secret}`
  }
  return h
}

async function main() {
  const res = await fetch(`${base}/api/referral/admin/backfill-commission-from-rewards`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ limit }),
  })
  const text = await res.text()
  console.log(res.status, text)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
