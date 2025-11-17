import { formatAmount } from '@pancakeswap/utils/formatInfoNumbers'

/**
 * Format a number as a dollar amount
 * Replaces deleted views/V3Info/utils/numbers
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @param showSymbol - Whether to show $ symbol (default: true)
 * @returns Formatted string like "$1,234.56" or "<$0.01"
 */
export function formatDollarAmount(amount: number | undefined | null, decimals = 2, showSymbol = true): string {
  if (amount === undefined || amount === null || Number.isNaN(amount)) {
    return showSymbol ? '$0.00' : '0.00'
  }

  if (amount === 0) {
    return showSymbol ? '$0.00' : '0.00'
  }

  // Handle very small amounts
  if (amount > 0 && amount < 0.01) {
    return showSymbol ? '<$0.01' : '<0.01'
  }

  const formatted =
    formatAmount(amount, {
      notation: amount >= 10000 ? 'compact' : 'standard',
      precision: decimals,
    }) || '0'

  return showSymbol ? `$${formatted}` : formatted
}
