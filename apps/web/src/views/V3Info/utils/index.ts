/**
 * Utility functions - Replaces deleted views/V3Info/utils
 */

/**
 * Shorten address to show first 4 and last 4 characters
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return ''
  if (address.length <= chars * 2) return address
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

export function feeTierPercent(fee?: number): string {
  if (!fee) {
    return '0%'
  }
  return `${(fee / 10000).toFixed(2)}%`
}
