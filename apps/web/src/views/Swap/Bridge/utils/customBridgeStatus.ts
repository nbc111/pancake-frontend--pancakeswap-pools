import { BridgeStatus, UserBridgeOrder } from '../types'

export const customBridgeStatus = (order: UserBridgeOrder): BridgeStatus => {
  return order.status ?? BridgeStatus.PENDING
}
