/** 与 POST /api/referral/admin/graph 成功响应一致（供管理端展示） */

export type ReferralDownlineTreeNode = {
  address: string
  children: ReferralDownlineTreeNode[]
}

export type ReferralServerGraphResponse = {
  storage?: string
  dataFileHint?: string
  address: string
  uplines: {
    level1: string | null
    level2: string | null
    level3: string | null
  }
  downlines: {
    level1: string[]
    level2: string[]
    level3: string[]
  }
  downlineTree: ReferralDownlineTreeNode
  totalBindings: number
}
