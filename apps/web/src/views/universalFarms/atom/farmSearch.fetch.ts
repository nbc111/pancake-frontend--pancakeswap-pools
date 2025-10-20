import { atomFamily } from 'jotai/utils'
import isEqual from 'lodash/isEqual'
import { atomWithLoadable } from 'quoter/atom/atomWithLoadable'
import { FarmV4SupportedChainId, Protocol } from '@pancakeswap/farms'
import edgeFarmQueries from 'state/farmsV4/search/edgeFarmQueries'

import { FarmInfo } from 'state/farmsV4/search/farm.util'

async function fetchFarmList({
  extend = false,
  protocols,
  tokens,
  symbols,
  chains,
}: {
  extend?: boolean
  protocols?: Protocol[]
  tokens?: string[]
  symbols?: string[]
  chains?: FarmV4SupportedChainId[]
}) {
  const pools = await edgeFarmQueries.queryFarms({
    extend,
    protocols: protocols || [],
    tokens,
    symbols,
    chains: chains || [],
  })
  return pools
}

export const baseFarmListAtom = atomFamily((params: { chains: FarmV4SupportedChainId[]; protocols: Protocol[] }) => {
  return atomWithLoadable<FarmInfo[]>(async () => {
    const { chains, protocols } = params
    return fetchFarmList({
      extend: false,
      chains,
      protocols,
    })
  })
}, isEqual)

export const extendFarmListAtom = atomFamily(
  (params: { protocols: Protocol[]; chains: FarmV4SupportedChainId[]; tokens?: string[]; symbols?: string[] }) => {
    const { protocols, tokens, symbols, chains } = params
    return atomWithLoadable<FarmInfo[]>(async () => {
      return fetchFarmList({
        extend: true,
        protocols,
        tokens,
        symbols,
        chains,
      })
    })
  },
  isEqual,
)
