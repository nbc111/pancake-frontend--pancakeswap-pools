import { useEffect, useRef } from 'react'

/**
 * Placeholder hook - Get previous value
 * Returns the previous value of the given value
 */
export default function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>()

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}
