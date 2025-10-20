import { useIsMounted } from '@pancakeswap/hooks'
import { Native } from '@pancakeswap/sdk'
import { sortCurrencies } from '@pancakeswap/swap-sdk-core'
import { CAKE, USDC } from '@pancakeswap/tokens'
import { useSelectIdRouteParams } from 'hooks/dynamicRoute/useSelectIdRoute'
import { useCurrencyByChainId } from 'hooks/Tokens'
import { useActiveChainId } from 'hooks/useAccountActiveChain'
import { useEffect, useMemo } from 'react'
import { useInverted } from 'state/infinity/shared'
import currencyId from 'utils/currencyId'

const isCurrencyIdSorted = (chainId: number, currencyIdA: string, currencyIdB: string) => {
  const nativeCurrency = Native.onChain(chainId)
  if (currencyIdA.toUpperCase() === nativeCurrency.symbol.toUpperCase()) return true
  if (currencyIdB.toUpperCase() === nativeCurrency.symbol.toUpperCase()) return false

  return currencyIdA.toLowerCase() < currencyIdB.toLowerCase()
}

export const useCurrencies = () => {
  const { chainId: activeChainId } = useActiveChainId()

  const { currencyIdA: baseCurrencyId, currencyIdB: quoteCurrencyId, chainId, updateParams } = useSelectIdRouteParams()
  const [inverted, setInverted] = useInverted()

  const baseCurrency_ = useCurrencyByChainId(baseCurrencyId, chainId)
  const quoteCurrency_ = useCurrencyByChainId(quoteCurrencyId, chainId)

  const [baseCurrency, quoteCurrency] = useMemo(() => {
    // Prevent NATIVE-WNATIVE pair
    if (baseCurrency_ && quoteCurrency_ && baseCurrency_?.wrapped.address === quoteCurrency_?.wrapped.address) {
      return [baseCurrency_, undefined]
    }
    return [baseCurrency_, quoteCurrency_]
  }, [baseCurrency_, quoteCurrency_])

  const [currency0, currency1] = useMemo(() => {
    if (!baseCurrency || !quoteCurrency) {
      return [undefined, undefined]
    }

    return sortCurrencies([baseCurrency, quoteCurrency])
  }, [baseCurrency, quoteCurrency])

  const isInverted = useMemo(() => {
    if (!baseCurrencyId || !quoteCurrencyId || !chainId) return null
    return !isCurrencyIdSorted(chainId, baseCurrencyId, quoteCurrencyId)
  }, [baseCurrencyId, chainId, quoteCurrencyId])

  const isMounted = useIsMounted()

  useEffect(() => {
    if (isInverted !== null && inverted !== null && inverted !== isInverted) {
      setInverted(isInverted)
    }
  }, [inverted, isInverted, isMounted, setInverted])

  useEffect(() => {
    if (isMounted && inverted === null && isInverted !== null) {
      setInverted(isInverted)
    }
  }, [inverted, isInverted, isMounted, setInverted])

  // Reset currencies when user's chainId changes
  useEffect(
    () => {
      if (activeChainId && chainId && activeChainId !== chainId) {
        updateParams({
          chainId: activeChainId,
          currencyIdA: currencyId(Native.onChain(activeChainId)),
          currencyIdB: CAKE[activeChainId]?.address ?? USDC[activeChainId]?.address,
        })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeChainId],
  )

  return {
    currency0,
    currency1,
    baseCurrency,
    quoteCurrency,
  }
}
