#!/usr/bin/env node
/**
 * 调用管理端接口同步链上 RewardPaid 日志到 PostgreSQL；新插入行会按邀请关系自动生成返佣记录。
 * 需：pnpm referral:db:up、DATABASE_URL、pnpm dev（或已部署的 BASE_URL）
 * 历史未记佣：pnpm staking:backfill-commission
 *
 * 远程服务器每日定时（北京时间 12:00）：用 crontab 执行 scripts/cron-sync-staking-reward-paid.sh（见该文件内说明）。
 *
 * cd apps/web && pnpm staking:index-rewards
 * BASE_URL=http://localhost:3000 REFERRAL_ADMIN_SECRET=xxx pnpm staking:index-rewards
 * 可选：FROM_BLOCK=123 TO_BLOCK=456 MAX_CHUNKS=50
 */
const base = process.env.BASE_URL || 'http://localhost:3000'
const secret = process.env.REFERRAL_ADMIN_SECRET || ''

function authHeaders() {
  const h = {}
  if (secret) {
    h.Authorization = `Bearer ${secret}`
  }
  return h
}

async function main() {
  const fromBlock = process.env.FROM_BLOCK
  const toBlock = process.env.TO_BLOCK
  const maxChunks = process.env.MAX_CHUNKS

  const body = {}
  if (fromBlock) body.fromBlock = fromBlock
  if (toBlock) body.toBlock = toBlock
  if (maxChunks) body.maxChunks = Number(maxChunks)

  console.log('[GET] status')
  const st = await fetch(`${base}/api/referral/admin/sync-staking-reward-paid`, { headers: authHeaders() })
  console.log('    ', st.status, await st.text())

  console.log('[POST] sync', body)
  const res = await fetch(`${base}/api/referral/admin/sync-staking-reward-paid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  console.log('    ', res.status, text)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
