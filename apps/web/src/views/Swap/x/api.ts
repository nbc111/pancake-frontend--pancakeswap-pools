/**
 * X 订单响应接口
 * 占位符类型定义 - 用于保持代码可编译
 */
export interface GetXOrderReceiptResponseOrder {
  hash: string
  chainId: number
  status: 'OPEN' | 'PENDING' | 'FILLED' | 'CANCELLED' | 'EXPIRED'
  transactionHash?: string
  deadline?: number | string
  createdAt: string
  input: {
    token: string
    startAmount: string
    endAmount: string
  }
  outputs: Array<{
    token: string
    startAmount: string
    endAmount: string
  }>
  [key: string]: any
}
