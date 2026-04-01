/**
 * NBC Staking Admin — Withdraw Monitor
 * 测试覆盖：
 *  1. 黑名单 load/save/add/remove
 *  2. 提现历史 load/save/merge 去重
 *  3. 金额 bigint 序列化/反序列化
 *  4. 过滤逻辑（all / blacklisted）
 *  5. 边界条件：空值、非法地址、超过 MAX_HISTORY
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// ─── 复制 index.tsx 中的纯逻辑，避免引入 React/wagmi 依赖 ─────────────────

const BLACKLIST_STORAGE_KEY = 'nbc_staking_blacklist'
const WITHDRAW_HISTORY_KEY = 'nbc_staking_withdraw_history'
const MAX_HISTORY = 200

type WithdrawRecord = {
  poolIndex: number
  user: string
  amount: bigint
  timestamp: number
  txHash: string
  blockNumber: bigint
}

function loadBlacklist(storage: Storage): string[] {
  try {
    const raw = storage.getItem(BLACKLIST_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveBlacklist(storage: Storage, list: string[]) {
  storage.setItem(BLACKLIST_STORAGE_KEY, JSON.stringify(list))
}

function loadWithdrawHistory(storage: Storage): WithdrawRecord[] {
  try {
    const raw = storage.getItem(WITHDRAW_HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return parsed.map((r: any) => ({
      ...r,
      amount: BigInt(r.amount),
      blockNumber: BigInt(r.blockNumber),
    }))
  } catch {
    return []
  }
}

function saveWithdrawHistory(storage: Storage, history: WithdrawRecord[]) {
  const serializable = history.slice(0, MAX_HISTORY).map((r) => ({
    ...r,
    amount: r.amount.toString(),
    blockNumber: r.blockNumber.toString(),
  }))
  storage.setItem(WITHDRAW_HISTORY_KEY, JSON.stringify(serializable))
}

function mergeHistory(incoming: WithdrawRecord[], existing: WithdrawRecord[]): WithdrawRecord[] {
  const seen = new Set(existing.map((r) => r.txHash + r.user))
  const fresh = incoming.filter((r) => !seen.has(r.txHash + r.user))
  return [...fresh, ...existing].slice(0, MAX_HISTORY)
}

function isBlacklisted(blacklist: string[], addr: string): boolean {
  return blacklist.includes(addr.toLowerCase())
}

function addToBlacklist(blacklist: string[], addr: string): string[] {
  const normalized = addr.trim().toLowerCase()
  if (!normalized || !normalized.startsWith('0x')) return blacklist
  return blacklist.includes(normalized) ? blacklist : [...blacklist, normalized]
}

function removeFromBlacklist(blacklist: string[], addr: string): string[] {
  return blacklist.filter((a) => a !== addr.toLowerCase())
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<WithdrawRecord> = {}): WithdrawRecord {
  return {
    poolIndex: 0,
    user: '0xabc000000000000000000000000000000000001',
    amount: 1000000000000000000n, // 1 NBC
    timestamp: 1000000,
    txHash: '0xdeadbeef0000000000000000000000000000000000000000000000000000001',
    blockNumber: 100n,
    ...overrides,
  }
}

// ─── 模拟 localStorage ────────────────────────────────────────────────────────

function createMockStorage(): Storage {
  const store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() { return Object.keys(store).length },
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 测试套件
// ═════════════════════════════════════════════════════════════════════════════

describe('黑名单管理', () => {
  let storage: Storage

  beforeEach(() => {
    storage = createMockStorage()
  })

  it('初始黑名单为空', () => {
    expect(loadBlacklist(storage)).toEqual([])
  })

  it('保存并读取黑名单', () => {
    const list = ['0xabc123', '0xdef456']
    saveBlacklist(storage, list)
    expect(loadBlacklist(storage)).toEqual(list)
  })

  it('添加地址：自动小写化', () => {
    const result = addToBlacklist([], '0xABC000000000000000000000000000000000001')
    expect(result).toContain('0xabc000000000000000000000000000000000001')
  })

  it('添加地址：去重，不会重复', () => {
    const addr = '0xabc000000000000000000000000000000000001'
    const list1 = addToBlacklist([], addr)
    const list2 = addToBlacklist(list1, addr)
    expect(list2.length).toBe(1)
  })

  it('添加地址：大写版本视为相同地址', () => {
    const lower = '0xabc000000000000000000000000000000000001'
    const upper = '0xABC000000000000000000000000000000000001'
    const list1 = addToBlacklist([], lower)
    const list2 = addToBlacklist(list1, upper)
    expect(list2.length).toBe(1)
  })

  it('添加空字符串：忽略', () => {
    const result = addToBlacklist([], '')
    expect(result).toEqual([])
  })

  it('添加非 0x 开头的地址：忽略', () => {
    const result = addToBlacklist([], 'notanaddress')
    expect(result).toEqual([])
  })

  it('删除地址', () => {
    const addr = '0xabc000000000000000000000000000000000001'
    const list = [addr, '0xother000000000000000000000000000000001']
    const result = removeFromBlacklist(list, addr)
    expect(result).not.toContain(addr)
    expect(result.length).toBe(1)
  })

  it('删除不存在的地址：列表不变', () => {
    const list = ['0xabc000000000000000000000000000000000001']
    const result = removeFromBlacklist(list, '0xnonexistent')
    expect(result).toEqual(list)
  })

  it('isBlacklisted：大小写不敏感', () => {
    const list = ['0xabc000000000000000000000000000000000001']
    expect(isBlacklisted(list, '0xABC000000000000000000000000000000000001')).toBe(true)
    expect(isBlacklisted(list, '0xabc000000000000000000000000000000000001')).toBe(true)
  })

  it('isBlacklisted：未标记地址返回 false', () => {
    const list = ['0xabc000000000000000000000000000000000001']
    expect(isBlacklisted(list, '0xother00000000000000000000000000000000001')).toBe(false)
  })

  it('storage 损坏时 loadBlacklist 返回空数组', () => {
    storage.setItem(BLACKLIST_STORAGE_KEY, '{invalid json}')
    expect(loadBlacklist(storage)).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('提现历史 持久化', () => {
  let storage: Storage

  beforeEach(() => {
    storage = createMockStorage()
  })

  it('初始历史为空', () => {
    expect(loadWithdrawHistory(storage)).toEqual([])
  })

  it('保存后读取，bigint 正确还原', () => {
    const record = makeRecord({ amount: 999999999999999999n, blockNumber: 12345678n })
    saveWithdrawHistory(storage, [record])
    const loaded = loadWithdrawHistory(storage)
    expect(loaded[0].amount).toBe(999999999999999999n)
    expect(loaded[0].blockNumber).toBe(12345678n)
  })

  it('保存多条记录并全部读取', () => {
    const records = [
      makeRecord({ txHash: '0x1', user: '0xuser1000000000000000000000000000000001' }),
      makeRecord({ txHash: '0x2', user: '0xuser2000000000000000000000000000000002' }),
      makeRecord({ txHash: '0x3', user: '0xuser3000000000000000000000000000000003' }),
    ]
    saveWithdrawHistory(storage, records)
    const loaded = loadWithdrawHistory(storage)
    expect(loaded.length).toBe(3)
    expect(loaded[0].txHash).toBe('0x1')
  })

  it('超过 MAX_HISTORY 条时截断', () => {
    const records = Array.from({ length: MAX_HISTORY + 50 }, (_, i) =>
      makeRecord({ txHash: `0x${i.toString().padStart(4, '0')}`, blockNumber: BigInt(i) }),
    )
    saveWithdrawHistory(storage, records)
    const loaded = loadWithdrawHistory(storage)
    expect(loaded.length).toBe(MAX_HISTORY)
  })

  it('storage 损坏时返回空数组', () => {
    storage.setItem(WITHDRAW_HISTORY_KEY, 'not valid json [')
    expect(loadWithdrawHistory(storage)).toEqual([])
  })

  it('amount 为 0 时正确处理', () => {
    const record = makeRecord({ amount: 0n })
    saveWithdrawHistory(storage, [record])
    const loaded = loadWithdrawHistory(storage)
    expect(loaded[0].amount).toBe(0n)
  })

  it('极大 bigint 值不丢失精度', () => {
    // 比 Number.MAX_SAFE_INTEGER 大的值
    const huge = 99999999999999999999999999999n
    const record = makeRecord({ amount: huge })
    saveWithdrawHistory(storage, [record])
    const loaded = loadWithdrawHistory(storage)
    expect(loaded[0].amount).toBe(huge)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('提现历史 合并去重', () => {
  it('新记录插在前面', () => {
    const existing = [makeRecord({ txHash: '0xold', blockNumber: 1n })]
    const incoming = [makeRecord({ txHash: '0xnew', blockNumber: 2n })]
    const merged = mergeHistory(incoming, existing)
    expect(merged[0].txHash).toBe('0xnew')
    expect(merged[1].txHash).toBe('0xold')
  })

  it('相同 txHash+user 不会重复', () => {
    const record = makeRecord({ txHash: '0xdup', user: '0xuser000000000000000000000000000000001' })
    const merged = mergeHistory([record], [record])
    expect(merged.length).toBe(1)
  })

  it('不同 user 但相同 txHash 视为不同记录', () => {
    const r1 = makeRecord({ txHash: '0xsame', user: '0xuser1000000000000000000000000000000001' })
    const r2 = makeRecord({ txHash: '0xsame', user: '0xuser2000000000000000000000000000000002' })
    const merged = mergeHistory([r1], [r2])
    expect(merged.length).toBe(2)
  })

  it('合并后总数超过 MAX_HISTORY 时截断', () => {
    const existing = Array.from({ length: MAX_HISTORY }, (_, i) =>
      makeRecord({ txHash: `0xexist${i}`, blockNumber: BigInt(i) }),
    )
    const incoming = [makeRecord({ txHash: '0xbrand_new', blockNumber: 9999n })]
    const merged = mergeHistory(incoming, existing)
    expect(merged.length).toBe(MAX_HISTORY)
    expect(merged[0].txHash).toBe('0xbrand_new') // 新记录在最前
  })

  it('incoming 为空时返回原有记录', () => {
    const existing = [makeRecord()]
    const merged = mergeHistory([], existing)
    expect(merged).toEqual(existing)
  })

  it('existing 为空时返回所有新记录', () => {
    const incoming = [makeRecord({ txHash: '0xa' }), makeRecord({ txHash: '0xb' })]
    const merged = mergeHistory(incoming, [])
    expect(merged.length).toBe(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('过滤逻辑', () => {
  const records: WithdrawRecord[] = [
    makeRecord({ user: '0xgood000000000000000000000000000000001', txHash: '0x1' }),
    makeRecord({ user: '0xbad0000000000000000000000000000000001', txHash: '0x2' }),
    makeRecord({ user: '0xbad0000000000000000000000000000000001', txHash: '0x3' }),
    makeRecord({ user: '0xclean00000000000000000000000000000001', txHash: '0x4' }),
  ]
  const blacklist = ['0xbad0000000000000000000000000000000001']

  it('filter=all 返回全部记录', () => {
    const filtered = records.filter(() => true)
    expect(filtered.length).toBe(4)
  })

  it('filter=blacklisted 只返回黑名单地址的记录', () => {
    const filtered = records.filter((r) => isBlacklisted(blacklist, r.user))
    expect(filtered.length).toBe(2)
    filtered.forEach((r) => expect(r.user).toBe('0xbad0000000000000000000000000000000001'))
  })

  it('黑名单为空时 filter=blacklisted 返回空', () => {
    const filtered = records.filter((r) => isBlacklisted([], r.user))
    expect(filtered.length).toBe(0)
  })

  it('blacklisted 计数正确', () => {
    const count = records.filter((r) => isBlacklisted(blacklist, r.user)).length
    expect(count).toBe(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('金额显示格式化', () => {
  it('1 NBC (18 decimals) 显示为 1.0000', () => {
    const amount = 1000000000000000000n
    const readable = (Number(amount) / 10 ** 18).toFixed(4)
    expect(readable).toBe('1.0000')
  })

  it('0.5 NBC 显示为 0.5000', () => {
    const amount = 500000000000000000n
    const readable = (Number(amount) / 10 ** 18).toFixed(4)
    expect(readable).toBe('0.5000')
  })

  it('0 NBC 显示为 0.0000', () => {
    const amount = 0n
    const readable = (Number(amount) / 10 ** 18).toFixed(4)
    expect(readable).toBe('0.0000')
  })

  it('大数量 100000 NBC 不溢出', () => {
    const amount = 100000n * 10n ** 18n
    const readable = (Number(amount) / 10 ** 18).toFixed(4)
    expect(readable).toBe('100000.0000')
  })
})
