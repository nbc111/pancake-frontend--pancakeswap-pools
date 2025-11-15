import { useQuery } from '@tanstack/react-query'

/**
 * 生成 Bridge 状态查询的 key
 */
export function bridgeStatusQueryKey(chainId: number, txHash: string): [string, number, string] {
  return ['bridgeStatus', chainId, txHash]
}

/**
 * 占位符 Hook - 查询跨链桥接状态
 * 由于 Bridge 功能已移除，此 Hook 返回空数据
 */
export function useBridgeStatus(chainId: number, txHash: string) {
  return useQuery({
    queryKey: bridgeStatusQueryKey(chainId, txHash),
    enabled: false, // 禁用查询，因为功能已移除
  })
}
