import { useEffect, useRef } from 'react'

/**
 * usePrevious - Hook to get previous value
 * Replaces deleted views/V3Info/hooks/usePrevious
 */
export default function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>()

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}
