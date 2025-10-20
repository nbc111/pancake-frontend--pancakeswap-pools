import { ChainId, chainNamesInKebabCase, isEvm } from '@pancakeswap/chains'
import {
  FarmV4SupportedChainId,
  fetchAllUniversalFarms,
  Protocol,
  supportedChainIdV4,
  UniversalFarmConfig,
} from '@pancakeswap/farms'
import { getCurrencyAddress, Pair } from '@pancakeswap/sdk'
import { InfinityRouter } from '@pancakeswap/smart-router'

import { SORT_ORDER } from '@pancakeswap/uikit'
import uniqBy from '@pancakeswap/utils/uniqBy'
import { computePoolAddress, DEPLOYER_ADDRESSES } from '@pancakeswap/v3-sdk'
import { edgeQueries } from 'quoter/utils/edgePoolQueries'
import { APIChain, getEdgeChainName } from 'quoter/utils/edgeQueries.util'
import { PoolInfo } from 'state/farmsV4/state/type'
import { explorerApiClient } from 'state/info/api/client'
import { Address } from 'viem/accounts'
import chunk from '@pancakeswap/utils/chunk'
import { FarmInfo, normalizeAddress, safeGetAddress } from './farm.util'

const DEFAULT_PROTOCOLS: Protocol[] = Object.values(Protocol)
export interface FarmQuery {
  keywords: string
  chains: ChainId[]
  protocols: Protocol[]
  sortBy: keyof PoolInfo | null
  sortOrder: SORT_ORDER
  activeChainId?: ChainId
  symbols?: string[]
}

function getPoolId(farm: UniversalFarmConfig) {
  if (farm.protocol === 'v3') {
    const deployerAddress = DEPLOYER_ADDRESSES[farm.chainId]
    const id = computePoolAddress({
      deployerAddress: deployerAddress as Address,
      tokenA: farm.token0.wrapped,
      tokenB: farm.token1.wrapped,
      fee: farm.feeAmount,
    })
    return id
  }
  if (farm.protocol === 'v2') {
    const id = Pair.getAddress(farm.token0.wrapped, farm.token1.wrapped)
    return id
  }
  if (farm.protocol === 'stable') {
    return farm.stableSwapAddress
  }
  if (farm.protocol === 'infinityCl' || farm.protocol === 'infinityBin') {
    return farm.poolId
  }
  throw new Error(`Unsupported protocol: ${farm.protocol}`)
}

export type ChainNameKebab = (typeof chainNamesInKebabCase)[keyof typeof chainNamesInKebabCase]

async function fetchExplorerFarmPools(protocols: Protocol[], chainIds: FarmV4SupportedChainId[]) {
  const chains = chainIds.filter((id) => isEvm(id)).map((chainId) => getEdgeChainName(chainId as ChainId))
  const resp = await explorerApiClient.GET('/cached/pools/farming', {
    params: {
      query: {
        protocols: protocols ?? DEFAULT_PROTOCOLS,
        chains,
      },
    },
    headers: {
      EXPLORER_API_KEY: process.env.EXPLORER_API_KEY,
    },
  })

  return (resp.data || []) as InfinityRouter.RemotePoolBase[]
}

function toRemotePool(farm: UniversalFarmConfig) {
  const { token0, token1 } = farm
  const poolBase: InfinityRouter.RemotePoolBase = {
    id: getPoolId(farm),
    chainId: farm.chainId,
    tvlUSD: '0',
    apr24h: '0',
    volumeUSD24h: '0',
    protocol: farm.protocol,
    token0: {
      id: getCurrencyAddress(token0),
      decimals: farm.token0.decimals,
      symbol: farm.token0.symbol,
    },
    token1: {
      id: getCurrencyAddress(token1),
      decimals: farm.token1.decimals,
      symbol: farm.token1.symbol,
    },
    // @ts-ignore
    feeTier: farm.feeAmount,
  }
  if (farm.protocol === 'v2') {
    return poolBase as InfinityRouter.RemotePoolV2
  }
  if (farm.protocol === 'v3') {
    return {
      ...poolBase,
      feeTier: farm.feeAmount,
    } as InfinityRouter.RemotePoolV3
  }

  return poolBase
}

async function mergePromiseList<T>(promises: Promise<T[]>[]): Promise<T[]> {
  const results = await Promise.allSettled(promises)
  return results.flatMap((r, i) => {
    if (r.status === 'fulfilled') return r.value
    return []
  })
}

async function fetchFarms(query: {
  extend: boolean
  protocols: Protocol[]
  chains: FarmV4SupportedChainId[]
  tokens?: string[]
  symbols?: string[]
}) {
  // const protocols = DEFAULT_PROTOCOLS
  const { extend, protocols: _protocols, tokens, symbols, chains } = query
  const protocols = _protocols.length > 0 ? _protocols : DEFAULT_PROTOCOLS
  const chainIds = chains.length > 0 ? chains : supportedChainIdV4
  if (!extend) {
    return mergePromiseList([
      fetchExplorerFarmPools(protocols, Array.from(chainIds)),
      fetchAllExplorerPools(protocols, Array.from(chainIds)),
    ])
  }
  if (tokens && tokens.length > 0) {
    const byTokenAddress = fetchAllExplorerPoolsByAddress(Array.from(chainIds), tokens, protocols, true)
    const byPoolAddress = fetchAllExplorerPoolsByAddress(Array.from(chainIds), tokens, protocols)
    return mergePromiseList([byTokenAddress, byPoolAddress])
  }

  if (symbols && symbols.length > 0) {
    return fetchAllExplorerPoolsBySymbols(Array.from(chainIds), symbols, protocols)
  }
  return fetchAllExplorerPools(protocols, Array.from(chainIds))
}

