import { ChainId } from '@pancakeswap/chains'
import { useQuery } from '@tanstack/react-query'

interface PairPriceData {
  time: number
  open: number
  close: number
  high: number
  low: number
}

interface UsePairPriceChartTokenDataResult {
  data?: PairPriceData[]
  maxPrice?: number
  minPrice?: number
  averagePrice?: number
}

/**
 * Placeholder hook - Get pair price chart token data
 * Since V3Info functionality has been removed, this hook returns empty data
 *
 * @param pairAddress - Pair address
 * @param timeWindow - Time window ('hour' | 'day' | 'week' | 'month' | 'year')
 * @param chainId - Chain ID
 * @param enabled - Whether the query is enabled
 * @returns Pair price chart data
 */
export function usePairPriceChartTokenData(
  pairAddress?: string,
  timeWindow?: string,
  chainId?: ChainId,
  enabled = true,
): UsePairPriceChartTokenDataResult {
  return (
    useQuery({
      queryKey: ['pairPriceChartTokenData', pairAddress, timeWindow, chainId],
      queryFn: () => ({
        data: [] as PairPriceData[],
        maxPrice: undefined,
        minPrice: undefined,
        averagePrice: undefined,
      }),
      enabled: enabled && false, // Disable query as functionality has been removed
    }).data ?? {
      data: undefined,
      maxPrice: undefined,
      minPrice: undefined,
      averagePrice: undefined,
    }
  )
}

export interface PoolTickData {
  ticksProcessed: any[]
  activeTickIdx?: number
}

/**
 * Placeholder hook - Get pool tick data
 * Since V3Info functionality has been removed, this hook returns empty data
 */
export function usePoolTickData(_address?: string): PoolTickData | undefined {
  return undefined
}

/**
 * Placeholder hook - Get Infinity CL pool tick data
 * Since V3Info functionality has been removed, this hook returns empty data
 */
export function useInfinityCLPoolTickData(_poolKey?: any): PoolTickData | undefined {
  return undefined
}
