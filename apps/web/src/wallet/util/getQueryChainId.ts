import { isChainSupported, ChainId, getChainIdByChainName } from '@pancakeswap/chains'
import safeGetWindow from '@pancakeswap/utils/safeGetWindow'

export function getQueryChainId() {
  const window = safeGetWindow()
  if (!window) {
    return ChainId.BSC
  }
  const params = new URL(window.location.href).searchParams
  const chainId = getChainIdByChainName(params.get('chain') || '')
  if (!chainId) {
    return undefined
  }
  return chainId
}
