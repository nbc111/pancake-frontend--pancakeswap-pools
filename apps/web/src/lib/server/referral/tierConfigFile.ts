import fs from 'fs'
import path from 'path'
import type { AdminTierBpsRow } from './tierConfigConstants'

function resolvePath(): string {
  if (process.env.REFERRAL_TIER_CONFIG_FILE) {
    return process.env.REFERRAL_TIER_CONFIG_FILE
  }
  const cwd = process.cwd()
  const normalized = cwd.replace(/\\/g, '/')
  const webRoot = normalized.endsWith('apps/web') ? cwd : path.join(cwd, 'apps', 'web')
  return path.join(webRoot, '.data', 'referral-admin-tier-bps.json')
}

const filePath = resolvePath()

type FileShape = {
  juniorBps: number
  secondaryBps: number
  primaryBps: number
  updatedAt: number
}

export function readAdminTierBpsFile(): AdminTierBpsRow | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null
    }
    const raw = fs.readFileSync(filePath, 'utf8')
    const parsed = JSON.parse(raw) as Partial<FileShape>
    const j = Number(parsed.juniorBps)
    const s = Number(parsed.secondaryBps)
    const p = Number(parsed.primaryBps)
    const u = Number(parsed.updatedAt)
    if (![j, s, p, u].every((n) => Number.isFinite(n))) {
      return null
    }
    return {
      juniorBps: Math.min(10000, Math.max(0, Math.floor(j))),
      secondaryBps: Math.min(10000, Math.max(0, Math.floor(s))),
      primaryBps: Math.min(10000, Math.max(0, Math.floor(p))),
      updatedAt: Math.floor(u),
    }
  } catch {
    return null
  }
}

export function writeAdminTierBpsFile(row: AdminTierBpsRow): void {
  const dir = path.dirname(filePath)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(row, null, 2), 'utf8')
}

export function getTierConfigFileHint(): string {
  return process.env.REFERRAL_TIER_CONFIG_FILE || '.data/referral-admin-tier-bps.json'
}
