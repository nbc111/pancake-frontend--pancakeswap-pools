import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from '@pancakeswap/localization'
import { Box, Button, Flex, Heading, Input, Message, MessageText, Text } from '@pancakeswap/uikit'
import {
  defaultFinancialProductConfig,
  loadFinancialProductConfig,
  saveFinancialProductConfig,
  type FinancialPeriodConfig,
  type FinancialProductConfig,
} from 'utils/nbcAdmin/financialProductConfig'

const genId = () => `p${Date.now().toString(36)}`

export const NbcStakingAdminFinancialTab: React.FC = () => {
  const { t } = useTranslation()
  const [config, setConfig] = useState<FinancialProductConfig>(() => defaultFinancialProductConfig())
  const [savedHint, setSavedHint] = useState(false)

  useEffect(() => {
    setConfig(loadFinancialProductConfig())
  }, [])

  const persist = useCallback(() => {
    saveFinancialProductConfig(config)
    setSavedHint(true)
    window.setTimeout(() => setSavedHint(false), 2500)
  }, [config])

  const updatePeriod = (index: number, patch: Partial<FinancialPeriodConfig>) => {
    setConfig((c) => {
      const periods = [...c.periods]
      periods[index] = { ...periods[index], ...patch }
      return { ...c, periods }
    })
  }

  const addPeriod = () => {
    setConfig((c) => ({
      ...c,
      periods: [...c.periods, { id: genId(), label: t('New period'), annualYieldPercent: 10 }],
    }))
  }

  const removePeriod = (index: number) => {
    setConfig((c) => ({
      ...c,
      periods: c.periods.filter((_, i) => i !== index),
    }))
  }

  return (
    <Box p="24px" mb="24px">
      <Heading scale="lg" mb="8px">
        {t('Financial product parameters')}
      </Heading>
      <Text color="textSubtle" fontSize="14px" mb="24px">
        {t(
          'Configure yield periods, compound, minimum stake and lock duration. Stored locally in this browser until a backend is connected.',
        )}
      </Text>

      <Message variant="warning" mb="24px">
        <MessageText>
          {t(
            'This configuration is independent of on-chain staking. Connect it to your product or API when ready.',
          )}
        </MessageText>
      </Message>

      {savedHint && (
        <Message variant="success" mb="16px">
          <MessageText>{t('Saved')}</MessageText>
        </Message>
      )}

      <Box mb="24px" p="20px" style={{ border: '1px solid var(--colors-input)', borderRadius: 12 }}>
        <Text bold mb="16px">
          {t('Yield by period')}
        </Text>
        {config.periods.map((row, i) => (
          <Flex key={row.id} flexWrap="wrap" mb="12px" alignItems="center" style={{ gap: '12px' }}>
            <Box width="100px">
              <Text fontSize="12px" color="textSubtle" mb="4px">
                {t('Label')}
              </Text>
              <Input
                scale="sm"
                value={row.label}
                onChange={(e) => updatePeriod(i, { label: e.target.value })}
              />
            </Box>
            <Box width="120px">
              <Text fontSize="12px" color="textSubtle" mb="4px">
                {t('APR %')}
              </Text>
              <Input
                scale="sm"
                type="number"
                value={row.annualYieldPercent}
                onChange={(e) =>
                  updatePeriod(i, { annualYieldPercent: parseFloat(e.target.value) || 0 })
                }
              />
            </Box>
            <Button variant="danger" scale="sm" mt="20px" onClick={() => removePeriod(i)}>
              {t('Remove')}
            </Button>
          </Flex>
        ))}
        <Button variant="secondary" scale="sm" onClick={addPeriod}>
          {t('Add period')}
        </Button>
      </Box>

      <Box mb="24px" p="20px" style={{ border: '1px solid var(--colors-input)', borderRadius: 12 }}>
        <Flex alignItems="center" justifyContent="space-between" flexWrap="wrap" style={{ gap: '16px' }}>
          <Box>
            <Text bold mb="8px">
              {t('Compound (reinvest)')}
            </Text>
            <Text fontSize="14px" color="textSubtle">
              {t('When enabled, UI can show compound; logic is off-chain until integrated.')}
            </Text>
          </Box>
          <Button
            scale="sm"
            variant={config.compoundEnabled ? 'primary' : 'secondary'}
            onClick={() => setConfig((c) => ({ ...c, compoundEnabled: !c.compoundEnabled }))}
          >
            {config.compoundEnabled ? t('On') : t('Off')}
          </Button>
        </Flex>
      </Box>

      <Flex flexWrap="wrap" mb="24px" style={{ gap: '24px' }}>
        <Box
          p="20px"
          style={{ flex: 1, minWidth: 200, border: '1px solid var(--colors-input)', borderRadius: 12 }}
        >
          <Text fontSize="12px" color="textSubtle" mb="4px">
            {t('Minimum stake amount')}
          </Text>
          <Input
            value={config.minStakeAmount}
            onChange={(e) => setConfig((c) => ({ ...c, minStakeAmount: e.target.value }))}
          />
        </Box>
        <Box
          p="20px"
          style={{ flex: 1, minWidth: 200, border: '1px solid var(--colors-input)', borderRadius: 12 }}
        >
          <Text fontSize="12px" color="textSubtle" mb="4px">
            {t('Lock period (days)')}
          </Text>
          <Input
            type="number"
            value={config.lockPeriodDays}
            onChange={(e) =>
              setConfig((c) => ({ ...c, lockPeriodDays: parseInt(e.target.value, 10) || 0 }))
            }
          />
        </Box>
      </Flex>

      <Flex flexWrap="wrap" style={{ gap: '12px' }}>
        <Button onClick={persist}>{t('Save configuration')}</Button>
        <Button
          variant="secondary"
          onClick={() => {
            setConfig(defaultFinancialProductConfig())
          }}
        >
          {t('Reset to defaults')}
        </Button>
      </Flex>
    </Box>
  )
}