async function queryFarms(query: {
  extend: boolean
  protocols: Protocol[]
  chains: FarmV4SupportedChainId[]
  tokens?: string[]
  symbols?: string[]
}) {
  try {
    const { extend } = query
    const [pools, universalFarms] = await Promise.all([fetchFarms(query), fetchAllUniversalFarms()])

    const farmMaps = universalFarms.reduce((acc, farm) => {
      const id = getPoolId(farm)
      return {
        ...acc,
        [`${farm.chainId}:${id}`]: {
          pid: farm.pid,
          lpAddress: safeGetAddress(farm.lpAddress),
        },
      }
    }, {} as Record<Address, number | undefined>)
    const universalFarmPools = universalFarms.map((x) => toRemotePool(x))

    const all = (extend ? [...pools] : [...pools, ...universalFarmPools])
      .map(normalizeAddress)
      .filter((x) => x) as InfinityRouter.RemotePoolBase[]

    const allPools = uniqBy(all, (p) => `${p.chainId}:${p.id}`)
      .map((pool) => {
        const parsedPool = InfinityRouter.parseRemotePool(pool as InfinityRouter.RemotePool)
        if (!parsedPool) {
          return null
        }

        const farmInfo = farmMaps[`${pool.chainId}:${pool.id}`]
        const pid = farmInfo ? farmInfo.pid : undefined
        const lpAddress = farmInfo ? farmInfo.lpAddress : undefined
        return {
          pool: parsedPool,
          id: pool.id,
          chainId: pool.chainId,
          protocol: pool.protocol,
          tvlUSD: pool.tvlUSD || '0',
          vol24hUsd: pool.volumeUSD24h || '0',
          pid,
          apr24h: Number(pool.apr24h || 0),
          isDynamicFee: pool.isDynamicFee,
          feeTier: pool.feeTier,
          lpAddress: lpAddress || pool.id,
        } as FarmInfo
      })
      .filter((x) => x) as FarmInfo[]
    return allPools
  } catch (ex) {
    console.warn('Error fetching farms:', ex)
    return []
  }
}

async function fetchAllExplorerPools(protocols: Protocol[], chains: FarmV4SupportedChainId[]) {
  const poolQuery = {
    baseUrl: `${process.env.NEXT_PUBLIC_EXPLORE_API_ENDPOINT}/cached/pools/list`,
    protocols,
    chains: chains.filter((id) => isEvm(id)).map((chain) => getEdgeChainName(chain as ChainId)),
    maxPages: 2,
    orderBy: 'volumeUSD24h' as const,
  }
  const pools = await edgeQueries.fetchAllPools(poolQuery)
  return pools.map(normalizeAddress).filter((x) => x) as InfinityRouter.RemotePoolBase[]
}

async function fetchAllExplorerPoolsByAddress(
  chains: FarmV4SupportedChainId[],
  addresses: string[],
  protocols: Protocol[],
  isPool: boolean = false,
) {
  if (!protocols.length) return []
  const baseUrl = `${process.env.NEXT_PUBLIC_EXPLORE_API_ENDPOINT}/cached/pools/list`
  const chainNames = chains.filter((id) => isEvm(id)).map((chain) => getEdgeChainName(chain as ChainId))

  if (!addresses.length) return []

  const chunks = chunk(addresses, 20)
  const allPools = await mergePromiseList(
    chunks.map((addrChunk) => {
      return edgeQueries.fetchAllPools({
        baseUrl,
        protocols,
        chains: chainNames,
        pools: isPool ? addrChunk : undefined,
        tokens: !isPool ? addrChunk : undefined,
        maxPages: 1,
      })
    }),
  )
  return allPools
    .flat()
    .map(normalizeAddress)
    .filter((x) => x) as InfinityRouter.RemotePoolBase[]
}

async function fetchAllExplorerPoolsBySymbols(
  chains: FarmV4SupportedChainId[],
  symbols: string[],
  protocols: Protocol[],
) {
  if (!protocols.length) return []
  if (!symbols.length) return []

  const baseUrl = `${process.env.NEXT_PUBLIC_EXPLORE_API_ENDPOINT}/cached/pools/list`
  const chainNames = chains.filter((id) => isEvm(id)).map((chain) => getEdgeChainName(chain as ChainId))

  const chunks = chunk(symbols, 20)
  const allPools = await mergePromiseList(
    chunks.map((symbolChunk) => {
      return edgeQueries.fetchAllPools({
        baseUrl,
        protocols,
        chains: chainNames,
        symbols: symbolChunk,
        maxPages: 1,
      })
    }),
  )

  return allPools
    .flat()
    .map(normalizeAddress)
    .filter((x) => x) as InfinityRouter.RemotePoolBase[]
}

export default {
  queryFarms,
}
