export function formatDollarAmount(amount: number | string, digits = 2, showLessThan = true): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (Number.isNaN(num)) return '$0.00'
  if (num === 0) return '$0.00'
  if (num < 0.0001 && showLessThan) return '<$0.0001'
  if (num < 1) return `$${num.toFixed(digits)}`
  if (num < 1000) return `$${num.toFixed(digits)}`
  if (num < 1000000) return `$${(num / 1000).toFixed(digits)}K`
  if (num < 1000000000) return `$${(num / 1000000).toFixed(digits)}M`
  return `$${(num / 1000000000).toFixed(digits)}B`
}
