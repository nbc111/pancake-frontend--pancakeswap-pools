import { useTranslation } from '@pancakeswap/localization'
import { Flex, PreTitle, FlexGap } from '@pancakeswap/uikit'
import { useCallback, useMemo, useState } from 'react'

import { GlobalSettingsTab } from './GlobalSettingsTab'
import { EVMSettingsTab } from './EVMSettingsTab'

enum GlobalSettingsTabIndex {
  GLOBAL = 0,
  EVM_SETTINGS = 1,
}

const GlobalSettings: React.FC = () => {
  const { t } = useTranslation()

  // Tab state
  const [activeTabIndex, setActiveTabIndex] = useState<GlobalSettingsTabIndex>(GlobalSettingsTabIndex.GLOBAL)

  const onTabChange = useCallback(
    (index: GlobalSettingsTabIndex) => {
      setActiveTabIndex(index)
    },
    [setActiveTabIndex],
  )

  // Tab configuration
  // Limitation: we use t() so can't have config outside of the component
  const tabs = useMemo(
    () => [
      {
        index: GlobalSettingsTabIndex.GLOBAL,
        label: t('Global Settings'),
        component: <GlobalSettingsTab />,
      },
      {
        index: GlobalSettingsTabIndex.EVM_SETTINGS,
        label: t('EVM Settings'),
        component: <EVMSettingsTab />,
      },
    ],
    [t],
  )

  return (
    <Flex pb="24px" flexDirection="column">
      <FlexGap mb="24px" gap="16px">
        {tabs.map((tab) => (
          <PreTitle
            key={tab.index}
            style={{ cursor: 'pointer' }}
            color={activeTabIndex === tab.index ? 'secondary' : 'textSubtle'}
            onClick={() => onTabChange(tab.index)}
          >
            {tab.label}
          </PreTitle>
        ))}
      </FlexGap>

      {tabs.find((tab) => tab.index === activeTabIndex)?.component}
    </Flex>
  )
}

export default GlobalSettings
