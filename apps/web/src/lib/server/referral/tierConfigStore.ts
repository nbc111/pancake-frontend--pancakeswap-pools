import type { AdminTierBpsRow } from './tierConfigConstants'
import { isPostgresReferralEnabled } from './pgPool'
import { getTierConfigFileHint, readAdminTierBpsFile, writeAdminTierBpsFile } from './tierConfigFile'
import { readAdminTierBpsPg, upsertAdminTierBpsPg } from './tierConfigPg'

export async function readAdminTierBps(): Promise<AdminTierBpsRow | null> {
  if (isPostgresReferralEnabled()) {
    return readAdminTierBpsPg()
  }
  return readAdminTierBpsFile()
}

export async function upsertAdminTierBps(row: AdminTierBpsRow): Promise<void> {
  if (isPostgresReferralEnabled()) {
    await upsertAdminTierBpsPg(row)
    return
  }
  writeAdminTierBpsFile(row)
}

export function getAdminTierConfigStorageBackend(): 'postgresql' | 'file' {
  return isPostgresReferralEnabled() ? 'postgresql' : 'file'
}

export { getTierConfigFileHint }
