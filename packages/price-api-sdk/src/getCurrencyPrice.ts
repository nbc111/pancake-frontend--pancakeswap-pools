import { ChainId, isTestnetChainId } from '@pancakeswap/chains'

import { Address } from './types/common'

const WALLET_API = 'https://wallet-api.pancakeswap.com/v1/prices/list/'

export const zeroAddress = '0x0000000000000000000000000000000000000000' as const

type TokenUsdPrice = {
  address: Address
  priceUSD: number
}

// duck typing for native currency, token, token info
export type CurrencyParams =
  | {
      chainId: ChainId
      address: Address
      isNative?: false
    }
  | {
      chainId: ChainId
      isNative: true
    }

export type CurrencyKey = `${number}:${string}`

export type CurrencyUsdResult = Record<CurrencyKey, number>

export function getCurrencyKey(currencyParams?: CurrencyParams): CurrencyKey | undefined {
  if (!currencyParams) {
    return undefined
  }

  if ('isNative' in currencyParams && currencyParams.isNative === true) {
    return `${currencyParams.chainId}:${zeroAddress}`
  }
  const { chainId, address } = currencyParams
  return `${chainId}:${address.toLowerCase()}`
}

export function getCurrencyListKey(currencyListParams?: CurrencyParams[]): string | undefined {
  if (!currencyListParams) {
    return undefined
  }

  const currencyKeys = currencyListParams.map(getCurrencyKey).filter((key): key is CurrencyKey => !!key)

  const uniqueKeys = [...new Set(currencyKeys)]

  return uniqueKeys.join(',')
}

function getRequestUrl(params?: CurrencyParams | CurrencyParams[]): string | undefined {
  if (!params) {
    return undefined
  }
  const infoList = Array.isArray(params) ? params : [params]
  const key = getCurrencyListKey(infoList.filter((c) => !isTestnetChainId(c.chainId)))
  if (!key) {
    return undefined
  }
  const encodedKey = encodeURIComponent(key)
  return `${WALLET_API}${encodedKey}`
}

export async function getCurrencyUsdPrice(currencyParams?: CurrencyParams, options?: RequestInit) {
  if (!currencyParams || isTestnetChainId(currencyParams.chainId)) {
    return 0
  }

  const prices = await getCurrencyListUsdPrice([currencyParams], options)
  const key = getCurrencyKey(currencyParams)
  return (key && prices[key]) ?? 0
}

export async function getCurrencyListUsdPrice(
  currencyListParams?: CurrencyParams[],
  options?: RequestInit,
): Promise<CurrencyUsdResult> {
  const requestUrl = getRequestUrl(currencyListParams)
  if (!requestUrl || !currencyListParams) {
    // Return empty object instead of throwing error for invalid requests
    return {}
  }

  try {
    // Add timeout to prevent hanging requests (10 seconds)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    const fetchOptions = {
      ...options,
      signal: options?.signal || controller.signal,
    }

    try {
      const res = await fetch(requestUrl, fetchOptions)
      clearTimeout(timeoutId)
      if (!res.ok) {
        // Return empty object for non-ok responses instead of throwing
        console.warn(`Price API returned non-ok status: ${res.status}`)
        return {}
      }
      const data = await res.json()
      return data || {}
    } catch (fetchError) {
      clearTimeout(timeoutId)
      throw fetchError
    }
  } catch (error) {
    // in case wallet api is down or network error, return empty object
    // This includes timeout, network errors, CORS errors, etc.
    if (error instanceof Error && error.name !== 'AbortError') {
      console.error('Failed to get currency list usd price:', error.message)
    }
    return {}
  }
}

export async function getTokenPrices(
  chainId: ChainId,
  addresses: Address[],
  options?: RequestInit,
): Promise<TokenUsdPrice[]> {
  const requestParams: CurrencyParams[] = addresses.map((address) => ({
    address,
    chainId,
  }))

  const prices = await getCurrencyListUsdPrice(requestParams, options)
  return addresses.map((address) => {
    const key = getCurrencyKey({
      address,
      chainId,
    })
    const priceUSD = (key && prices[key]) ?? 0
    return { address, priceUSD }
  })
}

export async function getNativeTokenPrices(chainIds: ChainId[], options?: RequestInit): Promise<Map<ChainId, number>> {
  const requestParams: CurrencyParams[] = chainIds.map((chainId) => ({
    isNative: true,
    chainId,
  }))
  const prices = await getCurrencyListUsdPrice(requestParams, options)
  return chainIds.reduce((acc, chainId) => {
    const key = getCurrencyKey({
      chainId,
      isNative: true,
    })
    acc.set(chainId, (key && prices[key]) ?? 0)
    return acc
  }, new Map<ChainId, number>())
}
