import { ChainId } from '@pancakeswap/chains'
import { FarmV4SupportedChainId, Protocol, supportedChainIdV4 } from '@pancakeswap/farms'

const IS_ADDRESS_REG = /^0x[a-fA-F0-9]{40,64}$/

export interface ExtendSearchParam {
  protocols: Protocol[]
  chains: FarmV4SupportedChainId[]
  tokens?: string[]
  symbols?: string[]
}

function parseTokenExtendSearch(keywords: string, protocols: Protocol[], chains: ChainId[]): ExtendSearchParam[] {
  const symbols = keywords
    .trim()
    .split(/(\s+|,|-|\/)/)
    .map((x) => x.trim())
    .filter((x) => x && !IS_ADDRESS_REG.test(x))
    .slice(0, 3)

  return [
    {
      protocols,
      chains: chains as FarmV4SupportedChainId[],
      symbols,
    },
  ].filter((x) => x.symbols && x.symbols.length > 0)
}

const parseFarmSearchAddress = (keywords: string, protocols: Protocol[], chains: ChainId[]): ExtendSearchParam[] => {
  if (IS_ADDRESS_REG.test(keywords.trim())) {
    return [
      {
        protocols,
        tokens: chains.map((chain) => `${chain}:${keywords.trim()}`),
        chains: chains as FarmV4SupportedChainId[],
      },
    ].filter((x) => x.tokens && x.tokens.length > 0)
  }
  return []
}

const parseQueryChain = (chains: ChainId[], protocols: Protocol[]): ExtendSearchParam[] => {
  if (chains.length === 0) {
    return []
  }
  return [
    {
      protocols,
      chains: chains as FarmV4SupportedChainId[],
    },
  ]
}

export const parseExtendSearchParams = (keywords: string, protocols: Protocol[], chains: ChainId[]) => {
  if (!keywords || keywords.trim().length === 0) {
    return []
  }

  const addressParams = parseFarmSearchAddress(keywords, protocols, chains)
  const tokenParams = parseTokenExtendSearch(keywords, protocols, chains)
  const chainParams = parseQueryChain(chains, protocols)

  return [...chainParams, ...addressParams, ...tokenParams]
}
