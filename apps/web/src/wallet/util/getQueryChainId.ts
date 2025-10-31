import { isChainSupported, ChainId, getChainIdByChainName } from '@pancakeswap/chains'
import { getChainId } from 'config/chains'
import safeGetWindow from '@pancakeswap/utils/safeGetWindow'

export function getQueryChainId() {
  const window = safeGetWindow()
  if (!window) {
    return ChainId.BSC
  }
  const params = new URL(window.location.href).searchParams
  const chainName = params.get('chain') || ''
  
  // First try local mapping (includes NBC Chain and other custom chains)
  const localChainId = getChainId(chainName)
  if (localChainId) {
    return localChainId
  }
  
  // Fallback to package mapping
  const chainId = getChainIdByChainName(chainName)
  if (!chainId) {
    return undefined
  }
  return chainId
}
