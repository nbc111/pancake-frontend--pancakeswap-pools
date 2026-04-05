import { describe, it, expect } from 'vitest'
import type { ServerReferralFile } from './store'
import { buildReferralGraphForAddress, getUplineChain, getDownlinesByLevel } from './graph'

describe('referral graph', () => {
  const A = '0x0000000000000000000000000000000000000001' as `0x${string}`
  const B = '0x0000000000000000000000000000000000000002' as `0x${string}`
  const C = '0x0000000000000000000000000000000000000003' as `0x${string}`
  const D = '0x0000000000000000000000000000000000000004' as `0x${string}`
  const E = '0x0000000000000000000000000000000000000005' as `0x${string}`

  const bindings: ServerReferralFile = {
    [D.toLowerCase()]: { referrer: C, boundAt: 1 },
    [C.toLowerCase()]: { referrer: B, boundAt: 1 },
    [B.toLowerCase()]: { referrer: A, boundAt: 1 },
    [E.toLowerCase()]: { referrer: D, boundAt: 1 },
  }

  it('upline chain for D is C,B,A', () => {
    const chain = getUplineChain(bindings, D)
    expect(chain[0]).toBe(C.toLowerCase())
    expect(chain[1]).toBe(B.toLowerCase())
    expect(chain[2]).toBe(A.toLowerCase())
  })

  it('downlines for A: L1 B, L2 C, L3 D', () => {
    const dl = getDownlinesByLevel(bindings, A)
    expect(dl.level1).toContain(B.toLowerCase())
    expect(dl.level2).toContain(C.toLowerCase())
    expect(dl.level3).toContain(D.toLowerCase())
  })

  it('buildReferralGraphForAddress aggregates', () => {
    const g = buildReferralGraphForAddress(bindings, D)
    expect(g.uplines.level1).toBe(C.toLowerCase())
    expect(g.downlines.level1).toEqual([E.toLowerCase()])
  })
})
