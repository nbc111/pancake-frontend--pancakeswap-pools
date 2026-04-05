/**
 * 邀请绑定持久化：
 * - 设置 `DATABASE_URL` 时使用 PostgreSQL；
 * - 否则使用 JSON 文件（见 storeFile / REFERRAL_DATA_FILE）。
 */
export type { ServerReferralRow, ServerReferralFile } from './storeTypes'

import type { ServerReferralRow } from './storeTypes'
import { isPostgresReferralEnabled } from './pgPool'
import {
  getReferralForInviteeFile,
  readAllReferralsFile,
  upsertReferralFile,
} from './storeFile'
import { getReferralForInviteePg, readAllReferralsPg, upsertReferralPg } from './storePg'

export async function readAllReferrals() {
  if (isPostgresReferralEnabled()) {
    return readAllReferralsPg()
  }
  return readAllReferralsFile()
}

export async function getReferralForInvitee(inviteeLower: string) {
  if (isPostgresReferralEnabled()) {
    return getReferralForInviteePg(inviteeLower)
  }
  return getReferralForInviteeFile(inviteeLower)
}

export async function upsertReferral(inviteeLower: string, row: ServerReferralRow) {
  if (isPostgresReferralEnabled()) {
    return upsertReferralPg(inviteeLower, row)
  }
  return upsertReferralFile(inviteeLower, row)
}

/** 当前存储后端（供管理 API 返回） */
export function getReferralStorageBackend(): 'postgresql' | 'file' {
  return isPostgresReferralEnabled() ? 'postgresql' : 'file'
}
