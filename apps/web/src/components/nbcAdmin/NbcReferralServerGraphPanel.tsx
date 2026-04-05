import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from '@pancakeswap/localization'
import { useTheme } from '@pancakeswap/hooks'
import {
  Box,
  Button,
  ChevronRightIcon,
  Collapse,
  CopyButton,
  Flex,
  Input,
  Message,
  MessageText,
  Text,
} from '@pancakeswap/uikit'
import truncateHash from '@pancakeswap/utils/truncateHash'
import { isAddress } from 'viem'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ReferralServerGraphResponse } from 'types/referralServerGraph'
import { ServerReferralDownlineTree } from './ServerReferralDownlineTree'

const panelSurface = {
  border: '1px solid var(--colors-cardBorder)',
  borderRadius: 16,
  background: 'var(--colors-backgroundAlt)',
} as const

function AddressChip({
  addr,
  label,
  emphasized,
}: {
  addr: string | null
  label: string
  emphasized?: boolean
}) {
  const { t } = useTranslation()
  const has = Boolean(addr)

  return (
    <Box
      style={{
        minWidth: 140,
        maxWidth: 220,
        padding: '12px 14px',
        borderRadius: 12,
        border: `1px solid ${emphasized ? 'var(--colors-primary)' : 'var(--colors-cardBorder)'}`,
        background: 'var(--colors-input)',
      }}
    >
      <Text fontSize="11px" color="textSubtle" mb="6px" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </Text>
      {has ? (
        <Flex alignItems="center" style={{ gap: 6 }}>
          <Text fontSize="13px" fontFamily="monospace" bold style={{ wordBreak: 'break-all', flex: 1 }}>
            {truncateHash(addr as string)}
          </Text>
          <CopyButton
            text={addr as string}
            tooltipMessage={t('Copied')}
            defaultTooltipMessage={t('Copy address')}
            width="18px"
            buttonColor="textSubtle"
          />
        </Flex>
      ) : (
        <Text fontSize="13px" color="textDisabled">
          {t('No results')}
        </Text>
      )}
    </Box>
  )
}

function StatTile({ title, value, sub }: { title: string; value: string | number; sub?: string }) {
  return (
    <Box
      p="14px 16px"
      style={{
        ...panelSurface,
        flex: '1 1 120px',
        minWidth: 100,
        background: 'var(--colors-background)',
      }}
    >
      <Text fontSize="12px" color="textSubtle" mb="6px">
        {title}
      </Text>
      <Text fontSize="22px" bold lineHeight="1.1">
        {value}
      </Text>
      {sub ? (
        <Text fontSize="11px" color="textSubtle" mt="6px">
          {sub}
        </Text>
      ) : null}
    </Box>
  )
}

function DownlineList({ addrs }: { addrs: string[] }) {
  const { t } = useTranslation()
  if (addrs.length === 0) {
    return (
      <Text fontSize="13px" color="textDisabled" py="8px">
        {t('No results')}
      </Text>
    )
  }
  return (
    <Box
      as="ul"
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        maxHeight: 220,
        overflowY: 'auto',
      }}
    >
      {addrs.map((a) => (
        <Box
          key={a}
          as="li"
          py="10px"
          style={{ borderBottom: '1px solid var(--colors-cardBorder)' }}
        >
          <Flex alignItems="center" justifyContent="space-between" style={{ gap: 8 }}>
            <Text fontSize="13px" fontFamily="monospace" style={{ wordBreak: 'break-all', flex: 1 }}>
              {a}
            </Text>
            <CopyButton
              text={a}
              tooltipMessage={t('Copied')}
              defaultTooltipMessage={t('Copy address')}
              width="18px"
              buttonColor="textSubtle"
            />
          </Flex>
        </Box>
      ))}
    </Box>
  )
}

/**
 * 查询服务端持久化的邀请绑定；管理页仅 owner 可见，此处不再要求二次签名。
 */
