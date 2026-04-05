import { isPostgresReferralEnabled } from 'lib/server/referral/pgPool'
import {
  appendCommissionRecordsFile,
  countCommissionRecordsByBeneficiaryFile,
  countCommissionRecordsFile,
  deleteAllCommissionRecordsFile,
  getCommissionRecordsFileHint,
  listCommissionRecordsByBeneficiaryFile,
  listCommissionRecordsFile,
  sumCommissionAmountByBeneficiaryFile,
  updateCommissionRecordPayoutFile,
} from 'lib/server/referral/commissionRecordsFile'
import {
  countCommissionRecordsPg,
  deleteAllCommissionRecordsPg,
  getBeneficiaryCommissionMetaPg,
  insertCommissionRecordsPg,
  listCommissionRecordsByBeneficiaryPg,
  listCommissionRecordsPg,
  updateCommissionRecordPayoutPg,
} from 'lib/server/referral/commissionRecordsPg'
import type { CommissionPayoutStatus, CommissionRecord } from 'utils/nbcAdmin/agentReferral'

export async function listCommissionRecords(limit: number): Promise<CommissionRecord[]> {
  if (isPostgresReferralEnabled()) {
    return listCommissionRecordsPg(limit)
  }
  return listCommissionRecordsFile(limit)
}

/** 用户作为 beneficiary 获得的返佣（质押页「我的返佣」） */
export async function listCommissionRecordsByBeneficiary(
  beneficiary: string,
  limit: number,
  offset = 0,
): Promise<CommissionRecord[]> {
  if (isPostgresReferralEnabled()) {
    return listCommissionRecordsByBeneficiaryPg(beneficiary, limit, offset)
  }
  return listCommissionRecordsByBeneficiaryFile(beneficiary, limit, offset)
}

/** 分页一条龙：当前页 rows + 总条数 + 佣金合计（全部分页的 sum，链上最小单位字符串） */
export async function getCommissionEarningsPageForBeneficiary(
  beneficiary: string,
  limit: number,
  offset: number,
): Promise<{ records: CommissionRecord[]; total: number; sumCommissionWei: string }> {
  if (isPostgresReferralEnabled()) {
    const [records, meta] = await Promise.all([
      listCommissionRecordsByBeneficiaryPg(beneficiary, limit, offset),
      getBeneficiaryCommissionMetaPg(beneficiary),
    ])
    return { records, total: meta.total, sumCommissionWei: meta.sumCommissionWei }
  }
  return {
    records: listCommissionRecordsByBeneficiaryFile(beneficiary, limit, offset),
    total: countCommissionRecordsByBeneficiaryFile(beneficiary),
    sumCommissionWei: sumCommissionAmountByBeneficiaryFile(beneficiary),
  }
}

export async function appendCommissionRecords(records: CommissionRecord[]): Promise<number> {
  if (isPostgresReferralEnabled()) {
    return insertCommissionRecordsPg(records)
  }
  return appendCommissionRecordsFile(records)
}

export async function updateCommissionRecordPayout(
  id: string,
  payoutStatus: CommissionPayoutStatus,
  adminPayoutNote: string | null | undefined,
): Promise<boolean> {
  const payoutUpdatedAt = Date.now()
  if (isPostgresReferralEnabled()) {
    return updateCommissionRecordPayoutPg(id, payoutStatus, adminPayoutNote, payoutUpdatedAt)
  }
  return updateCommissionRecordPayoutFile(id, payoutStatus, adminPayoutNote, payoutUpdatedAt)
}

export async function deleteAllCommissionRecords(): Promise<void> {
  if (isPostgresReferralEnabled()) {
    await deleteAllCommissionRecordsPg()
    return
  }
  deleteAllCommissionRecordsFile()
}

export async function countCommissionRecords(): Promise<number> {
  if (isPostgresReferralEnabled()) {
    return countCommissionRecordsPg()
  }
  return countCommissionRecordsFile()
}

export function getCommissionRecordsStorageBackend(): 'postgresql' | 'file' {
  return isPostgresReferralEnabled() ? 'postgresql' : 'file'
}

export { getCommissionRecordsFileHint }
