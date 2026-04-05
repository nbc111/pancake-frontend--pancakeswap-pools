#!/usr/bin/env node
/**
 * 一键本地验收：质押 RewardPaid 同步状态 + 增量同步 + 邀请绑定冒烟。
 * 需本机已 `pnpm dev`（默认 http://127.0.0.1:3000）且数据库可用。
 *
 * cd apps/web && pnpm verify:referral-staking-local
 * BASE_URL=http://127.0.0.1:3000 pnpm verify:referral-staking-local
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const webRoot = join(__dirname, '..')

function loadReferralAdminSecret() {
  if (process.env.REFERRAL_ADMIN_SECRET) return process.env.REFERRAL_ADMIN_SECRET
  for (const f of ['.env.local', '.env.development', '.env']) {
    const p = join(webRoot, f)
    if (!existsSync(p)) continue
    const text = readFileSync(p, 'utf8')
    for (const line of text.split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      if (t.startsWith('REFERRAL_ADMIN_SECRET=')) {
        let v = t.slice('REFERRAL_ADMIN_SECRET='.length).trim()
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1)
        }
        return v
      }
    }
  }
  return ''
}

const base = (process.env.BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')
const secret = loadReferralAdminSecret()
const headers = { 'Content-Type': 'application/json' }
if (secret) headers.Authorization = `Bearer ${secret}`

async function main() {
  console.log('=== GET /api/referral/admin/sync-staking-reward-paid ===')
  const st = await fetch(`${base}/api/referral/admin/sync-staking-reward-paid`, { headers: secret ? { Authorization: headers.Authorization } : {} })
  console.log(st.status, await st.text())

  console.log('\n=== POST /api/referral/admin/sync-staking-reward-paid ===')
  const post = await fetch(`${base}/api/referral/admin/sync-staking-reward-paid`, {
    method: 'POST',
    headers,
    body: '{}',
  })
  console.log(post.status, await post.text())

  console.log('\n=== referral-smoke ===')
  const r = spawnSync(process.execPath, [join(__dirname, 'referral-smoke.mjs')], {
    cwd: webRoot,
    env: { ...process.env, BASE_URL: base },
    stdio: 'inherit',
  })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
