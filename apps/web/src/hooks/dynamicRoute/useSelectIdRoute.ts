import { chainNames, getChainName } from '@pancakeswap/chains'
import { Protocol } from '@pancakeswap/farms'
import { INFINITY_SUPPORTED_CHAINS } from '@pancakeswap/infinity-sdk'
import { Native } from '@pancakeswap/sdk'
import { CAKE, USDC } from '@pancakeswap/tokens'
import { SelectIdRoute, zSelectId } from 'dynamicRoute'
import { useActiveChainId } from 'hooks/useActiveChainId'
import useNativeCurrency from 'hooks/useNativeCurrency'
import { useRouteParams } from 'next-typesafe-url/pages'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo } from 'react'
import { isSupportedProtocol } from 'utils/protocols'
import { z } from 'zod'

export const useSelectIdRoute = () => {
  const router = useRouter()
  const { chainId: activeChainId } = useActiveChainId()
  const native = useNativeCurrency(activeChainId)

  const { data: routeParams, error: routeError, isLoading } = useRouteParams(SelectIdRoute.routeParams)

  const protocolFromQuery = useMemo(() => router.query.selectId?.[1] || '', [router.query])

  const protocolName = useMemo(() => {
    return (
      // if no protocol and infinity is supported, set to infinity
      (
        (!protocolFromQuery || protocolFromQuery === 'infinity') && INFINITY_SUPPORTED_CHAINS.includes(activeChainId)
          ? 'infinity'
          : // if other protocol value is supported (v2, v3, stable), set to that protocol
          isSupportedProtocol(protocolFromQuery as Protocol)
          ? protocolFromQuery
          : // if protocol is not supported, default to v3
            'v3'
      ) as 'infinity' | 'v3' | 'v2' | 'stable'
    )
  }, [activeChainId, router.query])

  const replaceWithDefaultRoute = useCallback(() => {
    if (!activeChainId || !router.isReady) return

    const chainName = getChainName(activeChainId)
    console.debug('debug chainName', { chainName, activeChainId })

    const currencyA = native.symbol
    const currencyB: string = CAKE[activeChainId]?.address ?? USDC[activeChainId]?.address ?? ''

    router.replace(
      {
        query: {
          ...router.query,
          selectId: [chainName, protocolName, currencyA, currencyB],
          chain: chainNames[activeChainId],
        }, // keep other query params
      },
      undefined,
      { shallow: true },
    )
  }, [activeChainId, native.symbol, router, protocolName])

  // If Infinity is not supported on the current chain, redirect to default route
  useEffect(
    () => {
      if (protocolName && protocolFromQuery && protocolName !== protocolFromQuery) {
        replaceWithDefaultRoute()
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [protocolName, protocolFromQuery],
  )

  return {
    protocolName,
    replaceWithDefaultRoute,
    routeParams,
    routeError,
    isLoading,
  }
}

export const useSelectIdRouteParams = () => {
  const { routeParams } = useSelectIdRoute()
  const router = useRouter()

  const params = useMemo(() => {
    if (!routeParams || !routeParams.selectId) return null
    const [chainId, protocol, currencyIdA, currencyIdB] = routeParams.selectId
    return { chainId, protocol, currencyIdA, currencyIdB }
  }, [routeParams])

  const updateParams = useCallback(
    (p: Partial<z.infer<typeof zSelectId>>) => {
      if (!params || !Object.values(params).every((v) => v !== undefined)) return
      const hasOnlyChainId = Object.keys(p).length === 1 && 'chainId' in p && p.chainId !== params.chainId

      router.replace(
        {
          query: {
            ...router.query,
            selectId: hasOnlyChainId
              ? [
                  p.chainId!,
                  params.protocol,
                  params.protocol !== 'stableSwap' ? Native.onChain(p.chainId!).symbol : params.currencyIdA,
                  params.protocol !== 'stableSwap'
                    ? CAKE[p.chainId!]?.address ?? USDC[p.chainId!]?.address ?? params.currencyIdB
                    : params.currencyIdB,
                ]
              : [
                  p.chainId ?? params.chainId,
                  p.protocol ?? params.protocol,
                  p.currencyIdA ?? params.currencyIdA,
                  p.currencyIdB ?? params.currencyIdB,
                ],
            chain: chainNames[p.chainId ?? params.chainId],
          }, // keep other query params
        },
        undefined,
        { shallow: true },
      )
    },
    [params, router],
  )

  const switchCurrencies = useCallback(() => {
    updateParams({ currencyIdA: params?.currencyIdB, currencyIdB: params?.currencyIdA })
  }, [params, updateParams])

  return { ...params, updateParams, switchCurrencies }
}

export const useDefaultSelectIdRoute = () => {
  const { replaceWithDefaultRoute, routeParams, routeError, isLoading } = useSelectIdRoute()

  useEffect(() => {
    if (!isLoading && (!routeParams?.selectId || routeError)) {
      console.warn('replaceWithDefaultRoute', { routeParams, routeError })
      replaceWithDefaultRoute()
    }
  }, [isLoading, routeParams, replaceWithDefaultRoute, routeError])
}
