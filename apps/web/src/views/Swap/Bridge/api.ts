import { Currency } from '@pancakeswap/swap-sdk-core'

export interface Route {
  originChainId: number
  destinationChainId: number
  originToken: string
  destinationToken: string
}

export const getBridgeAvailableRoutes = async (_params: {
  originChainId: number
  destinationChainId: number
}): Promise<Route[]> => {
  return []
}

export const generateSwapCommands = async () => {
  return []
}

export const getTokenAddress = (currency: Currency) => currency.wrapped.address
export const getUnifiedTokenAddress = (currency: Currency) => currency.wrapped.address

export const postMetadata = async (_params: Record<string, unknown>) => ({
  supported: false,
  reason: 'Bridge is disabled on NBC Chain',
  bridgeTransactionData: { outputAmount: '0', totalRelayFee: '0' },
})

export const postSolanaEVMBridgeMetadata = async (_params: Record<string, unknown>) => ({
  supported: false,
  reason: 'Bridge is disabled on NBC Chain',
})
