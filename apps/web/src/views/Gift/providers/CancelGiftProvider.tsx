import { createContext, useContext, useState, ReactNode } from 'react'

interface CancelGiftContextType {
  isCancelling: boolean
  setIsCancelling: (value: boolean) => void
}

const CancelGiftContext = createContext<CancelGiftContextType | undefined>(undefined)

interface CancelGiftProviderProps {
  children: ReactNode
}

/**
 * Placeholder Provider - Provides cancel gift context
 */
export function CancelGiftProvider({ children }: CancelGiftProviderProps) {
  const [isCancelling, setIsCancelling] = useState(false)

  return <CancelGiftContext.Provider value={{ isCancelling, setIsCancelling }}>{children}</CancelGiftContext.Provider>
}

export function useCancelGiftContext(): CancelGiftContextType {
  const context = useContext(CancelGiftContext)
  if (!context) {
    return { isCancelling: false, setIsCancelling: () => {} }
  }
  return context
}
