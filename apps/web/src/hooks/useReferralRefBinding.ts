import { useTranslation } from '@pancakeswap/localization'
import { useToast } from '@pancakeswap/uikit'
import { useRouter } from 'next/router'
import { useCallback, useEffect } from 'react'
import { useAccount } from 'wagmi'
import {
  clearPendingRefInSession,
  getBindingForInvitee,
  getPendingRefFromSession,
  hydrateLocalIfEmpty,
  isReferralServerSyncEnabled,
  parseRefQuery,
  setPendingRefInSession,
  tryBindReferral,
} from 'utils/referralBinding'

/**
 * 邀请链接 ?ref=<邀请人地址>：session 暂存；连接钱包后首次绑定写入本地，并可同步服务端。
 * 默认无需被邀请人签名（连接钱包即上报）；若设置 REFERRAL_REQUIRE_INVITEE_SIGNATURE=true 则需验签。
 * 见 NEXT_PUBLIC_REFERRAL_SYNC_ENABLED、DATABASE_URL / REFERRAL_DATA_FILE。
 */
const LOCAL_ONLY_TOAST_KEY = 'nbc-referral-local-only-toast-v1'

export function useReferralRefBinding() {
  const { t } = useTranslation()
  const { toastInfo, toastError } = useToast()
  const router = useRouter()
  const { address } = useAccount()

  const removeRefFromUrl = useCallback(() => {
    if (!router.query.ref) return
    const q = { ...router.query }
    delete q.ref
    router.replace({ pathname: router.pathname, query: q }, undefined, { shallow: true })
  }, [router])

  useEffect(() => {
    if (!router.isReady || typeof window === 'undefined') return
    const refFromUrl = parseRefQuery(router.query.ref)
    if (refFromUrl) {
      setPendingRefInSession(refFromUrl)
    }
  }, [router.isReady, router.query.ref])

  useEffect(() => {
    if (!router.isReady || typeof window === 'undefined') return
    if (!address) return

    const invitee = address.toLowerCase() as `0x${string}`
    const syncEnabled = isReferralServerSyncEnabled()

    let cancelled = false

    ;(async () => {
      if (syncEnabled && !getBindingForInvitee(invitee)) {
        try {
          const r = await fetch(`/api/referral/lookup?invitee=${encodeURIComponent(invitee)}`)
          if (r.ok) {
            const j = (await r.json()) as { referrer?: string; boundAt?: number }
            if (!cancelled && j.referrer) {
              hydrateLocalIfEmpty(invitee, j.referrer as `0x${string}`, j.boundAt ?? Date.now())
            }
          }
        } catch {
          // 离线或接口未部署时忽略
        }
      }

      if (cancelled) return

      /**
       * 本地已有绑定但服务端曾未写入时（例如首次 POST 失败、或当时未开同步），补报一次。
       */
      const existingLocal = getBindingForInvitee(invitee)
      if (existingLocal && syncEnabled) {
        try {
          const r = await fetch(`/api/referral/lookup?invitee=${encodeURIComponent(invitee)}`)
          if (r.status === 404) {
            const res = await fetch('/api/referral/bind', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                invitee,
                referrer: existingLocal.referrer,
              }),
            })
            if (!res.ok) {
              const text = await res.text()
              console.warn('[referral] server backfill failed', res.status, text)
              toastError(t('Referral server sync failed'), `${res.status}: ${text.slice(0, 200)}`)
            }
          }
        } catch (e) {
          console.warn('[referral] server backfill error', e)
        }
      }

      if (cancelled) return

      if (getBindingForInvitee(invitee)) {
        removeRefFromUrl()
        clearPendingRefInSession()
        return
      }

      const fromUrl = parseRefQuery(router.query.ref)
      const fromSession = getPendingRefFromSession()
      const referrer = fromUrl ?? fromSession

      if (!referrer) {
        return
      }

      if (referrer === invitee) {
        clearPendingRefInSession()
        removeRefFromUrl()
        return
      }

      const ok = tryBindReferral(invitee, referrer)
      if (!ok) {
        return
      }

      clearPendingRefInSession()
      removeRefFromUrl()

      if (!syncEnabled) {
        if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem(LOCAL_ONLY_TOAST_KEY)) {
          sessionStorage.setItem(LOCAL_ONLY_TOAST_KEY, '1')
          toastInfo(
            t('Referral saved in this browser only'),
            t('Set NEXT_PUBLIC_REFERRAL_SYNC_ENABLED to true and restart dev server so the admin panel can query server-side data.'),
          )
        }
        return
      }

      try {
        if (cancelled) return
        const res = await fetch('/api/referral/bind', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invitee, referrer }),
        })
        if (!res.ok) {
          const text = await res.text()
          console.warn('[referral] server sync failed', res.status, text)
          toastError(
            t('Referral server sync failed'),
            `${res.status}: ${text.slice(0, 200)}`,
          )
        }
      } catch (e) {
        console.warn('[referral] server sync skipped or failed', e)
        const msg = e instanceof Error ? e.message : String(e)
        toastError(t('Referral server sync failed'), msg)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    router.isReady,
    address,
    router.query.ref,
    removeRefFromUrl,
    router,
    t,
    toastInfo,
    toastError,
  ])
}
