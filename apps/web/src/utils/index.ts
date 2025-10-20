import { ChainId, NonEVMChainId } from '@pancakeswap/chains'
import { Currency } from '@pancakeswap/sdk'
import { TokenAddressMap } from '@pancakeswap/token-lists'
import { multiChainScanName } from 'state/info/constant'
import { bsc } from 'wagmi/chains'
import { chains } from './wagmi'

export * from './safeGetAddress'
export { useBlockExploreName, useBlockExploreLink } from '../hooks/useBlockExploreName'

// returns the checksummed address if the address is valid, otherwise returns undefined

function getSolExplorerLink(
  data: string | number | undefined | null,
  type: 'transaction' | 'token' | 'address' | 'block' | 'countdown' | 'nft',
) {
  switch (type) {
    case 'transaction':
      return `https://solscan.io/tx/${data}`
    default:
      throw new Error(`Unsupported Solana explorer type: ${type}`)
  }
}

export function getBlockExploreLink(
  data: string | number | undefined | null,
  type: 'transaction' | 'token' | 'address' | 'block' | 'countdown' | 'nft',
  chainIdOverride?: number,
): string {
  const chainId = chainIdOverride || ChainId.BSC
  if (chainId === NonEVMChainId.SOLANA) {
    return getSolExplorerLink(data, type)
  }
  const chain = chains.find((c) => c.id === chainId)
  if (!chain || !data) return bsc.blockExplorers.default.url
  switch (type) {
    case 'transaction': {
      return `${chain?.blockExplorers?.default.url}/tx/${data}`
    }
    case 'token': {
      return `${chain?.blockExplorers?.default.url}/token/${data}`
    }
    case 'block': {
      return `${chain?.blockExplorers?.default.url}/block/${data}`
    }
    case 'countdown': {
      return `${chain?.blockExplorers?.default.url}/block/countdown/${data}`
    }
    case 'nft': {
      return `${chain?.blockExplorers?.default.url}/nft/${data}`
    }
    default: {
      return `${chain?.blockExplorers?.default.url}/address/${data}`
    }
  }
}

export function getBscScanLinkForNft(collectionAddress: string | undefined, tokenId?: string): string {
  if (!collectionAddress) return ''
  return `${bsc.blockExplorers.default.url}/token/${collectionAddress}?a=${tokenId}`
}

// add 10%
export function calculateGasMargin(value: bigint, margin = 1000n): bigint {
  return (value * (10000n + margin)) / 10000n
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

export function isTokenOnList(defaultTokens: TokenAddressMap<ChainId>, currency?: Currency): boolean {
  if (currency?.isNative) return true
  return Boolean(currency?.isToken && defaultTokens[currency.chainId]?.[currency.address])
}

export function truncateText(text: string | undefined, maxLength: number = 200) {
  if (!text) return ''

  if (text.length > maxLength) {
    return `${text.slice(0, maxLength)}...`
  }

  return text
}
