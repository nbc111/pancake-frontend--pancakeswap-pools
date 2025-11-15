import { useMemo } from 'react'
import { Currency, CurrencyAmount } from '@pancakeswap/sdk'

/**
 * 占位符 Hook - 检查用户余额是否不足
 * 由于 SwapSimplify 功能已移除，此 Hook 返回 false（余额充足）
 *
 * @param currency - 货币对象
 * @param amount - 金额
 * @returns 是否余额不足
 */
export function useUserInsufficientBalanceLight(currency?: Currency, amount?: CurrencyAmount<Currency>): boolean {
  return useMemo(() => {
    // 占位符实现 - 返回 false 表示余额充足
    // 如果需要实际实现，可以在这里添加余额检查逻辑
    return false
  }, [])
}
