import { useMemo, useState } from 'react'
import { ButtonMenu, ButtonMenuItem } from '@pancakeswap/uikit'

export interface TabOption {
  value: string
  label: string
  disabled?: boolean
}

interface TabMenuProps {
  tabs: TabOption[] | string[]
  defaultTab?: TabOption | string
  onTabChange?: (tab: TabOption | string) => void
}

export const TabMenu: React.FC<TabMenuProps> = ({ tabs, defaultTab, onTabChange }) => {
  const normalizedTabs = useMemo(() => {
    return tabs.map((tab) => (typeof tab === 'string' ? { value: tab, label: tab } : tab))
  }, [tabs])

  const defaultTabValue = useMemo(() => {
    if (!defaultTab) return normalizedTabs[0]?.value
    return typeof defaultTab === 'string' ? defaultTab : defaultTab.value
  }, [defaultTab, normalizedTabs])

  const [activeIndex, setActiveIndex] = useState(() => {
    const index = normalizedTabs.findIndex((tab) => tab.value === defaultTabValue)
    return index >= 0 ? index : 0
  })

  const handleItemClick = (index: number) => {
    if (normalizedTabs[index]?.disabled) return
    setActiveIndex(index)
    onTabChange?.(normalizedTabs[index])
  }

  return (
    <ButtonMenu activeIndex={activeIndex} onItemClick={handleItemClick} scale="sm">
      {normalizedTabs.map((tab) => (
        <ButtonMenuItem key={tab.value} disabled={tab.disabled}>
          {tab.label}
        </ButtonMenuItem>
      ))}
    </ButtonMenu>
  )
}
