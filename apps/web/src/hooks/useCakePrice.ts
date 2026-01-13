import { BIG_ZERO } from '@pancakeswap/utils/bigNumber'
import { useQuery } from '@tanstack/react-query'
import BigNumber from 'bignumber.js'
import { FAST_INTERVAL } from 'config/constants'

// NBC price API endpoint
const NBC_PRICE_API_URL =
  'https://www.nbcex.com/v1/rest/api/market/ticker?symbol=nbcusdt&accessKey=3PswIE0Z9w26R9MC5XrGU8b6LD4bQIWWO1x3nwix1xI='

interface NbcPriceResponse {
  status: string
  message: string | null
  data: {
    tradeName: string
    buy: number
    sell: number
    high: number
    low: number
    last: number
    open: number
    chg: number
    vol24hour: number
  }
}

// for migration to bignumber.js to avoid breaking changes
export const useCakePrice = ({ enabled = true } = {}) => {
  const { data, isLoading, error } = useQuery<BigNumber, Error>({
    queryKey: ['cakePrice'],
    queryFn: async () => {
      const price = await getCakePriceFromNbcApi()
      if (price === null) {
        // 如果 API 调用失败，返回 BIG_ZERO，但会在日志中记录
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.warn('[NBC Price] API call failed, returning BIG_ZERO')
        }
        return BIG_ZERO
      }
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log(`[NBC Price] ✅ Fetched successfully: $${price}`)
      }
      return new BigNumber(price)
    },
    staleTime: FAST_INTERVAL * 6,
    refetchInterval: FAST_INTERVAL * 6,
    enabled,
    retry: 3, // 重试 3 次
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // 指数退避
  })

  // 调试日志
  if (process.env.NODE_ENV === 'development') {
    if (isLoading) {
      // eslint-disable-next-line no-console
      console.log('[NBC Price] ⏳ Loading...')
    } else if (error) {
      // eslint-disable-next-line no-console
      console.error('[NBC Price] ❌ Error:', error)
    } else if (data) {
      // eslint-disable-next-line no-console
      console.log(`[NBC Price] 📊 Current price: $${data.toString()}`)
    }
  }

  return data ?? BIG_ZERO
}

export const getCakePriceFromOracle = async () => {
  return getCakePriceFromNbcApi()
}

export const getCakePriceFromNbcApi = async () => {
  try {
    const response = await fetch(NBC_PRICE_API_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      console.warn(`[NBC Price] HTTP error! status: ${response.status}`)
      return null
    }

    const result: NbcPriceResponse = await response.json()

    if (result.status === 'success' && result.data?.buy) {
      return result.data.buy.toString()
    }

    console.warn('[NBC Price] Invalid response from NBC API:', result)
    return null
  } catch (error) {
    console.error('[NBC Price] Failed to fetch NBC price:', error)
    return null
  }
}
