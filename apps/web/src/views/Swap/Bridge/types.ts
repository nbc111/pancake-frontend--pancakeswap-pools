import { Currency, CurrencyAmount } from '@pancakeswap/swap-sdk-core'

export enum BridgeStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PARTIAL_SUCCESS = 'partial_success',
  PENDING = 'pending',
}

export interface UserBridgeOrder {
  orderId?: string
  timestamp?: string
  status: BridgeStatus
  originChainId: number
  destinationChainId: number
  inputToken: string
  outputToken: string
  inputAmount: string
  outputAmount: string
  minOutputAmount: string
  recipientOnDestinationChain?: string
  transactionHash?: string
  fillTransactionHash?: string
}

export interface ActiveBridgeOrderMetadata {
  metadata: {
    status: BridgeStatus
    inputToken: string
    outputToken: string
    inputAmount: string
    outputAmount: string
    minOutputAmount: string
    originChainId: number
    destinationChainId: number
    recipientOnDestinationChain?: string
  }
}

export type SwapDataSchema = Record<string, unknown>
export type BridgeDataSchema = Record<string, unknown>

export interface BridgeMetadataParams {
  inputAmount: CurrencyAmount<Currency>
  outputCurrency: Currency
  recipientOnDestChain?: string
  commands?: SwapDataSchema[]
  nonce?: string | number
}
