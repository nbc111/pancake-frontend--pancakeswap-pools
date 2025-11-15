import { BridgeStatus } from '../types'

/**
 * 获取自定义的跨链桥接状态
 */
export function customBridgeStatus(order: { status: BridgeStatus }): string {
  // BridgeStatus 是枚举，直接返回字符串值
  if (typeof order.status === 'string') {
    return order.status
  }
  return BridgeStatus.PENDING
}
