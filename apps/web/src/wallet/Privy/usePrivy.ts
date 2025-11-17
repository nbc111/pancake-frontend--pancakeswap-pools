'use client'

import { usePrivy as usePrivyOriginal } from '@privy-io/react-auth'
import { isPrivyEnabled } from './config'

type PrivyHookReturn = ReturnType<typeof usePrivyOriginal>

const mockPrivy: PrivyHookReturn = {
  ready: false,
  readyPromise: Promise.resolve(),
  authenticated: false,
  user: null,
  login: async () => {
    console.warn('[Privy] login called but Privy is disabled in this environment')
  },
  logout: async () => {},
  createWallet: async () => {},
  linkWallet: async () => {},
  unlinkWallet: async () => {},
  exportWallet: async () => {},
  setWalletRecovery: async () => {},
  refreshUser: async () => {},
  getAccessToken: async () => undefined,
  getUser: async () => null,
} as PrivyHookReturn

type UsePrivyHook = () => PrivyHookReturn

const usePrivyDisabled: UsePrivyHook = () => mockPrivy
const usePrivyEnabled: UsePrivyHook = () => usePrivyOriginal()

export const usePrivy: UsePrivyHook = isPrivyEnabled ? usePrivyEnabled : usePrivyDisabled

export const withPrivyDisabledWarning = () => {
  if (!isPrivyEnabled) {
    console.warn('[Privy] Privy is disabled because NEXT_PUBLIC_PRIVY_* env vars are missing')
  }
}
