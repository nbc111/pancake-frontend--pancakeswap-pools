import { BridgeStatus, UserBridgeOrder } from '../types'

export const getBridgeTitle = (
  translate: (key: string, options?: Record<string, unknown>) => string,
  status: BridgeStatus | UserBridgeOrder,
) => {
  const normalizedStatus =
    typeof status === 'object' && 'status' in status ? status.status : (status as BridgeStatus | undefined)

  if (normalizedStatus === BridgeStatus.SUCCESS) {
    return translate('Cross-chain swap completed')
  }

  if (normalizedStatus === BridgeStatus.FAILED) {
    return translate('Cross-chain swap failed')
  }

  if (normalizedStatus === BridgeStatus.PARTIAL_SUCCESS) {
    return translate('Cross-chain swap partially completed')
  }

  return translate('Cross-chain swap in progress')
}
