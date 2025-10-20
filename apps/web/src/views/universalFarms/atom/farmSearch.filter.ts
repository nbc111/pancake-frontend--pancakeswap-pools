import { Currency, getCurrencyAddress } from '@pancakeswap/sdk'
import { SmartRouter } from '@pancakeswap/smart-router'
import { TokenInfo } from '@pancakeswap/token-lists'

import { FarmInfo } from 'state/farmsV4/search/farm.util'

export const filterTokens = (tokensMap: Record<string, TokenInfo>) => {
  return (farm: FarmInfo) => {
    return isFarmWhitelisted(farm, tokensMap)
  }
}

function isTokenWhitelisted(token: Currency, tokensMap: Record<string, TokenInfo>) {
  const key = `${token.chainId}:${getCurrencyAddress(token)}`.toLowerCase()
  return Boolean(token.isNative || tokensMap[key])
}

function isFarmWhitelisted(farm: FarmInfo, tokensMap: Record<string, TokenInfo>) {
  const [token0, token1] = SmartRouter.getCurrenciesOfPool(farm.pool)
  if (!token0 || !token1) return false
  return isTokenWhitelisted(token0, tokensMap) && isTokenWhitelisted(token1, tokensMap)
}

export const isInWhitelist = (tokensMap: Record<string, TokenInfo>) => {
  return (farm: FarmInfo) => {
    return isFarmWhitelisted(farm, tokensMap)
  }
}

export const getUnwhitelistedToken = (farm: FarmInfo, tokensMap: Record<string, TokenInfo>): Currency | null => {
  if (!farm) {
    return null
  }
  const [token0, token1] = SmartRouter.getCurrenciesOfPool(farm.pool)
  if (!token0 || !token1) return null
  if (!isTokenWhitelisted(token0, tokensMap)) return token0
  if (!isTokenWhitelisted(token1, tokensMap)) return token1
  return null
}
