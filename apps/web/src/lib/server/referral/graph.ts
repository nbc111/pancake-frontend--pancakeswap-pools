import type { ServerReferralFile, ServerReferralRow } from './storeTypes'

export const MAX_REFERRAL_DEPTH = 3

function norm(a: string): string {
  return a.trim().toLowerCase()
}

/** 直接上级：invitee → row.referrer */
export function getDirectReferrer(
  bindings: ServerReferralFile,
  invitee: string,
): string | null {
  const row = bindings[norm(invitee)] as ServerReferralRow | undefined
  return row?.referrer ? norm(row.referrer) : null
}

/**
 * 三级上级链：[一级, 二级, 三级]，无则 null；遇环则截断。
 */
export function getUplineChain(
  bindings: ServerReferralFile,
  address: string,
  maxDepth: number = MAX_REFERRAL_DEPTH,
): (string | null)[] {
  const out: (string | null)[] = []
  const seen = new Set<string>()
  let current = norm(address)

  for (let i = 0; i < maxDepth; i++) {
    if (seen.has(current)) break
    seen.add(current)

    const parent = getDirectReferrer(bindings, current)
    out.push(parent)
    if (!parent) {
      while (out.length < maxDepth) out.push(null)
      break
    }
    current = parent
  }

  while (out.length < maxDepth) out.push(null)
  return out.slice(0, maxDepth)
}

/**
 * 按层级收集下级：一级=直推，二级=一级的下级，三级=二级的下级。
 */
export function getDownlinesByLevel(
  bindings: ServerReferralFile,
  address: string,
  maxDepth: number = MAX_REFERRAL_DEPTH,
): { level1: string[]; level2: string[]; level3: string[] } {
  const root = norm(address)

  const childrenOf = (parent: string): string[] => {
    const p = norm(parent)
    const acc: string[] = []
    for (const [invitee, row] of Object.entries(bindings)) {
      if (!row?.referrer) continue
      if (norm(row.referrer) === p) acc.push(norm(invitee))
    }
    return acc
  }

  const uniq = (arr: string[]) => [...new Set(arr)]

  const level1 = childrenOf(root)
  const level2: string[] = []
  for (const p of level1) {
    level2.push(...childrenOf(p))
  }
  const level3: string[] = []
  for (const p of level2) {
    level3.push(...childrenOf(p))
  }

  return {
    level1: uniq(level1),
    level2: uniq(level2),
    level3: uniq(level3),
  }
}

/** 以 query 为根，最多展开 maxDepth 层直推下级（与服务端三级统计一致） */
export type ReferralDownlineTreeNode = {
  address: string
  children: ReferralDownlineTreeNode[]
}

export function buildDownlineTreeForAddress(
  bindings: ServerReferralFile,
  queryAddress: string,
  maxDepth: number = MAX_REFERRAL_DEPTH,
): ReferralDownlineTreeNode {
  const root = norm(queryAddress)

  const childrenOf = (parent: string): string[] => {
    const p = norm(parent)
    const acc: string[] = []
    for (const [invitee, row] of Object.entries(bindings)) {
      if (!row?.referrer) continue
      if (norm(row.referrer) === p) acc.push(norm(invitee))
    }
    return [...new Set(acc)]
  }

  const build = (addr: string, tierFromRoot: number): ReferralDownlineTreeNode => {
    if (tierFromRoot >= maxDepth) {
      return { address: addr, children: [] }
    }
    const kids = childrenOf(addr)
    return {
      address: addr,
      children: kids.map((c) => build(c, tierFromRoot + 1)),
    }
  }

  return build(root, 0)
}

export type ReferralGraphForAddress = {
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
  /** 与 downlines 同源，供管理后台树状展示 */
  downlineTree: ReferralDownlineTreeNode
  totalBindings: number
}

export function buildReferralGraphForAddress(
  bindings: ServerReferralFile,
  queryAddress: string,
): ReferralGraphForAddress {
  const chain = getUplineChain(bindings, queryAddress, MAX_REFERRAL_DEPTH)
  const dl = getDownlinesByLevel(bindings, queryAddress, MAX_REFERRAL_DEPTH)
  const downlineTree = buildDownlineTreeForAddress(bindings, queryAddress, MAX_REFERRAL_DEPTH)

  return {
    address: norm(queryAddress),
    uplines: {
      level1: chain[0] ?? null,
      level2: chain[1] ?? null,
      level3: chain[2] ?? null,
    },
    downlines: dl,
    downlineTree,
    totalBindings: Object.keys(bindings).filter((k) => bindings[k]?.referrer).length,
  }
}
