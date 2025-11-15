export interface BridgeDataSchema {
  [key: string]: any
}

export interface SwapDataSchema {
  [key: string]: any
}

export interface BridgeMetadataParams {
  [key: string]: any
}

// Bridge 订单状态枚举
export enum BridgeStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  PARTIAL_SUCCESS = 'partial_success',
}

// 用户跨链订单接口
export interface UserBridgeOrder {
  transactionHash: string
  fillTransactionHash?: string
  status: BridgeStatus
  inputToken: any
  outputToken: any
  inputAmount: string
  outputAmount: string
  minOutputAmount: string
  originChainId: number
  destinationChainId: number
  recipientOnDestinationChain?: string
}

// 活跃的跨链订单元数据
export interface ActiveBridgeOrderMetadata {
  txHash?: string
  originChainId?: number
  destinationChainId?: number
  order?: any
  metadata?: {
    status: BridgeStatus
    inputToken: any
    outputToken: any
    inputAmount: string
    outputAmount: string
    minOutputAmount: string
    originChainId: number
    destinationChainId: number
    recipientOnDestinationChain?: string
  }
}
