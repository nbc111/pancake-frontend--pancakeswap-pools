import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from '@pancakeswap/localization'
import { Box, Button, Flex, Modal, Text, copyText, useToast } from '@pancakeswap/uikit'
import truncateHash from '@pancakeswap/utils/truncateHash'
import {
  commissionPayoutStatusOrDefault,
  type CommissionPayoutStatus,
  type CommissionRecord,
} from 'utils/nbcAdmin/agentReferral'

const USER_COMMISSION_STATUS_STYLE: Record<
  CommissionPayoutStatus,
  { border: string; bg: string; labelKey: string }
> = {
  pending: {
    border: 'var(--colors-warning)',
    bg: 'var(--colors-backgroundAlt)',
    labelKey: 'NBC referral share commission status pending',
  },
  approved: {
    border: 'var(--colors-primary)',
    bg: 'var(--colors-input)',
    labelKey: 'NBC referral share commission status approved',
  },
  rejected: {
    border: 'var(--colors-failure)',
    bg: 'var(--colors-backgroundAlt)',
    labelKey: 'NBC referral share commission status rejected',
  },
  paid: {
    border: 'var(--colors-success)',
    bg: 'var(--colors-input)',
    labelKey: 'NBC referral share commission status paid',
  },
}

export type NbcReferralShareModalProps = {
  /** useModal 注入 */
  onDismiss?: () => void
  walletAddress: `0x${string}`
}

const PAGE_SIZE = 5

function abbrevNum(s: string, maxLen: number): string {
  const t = s.replace(/\s/g, '')
  if (t.length <= maxLen) return t
  return `${t.slice(0, maxLen)}…`
}

type EarningsApiResponse = {
  records?: CommissionRecord[]
  total?: number
  sumCommissionWei?: string
}

