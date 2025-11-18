import { OrderType } from '@pancakeswap/price-api-sdk'
import { RouteType } from '@pancakeswap/smart-router'
import { CurrencyAmount, TradeType } from '@pancakeswap/swap-sdk-core'

export interface InterfaceOrder {
  type: OrderType
  bridgeTransactionData?: any
  bridgeFee?: CurrencyAmount<any>
  expectedFillTimeSec?: number
  trade: {
    inputAmount: CurrencyAmount<any>
    outputAmount: CurrencyAmount<any>
    routes?: Array<{
      path: any[]
      inputAmount: CurrencyAmount<any>
      outputAmount: CurrencyAmount<any>
      type?: RouteType
    }>
    tradeType?: TradeType
  }
  isSvmOrder?: boolean
  isBridgeOrder?: boolean
}

export type EVMInterfaceOrder = InterfaceOrder

export type BridgeOrderWithCommands = InterfaceOrder & {
  commands?: InterfaceOrder[]
  noSlippageCommands?: InterfaceOrder[]
}

export const isBridgeOrder = (order?: InterfaceOrder | null): boolean =>
  order?.type === OrderType.PCS_BRIDGE || Boolean(order?.isBridgeOrder)

export const isSVMOrder = (order?: InterfaceOrder | null): boolean => Boolean(order?.isSvmOrder)

export const isXOrder = (_order?: InterfaceOrder | null): boolean => false

export const TWAP_SUPPORTED_CHAINS: number[] = [1281]
