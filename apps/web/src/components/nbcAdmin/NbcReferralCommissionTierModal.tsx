import React, { useEffect, useState } from 'react'
import { useTranslation } from '@pancakeswap/localization'
import { Box, Button, Flex, Input, Modal, Text } from '@pancakeswap/uikit'

function clampBps(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.min(10000, Math.max(0, Math.floor(n)))
}

const TIER_LABEL_KEYS = [
  'Junior agent (tier 1 upline)',
  'Secondary agent (tier 2 upline)',
  'Primary agent (tier 3 upline)',
] as const

export type NbcReferralCommissionTierModalProps = {
  /** 由 useModal / ModalProvider 的 cloneElement 注入，用于关闭 Portal 层弹窗 */
  onDismiss?: () => void
  initialBps: [number, number, number]
  onConfirmSave: (bps: [number, number, number]) => void | Promise<void>
}

/**
 * 在弹窗中编辑三级返佣基点，仅点击「保存」后通过 onConfirmSave 写回。
 */
export const NbcReferralCommissionTierModal: React.FC<NbcReferralCommissionTierModalProps> = ({
  onDismiss,
  initialBps,
  onConfirmSave,
}) => {
  const { t } = useTranslation()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<[string, string, string]>(() => [
    String(initialBps[0]),
    String(initialBps[1]),
    String(initialBps[2]),
  ])

  useEffect(() => {
    setDraft([String(initialBps[0]), String(initialBps[1]), String(initialBps[2])])
  }, [initialBps])

  const dismiss = () => onDismiss?.()

  const onSave = async () => {
    const bps: [number, number, number] = [
      clampBps(parseInt(draft[0], 10)),
      clampBps(parseInt(draft[1], 10)),
      clampBps(parseInt(draft[2], 10)),
    ]
    setSaveError(null)
    setSaving(true)
    try {
      await Promise.resolve(onConfirmSave(bps))
      dismiss()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={t('Configure commission rates')}
      onDismiss={dismiss}
      minHeight="280px"
      minWidth="320px"
    >
      <Text fontSize="13px" color="textSubtle" mb="16px">
        {t('Tier commission rates (basis points: 100 = 1%)')}
      </Text>
      {saveError && (
        <Text fontSize="13px" mb="12px" style={{ whiteSpace: 'pre-wrap', color: 'var(--colors-failure)' }}>
          {saveError}
        </Text>
      )}
      {TIER_LABEL_KEYS.map((labelKey, index) => {
        const bps = clampBps(parseInt(draft[index], 10))
        return (
          <Flex key={labelKey} alignItems="center" mb="14px" flexWrap="wrap" style={{ gap: 10 }}>
            <Box minWidth="160px" style={{ flex: '1 1 140px' }}>
              <Text fontSize="14px">{t(labelKey)}</Text>
            </Box>
            <Input
              type="number"
              scale="sm"
              style={{ maxWidth: 120 }}
              value={draft[index]}
              onChange={(e) => {
                const v = e.target.value
                setDraft((prev) => {
                  const next = [...prev] as [string, string, string]
                  next[index] = v
                  return next
                })
              }}
            />
            <Text fontSize="12px" color="textSubtle" style={{ minWidth: 56 }}>
              = {(bps / 100).toFixed(2)}%
            </Text>
          </Flex>
        )
      })}
      <Flex justifyContent="flex-end" flexWrap="wrap" style={{ gap: 10 }} mt="20px">
        <Button variant="secondary" onClick={dismiss}>
          {t('Cancel')}
        </Button>
        <Button onClick={onSave} disabled={saving} isLoading={saving}>
          {t('Save')}
        </Button>
      </Flex>
    </Modal>
  )
}
