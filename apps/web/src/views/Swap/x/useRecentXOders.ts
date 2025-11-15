import { useQuery } from '@tanstack/react-query'
import { Address } from 'viem'
import { GetXOrderReceiptResponseOrder } from './api'

interface UseRecentXOrdersParams {
  chainId?: number
  address?: Address | string
  refetchInterval?: number
  enabled?: boolean
}

interface UseRecentXOrdersResponse {
  orders: GetXOrderReceiptResponseOrder[]
}

/**
 * 占位符 Hook - 获取最近的 X 订单
 * 由于 Swap/X 功能已移除，此 Hook 返回空数据
 */
export function useRecentXOrders({ chainId, address, refetchInterval, enabled = false }: UseRecentXOrdersParams = {}): {
  data?: UseRecentXOrdersResponse
  isLoading: boolean
  isFetching: boolean
} {
  return useQuery({
    queryKey: ['recentXOrders', chainId, address],
    queryFn: () => ({
      orders: [] as GetXOrderReceiptResponseOrder[],
    }),
    enabled: enabled && false, // 禁用查询，因为功能已移除
    refetchInterval,
  })
}
