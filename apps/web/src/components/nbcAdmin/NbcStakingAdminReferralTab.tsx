import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from '@pancakeswap/localization'
import {
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  Heading,
  Message,
  MessageText,
  Text,
  copyText,
  useModal,
  useToast,
} from '@pancakeswap/uikit'
import truncateHash from '@pancakeswap/utils/truncateHash'
import {
  agentTiersFromServerBps,
  commissionPayoutStatusOrDefault,
  defaultAgentReferralState,
  totalCommissionSum,
  type AgentReferralState,
  type CommissionPayoutStatus,
  type CommissionRecord,
} from 'utils/nbcAdmin/agentReferral'
import { NbcReferralCommissionPayoutModal } from './NbcReferralCommissionPayoutModal'
import { NbcReferralCommissionTierModal } from './NbcReferralCommissionTierModal'
import { NbcReferralServerGraphPanel } from './NbcReferralServerGraphPanel'

/** 与链上逻辑无关：第1/2/3级上级对应 tiers[0..2] 的返佣比例 */
const TIER_UI = [
  { index: 0, labelKey: 'Junior agent (tier 1 upline)' },
  { index: 1, labelKey: 'Secondary agent (tier 2 upline)' },
  { index: 2, labelKey: 'Primary agent (tier 3 upline)' },
] as const

function referralAdminHeaders(json = false): HeadersInit {
  const h: HeadersInit = {}
  const s = process.env.NEXT_PUBLIC_REFERRAL_ADMIN_SECRET
  if (s) {
    h.Authorization = `Bearer ${s}`
  }
  if (json) {
    h['Content-Type'] = 'application/json'
  }
  return h
}

const COMMISSION_TABLE_MIN_WIDTH = 1080
/** 与用户端邀请弹窗「我的返佣记录」一致：每页条数 */
const ADMIN_COMMISSION_PAGE_SIZE = 5

const PAYOUT_STATUS_STYLE: Record<
  CommissionPayoutStatus,
  { border: string; bg: string; labelKey: string }
> = {
  pending: {
    border: 'var(--colors-warning)',
    bg: 'var(--colors-backgroundAlt)',
    labelKey: 'Commission payout status pending',
  },
  approved: {
    border: 'var(--colors-primary)',
    bg: 'var(--colors-input)',
    labelKey: 'Commission payout status approved',
  },
  rejected: {
    border: 'var(--colors-failure)',
    bg: 'var(--colors-backgroundAlt)',
    labelKey: 'Commission payout status rejected',
  },
  paid: {
    border: 'var(--colors-success)',
    bg: 'var(--colors-input)',
    labelKey: 'Commission payout status paid',
  },
}

