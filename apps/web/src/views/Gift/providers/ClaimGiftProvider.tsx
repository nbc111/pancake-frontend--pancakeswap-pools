import { createContext, useContext, useState, ReactNode } from 'react'

interface ClaimGiftContextType {
  code: string
  setCode: (code: string) => void
}

const ClaimGiftContext = createContext<ClaimGiftContextType | undefined>(undefined)

interface ClaimGiftProviderProps {
  children: ReactNode
}

/**
 * 占位符 Provider - 提供礼品领取上下文
 * 由于 Gift 功能已移除，此 Provider 提供基本的占位符实现
 */
export function ClaimGiftProvider({ children }: ClaimGiftProviderProps) {
  const [code, setCode] = useState<string>('')

  return <ClaimGiftContext.Provider value={{ code, setCode }}>{children}</ClaimGiftContext.Provider>
}

export function useClaimGiftContext(): ClaimGiftContextType {
  const context = useContext(ClaimGiftContext)
  if (!context) {
    // 返回默认值，避免在 Provider 外部使用时出错
    return { code: '', setCode: () => {} }
  }
  return context
}
