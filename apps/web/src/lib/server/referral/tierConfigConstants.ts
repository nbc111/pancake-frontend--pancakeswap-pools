/** 未在库中写入过配置时，管理后台展示的默认基点（与 agentReferral default 一致） */
export const DEFAULT_ADMIN_TIER_BPS = {
  juniorBps: 500,
  secondaryBps: 300,
  primaryBps: 100,
} as const

export type AdminTierBpsRow = {
  juniorBps: number
  secondaryBps: number
  primaryBps: number
  updatedAt: number
}
