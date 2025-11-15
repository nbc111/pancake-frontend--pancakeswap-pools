import { createContext, useContext, ReactNode } from 'react'
import { Currency, ERC20Token } from '@pancakeswap/sdk'
import { Address } from 'viem'

export interface LPStablePair {
  token0: Currency
  token1: Currency
  liquidityToken: ERC20Token
  stableTotalFee: number
}

export interface StableConfigContextType {
  stableSwapInfoContract?: UseStableSwapInfoContract
}

export interface UseStableSwapInfoContract {
  stableSwapAddress?: Address
  stableSwapInfoAddress?: Address
}

export const StableConfigContext = createContext<StableConfigContextType | null>(null)

export function useStableConfig(): StableConfigContextType {
  const context = useContext(StableConfigContext)
  return context || {}
}

export default useStableConfig
