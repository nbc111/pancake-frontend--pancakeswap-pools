import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from '@pancakeswap/localization'
import { Box, Button, Flex, Input, Modal, Text } from '@pancakeswap/uikit'
import truncateHash from '@pancakeswap/utils/truncateHash'
import type { CommissionPayoutStatus, CommissionRecord } from 'utils/nbcAdmin/agentReferral'
import { commissionPayoutStatusOrDefault } from 'utils/nbcAdmin/agentReferral'

export type NbcReferralCommissionPayoutModalProps = {
  onDismiss?: () => void
  /** 任意关闭方式（含点遮罩）时调用，便于父组件清理 state */
  onAfterClose?: () => void
  record: CommissionRecord
  onPatch: (body: {
    id: string
    payoutStatus: CommissionPayoutStatus
    adminPayoutNote?: string | null
  }) => Promise<void>
}

const STATUS_LABEL_KEY: Record<CommissionPayoutStatus, string> = {
  pending: 'Commission payout status pending',
  approved: 'Commission payout status approved',
  rejected: 'Commission payout status rejected',
  paid: 'Commission payout status paid',
}

export const NbcReferralCommissionPayoutModal: React.FC<NbcReferralCommissionPayoutModalProps> = ({
  onDismiss,
  onAfterClose,
  record,
  onPatch,
}) => {
  const { t } = useTranslation()
  const [rejectNote, setRejectNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const dismiss = useCallback(() => {
    onAfterClose?.()
    onDismiss?.()
  }, [onAfterClose, onDismiss])

  const status = useMemo(() => commissionPayoutStatusOrDefault(record), [record])

  const run = useCallback(
    async (payoutStatus: CommissionPayoutStatus, adminPayoutNote?: string | null) => {
      setErr(null)
      setBusy(true)
      try {
        await onPatch({ id: record.id, payoutStatus, adminPayoutNote })
        dismiss()
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e))
      } finally {
        setBusy(false)
      }
    },
    [dismiss, onPatch, record.id],
  )

  const onApprove = () => run('approved', null)
  const onReject = () => run('rejected', rejectNote.trim() || null)
  const onPaid = () => run('paid')
  const onResetPending = () => run('pending', null)

  return (
    <Modal title={t('Commission payout decision modal title')} onDismiss={dismiss} minWidth="320px">
      <Text fontSize="13px" color="textSubtle" mb="12px">
        {t('Commission payout decision modal hint')}
      </Text>
      <Box
        mb="16px"
        p="12px"
        style={{
          borderRadius: 12,
          background: 'var(--colors-backgroundAlt)',
          border: '1px solid var(--colors-cardBorder)',
          fontSize: 12,
        }}
      >
        <Text fontSize="12px" mb="6px">
          <Text as="span" color="textSubtle">
            {t('Referral invited user column')}:{' '}
          </Text>
          <Text as="span" fontFamily="monospace">
            {truncateHash(record.earner)}
          </Text>
        </Text>
        <Text fontSize="12px" mb="6px">
          <Text as="span" color="textSubtle">
            {t('Beneficiary')}:{' '}
          </Text>
          <Text as="span" fontFamily="monospace">
            {truncateHash(record.beneficiary)}
          </Text>
        </Text>
        <Text fontSize="12px" mb="6px">
          <Text as="span" color="textSubtle">
            L{record.tierDistance} · {t('Commission')}:{' '}
          </Text>
          <Text as="span" fontFamily="monospace">
            {record.commissionAmount}
          </Text>
        </Text>
        <Text fontSize="12px">
          <Text as="span" color="textSubtle">
            {t('Commission payout current status')}:{' '}
          </Text>
          <Text as="span" bold>
            {t(STATUS_LABEL_KEY[status])}
          </Text>
        </Text>
      </Box>
      {err && (
        <Text fontSize="13px" mb="12px" style={{ whiteSpace: 'pre-wrap', color: 'var(--colors-failure)' }}>
          {err}
        </Text>
      )}
      <Text fontSize="12px" color="textSubtle" mb="6px">
        {t('Commission payout reject note label')}
      </Text>
      <Input
        placeholder={t('Commission payout reject note placeholder')}
        value={rejectNote}
        onChange={(e) => setRejectNote(e.target.value)}
        style={{ marginBottom: 16 }}
        disabled={busy}
      />
      <Flex flexDirection="column" style={{ gap: 10 }}>
        <Button width="100%" disabled={busy} onClick={onApprove}>
          {t('Commission payout action approve')}
        </Button>
        <Button width="100%" variant="danger" disabled={busy} onClick={onReject}>
          {t('Commission payout action reject')}
        </Button>
        <Button width="100%" variant="secondary" disabled={busy} onClick={onPaid}>
          {t('Commission payout action paid')}
        </Button>
        <Button width="100%" variant="text" scale="sm" disabled={busy} onClick={onResetPending}>
          {t('Commission payout action reset pending')}
        </Button>
      </Flex>
    </Modal>
  )
}
