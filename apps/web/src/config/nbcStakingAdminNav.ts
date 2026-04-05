/**
 * NBC 质押管理后台：子路由 section 与侧边栏分组。
 * 路径：/nbc-staking-admin/[section]
 */

export const NBC_ADMIN_SECTIONS = [
  'pools',
  'add-pool',
  'monitor',
  'settings',
  'financial',
  'referral',
] as const

export type NbcAdminSection = (typeof NBC_ADMIN_SECTIONS)[number]

export const NBC_ADMIN_DEFAULT_SECTION: NbcAdminSection = 'pools'

export function isValidNbcAdminSection(s: string | undefined): s is NbcAdminSection {
  return typeof s === 'string' && (NBC_ADMIN_SECTIONS as readonly string[]).includes(s)
}

export type NbcAdminNavItem = {
  section: NbcAdminSection
  labelKey: string
  emoji?: string
}

export type NbcAdminNavGroup = {
  titleKey: string
  items: NbcAdminNavItem[]
}

/** 高频链上操作 vs 链下运营配置 */
export const NBC_ADMIN_NAV_GROUPS: NbcAdminNavGroup[] = [
  {
    titleKey: 'NBC Admin Nav — On-chain',
    items: [
      { section: 'pools', labelKey: 'Manage Existing Pools' },
      { section: 'add-pool', labelKey: 'Add New Pool' },
      { section: 'monitor', labelKey: 'Withdraw Monitor', emoji: '🔍' },
      { section: 'settings', labelKey: 'Settings' },
    ],
  },
  {
    titleKey: 'NBC Admin Nav — Off-chain',
    items: [
      { section: 'financial', labelKey: 'Financial product' },
      { section: 'referral', labelKey: 'Agent referral' },
    ],
  },
]
