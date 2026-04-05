import fs from 'fs'
import path from 'path'
import type { CommissionPayoutStatus, CommissionRecord } from 'utils/nbcAdmin/agentReferral'

function resolvePath(): string {
  if (process.env.REFERRAL_COMMISSION_RECORDS_FILE) {
    return process.env.REFERRAL_COMMISSION_RECORDS_FILE
  }
  const cwd = process.cwd()
  const normalized = cwd.replace(/\\/g, '/')
  const webRoot = normalized.endsWith('apps/web') ? cwd : path.join(cwd, 'apps', 'web')
  return path.join(webRoot, '.data', 'referral-commission-records.json')
}

const filePath = resolvePath()

type FileShape = { records: CommissionRecord[] }

function readAll(): CommissionRecord[] {
  try {
    if (!fs.existsSync(filePath)) return []
    const raw = fs.readFileSync(filePath, 'utf8')
    const parsed = JSON.parse(raw) as FileShape
    return Array.isArray(parsed.records) ? parsed.records : []
  } catch {
    return []
  }
}

function writeAll(records: CommissionRecord[]): void {
  const dir = path.dirname(filePath)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify({ records }, null, 2), 'utf8')
}

export function listCommissionRecordsFile(limit: number): CommissionRecord[] {
  const all = readAll().sort((a, b) => b.createdAt - a.createdAt)
  const lim = Math.min(Math.max(1, Math.floor(limit)), 2000)
  return all.slice(0, lim)
}

function beneficiaryRecordsSorted(beneficiary: string): CommissionRecord[] {
  const b = beneficiary.toLowerCase()
  return readAll()
    .filter((r) => r.beneficiary.toLowerCase() === b)
    .sort((a, b) => b.createdAt - a.createdAt)
}

export function listCommissionRecordsByBeneficiaryFile(
  beneficiary: string,
  limit: number,
  offset = 0,
): CommissionRecord[] {
  const all = beneficiaryRecordsSorted(beneficiary)
  const lim = Math.min(Math.max(1, Math.floor(limit)), 500)
  const off = Math.max(0, Math.floor(offset))
  return all.slice(off, off + lim)
}

export function countCommissionRecordsByBeneficiaryFile(beneficiary: string): number {
  return beneficiaryRecordsSorted(beneficiary).length
}

export function sumCommissionAmountByBeneficiaryFile(beneficiary: string): string {
  const all = beneficiaryRecordsSorted(beneficiary)
  try {
    return all.reduce((acc, r) => acc + BigInt(r.commissionAmount || '0'), 0n).toString()
  } catch {
    return '0'
  }
}

export function appendCommissionRecordsFile(records: CommissionRecord[]): number {
  if (records.length === 0) return 0
  const existing = readAll()
  const ids = new Set(existing.map((r) => r.id))
  let n = 0
  for (const r of records) {
    if (ids.has(r.id)) continue
    ids.add(r.id)
    existing.push(r)
    n += 1
  }
  writeAll(existing)
  return n
}

export function deleteAllCommissionRecordsFile(): void {
  writeAll([])
}

export function countCommissionRecordsFile(): number {
  return readAll().length
}

export function updateCommissionRecordPayoutFile(
  id: string,
  payoutStatus: CommissionPayoutStatus,
  adminPayoutNote: string | null | undefined,
  payoutUpdatedAt: number,
): boolean {
  const all = readAll()
  const i = all.findIndex((r) => r.id === id)
  if (i < 0) return false
  const cur = all[i]
  let next: CommissionRecord = { ...cur, payoutStatus, payoutUpdatedAt }
  if (adminPayoutNote !== undefined) {
    const trimmed = adminPayoutNote == null ? '' : adminPayoutNote.trim()
    if (trimmed === '') {
      const { adminPayoutNote: _drop, ...rest } = next
      next = rest as CommissionRecord
    } else {
      next = { ...next, adminPayoutNote: trimmed.slice(0, 2000) }
    }
  }
  all[i] = next
  writeAll(all)
  return true
}

export function getCommissionRecordsFileHint(): string {
  return process.env.REFERRAL_COMMISSION_RECORDS_FILE || '.data/referral-commission-records.json'
}
