import { FC, PropsWithChildren, useEffect, useMemo } from 'react'

import { type Adapter, type WalletError } from '@solana/wallet-adapter-base'
import { ExodusWalletAdapter } from '@solana/wallet-adapter-exodus'
import { GlowWalletAdapter } from '@solana/wallet-adapter-glow'
import { ConnectionProvider, useWallet, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import {
  BitgetWalletAdapter,
  BitpieWalletAdapter,
  Coin98WalletAdapter,
  CoinbaseWalletAdapter,
  MathWalletAdapter,
  PhantomWalletAdapter,
  SafePalWalletAdapter,
  SolongWalletAdapter,
  TokenPocketWalletAdapter,
  TrustWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { initialize, SolflareWalletAdapter } from '@solflare-wallet/wallet-adapter'

import { useAtomValue, useSetAtom } from 'jotai'
import { rpcUrlAtom } from '@pancakeswap/utils/user'
import { defaultNetWork } from './solana.config'
import { BackpackWalletAdapter } from './walletAdapter/BackpackWalletAdapter'
import { OKXWalletAdapter } from './walletAdapter/OKXWalletAdapter'
import { accountActiveChainAtom } from './atoms/accountStateAtoms'

initialize()

export const SolanaWalletStateUpdater = () => {
  const { connected, connecting, publicKey } = useWallet()
  const setWalletState = useSetAtom(accountActiveChainAtom)

  useEffect(() => {
    const solanaAccount = publicKey?.toBase58() || null
    setWalletState((prev) => {
      return { ...prev, solanaAccount }
    })
  }, [connected, connecting, publicKey, setWalletState])

  return null
}