const CommissionAddressCopyCell: React.FC<{ address: string }> = ({ address }) => {
  const { t } = useTranslation()
  const { toastSuccess } = useToast()
  const onCopy = useCallback(() => {
    copyText(address, () => {
      toastSuccess(t('Copied'), t('Commission address copied hint'))
    })
  }, [address, t, toastSuccess])
  return (
    <Flex alignItems="center" style={{ gap: 8, maxWidth: 240, minWidth: 0 }}>
      <Text
        as="span"
        fontFamily="monospace"
        fontSize="12px"
        style={{
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={address}
      >
        {truncateHash(address)}
      </Text>
      <Button type="button" scale="xs" variant="text" px="6px" onClick={onCopy} style={{ flexShrink: 0 }}>
        {t('Copy')}
      </Button>
    </Flex>
  )
}

function commissionRecordSource(
  note: string | undefined,
): 'auto' | 'other' | 'none' {
  const n = note?.trim() ?? ''
  if (n.startsWith('auto:RewardPaid')) return 'auto'
  if (n.length > 0) return 'other'
  return 'none'
}

function sumCommissionAmountWei(records: CommissionRecord[]): { wei: bigint | null; floatFallback: number } {
  const floatFallback = totalCommissionSum(records)
  try {
    const wei = records.reduce((acc, r) => acc + BigInt(r.commissionAmount || '0'), 0n)
    return { wei, floatFallback }
  } catch {
    return { wei: null, floatFallback }
  }
}

function abbreviateWei(s: string, maxLen = 14): string {
  const t = s.replace(/\s/g, '')
  if (t.length <= maxLen) return t
  return `${t.slice(0, maxLen)}…`
}

export const NbcStakingAdminReferralTab: React.FC = () => {
  const { t } = useTranslation()
  const [state, setState] = useState<AgentReferralState>(() => defaultAgentReferralState())
  const [savedHint, setSavedHint] = useState(false)
  const [tierConfigLoad, setTierConfigLoad] = useState<'loading' | 'ok' | 'error'>('loading')
  const [tierConfigError, setTierConfigError] = useState<string | null>(null)
  const [recordsLoad, setRecordsLoad] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [recordsError, setRecordsError] = useState<string | null>(null)
  const [syncRewardPaidLoading, setSyncRewardPaidLoading] = useState(false)
  const [syncRewardPaidFeedback, setSyncRewardPaidFeedback] = useState<{
    variant: 'success' | 'warning'
    text: string
  } | null>(null)
  const [payoutRecord, setPayoutRecord] = useState<CommissionRecord | null>(null)
  const [commissionPage, setCommissionPage] = useState(1)

  /** 返佣基点：GET /api/referral/admin/tier-config；返佣记录：GET /api/referral/admin/commission-records */
  useEffect(() => {
    let cancelled = false
    setState(defaultAgentReferralState())
    setTierConfigLoad('loading')
    setTierConfigError(null)
    setRecordsLoad('loading')
    setRecordsError(null)
    ;(async () => {
      try {
        const [tierRes, recRes] = await Promise.all([
          fetch('/api/referral/admin/tier-config', { headers: referralAdminHeaders(false) }),
          fetch('/api/referral/admin/commission-records?limit=2000', {
            headers: referralAdminHeaders(false),
          }),
        ])
        const tierText = await tierRes.text()
        const recText = await recRes.text()

        if (!tierRes.ok) {
          if (!cancelled) {
            setTierConfigLoad('error')
            let msg = tierText
            try {
              const j = JSON.parse(tierText) as { error?: string; details?: string }
              if (j.error) msg = [j.error, j.details].filter(Boolean).join('\n')
            } catch {
              // keep raw
            }
            setTierConfigError(msg || 'Request failed')
          }
        } else {
          const j = JSON.parse(tierText) as {
            juniorBps: number
            secondaryBps: number
            primaryBps: number
          }
          const tiers = agentTiersFromServerBps(j.juniorBps, j.secondaryBps, j.primaryBps)
          if (!cancelled) {
            setState((prev) => ({ ...prev, tiers }))
            setTierConfigLoad('ok')
            setTierConfigError(null)
          }
        }

        if (!recRes.ok) {
          if (!cancelled) {
            setRecordsLoad('error')
            let msg = recText
            try {
              const j = JSON.parse(recText) as { error?: string; details?: string }
              if (j.error) msg = [j.error, j.details].filter(Boolean).join('\n')
            } catch {
              // keep raw
            }
            setRecordsError(msg || 'Request failed')
          }
        } else {
          const recJson = JSON.parse(recText) as { records?: CommissionRecord[] }
          const records = Array.isArray(recJson.records) ? recJson.records : []
          if (!cancelled) {
            setState((prev) => ({ ...prev, commissionRecords: records }))
            setRecordsLoad('ok')
            setRecordsError(null)
          }
        }
      } catch (e) {
        if (!cancelled) {
          setTierConfigLoad('error')
          setTierConfigError(e instanceof Error ? e.message : String(e))
          setRecordsLoad('error')
          setRecordsError(e instanceof Error ? e.message : String(e))
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const sortedRecords = useMemo(
    () => [...state.commissionRecords].sort((a, b) => b.createdAt - a.createdAt),
    [state.commissionRecords],
  )

  const commissionListTotal = sortedRecords.length
  const commissionTotalPages = Math.max(1, Math.ceil(commissionListTotal / ADMIN_COMMISSION_PAGE_SIZE))
  /** 有数据即展示页码与按钮（仅 1 页时显示「第 1/1 页」且按钮禁用），避免「正好 5 条」时误以为分页未生效 */
  const showCommissionPageNav = commissionListTotal > 0

  useEffect(() => {
    setCommissionPage((p) => Math.min(Math.max(1, p), commissionTotalPages))
  }, [commissionTotalPages])

  const displayedRows = useMemo(() => {
    const start = (commissionPage - 1) * ADMIN_COMMISSION_PAGE_SIZE
    return sortedRecords.slice(start, start + ADMIN_COMMISSION_PAGE_SIZE)
  }, [sortedRecords, commissionPage])

  const refetchCommissionRecords = useCallback(async () => {
    try {
      const res = await fetch('/api/referral/admin/commission-records?limit=2000', {
        headers: referralAdminHeaders(false),
      })
      const text = await res.text()
      if (!res.ok) return
      const j = JSON.parse(text) as { records?: CommissionRecord[] }
      setState((prev) => ({
        ...prev,
        commissionRecords: Array.isArray(j.records) ? j.records : [],
      }))
    } catch {
      // ignore
    }
  }, [])

  const showSavedHint = useCallback(() => {
    setSavedHint(true)
    window.setTimeout(() => setSavedHint(false), 2000)
  }, [])

  const patchCommissionPayout = useCallback(
    async (body: {
      id: string
      payoutStatus: CommissionPayoutStatus
      adminPayoutNote?: string | null
    }) => {
      const res = await fetch('/api/referral/admin/commission-records', {
        method: 'PATCH',
        headers: referralAdminHeaders(true),
        body: JSON.stringify(body),
      })
      const text = await res.text()
      if (!res.ok) {
        let msg = text
        try {
          const j = JSON.parse(text) as { error?: string; details?: string }
          if (j.error) msg = [j.error, j.details].filter(Boolean).join('\n')
        } catch {
          // keep raw
        }
        throw new Error(msg || t('Request failed'))
      }
      await refetchCommissionRecords()
      showSavedHint()
    },
    [refetchCommissionRecords, showSavedHint, t],
  )

  const onSyncRewardPaidFromChain = useCallback(async () => {
    setSyncRewardPaidLoading(true)
    setSyncRewardPaidFeedback(null)
    try {
      const res = await fetch('/api/referral/admin/sync-staking-reward-paid', {
        method: 'POST',
        headers: referralAdminHeaders(true),
        body: JSON.stringify({}),
      })
      const text = await res.text()
      if (!res.ok) {
        let msg = text
        try {
          const j = JSON.parse(text) as { error?: string; details?: string }
          if (j.error) msg = [j.error, j.details].filter(Boolean).join('\n')
        } catch {
          // keep raw
        }
        setSyncRewardPaidFeedback({ variant: 'warning', text: msg || t('Request failed') })
        return
      }
      let rowsInserted = 0
      let commissionRowsInserted = 0
      let lastScannedToBlock = '—'
      try {
        const j = JSON.parse(text) as {
          rowsInserted?: number
          commissionRowsInserted?: number
          lastScannedToBlock?: string
        }
        rowsInserted = j.rowsInserted ?? 0
        commissionRowsInserted = j.commissionRowsInserted ?? 0
        lastScannedToBlock = j.lastScannedToBlock ?? '—'
      } catch {
        // ignore parse errors; still refresh list
      }
      await refetchCommissionRecords()
      showSavedHint()
      setSyncRewardPaidFeedback({
        variant: 'success',
        text: t('Sync reward records done hint', {
          rows: String(rowsInserted),
          commission: String(commissionRowsInserted),
          block: lastScannedToBlock,
        }),
      })
    } catch (e) {
      setSyncRewardPaidFeedback({
        variant: 'warning',
        text: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setSyncRewardPaidLoading(false)
    }
  }, [refetchCommissionRecords, showSavedHint, t])

  const onClearAllCommissionRecords = useCallback(async () => {
    if (!window.confirm(t('Clear all commission records on server?'))) return
    try {
      const res = await fetch('/api/referral/admin/commission-records', {
        method: 'DELETE',
        headers: referralAdminHeaders(false),
      })
      if (!res.ok) {
        const tx = await res.text()
        window.alert(tx || t('Request failed'))
        return
      }
      setState((prev) => ({ ...prev, commissionRecords: [] }))
      setSyncRewardPaidFeedback(null)
      showSavedHint()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : String(e))
    }
  }, [showSavedHint, t])

  const applyCommissionTiers = useCallback(async (bps: [number, number, number]) => {
    const res = await fetch('/api/referral/admin/tier-config', {
      method: 'POST',
      headers: referralAdminHeaders(true),
      body: JSON.stringify({
        juniorBps: bps[0],
        secondaryBps: bps[1],
        primaryBps: bps[2],
      }),
    })
    const text = await res.text()
    if (!res.ok) {
      let msg = text
      try {
        const j = JSON.parse(text) as { error?: string; details?: string }
        if (j.error) {
          msg = [j.error, j.details].filter(Boolean).join('\n')
        }
      } catch {
        // keep raw
      }
      throw new Error(msg || t('Request failed'))
    }
    const tiers = agentTiersFromServerBps(bps[0], bps[1], bps[2])
    setState((prev) => ({ ...prev, tiers }))
    showSavedHint()
  }, [t, showSavedHint])

  const tierModalInitialBps = useMemo(
    () =>
      [
        state.tiers[0].commissionRateBps,
        state.tiers[1].commissionRateBps,
        state.tiers[2].commissionRateBps,
      ] as [number, number, number],
    [state.tiers],
  )

  /** 经 ModalProvider Portal 挂载：全屏遮罩、body 滚动锁定、弹窗垂直居中 */
  const [onPresentCommissionTierModal] = useModal(
    <NbcReferralCommissionTierModal initialBps={tierModalInitialBps} onConfirmSave={applyCommissionTiers} />,
    true,
    true,
    'nbc-referral-commission-tier',
  )

  const [onPresentPayoutModal] = useModal(
    payoutRecord ? (
      <NbcReferralCommissionPayoutModal
        record={payoutRecord}
        onPatch={patchCommissionPayout}
        onAfterClose={() => setPayoutRecord(null)}
      />
    ) : (
      <></>
    ),
    true,
    true,
    'nbc-referral-commission-payout',
  )

  const openPayoutModal = useCallback(
    (r: CommissionRecord) => {
      setPayoutRecord(r)
      window.setTimeout(() => onPresentPayoutModal(), 0)
    },
    [onPresentPayoutModal],
  )

  const commissionStats = useMemo(() => {
    const count = state.commissionRecords.length
    const autoCount = state.commissionRecords.filter((r) => commissionRecordSource(r.note) === 'auto').length
    const { wei, floatFallback } = sumCommissionAmountWei(state.commissionRecords)
    return { count, autoCount, commissionWei: wei, floatFallback }
  }, [state.commissionRecords])

  return (
    <Box py="16px" px="0px" mb="24px">
      <Heading scale="lg" mb="8px">
        {t('Agent referral (3-level)')}
      </Heading>
      <Text color="textSubtle" fontSize="14px" mb="24px">
        {t(
          'Agent referral tab: tier rates and invite graph from server; commission records from server when RewardPaid is indexed (sync-staking-reward-paid).',
        )}
      </Text>

      <Message variant="warning" mb="24px">
        <MessageText>
          {t(
            'Commission rates apply to each upline tier as a % of the downline user yield (off-chain bookkeeping).',
          )}
        </MessageText>
      </Message>

      <NbcReferralServerGraphPanel />

      {savedHint && (
        <Message variant="success" mb="16px">
          <MessageText>{t('Saved')}</MessageText>
        </Message>
      )}

      {tierConfigLoad === 'loading' && (
        <Message variant="primary" mb="16px">
          <MessageText fontSize="13px">{t('Loading tier commission config from server')}</MessageText>
        </Message>
      )}

      {tierConfigLoad === 'error' && tierConfigError && (
        <Message variant="warning" mb="16px">
          <MessageText fontSize="13px" style={{ whiteSpace: 'pre-wrap' }}>
            {t('Tier commission config load failed')}: {tierConfigError}
          </MessageText>
        </Message>
      )}

      {recordsLoad === 'loading' && (
        <Message variant="primary" mb="16px">
          <MessageText fontSize="13px">{t('Loading commission records from server')}</MessageText>
        </Message>
      )}

      {recordsLoad === 'error' && recordsError && (
        <Message variant="warning" mb="16px">
          <MessageText fontSize="13px" style={{ whiteSpace: 'pre-wrap' }}>
            {t('Commission records load failed')}: {recordsError}
          </MessageText>
        </Message>
      )}

      <Box mb="24px" py="16px" px="14px" style={{ border: '1px solid var(--colors-input)', borderRadius: 12 }}>
        <Flex justifyContent="space-between" alignItems="center" flexWrap="wrap" style={{ gap: 12 }} mb="16px">
          <Text bold>{t('Tier commission rates (basis points: 100 = 1%)')}</Text>
          <Button
            scale="sm"
            onClick={onPresentCommissionTierModal}
            disabled={tierConfigLoad === 'loading'}
          >
            {t('Configure commission rates')}
          </Button>
        </Flex>
        {TIER_UI.map(({ index, labelKey }) => (
          <Flex key={labelKey} alignItems="center" mb="12px" flexWrap="wrap" style={{ gap: '12px' }}>
            <Box minWidth="200px">
              <Text fontSize="14px">{t(labelKey)}</Text>
            </Box>
            <Text fontSize="14px" fontFamily="monospace">
              {state.tiers[index].commissionRateBps}
            </Text>
            <Text fontSize="12px" color="textSubtle">
              = {(state.tiers[index].commissionRateBps / 100).toFixed(2)}%
            </Text>
          </Flex>
        ))}
      </Box>

      <Card mb="24px">
        <CardBody p={['12px', null, '16px']}>
          <Flex
            justifyContent="space-between"
            alignItems="flex-start"
            flexDirection={['column', null, 'row']}
            mb="20px"
            style={{ gap: 16 }}
          >
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Heading scale="md" mb="6px" color="secondary">
                {t('Commission records')}
              </Heading>
              <Text fontSize="13px" color="textSubtle" lineHeight="1.5">
                {t('Commission records module subtitle')}
              </Text>
            </Box>
            <Flex flexWrap="wrap" style={{ gap: '8px', flexShrink: 0 }}>
              <Button
                scale="sm"
                onClick={onSyncRewardPaidFromChain}
                disabled={syncRewardPaidLoading}
                isLoading={syncRewardPaidLoading}
              >
                {t('Sync reward records')}
              </Button>
              <Button scale="sm" variant="danger" onClick={onClearAllCommissionRecords}>
                {t('Clear all commission records')}
              </Button>
            </Flex>
          </Flex>

          <Flex flexWrap="wrap" style={{ gap: 12 }} mb="20px">
            <Box
              style={{
                flex: 1,
                minWidth: '148px',
                borderRadius: 16,
                padding: '14px 16px',
                background: 'var(--colors-backgroundAlt)',
                border: '1px solid var(--colors-cardBorder)',
              }}
            >
              <Text fontSize="12px" color="textSubtle" mb="4px">
                {t('Commission KPI total entries')}
              </Text>
              <Text fontSize="22px" bold style={{ letterSpacing: '-0.02em' }}>
                {commissionStats.count.toLocaleString()}
              </Text>
            </Box>
            <Box
              style={{
                flex: 1,
                minWidth: '148px',
                borderRadius: 16,
                padding: '14px 16px',
                background: 'var(--colors-backgroundAlt)',
                border: '1px solid var(--colors-cardBorder)',
              }}
            >
              <Text fontSize="12px" color="textSubtle" mb="4px">
                {t('Commission KPI auto from chain')}
              </Text>
              <Text fontSize="22px" bold style={{ letterSpacing: '-0.02em' }}>
                {commissionStats.autoCount.toLocaleString()}
              </Text>
            </Box>
            <Box
              style={{
                flex: 1,
                minWidth: '148px',
                borderRadius: 16,
                padding: '14px 16px',
                background: 'var(--colors-backgroundAlt)',
                border: '1px solid var(--colors-cardBorder)',
              }}
            >
              <Text fontSize="12px" color="textSubtle" mb="4px">
                {t('Commission KPI sum label')}
              </Text>
              <Text
                fontSize="18px"
                bold
                fontFamily="monospace"
                style={{ letterSpacing: '-0.02em', wordBreak: 'break-all' }}
                title={
                  commissionStats.commissionWei !== null
                    ? commissionStats.commissionWei.toString()
                    : String(commissionStats.floatFallback)
                }
              >
                {commissionStats.commissionWei !== null
                  ? abbreviateWei(commissionStats.commissionWei.toString(), 22)
                  : commissionStats.floatFallback.toFixed(6)}
              </Text>
              <Text fontSize="11px" color="textSubtle" mt="6px" lineHeight="1.4">
                {t('Commission KPI sum unit hint')}
              </Text>
            </Box>
          </Flex>

          {syncRewardPaidFeedback && (
            <Message variant={syncRewardPaidFeedback.variant === 'success' ? 'success' : 'warning'} mb="16px">
              <MessageText fontSize="13px" style={{ whiteSpace: 'pre-wrap' }}>
                {syncRewardPaidFeedback.text}
              </MessageText>
            </Message>
          )}

          <Box
            style={{
              borderRadius: 16,
              border: '1px solid var(--colors-cardBorder)',
              overflow: 'hidden',
              background: 'var(--colors-card)',
            }}
          >
            <Box
              style={{
                overflowX: 'auto',
                minHeight: commissionTotalPages > 1 ? 220 : undefined,
              }}
            >
              <table
                style={{
                  width: '100%',
                  minWidth: COMMISSION_TABLE_MIN_WIDTH,
                  borderCollapse: 'collapse',
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr
                    style={{
                      textAlign: 'left',
                      background: 'var(--colors-backgroundAlt)',
                      borderBottom: '1px solid var(--colors-cardBorder)',
                    }}
                  >
                    <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--colors-textSubtle)' }}>
                      {t('Time')}
                    </th>
                    <th style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--colors-textSubtle)' }}>
                      {t('Tier')}
                    </th>
                    <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--colors-textSubtle)' }}>
                      {t('Referral invited user column')}
                    </th>
                    <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--colors-textSubtle)' }}>
                      {t('Beneficiary')}
                    </th>
                    <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--colors-textSubtle)' }}>
                      {t('Commission table claim base header')}
                    </th>
                    <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--colors-textSubtle)' }}>
                      {t('Commission')}
                    </th>
                    <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--colors-textSubtle)' }}>
                      {t('Commission payout status column')}
                    </th>
                    <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--colors-textSubtle)' }}>
                      {t('Commission payout action column')}
                    </th>
                    <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--colors-textSubtle)' }}>
                      {t('Commission table note header')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recordsLoad === 'loading' && commissionListTotal === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '32px 20px', textAlign: 'center' }}>
                        <Text fontSize="13px" color="textSubtle">
                          {t('Loading commission records from server')}
                        </Text>
                      </td>
                    </tr>
                  ) : recordsLoad === 'ok' && commissionListTotal === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '40px 20px', textAlign: 'center' }}>
                        <Text fontSize="15px" bold mb="8px" display="block">
                          {t('Commission records empty title')}
                        </Text>
                        <Text fontSize="13px" color="textSubtle" display="block">
                          {t('Commission records empty hint')}
                        </Text>
                      </td>
                    </tr>
                  ) : recordsLoad === 'error' && commissionListTotal === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '32px 20px', textAlign: 'center' }}>
                        <Text fontSize="13px" color="textSubtle">
                          {t('Commission records table load error')}
                        </Text>
                      </td>
                    </tr>
                  ) : (
                    displayedRows.map((r, idx) => {
                      const payoutSt = commissionPayoutStatusOrDefault(r)
                      const payoutStyle = PAYOUT_STATUS_STYLE[payoutSt]
                      const tierTone =
                        r.tierDistance === 1
                          ? { bg: 'var(--colors-input)', border: 'var(--colors-primary)' }
                          : r.tierDistance === 2
                            ? { bg: 'var(--colors-input)', border: 'var(--colors-secondary)' }
                            : { bg: 'var(--colors-backgroundAlt)', border: 'var(--colors-cardBorder)' }
                      const rowIndex = (commissionPage - 1) * ADMIN_COMMISSION_PAGE_SIZE + idx
                      return (
                        <tr
                          key={r.id}
                          style={{
                            borderBottom: '1px solid var(--colors-cardBorder)',
                            background: rowIndex % 2 === 1 ? 'var(--colors-backgroundAlt)' : 'transparent',
                          }}
                        >
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                            <Text fontSize="12px" lineHeight="1.35">
                              {new Date(r.createdAt).toLocaleString(undefined, {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Text>
                          </td>
                          <td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                            <Text
                              fontSize="12px"
                              bold
                              px="8px"
                              py="4px"
                              style={{
                                display: 'inline-block',
                                borderRadius: 999,
                                border: `1px solid ${tierTone.border}`,
                                background: tierTone.bg,
                              }}
                            >
                              L{r.tierDistance}
                            </Text>
                          </td>
                          <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                            <CommissionAddressCopyCell address={r.earner} />
                          </td>
                          <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                            <CommissionAddressCopyCell address={r.beneficiary} />
                          </td>
                          <td
                            style={{
                              padding: '12px 14px',
                              fontFamily: 'monospace',
                              fontSize: 11,
                              verticalAlign: 'middle',
                              maxWidth: 140,
                            }}
                            title={r.yieldAmount}
                          >
                            {abbreviateWei(r.yieldAmount, 12)}
                          </td>
                          <td
                            style={{
                              padding: '12px 14px',
                              fontFamily: 'monospace',
                              fontSize: 12,
                              verticalAlign: 'middle',
                              maxWidth: 140,
                            }}
                            title={r.commissionAmount}
                          >
                            {abbreviateWei(r.commissionAmount, 14)}
                          </td>
                          <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                            <Text
                              fontSize="11px"
                              bold
                              px="8px"
                              py="4px"
                              style={{
                                display: 'inline-block',
                                borderRadius: 999,
                                border: `1px solid ${payoutStyle.border}`,
                                background: payoutStyle.bg,
                                maxWidth: '100%',
                              }}
                              title={r.adminPayoutNote ?? ''}
                            >
                              {t(payoutStyle.labelKey)}
                            </Text>
                          </td>
                          <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                            <Button type="button" scale="xs" variant="secondary" onClick={() => openPayoutModal(r)}>
                              {t('Commission payout open modal')}
                            </Button>
                          </td>
                          <td
                            style={{
                              padding: '12px 14px',
                              fontSize: 12,
                              color: 'var(--colors-textSubtle)',
                              verticalAlign: 'middle',
                              maxWidth: 200,
                            }}
                            title={r.note ?? ''}
                          >
                            <span
                              style={{
                                display: 'block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {r.note ?? '—'}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </Box>
          </Box>

          {showCommissionPageNav && (
            <Flex justifyContent="space-between" alignItems="center" flexWrap="wrap" style={{ gap: 10 }} mt="14px">
              <Text fontSize="12px" color="textSubtle">
                {t('NBC referral share pagination status', {
                  page: String(commissionPage),
                  totalPages: String(commissionTotalPages),
                })}
                {' · '}
                {t('Commission admin table page size hint', {
                  size: String(ADMIN_COMMISSION_PAGE_SIZE),
                  total: String(commissionListTotal),
                })}
              </Text>
              <Flex style={{ gap: 8 }}>
                <Button
                  scale="sm"
                  variant="secondary"
                  disabled={commissionPage <= 1}
                  onClick={() => setCommissionPage((p) => Math.max(1, p - 1))}
                >
                  {t('NBC referral share pagination prev')}
                </Button>
                <Button
                  scale="sm"
                  variant="secondary"
                  disabled={commissionPage >= commissionTotalPages}
                  onClick={() => setCommissionPage((p) => Math.min(commissionTotalPages, p + 1))}
                >
                  {t('NBC referral share pagination next')}
                </Button>
              </Flex>
            </Flex>
          )}
        </CardBody>
      </Card>
    </Box>
  )
}
