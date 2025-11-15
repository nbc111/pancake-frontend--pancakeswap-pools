import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'

dayjs.extend(relativeTime)
dayjs.extend(utc)

export function formatTime(timestamp: string | number, format?: number): string {
  const date = dayjs.unix(typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp)
  if (format === 0) {
    return date.fromNow()
  }
  return date.format('YYYY-MM-DD HH:mm:ss')
}
