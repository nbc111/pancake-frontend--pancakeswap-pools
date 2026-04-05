import { z } from 'zod'
import { isAddress } from 'viem'
import { STORAGE_KEY_AGENT } from './storageKeys'

export type AgentTierId = 'junior' | 'secondary' | 'primary'

/** 管理端返佣发放状态（链下记账；默认待处理） */
export const COMMISSION_PAYOUT_STATUSES = ['pending', 'approved', 'rejected', 'paid'] as const
export type CommissionPayoutStatus = (typeof COMMISSION_PAYOUT_STATUSES)[number]

export function commissionPayoutStatusOrDefault(r: { payoutStatus?: CommissionPayoutStatus }): CommissionPayoutStatus {
  return r.payoutStatus ?? 'pending'
}

const tierSchema = z.object({
  id: z.enum(['junior', 'secondary', 'primary']),
  /** 返佣比例：基点，100 = 1%，10000 = 100% */
  commissionRateBps: z.number().int().min(0).max(10000),
})

export const agentReferralConfigSchema = z.object({
  version: z.literal(1),
  tiers: z.tuple([tierSchema, tierSchema, tierSchema]),
  /** 代理关系：parent 邀请 child */
  edges: z.array(
    z.object({
      parent: z.string(),
      child: z.string(),
    }),
  ),
  commissionRecords: z.array(
    z.object({
      id: z.string(),
      createdAt: z.number(),
      earner: z.string(),
      beneficiary: z.string(),
      /** 1=初级(直推), 2=二级, 3=一级(最远) — 与 tiers 顺序对应距离 */
      tierDistance: z.union([z.literal(1), z.literal(2), z.literal(3)]),
      yieldAmount: z.string(),
      commissionAmount: z.string(),
      note: z.string().optional(),
      payoutStatus: z.enum(COMMISSION_PAYOUT_STATUSES).optional(),
      payoutUpdatedAt: z.number().optional(),
      adminPayoutNote: z.string().optional(),
    }),
  ),
})

export type AgentTierConfig = z.infer<typeof tierSchema>
export type AgentReferralState = z.infer<typeof agentReferralConfigSchema>
export type CommissionRecord = AgentReferralState['commissionRecords'][number]

export function defaultAgentReferralState(): AgentReferralState {
  return {
    version: 1,
    tiers: agentTiersFromServerBps(500, 300, 100),
    edges: [],
    commissionRecords: [],
  }
}

/** 与服务端 GET /api/referral/admin/tier-config 的基点顺序一致 */
export function agentTiersFromServerBps(
  juniorBps: number,
  secondaryBps: number,
  primaryBps: number,
): AgentReferralState['tiers'] {
  return [
    { id: 'junior', commissionRateBps: juniorBps },
    { id: 'secondary', commissionRateBps: secondaryBps },
    { id: 'primary', commissionRateBps: primaryBps },
  ]
}

function parseState(raw: string | null): AgentReferralState | null {
  if (!raw) return null
  try {
    const json = JSON.parse(raw)
    const r = agentReferralConfigSchema.safeParse(json)
    return r.success ? r.data : null
  } catch {
    return null
  }
}

export function loadAgentReferralState(): AgentReferralState {
  if (typeof window === 'undefined') return defaultAgentReferralState()
  return parseState(window.localStorage.getItem(STORAGE_KEY_AGENT)) ?? defaultAgentReferralState()
}

export function saveAgentReferralState(state: AgentReferralState): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY_AGENT, JSON.stringify(state))
}

function normalizeAddr(a: string): `0x${string}` | null {
  const s = a.trim()
  if (!isAddress(s)) return null
  return s.toLowerCase() as `0x${string}`
}

