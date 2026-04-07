/**
 * NBC Staking Admin — Withdraw Approval Queue
 * 测试覆盖：
 *  1. WithdrawRequest 状态判断（pending / approved / rejected / executed）
 *  2. 过滤逻辑（all / pending / approved / rejected）
 *  3. 统计计数（各状态数量）
 *  4. 排序（最新申请在前）
 *  5. 金额格式化
 *  6. 边界条件：空列表、全部同一状态等
 */

import { describe, it, expect } from 'vitest'

// ─── 类型定义（与 index.tsx 保持一致）────────────────────────────────────────

type WithdrawRequest = {
  requestId: number
  poolIndex: number
  user: string
  amount: bigint
  requestedAt: number
  approved: boolean
  executed: boolean
  rejected: boolean
}

// ─── 纯逻辑函数（从 UI 中抽取，方便单测）─────────────────────────────────────

function isPending(req: WithdrawRequest): boolean {
  return !req.approved && !req.rejected && !req.executed
}

function isApprovedPending(req: WithdrawRequest): boolean {
  return req.approved && !req.executed
}

function filterRequests(
  requests: WithdrawRequest[],
  filter: 'all' | 'pending' | 'approved' | 'rejected',
): WithdrawRequest[] {
  switch (filter) {
    case 'pending':
      return requests.filter((r) => !r.approved && !r.rejected && !r.executed)
    case 'approved':
      return requests.filter((r) => r.approved && !r.executed)
    case 'rejected':
      return requests.filter((r) => r.rejected)
    case 'all':
    default:
      return requests
  }
}

function countByStatus(requests: WithdrawRequest[]) {
  return {
    pending: requests.filter((r) => !r.approved && !r.rejected && !r.executed).length,
    approved: requests.filter((r) => r.approved && !r.executed).length,
    rejected: requests.filter((r) => r.rejected).length,
    executed: requests.filter((r) => r.executed).length,
  }
}

function sortByIdDesc(requests: WithdrawRequest[]): WithdrawRequest[] {
  return [...requests].sort((a, b) => b.requestId - a.requestId)
}

function formatAmount(amount: bigint, decimals = 18): string {
  return (Number(amount) / 10 ** decimals).toFixed(4)
}

