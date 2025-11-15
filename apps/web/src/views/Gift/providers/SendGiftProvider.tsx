import { createContext, useContext, useState, ReactNode } from 'react'

interface SendGiftContextType {
  nativeAmount: string
  setNativeAmount: (amount: string) => void
  includeStarterGas: boolean
  setIncludeStarterGas: (include: boolean) => void
}

export const SendGiftContext = createContext<SendGiftContextType | undefined>(undefined)

interface SendGiftProviderProps {
  children: ReactNode
}

/**
 * 占位符 Provider - 提供发送礼品上下文
 * 由于 Gift 功能已移除，此 Provider 提供基本的占位符实现
 */
export function SendGiftProvider({ children }: SendGiftProviderProps) {
  const [nativeAmount, setNativeAmount] = useState<string>('')
  const [includeStarterGas, setIncludeStarterGas] = useState<boolean>(false)

  return (
    <SendGiftContext.Provider value={{ nativeAmount, setNativeAmount, includeStarterGas, setIncludeStarterGas }}>
      {children}
    </SendGiftContext.Provider>
  )
}

export function useSendGiftContext(): SendGiftContextType {
  const context = useContext(SendGiftContext)
  if (!context) {
    // 返回默认值，避免在 Provider 外部使用时出错
    return {
      nativeAmount: '',
      setNativeAmount: () => {},
      includeStarterGas: false,
      setIncludeStarterGas: () => {},
    }
  }
  return context
}
