import { Toggle } from '@pancakeswap/uikit'
import { useSendGiftContext } from '../providers/SendGiftProvider'

/**
 * Placeholder component - Send gift toggle switch
 * Since Gift functionality has been removed, this component provides basic placeholder implementation
 */
export function SendGiftToggle() {
  const { includeStarterGas, setIncludeStarterGas } = useSendGiftContext()

  return <Toggle checked={includeStarterGas} onChange={(e) => setIncludeStarterGas(e.target.checked)} scale="sm" />
}