function getStatusLabel(req: WithdrawRequest): string {
  if (req.executed) return 'Executed'
  if (req.rejected) return 'Rejected'
  if (req.approved) return 'Approved - Awaiting user execution'
  return 'Pending Approval'
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeRequest(overrides: Partial<WithdrawRequest> = {}): WithdrawRequest {
  return {
    requestId: 0,
    poolIndex: 0,
    user: '0xuser000000000000000000000000000000001',
    amount: 1000000000000000000n, // 1 NBC
    requestedAt: 1700000000,
    approved: false,
    executed: false,
    rejected: false,
    ...overrides,
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 测试套件
// ═════════════════════════════════════════════════════════════════════════════

describe('状态判断', () => {
  it('新申请默认为 pending', () => {
    const req = makeRequest()
    expect(isPending(req)).toBe(true)
    expect(isApprovedPending(req)).toBe(false)
  })

  it('approved=true, executed=false → approved pending', () => {
    const req = makeRequest({ approved: true })
    expect(isPending(req)).toBe(false)
    expect(isApprovedPending(req)).toBe(true)
  })

  it('approved=true, executed=true → 已执行，不再是 pending 也不是 approved pending', () => {
    const req = makeRequest({ approved: true, executed: true })
    expect(isPending(req)).toBe(false)
    expect(isApprovedPending(req)).toBe(false)
  })

  it('rejected=true → 不是 pending', () => {
    const req = makeRequest({ rejected: true })
    expect(isPending(req)).toBe(false)
  })

  it('getStatusLabel: 默认 pending', () => {
    expect(getStatusLabel(makeRequest())).toBe('Pending Approval')
  })

  it('getStatusLabel: approved 未执行', () => {
    expect(getStatusLabel(makeRequest({ approved: true }))).toBe('Approved - Awaiting user execution')
  })

  it('getStatusLabel: rejected', () => {
    expect(getStatusLabel(makeRequest({ rejected: true }))).toBe('Rejected')
  })

  it('getStatusLabel: executed', () => {
    expect(getStatusLabel(makeRequest({ approved: true, executed: true }))).toBe('Executed')
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('过滤逻辑', () => {
  const requests: WithdrawRequest[] = [
    makeRequest({ requestId: 0 }),                                         // pending
    makeRequest({ requestId: 1, approved: true }),                         // approved pending
    makeRequest({ requestId: 2, rejected: true }),                         // rejected
    makeRequest({ requestId: 3, approved: true, executed: true }),         // executed
    makeRequest({ requestId: 4 }),                                         // pending
  ]

  it('filter=all 返回全部', () => {
    expect(filterRequests(requests, 'all').length).toBe(5)
  })

  it('filter=pending 只返回待审批', () => {
    const result = filterRequests(requests, 'pending')
    expect(result.length).toBe(2)
    result.forEach((r) => expect(isPending(r)).toBe(true))
  })

  it('filter=approved 只返回已批准但未执行', () => {
    const result = filterRequests(requests, 'approved')
    expect(result.length).toBe(1)
    expect(result[0].requestId).toBe(1)
  })

  it('filter=rejected 只返回被拒绝的', () => {
    const result = filterRequests(requests, 'rejected')
    expect(result.length).toBe(1)
    expect(result[0].requestId).toBe(2)
  })

  it('空列表各 filter 均返回空数组', () => {
    expect(filterRequests([], 'all')).toEqual([])
    expect(filterRequests([], 'pending')).toEqual([])
    expect(filterRequests([], 'approved')).toEqual([])
    expect(filterRequests([], 'rejected')).toEqual([])
  })

  it('全部 pending 时 filter=approved 返回空', () => {
    const allPending = [makeRequest({ requestId: 0 }), makeRequest({ requestId: 1 })]
    expect(filterRequests(allPending, 'approved')).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('统计计数', () => {
  it('空列表所有计数为 0', () => {
    const counts = countByStatus([])
    expect(counts).toEqual({ pending: 0, approved: 0, rejected: 0, executed: 0 })
  })

  it('混合状态计数正确', () => {
    const requests = [
      makeRequest({ requestId: 0 }),                                      // pending
      makeRequest({ requestId: 1 }),                                      // pending
      makeRequest({ requestId: 2, approved: true }),                      // approved
      makeRequest({ requestId: 3, rejected: true }),                      // rejected
      makeRequest({ requestId: 4, approved: true, executed: true }),      // executed
      makeRequest({ requestId: 5, approved: true, executed: true }),      // executed
    ]
    const counts = countByStatus(requests)
    expect(counts.pending).toBe(2)
    expect(counts.approved).toBe(1)
    expect(counts.rejected).toBe(1)
    expect(counts.executed).toBe(2)
  })

  it('全部 pending 时其他计数为 0', () => {
    const requests = [makeRequest(), makeRequest({ requestId: 1 })]
    const counts = countByStatus(requests)
    expect(counts.pending).toBe(2)
    expect(counts.approved).toBe(0)
    expect(counts.rejected).toBe(0)
    expect(counts.executed).toBe(0)
  })

  it('approved + executed 不会被重复计入 approved', () => {
    const req = makeRequest({ approved: true, executed: true })
    const counts = countByStatus([req])
    expect(counts.approved).toBe(0)
    expect(counts.executed).toBe(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('排序', () => {
  it('按 requestId 降序排列（最新在前）', () => {
    const requests = [
      makeRequest({ requestId: 2 }),
      makeRequest({ requestId: 0 }),
      makeRequest({ requestId: 5 }),
      makeRequest({ requestId: 1 }),
    ]
    const sorted = sortByIdDesc(requests)
    expect(sorted.map((r) => r.requestId)).toEqual([5, 2, 1, 0])
  })

  it('不修改原数组', () => {
    const requests = [makeRequest({ requestId: 3 }), makeRequest({ requestId: 1 })]
    const sorted = sortByIdDesc(requests)
    expect(requests[0].requestId).toBe(3)
    expect(sorted[0].requestId).toBe(3)
  })

  it('单条记录排序不报错', () => {
    const requests = [makeRequest({ requestId: 7 })]
    expect(sortByIdDesc(requests)[0].requestId).toBe(7)
  })

  it('空列表排序返回空数组', () => {
    expect(sortByIdDesc([])).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('金额格式化', () => {
  it('1 NBC (18 decimals) → 1.0000', () => {
    expect(formatAmount(1000000000000000000n)).toBe('1.0000')
  })

  it('0.5 NBC → 0.5000', () => {
    expect(formatAmount(500000000000000000n)).toBe('0.5000')
  })

  it('0 → 0.0000', () => {
    expect(formatAmount(0n)).toBe('0.0000')
  })

  it('100000 NBC 不溢出', () => {
    expect(formatAmount(100000n * 10n ** 18n)).toBe('100000.0000')
  })

  it('小数精度截断为 4 位', () => {
    const amount = 1234567890000000000n
    const result = formatAmount(amount)
    expect(result).toBe('1.2346')
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('边界条件', () => {
  it('同一 user 在同一 pool，rejected 后可以有新 pending', () => {
    const user = '0xuser000000000000000000000000000000001'
    const requests = [
      makeRequest({ requestId: 0, user, poolIndex: 0 }),
      makeRequest({ requestId: 1, user, poolIndex: 0, rejected: true }),
    ]
    const pending = filterRequests(requests, 'pending')
    expect(pending.length).toBe(1)
    expect(pending[0].requestId).toBe(0)
  })

  it('不同 pool 的 pending 申请互不影响', () => {
    const user = '0xuser000000000000000000000000000000001'
    const requests = [
      makeRequest({ requestId: 0, user, poolIndex: 0 }),
      makeRequest({ requestId: 1, user, poolIndex: 1 }),
    ]
    const pending = filterRequests(requests, 'pending')
    expect(pending.length).toBe(2)
  })

  it('requestId 为 0 的申请能正常处理', () => {
    const req = makeRequest({ requestId: 0 })
    expect(isPending(req)).toBe(true)
    expect(getStatusLabel(req)).toBe('Pending Approval')
  })

  it('大量申请时过滤性能不崩溃', () => {
    const requests = Array.from({ length: 1000 }, (_, i) =>
      makeRequest({ requestId: i, approved: i % 3 === 0, rejected: i % 5 === 0 }),
    )
    expect(() => filterRequests(requests, 'pending')).not.toThrow()
    expect(() => countByStatus(requests)).not.toThrow()
    expect(() => sortByIdDesc(requests)).not.toThrow()
  })
})
