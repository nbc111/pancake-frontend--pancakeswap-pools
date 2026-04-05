import fs from 'fs'
import path from 'path'
import type { ServerReferralFile, ServerReferralRow } from './storeTypes'

function resolveDataFile(): string {
  if (process.env.REFERRAL_DATA_FILE) {
    return process.env.REFERRAL_DATA_FILE
  }
  const cwd = process.cwd()
  const normalized = cwd.replace(/\\/g, '/')
  const webRoot = normalized.endsWith('apps/web') ? cwd : path.join(cwd, 'apps', 'web')
  return path.join(webRoot, '.data', 'referral-bindings.json')
}

const dataFile = resolveDataFile()

export function readAllReferralsFile(): ServerReferralFile {
  try {
    if (!fs.existsSync(dataFile)) {
      return {}
    }
    const raw = fs.readFileSync(dataFile, 'utf8')
    const parsed = JSON.parse(raw) as ServerReferralFile
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function writeAllReferralsFile(data: ServerReferralFile) {
  const dir = path.dirname(dataFile)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf8')
}

export function getReferralForInviteeFile(inviteeLower: string): ServerReferralRow | null {
  const all = readAllReferralsFile()
  const row = all[inviteeLower.toLowerCase()]
  return row?.referrer ? row : null
}

export function upsertReferralFile(
  inviteeLower: string,
  row: ServerReferralRow,
): 'created' | 'unchanged' | 'conflict' {
  const all = readAllReferralsFile()
  const key = inviteeLower.toLowerCase()
  const existing = all[key]
  if (existing?.referrer) {
    if (existing.referrer.toLowerCase() === row.referrer.toLowerCase()) {
      return 'unchanged'
    }
    return 'conflict'
  }
  all[key] = {
    referrer: row.referrer.toLowerCase() as `0x${string}`,
    boundAt: row.boundAt,
    signature: row.signature,
  }
  writeAllReferralsFile(all)
  return 'created'
}
