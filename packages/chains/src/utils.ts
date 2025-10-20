import { ChainId, NonEVMChainId, testnetChainIds, UnifiedChainId } from './chainId'
import {
  chainNameToChainId,
  chainNames,
  chainNamesInKebabCase,
  defiLlamaChainNames,
  mainnetChainNamesInKebabCase,
} from './chainNames'

export function getChainName(chainId: ChainId) {
  return chainNames[chainId]
}

export function getChainNameInKebabCase(chainId: ChainId) {
  return chainNamesInKebabCase[chainId]
}

export function getMainnetChainNameInKebabCase(chainId: keyof typeof mainnetChainNamesInKebabCase) {
  return mainnetChainNamesInKebabCase[chainId]
}

export function getLlamaChainName(chainId: ChainId) {
  return defiLlamaChainNames[chainId]
}

export function getChainIdByChainName(chainName?: string): UnifiedChainId | undefined {
  if (!chainName) return undefined
  return chainNameToChainId[chainName] ?? undefined
}

export function isTestnetChainId(chainId: ChainId) {
  return testnetChainIds.includes(chainId)
}

export function isEvm(chainId?: number) {
  if (!chainId) return false
  return chainId < 1_000_000
}

export function isSolana(chainId?: UnifiedChainId) {
  if (!chainId) return false
  return chainId === NonEVMChainId.SOLANA
}

export function isChainSupported(chainId?: UnifiedChainId) {
  if (!chainId) return false
  return (
    Object.values(ChainId).includes(chainId as ChainId) ||
    Object.values(NonEVMChainId).includes(chainId as NonEVMChainId)
  )
}