export const NbcReferralShareModal: React.FC<NbcReferralShareModalProps> = ({ onDismiss, walletAddress }) => {
  const { t } = useTranslation()
  const router = useRouter()
  const { toastSuccess } = useToast()
  const [page, setPage] = useState(1)
  const [records, setRecords] = useState<CommissionRecord[]>([])
  const [total, setTotal] = useState(0)
  const [sumCommissionWei, setSumCommissionWei] = useState('0')
  const [recordsLoading, setRecordsLoading] = useState(true)
  const [recordsError, setRecordsError] = useState<string | null>(null)

  useLayoutEffect(() => {
    setPage(1)
    setTotal(0)
    setRecords([])
    setSumCommissionWei('0')
    setRecordsError(null)
  }, [walletAddress])

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const path = router.pathname || '/nbc-staking'
    const u = new URL(path, window.location.origin)
    u.searchParams.set('chain', 'nbc')
    u.searchParams.set('ref', walletAddress)
    return u.toString()
  }, [router.pathname, walletAddress])

  useEffect(() => {
    let cancelled = false
    setRecordsLoading(true)
    setRecordsError(null)
    const offset = (page - 1) * PAGE_SIZE

    const parseErrorMessage = (raw: string) => {
      try {
        const j = JSON.parse(raw) as { error?: string; details?: string }
        return [j.error, j.details].filter(Boolean).join('\n') || raw
      } catch {
        return raw
      }
    }
    const q = new URLSearchParams({
      beneficiary: walletAddress,
      limit: String(PAGE_SIZE),
      offset: String(offset),
    })
    fetch(`/api/referral/my-commission-earnings?${q.toString()}`)
      .then((r) => r.text().then((text) => ({ ok: r.ok, text })))
      .then(({ ok, text }) => {
        if (cancelled) return
        if (!ok) {
          setRecordsError(parseErrorMessage(text))
          setRecords([])
          return
        }
        try {
          const j = JSON.parse(text) as EarningsApiResponse
          setRecords(Array.isArray(j.records) ? j.records : [])
          setTotal(typeof j.total === 'number' && Number.isFinite(j.total) ? j.total : 0)
          setSumCommissionWei(typeof j.sumCommissionWei === 'string' ? j.sumCommissionWei : '0')
        } catch {
          setRecordsError(parseErrorMessage(text))
          setRecords([])
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setRecordsError(e instanceof Error ? e.message : String(e))
          setRecords([])
        }
      })
      .finally(() => {
        if (!cancelled) setRecordsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [walletAddress, page])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const showPager = total > PAGE_SIZE
  /** 首屏加载中不展示空表头；有数据、翻页中或当前页有条目时展示 */
  const showCommissionsSection =
    total > 0 || records.length > 0 || (recordsLoading && page > 1)

  const onCopyLink = useCallback(() => {
    if (!shareUrl) return
    copyText(shareUrl, () => {
      toastSuccess(t('Copied'), t('NBC referral share link copied'))
    })
  }, [shareUrl, t, toastSuccess])

  const dismiss = () => onDismiss?.()

  return (
    <Modal title={t('NBC referral share modal title')} onDismiss={dismiss} minWidth="600px" minHeight="240px">
      <Text fontSize="13px" color="textSubtle" mb="14px" lineHeight="1.5">
        {t('NBC referral share modal invite hint')}
      </Text>
      <Box
        mb="16px"
        p="12px"
        style={{
          borderRadius: 12,
          background: 'var(--colors-input)',
          border: '1px solid var(--colors-cardBorder)',
          wordBreak: 'break-all',
        }}
      >
        <Text fontSize="12px" fontFamily="monospace" color="text">
          {shareUrl || '…'}
        </Text>
      </Box>
      <Box mb="22px">
        <Button scale="sm" onClick={onCopyLink} disabled={!shareUrl}>
          {t('Copy invite link')}
        </Button>
      </Box>

      <Text fontSize="15px" bold mb="6px" color="secondary">
        {t('NBC referral share modal my commissions')}
      </Text>
      <Text fontSize="12px" color="textSubtle" mb="10px" lineHeight="1.5">
        {t('NBC referral share modal commissions hint')}
      </Text>

      {recordsLoading && records.length === 0 && !recordsError && (
        <Text fontSize="13px" color="textSubtle" mb="12px">
          {t('Loading')}…
        </Text>
      )}
      {recordsError && (
        <Text fontSize="13px" mb="12px" style={{ whiteSpace: 'pre-wrap', color: 'var(--colors-failure)' }}>
          {t('NBC referral share modal load failed')}: {recordsError}
        </Text>
      )}
      {!recordsLoading && !recordsError && total === 0 && page === 1 && (
        <Text fontSize="13px" color="textSubtle" mb="12px">
          {t('NBC referral share modal no commissions')}
        </Text>
      )}
      {showCommissionsSection && (
        <>
          <Flex justifyContent="space-between" alignItems="center" mb="10px" flexWrap="wrap" style={{ gap: 8 }}>
            <Text fontSize="12px" color="textSubtle">
              {t('NBC referral share modal row count', { count: String(total) })}
            </Text>
            <Text fontSize="12px" fontFamily="monospace" color="textSubtle" title={sumCommissionWei}>
              {t('NBC referral share modal sum commission')}: {abbrevNum(sumCommissionWei, 18)}
            </Text>
          </Flex>
          <Box
            style={{
              minHeight: showPager ? 200 : 120,
              maxHeight: 280,
              overflow: 'auto',
              borderRadius: 12,
              border: '1px solid var(--colors-cardBorder)',
              opacity: recordsLoading ? 0.65 : 1,
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 12,
              }}
            >
              <thead>
                <tr style={{ background: 'var(--colors-backgroundAlt)', position: 'sticky', top: 0, zIndex: 1 }}>
                  <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--colors-textSubtle)' }}>
                    {t('Time')}
                  </th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--colors-textSubtle)' }}>
                    {t('Referral invited user column')}
                  </th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--colors-textSubtle)' }}>
                    {t('Tier')}
                  </th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--colors-textSubtle)' }}>
                    {t('Commission')}
                  </th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--colors-textSubtle)' }}>
                    {t('NBC referral share commission status column')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => {
                  const st = commissionPayoutStatusOrDefault(r)
                  const stStyle = USER_COMMISSION_STATUS_STYLE[st]
                  return (
                  <tr
                    key={r.id}
                    style={{
                      borderTop: '1px solid var(--colors-cardBorder)',
                      background: i % 2 === 1 ? 'var(--colors-backgroundAlt)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                      {new Date(r.createdAt).toLocaleString(undefined, {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td
                      style={{
                        padding: '8px 10px',
                        fontFamily: 'monospace',
                        verticalAlign: 'top',
                        maxWidth: 120,
                      }}
                      title={r.earner}
                    >
                      {truncateHash(r.earner)}
                    </td>
                    <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>L{r.tierDistance}</td>
                    <td
                      style={{
                        padding: '8px 10px',
                        fontFamily: 'monospace',
                        verticalAlign: 'top',
                        maxWidth: 100,
                      }}
                      title={r.commissionAmount}
                    >
                      {abbrevNum(r.commissionAmount, 12)}
                    </td>
                    <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                      <Text
                        fontSize="11px"
                        bold
                        px="6px"
                        py="3px"
                        style={{
                          display: 'inline-block',
                          borderRadius: 999,
                          border: `1px solid ${stStyle.border}`,
                          background: stStyle.bg,
                          maxWidth: '100%',
                        }}
                        title={[r.adminPayoutNote, r.payoutUpdatedAt ? new Date(r.payoutUpdatedAt).toLocaleString() : '']
                          .filter(Boolean)
                          .join(' · ')}
                      >
                        {t(stStyle.labelKey)}
                      </Text>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </Box>
          {showPager && (
            <Flex justifyContent="space-between" alignItems="center" flexWrap="wrap" style={{ gap: 10 }} mt="12px">
              <Text fontSize="12px" color="textSubtle">
                {t('NBC referral share pagination status', {
                  page: String(page),
                  totalPages: String(totalPages),
                })}
              </Text>
              <Flex style={{ gap: 8 }}>
                <Button
                  scale="sm"
                  variant="secondary"
                  disabled={recordsLoading || page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {t('NBC referral share pagination prev')}
                </Button>
                <Button
                  scale="sm"
                  variant="secondary"
                  disabled={recordsLoading || page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  {t('NBC referral share pagination next')}
                </Button>
              </Flex>
            </Flex>
          )}
          <Text fontSize="11px" color="textSubtle" mt="10px" lineHeight="1.45">
            {t('NBC referral share modal amount unit hint')}
          </Text>
        </>
      )}

      <Flex justifyContent="flex-end" mt="18px">
        <Button variant="secondary" onClick={dismiss}>
          {t('Close')}
        </Button>
      </Flex>
    </Modal>
  )
}
