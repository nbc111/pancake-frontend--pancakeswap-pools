import dayjs from 'dayjs'

/**
 * Format time utility - Replaces deleted views/V3Info/utils/date
 */
export function formatTime(timestamp: string | number, formatType: number = 0): string {
  const timestampNum = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp

  if (!timestampNum || Number.isNaN(timestampNum)) {
    return '-'
  }

  const date = dayjs.unix(timestampNum)

  if (formatType === 0) {
    // Format: "MMM D, YYYY h:mm A"
    return date.format('MMM D, YYYY h:mm A')
  }

  // Default format
  return date.format('MMM D, YYYY')
}

export function unixToDate(timestamp: string | number): string {
  const timestampNum = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp
  if (!timestampNum || Number.isNaN(timestampNum)) {
    return '-'
  }
  return dayjs.unix(timestampNum).format('MMM D, YYYY')
}