export const NbcReferralServerGraphPanel: React.FC = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [queryAddress, setQueryAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ReferralServerGraphResponse | null>(null)
  const [openL1, setOpenL1] = useState(true)
  const [openL2, setOpenL2] = useState(false)
  const [openL3, setOpenL3] = useState(false)
  /** 收起后仅保留一条摘要栏，数据仍在内存中，可再展开 */
  const [resultsCollapsed, setResultsCollapsed] = useState(false)

  const clearQueryOutput = useCallback(() => {
    setResult(null)
    setError(null)
    setResultsCollapsed(false)
    setOpenL1(true)
    setOpenL2(false)
    setOpenL3(false)
  }, [])

  const onQuery = useCallback(async () => {
    const q = queryAddress.trim()
    if (!isAddress(q)) {
      setError(t('Invalid address'))
      return
    }
    setError(null)
    setResult(null)
    setLoading(true)
    setOpenL1(true)
    setOpenL2(false)
    setOpenL3(false)
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      const adminSecret = process.env.NEXT_PUBLIC_REFERRAL_ADMIN_SECRET
      if (adminSecret) {
        headers.Authorization = `Bearer ${adminSecret}`
      }
      const res = await fetch('/api/referral/admin/graph', {
        method: 'POST',
        headers,
        body: JSON.stringify({ queryAddress: q }),
      })
      const text = await res.text()
      if (!res.ok) {
        let msg = text
        try {
          const j = JSON.parse(text) as { error?: string; details?: string; hint?: string }
          if (j.error) {
            msg = [j.error, j.details, j.hint].filter(Boolean).join('\n\n')
          }
        } catch {
          // keep raw
        }
        setError(msg || t('Request failed'))
        return
      }
      setResultsCollapsed(false)
      const parsed = JSON.parse(text) as ReferralServerGraphResponse
      if (!parsed.downlineTree) {
        parsed.downlineTree = { address: parsed.address, children: [] }
      }
      setResult(parsed)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [queryAddress, t])

  const chartData = useMemo(() => {
    if (!result) return []
    return [
      {
        tier: t('Level 1 (direct)'),
        count: result.downlines.level1.length,
        key: 'l1',
      },
      {
        tier: t('Level 2'),
        count: result.downlines.level2.length,
        key: 'l2',
      },
      {
        tier: t('Level 3'),
        count: result.downlines.level3.length,
        key: 'l3',
      },
    ]
  }, [result, t])

  const chartColors = useMemo(
    () => [theme.colors.primary, theme.colors.secondary, theme.colors.textSubtle],
    [theme.colors.primary, theme.colors.secondary, theme.colors.textSubtle],
  )

  const totalDownlineHeadcount = useMemo(() => {
    if (!result) return 0
    return (
      result.downlines.level1.length +
      result.downlines.level2.length +
      result.downlines.level3.length
    )
  }, [result])

  const storageLabel =
    result?.storage === 'postgresql' ? t('PostgreSQL') : result?.storage === 'file' ? t('Local JSON file') : '—'

  return (
    <Box
      mb="24px"
      py="18px"
      px={['10px', '12px', '14px']}
      style={{ ...panelSurface, background: 'var(--colors-background)' }}
    >
      <Flex justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" style={{ gap: 12 }} mb="12px">
        <Box>
          <Text bold fontSize="18px">
            {t('Server referral graph (3-level)')}
          </Text>
          <Text fontSize="14px" color="textSubtle" mt="6px" style={{ maxWidth: 640 }}>
            {t(
              'Query upline chain and downline lists from server-side bindings. Admin page is owner-only; no wallet signature required here. Data from /api/referral/bind storage.',
            )}
          </Text>
        </Box>
      </Flex>

      <Message variant="primary" mb="12px">
        <MessageText fontSize="12px">{t('Who to query in admin')}</MessageText>
      </Message>

      <Message variant="warning" mb="16px">
        <MessageText fontSize="12px">
          {t(
            'Ensure NEXT_PUBLIC_REFERRAL_SYNC_ENABLED and successful user sync; otherwise server file may be empty.',
          )}
        </MessageText>
      </Message>

      <Flex flexWrap="wrap" alignItems="flex-end" mb="20px" style={{ gap: 12 }}>
        <Box style={{ flex: 1, minWidth: 220 }}>
          <Text fontSize="12px" color="textSubtle" mb="6px">
            {t('Query address')}
          </Text>
          <Input
            scale="md"
            value={queryAddress}
            onChange={(e) => setQueryAddress(e.target.value)}
            placeholder="0x..."
          />
        </Box>
        <Button onClick={onQuery} disabled={loading || !queryAddress.trim()} isLoading={loading}>
          {t('Query')}
        </Button>
        {(result || error) && (
          <Button variant="secondary" onClick={clearQueryOutput}>
            {t('Clear query results')}
          </Button>
        )}
      </Flex>

      {error && (
        <Message variant="danger" mb="16px">
          <MessageText fontSize="13px" style={{ whiteSpace: 'pre-wrap' }}>
            {error}
          </MessageText>
        </Message>
      )}

      {result && resultsCollapsed && (
        <Box
          p="14px 16px"
          mb="16px"
          style={{
            border: '1px solid var(--colors-cardBorder)',
            borderRadius: 12,
            background: 'var(--colors-backgroundAlt)',
          }}
        >
          <Flex flexWrap="wrap" alignItems="center" justifyContent="space-between" style={{ gap: 12 }}>
            <Text fontSize="13px" color="textSubtle">
              {`${t('Query results collapsed hint')}: `}
              <Text as="span" fontSize="13px" fontFamily="monospace" color="text">
                {result.address}
              </Text>
            </Text>
            <Button scale="sm" variant="secondary" onClick={() => setResultsCollapsed(false)}>
              {t('Expand results')}
            </Button>
          </Flex>
        </Box>
      )}

      {result && !resultsCollapsed && (
        <Flex flexDirection="column" style={{ gap: 20 }}>
          <Box>
            <Flex justifyContent="space-between" alignItems="center" flexWrap="wrap" style={{ gap: 8 }} mb="12px">
              <Text bold fontSize="15px">
                {t('Referral query snapshot')}
              </Text>
              <Button scale="sm" variant="text" onClick={() => setResultsCollapsed(true)}>
                {t('Collapse results')}
              </Button>
            </Flex>
            <Flex flexWrap="wrap" style={{ gap: 12 }} mb="12px">
              <StatTile title={t('Total bound invitees on server')} value={result.totalBindings} />
              <StatTile
                title={t('Downline addresses listed')}
                value={totalDownlineHeadcount}
                sub={t('Sum of L1+L2+L3 rows; same wallet may appear in multiple tiers')}
              />
              <StatTile title={t('Storage backend')} value={storageLabel} sub={result.dataFileHint} />
            </Flex>
          </Box>

          <Box p="16px 18px" style={panelSurface}>
            <Text bold fontSize="15px" mb="8px">
              {t('Relationship graph (from server query)')}
            </Text>
            <Text fontSize="12px" color="textSubtle" mb="12px">
              {t('Same data as above Query address — downline tree rooted at queried address')}
            </Text>
            <ServerReferralDownlineTree root={result.downlineTree} />
          </Box>

          <Box p="16px 18px" style={panelSurface}>
            <Flex justifyContent="space-between" alignItems="center" flexWrap="wrap" style={{ gap: 8 }} mb="12px">
              <Text bold fontSize="15px">
                {t('Upline chain')}
              </Text>
              <Text fontSize="12px" color="textSubtle">
                {t('Furthest upline → direct referrer → query address')}
              </Text>
            </Flex>
            <Flex flexWrap="wrap" alignItems="stretch" style={{ gap: 10 }}>
              <AddressChip addr={result.uplines.level3} label={t('Level 3')} />
              <Flex alignItems="center" justifyContent="center" style={{ minWidth: 24 }}>
                <ChevronRightIcon color="textSubtle" width="20px" />
              </Flex>
              <AddressChip addr={result.uplines.level2} label={t('Level 2')} />
              <Flex alignItems="center" justifyContent="center" style={{ minWidth: 24 }}>
                <ChevronRightIcon color="textSubtle" width="20px" />
              </Flex>
              <AddressChip addr={result.uplines.level1} label={t('Level 1 (direct referrer)')} />
              <Flex alignItems="center" justifyContent="center" style={{ minWidth: 24 }}>
                <ChevronRightIcon color="textSubtle" width="20px" />
              </Flex>
              <AddressChip addr={result.address} label={t('Query address')} emphasized />
            </Flex>
          </Box>

          <Box p="16px 18px" style={panelSurface}>
            <Text bold fontSize="15px" mb="4px">
              {t('Downline distribution chart')}
            </Text>
            <Text fontSize="12px" color="textSubtle" mb="12px">
              {t('Bar chart shows invitee counts per tier under the query address')}
            </Text>
            <Box style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="tier"
                    tick={{ fill: theme.colors.textSubtle, fontSize: 11 }}
                    axisLine={{ stroke: theme.colors.cardBorder }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    width={36}
                    tick={{ fill: theme.colors.textSubtle, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const row = payload[0].payload as { tier: string; count: number }
                      return (
                        <Box
                          p="12px 14px"
                          style={{
                            background: theme.colors.backgroundAlt,
                            border: `1px solid ${theme.colors.cardBorder}`,
                            borderRadius: 12,
                            boxShadow: theme.shadows?.tooltip ?? '0 4px 12px rgba(0,0,0,0.12)',
                          }}
                        >
                          <Text fontSize="12px" color="textSubtle" mb="4px">
                            {row.tier}
                          </Text>
                          <Text bold fontSize="16px">
                            {row.count}
                          </Text>
                        </Box>
                      )
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56}>
                    {chartData.map((entry, i) => (
                      <Cell key={entry.key} fill={chartColors[i % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>

          <Box p="16px 18px" style={panelSurface}>
            <Text bold fontSize="15px" mb="12px">
              {t('Downline roster')}
            </Text>
            <Flex flexDirection="column" style={{ gap: 8 }}>
              <Collapse
                isOpen={openL1}
                onToggle={() => setOpenL1((o) => !o)}
                title={
                  <Text bold fontSize="14px">
                    {t('Level 1 (direct)')} · {result.downlines.level1.length}
                  </Text>
                }
                content={<DownlineList addrs={result.downlines.level1} />}
                contentExtendableMaxHeight={240}
              />
              <Collapse
                isOpen={openL2}
                onToggle={() => setOpenL2((o) => !o)}
                title={
                  <Text bold fontSize="14px">
                    {t('Level 2')} · {result.downlines.level2.length}
                  </Text>
                }
                content={<DownlineList addrs={result.downlines.level2} />}
                contentExtendableMaxHeight={240}
              />
              <Collapse
                isOpen={openL3}
                onToggle={() => setOpenL3((o) => !o)}
                title={
                  <Text bold fontSize="14px">
                    {t('Level 3')} · {result.downlines.level3.length}
                  </Text>
                }
                content={<DownlineList addrs={result.downlines.level3} />}
                contentExtendableMaxHeight={240}
              />
            </Flex>
          </Box>
        </Flex>
      )}
    </Box>
  )
}
