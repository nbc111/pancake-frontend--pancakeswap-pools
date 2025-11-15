import { useInfiniteQuery } from '@tanstack/react-query'
import { Address } from 'viem'
import { UserBridgeOrder } from '../types'

interface UseRecentBridgeOrdersParams {
  address?: Address | string
}

/**
 * 占位符 Hook - 获取最近的跨链桥接订单
 * 由于 Bridge 功能已移除，此 Hook 返回空数据
 */
export function useRecentBridgeOrders({ address }: UseRecentBridgeOrdersParams = {}) {
  return useInfiniteQuery({
    queryKey: ['recentBridgeOrders', address],
    queryFn: () => ({
      pages: [] as UserBridgeOrder[][],
      pageParams: [] as string[],
    }),
    enabled: false, // 禁用查询，因为功能已移除
    getNextPageParam: () => undefined,
    initialPageParam: undefined,
  })
}
