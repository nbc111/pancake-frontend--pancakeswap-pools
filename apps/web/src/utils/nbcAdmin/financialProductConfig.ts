import { z } from 'zod'
import { STORAGE_KEY_FINANCIAL } from './storageKeys'

const periodSchema = z.object({
  id: z.string().min(1),
  /** 展示用，如「30 天」 */
  label: z.string(),
  /** 年化收益率（百分比，如 12 表示 12%） */
  annualYieldPercent: z.number().min(0).max(1000),
})

export const financialProductConfigSchema = z.object({
  version: z.literal(1),
  periods: z.array(periodSchema).max(32),
  compoundEnabled: z.boolean(),
  /** 起投金额（展示用字符串，避免精度问题） */
  minStakeAmount: z.string(),
  /** 锁仓周期（天） */
  lockPeriodDays: z.number().int().min(0).max(36500),
})

export type FinancialPeriodConfig = z.infer<typeof periodSchema>
export type FinancialProductConfig = z.infer<typeof financialProductConfigSchema>

export const defaultFinancialProductConfig = (): FinancialProductConfig => ({
  version: 1,
  periods: [
    { id: 'p30', label: '30 天', annualYieldPercent: 8 },
    { id: 'p90', label: '90 天', annualYieldPercent: 12 },
    { id: 'p180', label: '180 天', annualYieldPercent: 15 },
  ],
  compoundEnabled: false,
  minStakeAmount: '100',
  lockPeriodDays: 30,
})

function parseConfig(raw: string | null): FinancialProductConfig | null {
  if (!raw) return null
  try {
    const json = JSON.parse(raw)
    const r = financialProductConfigSchema.safeParse(json)
    return r.success ? r.data : null
  } catch {
    return null
  }
}

export function loadFinancialProductConfig(): FinancialProductConfig {
  if (typeof window === 'undefined') return defaultFinancialProductConfig()
  const parsed = parseConfig(window.localStorage.getItem(STORAGE_KEY_FINANCIAL))
  return parsed ?? defaultFinancialProductConfig()
}

export function saveFinancialProductConfig(config: FinancialProductConfig): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY_FINANCIAL, JSON.stringify(config))
}

/** 供未来理财前端读取；未接入前不影响现有质押页 */
export function getFinancialProductConfigFromStorage(): FinancialProductConfig | null {
  if (typeof window === 'undefined') return null
  return parseConfig(window.localStorage.getItem(STORAGE_KEY_FINANCIAL))
}