/** 从子节点向上找最多 3 层上级（用于返佣） */
export function resolveUplineChain(child: `0x${string}`, edges: AgentReferralState['edges']): `0x${string}`[] {
  const parentByChild = new Map<string, `0x${string}`>()
  for (const e of edges) {
    const p = normalizeAddr(e.parent)
    const c = normalizeAddr(e.child)
    if (p && c) parentByChild.set(c, p)
  }
  const out: `0x${string}`[] = []
  let cur: `0x${string}` | undefined = child
  for (let i = 0; i < 3; i++) {
    const parent = cur ? parentByChild.get(cur) : undefined
    if (!parent) break
    out.push(parent)
    cur = parent
  }
  return out
}

/**
 * 根据服务端查询得到的上级链 [L1,L2,L3] 计算佣金（与 resolveUplineChain 顺序一致）。
 */
export function computeCommissionsFromUplineChain(
  yieldAmountHuman: number,
  uplines: (string | null)[],
  tiers: AgentReferralState['tiers'],
): { beneficiary: `0x${string}`; tierDistance: 1 | 2 | 3; rateBps: number; commission: number }[] {
  if (yieldAmountHuman <= 0 || !Number.isFinite(yieldAmountHuman)) return []
  const result: {
    beneficiary: `0x${string}`
    tierDistance: 1 | 2 | 3
    rateBps: number
    commission: number
  }[] = []
  for (let i = 0; i < 3; i++) {
    const raw = uplines[i]
    if (!raw) continue
    const beneficiary = normalizeAddr(raw)
    if (!beneficiary) continue
    const tier = tiers[i]
    if (!tier) continue
    const rateBps = tier.commissionRateBps
    const commission = (yieldAmountHuman * rateBps) / 10000
    result.push({
      beneficiary,
      tierDistance: (i + 1) as 1 | 2 | 3,
      rateBps,
      commission,
    })
  }
  return result
}

/** 根据下级理财收益计算应记入各上级佣金（仅逻辑，不写存储） */
export function computeCommissionsFromYield(
  earner: `0x${string}`,
  yieldAmountHuman: number,
  state: AgentReferralState,
): { beneficiary: `0x${string}`; tierDistance: 1 | 2 | 3; rateBps: number; commission: number }[] {
  if (yieldAmountHuman <= 0 || !Number.isFinite(yieldAmountHuman)) return []
  const uplines = resolveUplineChain(earner, state.edges)
  const result: { beneficiary: `0x${string}`; tierDistance: 1 | 2 | 3; rateBps: number; commission: number }[] = []
  uplines.forEach((beneficiary, idx) => {
    const tier = state.tiers[idx]
    if (!tier) return
    const rateBps = tier.commissionRateBps
    const commission = (yieldAmountHuman * rateBps) / 10000
    result.push({
      beneficiary,
      tierDistance: (idx + 1) as 1 | 2 | 3,
      rateBps,
      commission,
    })
  })
  return result
}

export function totalCommissionSum(records: CommissionRecord[]): number {
  return records.reduce((acc, r) => acc + parseFloat(r.commissionAmount || '0') || 0, 0)
}

export type TreeNode = {
  address: `0x${string}`
  children: TreeNode[]
}

/** 构建森林的根（无父的节点） */
export function buildAgentForest(edges: AgentReferralState['edges']): TreeNode[] {
  const childrenSet = new Set<string>()
  const all = new Set<string>()
  const normalizedEdges: { parent: `0x${string}`; child: `0x${string}` }[] = []
  for (const e of edges) {
    const p = normalizeAddr(e.parent)
    const c = normalizeAddr(e.child)
    if (!p || !c || p === c) continue
    normalizedEdges.push({ parent: p, child: c })
    all.add(p)
    all.add(c)
    childrenSet.add(c)
  }
  const roots = [...all].filter((a) => !childrenSet.has(a))
  const byParent = new Map<string, `0x${string}`[]>()
  for (const { parent, child } of normalizedEdges) {
    const list = byParent.get(parent) ?? []
    list.push(child)
    byParent.set(parent, list)
  }
  const build = (addr: `0x${string}`): TreeNode => ({
    address: addr,
    children: (byParent.get(addr) ?? []).map((ch) => build(ch)),
  })
  return roots.length > 0 ? roots.map((r) => build(r as `0x${string}`)) : []
}
