import { isAddress } from 'viem'

/** 已绑定关系：key = invitee 地址小写 */
export const REFERRAL_BINDINGS_KEY = 'nbc-referral-bindings-v1'

/** 待处理邀请人：在连接钱包前从 URL ?ref= 写入 */
export const REFERRAL_PENDING_REF_KEY = 'nbc-pending-ref-v1'

export type ReferralBinding = {
  referrer: `0x${string}`
  boundAt: number
}

export type ReferralBindingsMap = Record<string, ReferralBinding>

function readBindings(): ReferralBindingsMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(REFERRAL_BINDINGS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as ReferralBindingsMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeBindings(map: ReferralBindingsMap) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(REFERRAL_BINDINGS_KEY, JSON.stringify(map))
}

export function normalizeAddr(a: string): `0x${string}` | null {
  const s = a.trim()
  if (!isAddress(s)) return null
  return s.toLowerCase() as `0x${string}`
}

/** 从路由参数解析 ref（邀请人地址） */
export function parseRefQuery(ref: unknown): `0x${string}` | null {
  if (ref === undefined || ref === null) return null
  const s = Array.isArray(ref) ? ref[0] : ref
  if (typeof s !== 'string') return null
  return normalizeAddr(s)
}

export function getPendingRefFromSession(): `0x${string}` | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(REFERRAL_PENDING_REF_KEY)
    if (!raw) return null
    return normalizeAddr(raw)
  } catch {
    return null
  }
}

export function setPendingRefInSession(referrer: `0x${string}`) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(REFERRAL_PENDING_REF_KEY, referrer)
  } catch {
    // ignore quota / private mode
  }
}

export function clearPendingRefInSession() {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(REFERRAL_PENDING_REF_KEY)
  } catch {
    // ignore
  }
}

/** 是否已为该地址绑定过邀请人（首次连接后不变） */
export function getBindingForInvitee(invitee: `0x${string}`): ReferralBinding | null {
  const key = invitee.toLowerCase()
  const map = readBindings()
  const row = map[key]
  return row && row.referrer ? row : null
}

/** 供页面/后续上报：查询当前钱包的邀请人 */
export function getReferrerForWallet(invitee: string | undefined): `0x${string}` | null {
  if (!invitee) return null
  const n = normalizeAddr(invitee)
  if (!n) return null
  return getBindingForInvitee(n)?.referrer ?? null
}

/**
 * 首次绑定：若该 invitee 已有记录则不变。
 * @returns 是否本次新写入
 */
export function tryBindReferral(invitee: `0x${string}`, referrer: `0x${string}`): boolean {
  if (invitee === referrer) return false
  const key = invitee.toLowerCase()
  const map = readBindings()
  if (map[key]?.referrer) return false

  map[key] = { referrer, boundAt: Date.now() }
  writeBindings(map)
  return true
}

/** 与 /api/referral/bind 共用，邀请人签名确认绑定关系（被邀请人地址为 invitee） */
export function buildReferralBindMessage(
  invitee: `0x${string}`,
  referrer: `0x${string}`,
  timestamp: number,
): string {
  return `NBC Referral Binding\nInviter: ${referrer.toLowerCase()}\nInvitee: ${invitee.toLowerCase()}\nTimestamp: ${timestamp}`
}

/** 服务端 lookup 命中且本地尚无记录时合并到本地 */
export function hydrateLocalIfEmpty(
  invitee: `0x${string}`,
  referrer: `0x${string}`,
  boundAt: number,
): boolean {
  const key = invitee.toLowerCase()
  const map = readBindings()
  if (map[key]?.referrer) return false
  map[key] = { referrer: referrer.toLowerCase() as `0x${string}`, boundAt }
  writeBindings(map)
  return true
}

export function isReferralServerSyncEnabled(): boolean {
  return typeof window !== 'undefined' && process.env.NEXT_PUBLIC_REFERRAL_SYNC_ENABLED === 'true'
}
