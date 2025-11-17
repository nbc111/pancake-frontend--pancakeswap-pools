'use client'

import { useSmartWallets as useSmartWalletsOriginal } from '@privy-io/react-auth/smart-wallets'
import { isPrivyEnabled } from './config'

type UseSmartWalletsReturn = ReturnType<typeof useSmartWalletsOriginal>

const stubSmartWallets: UseSmartWalletsReturn = {
  client: null,
  getClientForChain: async () => null,
}

type UseSmartWalletsHook = () => UseSmartWalletsReturn

const useSmartWalletsDisabled: UseSmartWalletsHook = () => stubSmartWallets
const useSmartWalletsEnabled: UseSmartWalletsHook = () => useSmartWalletsOriginal()

export const useSmartWalletsSafe: UseSmartWalletsHook = isPrivyEnabled
  ? useSmartWalletsEnabled
  : useSmartWalletsDisabled
