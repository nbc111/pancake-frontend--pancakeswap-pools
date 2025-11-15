import { useEffect } from 'react'
import { useRouter } from 'next/router'

interface UseAutoFillCodeParams {
  onAutoFillCode?: () => void
  setCode?: (code: string) => void
}

/**
 * 占位符 Hook - 自动填充礼品代码
 * 从 URL 查询参数中读取礼品代码并自动填充
 * 由于 Gift 功能已移除，此 Hook 提供基本的占位符实现
 */
export function useAutoFillCode({ onAutoFillCode, setCode }: UseAutoFillCodeParams = {}) {
  const router = useRouter()

  useEffect(() => {
    // 从 URL 查询参数中读取礼品代码
    const code = router.query.code as string | undefined
    if (code) {
      setCode?.(code)
      onAutoFillCode?.()
    }
  }, [router.query.code, setCode, onAutoFillCode])
}
