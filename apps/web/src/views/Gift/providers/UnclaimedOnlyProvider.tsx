import { createContext, useContext, useState, ReactNode } from 'react'

interface UnclaimedOnlyContextType {
  unclaimedOnly: boolean
  setUnclaimedOnly: (value: boolean) => void
}

const UnclaimedOnlyContext = createContext<UnclaimedOnlyContextType | undefined>(undefined)

interface UnclaimedOnlyProviderProps {
  children: ReactNode
}

/**
 * 占位符 Provider - 提供仅显示未领取礼品的过滤上下文
 * 由于 Gift 功能已移除，此 Provider 提供基本的占位符实现
 */
export function UnclaimedOnlyProvider({ children }: UnclaimedOnlyProviderProps) {
  const [unclaimedOnly, setUnclaimedOnly] = useState<boolean>(false)

  return (
    <UnclaimedOnlyContext.Provider value={{ unclaimedOnly, setUnclaimedOnly }}>
      {children}
    </UnclaimedOnlyContext.Provider>
  )
}

export function useUnclaimedOnlyContext(): UnclaimedOnlyContextType {
  const context = useContext(UnclaimedOnlyContext)
  if (!context) {
    // 返回默认值，避免在 Provider 外部使用时出错
    return { unclaimedOnly: false, setUnclaimedOnly: () => {} }
  }
  return context
}
