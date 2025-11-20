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
  const { data } = useQuery<BigNumber, Error>({
    queryKey: ['cakePrice'],
    queryFn: async () => new BigNumber(await getCakePriceFromNbcApi()),
    staleTime: FAST_INTERVAL * 6,
    refetchInterval: FAST_INTERVAL * 6,
    enabled,
  })
  return data ?? BIG_ZERO
}

export const getCakePriceFromOracle = async () => {
  return getCakePriceFromNbcApi()
}

export const getCakePriceFromNbcApi = async () => {
  try {
    const response = await fetch(NBC_PRICE_API_URL)
    const result: NbcPriceResponse = await response.json()

    if (result.status === 'success' && result.data?.buy) {
      return result.data.buy.toString()
    }

    throw new Error('Invalid response from NBC API')
  } catch (error) {
    console.error('Failed to fetch NBC price:', error)
    throw error
  }
}
