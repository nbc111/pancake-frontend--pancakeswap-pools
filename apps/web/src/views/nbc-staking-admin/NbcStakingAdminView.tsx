import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { styled } from 'styled-components'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useWatchContractEvent, usePublicClient } from 'wagmi'
import { useTranslation } from '@pancakeswap/localization'
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Input,
  Text,
  PageHeader,
  Message,
  MessageText,
} from '@pancakeswap/uikit'
import Page from 'components/Layout/Page'
import { NbcStakingAdminFinancialTab } from 'components/nbcAdmin/NbcStakingAdminFinancialTab'
import { NbcStakingAdminReferralTab } from 'components/nbcAdmin/NbcStakingAdminReferralTab'
import { NbcStakingAdminSidebar } from 'components/nbcAdmin/NbcStakingAdminSidebar'
import type { NbcAdminSection } from 'config/nbcStakingAdminNav'
import { STAKING_CONTRACT_ADDRESS, STAKING_ABI, CHAIN_ID } from 'config/staking/constants'
import { getPoolConfigBySousId, STAKING_POOL_CONFIGS } from 'config/staking/poolConfig'
import { CHAIN_QUERY_NAME, getChainId } from 'config/chains'
import { ChainId } from '@pancakeswap/chains'
import { useSetAtom } from 'jotai'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { accountActiveChainAtom } from 'wallet/atoms/accountStateAtoms'
import { parseUnits } from 'viem'

/**
 * PageHeader 默认内层是 UIKit Container（maxWidth 1200px + 左右 padding），会在已加宽的 admin Page 里再缩一列，左侧留白异常。
 * 用 innerProps 铺满父级并与下方主内容共用 NBC_ADMIN_PAGE_LAYOUT 的横向 padding。
 */
const StyledPageHeader = styled(PageHeader).attrs({
  innerProps: {
    maxWidth: '100%',
    width: '100%',
    px: '0px',
    mx: '0',
  },
})`
  padding-top: 8px;
  padding-bottom: 24px;
`

const AdminShell = styled(Flex)`
  width: 100%;
  flex-direction: column;
  gap: 24px;
  align-items: stretch;
  ${({ theme }) => theme.mediaQueries.lg} {
    flex-direction: row;
    align-items: flex-start;
  }
`

const NBC_CHAIN_ID = 1281 as ChainId

type WithdrawRequest = {
  requestId: number
  poolIndex: number
  user: string
  amount: bigint
  requestedAt: number
  approved: boolean
  executed: boolean
  rejected: boolean
}
const DURATION_PRESETS = [
  { label: '1年', value: '31536000' },
  { label: '6月', value: '15552000' },
  { label: '3月', value: '7776000' },
  { label: '1月', value: '2592000' },
  { label: '1天', value: '86400' },
] as const

/** 仅管理后台：加宽容器，减少大屏两侧留白；用户页 /nbc-staking 仍用 Layout/Page 默认 1200px */
const NBC_ADMIN_PAGE_LAYOUT = {
  maxWidth: '1840px',
  /** 再收紧左右 gutter，把宽度让给侧栏 + 主栏（返佣宽表等） */
  px: ['6px', '10px', '14px'] as const,
} as const

/** 与代理返佣页 `NbcReferralServerGraphPanel` 主面板左右内边距一致，便于各 tab 主内容区对齐 */
const NBC_ADMIN_SECTION_CONTENT_PX = ['10px', '12px', '14px'] as const

const NbcStakingAdminView: React.FC<{ section: NbcAdminSection }> = ({ section }) => {
  const { t } = useTranslation()
  const formatPoolSelectOption = useCallback(
    (c: { sousId: number; rewardTokenSymbol: string; rewardTokenName: string }) =>
      t('NBC admin pool select option', {
        symbol: c.rewardTokenSymbol,
        name: c.rewardTokenName,
        id: String(c.sousId),
      }),
    [t],
  )
  const router = useRouter()
  const updateAccountState = useSetAtom(accountActiveChainAtom)
  const { address: account } = useAccount()
  const { chainId } = useActiveChainId()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // 当 chain 参数为空时自动重定向为 chain=nbc
  useEffect(() => {
    if (router.isReady && !router.query.chain) {
      router.replace(
        {
          pathname: router.pathname,
          query: { ...router.query, chain: CHAIN_QUERY_NAME[NBC_CHAIN_ID] },
        },
        undefined,
        { shallow: true },
      )
    }
  }, [router.isReady, router.query.chain, router.pathname, router.query])
  useEffect(() => {
    if (router.isReady && router.query.chain === 'nbc') {
      const resolvedChainId = getChainId(router.query.chain as string)
      if (resolvedChainId === NBC_CHAIN_ID) {
        updateAccountState((prev) => ({ ...prev, chainId: NBC_CHAIN_ID }))
      }
    }
  }, [router.isReady, router.query.chain, updateAccountState])

  // 检查是否为合约 owner
  const { data: ownerAddress } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'owner',
    chainId: CHAIN_ID,
  })
  const ownerStr = typeof ownerAddress === 'string' ? ownerAddress : undefined

  const isOwner = account && ownerStr && account.toLowerCase() === ownerStr.toLowerCase()

  // 状态管理
  const [showPoolsGuide, setShowPoolsGuide] = useState(false)
  const [showPoolsTechDetails, setShowPoolsTechDetails] = useState(false)
  const [showAddGuide, setShowAddGuide] = useState(false)
  const [showSettingsGuide, setShowSettingsGuide] = useState(false)
  const [emergencyWithdrawConfirmed, setEmergencyWithdrawConfirmed] = useState(false)
  const [poolIndex, setPoolIndex] = useState<string>('0')
  const [rewardAmount, setRewardAmount] = useState<string>('')
  const [rewardsDuration, setRewardsDuration] = useState<string>('31536000') // 默认 1 年
  const [newPoolToken, setNewPoolToken] = useState<string>('')
  const [newPoolRewardRate, setNewPoolRewardRate] = useState<string>('')
  const [newPoolDuration, setNewPoolDuration] = useState<string>('31536000')
  const [withdrawAmount, setWithdrawAmount] = useState<string>('')
  const [poolActive, setPoolActive] = useState<boolean>(true)
  const [approveTokenAddress, setApproveTokenAddress] = useState<string>('')
  const [approveAmount, setApproveAmount] = useState<string>('')
  const [tokenDecimals, setTokenDecimals] = useState<string>('18')
  const [setRewardRateOnlyPoolIndex, setSetRewardRateOnlyPoolIndex] = useState<string>('0')
  const [setRewardRateOnlyValue, setSetRewardRateOnlyValue] = useState<string>('')

  // 监控面板状态 - 提现审批队列
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([])
  const [isLoadingRequests, setIsLoadingRequests] = useState(false)
  const [monitorFilter, setMonitorFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [actionRequestId, setActionRequestId] = useState<number | null>(null)

  // APR 计算器相关状态
  const [expectedStakeAmount, setExpectedStakeAmount] = useState<string>('1000000') // 预期质押量 NBC
  const [nbcPrice, setNbcPrice] = useState<string>('0.06') // NBC 价格
  const [rewardTokenPrice, setRewardTokenPrice] = useState<string>('89000') // 奖励代币价格
  const [targetAPR, setTargetAPR] = useState<string>('30') // 目标 APR
  const [aprCalculatorDecimals, setAprCalculatorDecimals] = useState<string>('18') // 奖励代币精度，用于最小有效值

  // 当前精度下的最小有效奖励率（代币/秒），小于此值链上会变为 0
  const minEffectiveRatePerSecond = 1 / 10 ** (parseInt(aprCalculatorDecimals, 10) || 18)

  // 根据目标 APR 计算建议的奖励率
  const calculateSuggestedRewardRate = () => {
    try {
      const stakeAmount = parseFloat(expectedStakeAmount) || 0
      const nbcPriceNum = parseFloat(nbcPrice) || 0
      const rewardPriceNum = parseFloat(rewardTokenPrice) || 0
      const targetAPRNum = parseFloat(targetAPR) || 0
      
      if (stakeAmount <= 0 || nbcPriceNum <= 0 || rewardPriceNum <= 0 || targetAPRNum <= 0) return null
      
      // 年奖励价值 = 质押价值 × APR%
      const yearlyRewardValue = stakeAmount * nbcPriceNum * (targetAPRNum / 100)
      // 年奖励代币数量 = 年奖励价值 / 奖励代币价格
      const yearlyRewardTokens = yearlyRewardValue / rewardPriceNum
      // 每秒奖励 = 年奖励代币数量 / 一年秒数
      const rewardRatePerSecond = yearlyRewardTokens / 31536000
      
      return rewardRatePerSecond
    } catch {
      return null
    }
  }
  
  const suggestedRewardRate = calculateSuggestedRewardRate()
  
  // 计算预估 APR（根据输入的奖励率）
  const calculateEstimatedAPR = () => {
    try {
      const stakeAmount = parseFloat(expectedStakeAmount) || 0
      const nbcPriceNum = parseFloat(nbcPrice) || 0
      const rewardPriceNum = parseFloat(rewardTokenPrice) || 0
      
      if (stakeAmount <= 0 || nbcPriceNum <= 0 || rewardPriceNum <= 0) return null
      
      // 人类可读模式：已经是代币数量/秒
      const rewardRatePerSecond = parseFloat(newPoolRewardRate)
      
      if (isNaN(rewardRatePerSecond) || rewardRatePerSecond <= 0) return null
      
      // 年奖励价值 = 每秒奖励 × 一年秒数 × 奖励代币价格
      const yearlyRewardValue = rewardRatePerSecond * 31536000 * rewardPriceNum
      // 质押价值 = 质押量 × NBC价格
      const stakeValue = stakeAmount * nbcPriceNum
      // APR = 年奖励价值 / 质押价值 × 100
      const apr = (yearlyRewardValue / stakeValue) * 100
      
      return apr
    } catch {
      return null
    }
  }
  
  const estimatedAPR = calculateEstimatedAPR()

  // 查询池数量
  const { data: poolLength } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'poolLength',
    chainId: CHAIN_ID,
  })

  // 查询合约暂停状态
  const { data: isPaused, refetch: refetchPaused } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'paused',
    chainId: CHAIN_ID,
  })

  const handlePause = () => {
    writeContract({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_ABI as any,
      functionName: isPaused ? 'unpause' : 'pause',
      args: [],
      chainId: CHAIN_ID,
    })
  }

  const publicClient = usePublicClient({ chainId: CHAIN_ID })

  const { data: withdrawRequestCount, refetch: refetchRequestCount } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'withdrawRequestCount',
    chainId: CHAIN_ID,
  })

  const handleFetchRequests = useCallback(async () => {
    if (!publicClient || isLoadingRequests) return
    setIsLoadingRequests(true)
    try {
      const count = Number(withdrawRequestCount ?? 0)
      if (count === 0) {
        setWithdrawRequests([])
        return
      }

      const requestsRaw = await Promise.all(
        Array.from({ length: count }, async (_, i) => {
          try {
            const [poolIndex, user, amount, requestedAt, approved, executed, rejected] = (await publicClient.readContract({
              address: STAKING_CONTRACT_ADDRESS,
              abi: STAKING_ABI as any,
              functionName: 'getWithdrawRequest',
              args: [BigInt(i)],
            })) as any[]

            return {
              requestId: i,
              poolIndex: Number(poolIndex),
              user: user as string,
              amount: amount as bigint,
              requestedAt: Number(requestedAt),
              approved: approved as boolean,
              executed: executed as boolean,
              rejected: rejected as boolean,
            } satisfies WithdrawRequest
          } catch (requestError) {
            console.error(`getWithdrawRequest(${i}) failed`, requestError)
            return null
          }
        }),
      )

      const requests = requestsRaw.filter(Boolean) as WithdrawRequest[]

      setWithdrawRequests(requests)
    } catch (err) {
      console.error('fetchRequests error', err)
    } finally {
      setIsLoadingRequests(false)
    }
  }, [publicClient, isLoadingRequests, withdrawRequestCount])

  useEffect(() => {
    if (section !== 'monitor') return
    handleFetchRequests()
  }, [section, handleFetchRequests])

  useEffect(() => {
    if (!isConfirmed) return
    setActionRequestId(null)
    if (section === 'monitor') {
      handleFetchRequests()
      refetchRequestCount()
    }
  }, [isConfirmed, section, handleFetchRequests, refetchRequestCount])

  useWatchContractEvent({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    eventName: 'WithdrawRequested',
    chainId: CHAIN_ID,
    onLogs: async () => {
      await refetchRequestCount()
      handleFetchRequests()
    },
  })

  const handleApprove = (requestId: number) => {
    setActionRequestId(requestId)
    writeContract({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_ABI as any,
      functionName: 'approveWithdraw',
      args: [BigInt(requestId)],
      chainId: CHAIN_ID,
    })
  }

  const handleReject = (requestId: number) => {
    setActionRequestId(requestId)
    writeContract({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_ABI as any,
      functionName: 'rejectWithdraw',
      args: [BigInt(requestId)],
      chainId: CHAIN_ID,
    })
  }

  // 处理函数定义（必须在 hooks 之后，条件返回之前）
  const handleNotifyReward = () => {
    if (!rewardAmount || !poolIndex) return
    const decimals = parseInt(tokenDecimals) || 18
    writeContract({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_ABI as any,
      functionName: 'notifyRewardAmount',
      args: [BigInt(poolIndex), parseUnits(rewardAmount, decimals)],
      chainId: CHAIN_ID,
    })
  }

  const handleSetRewardsDuration = () => {
    if (!rewardsDuration || !poolIndex) return
    writeContract({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_ABI as any,
      functionName: 'setRewardsDuration',
      args: [BigInt(poolIndex), BigInt(rewardsDuration)],
      chainId: CHAIN_ID,
    })
  }

  const handleSetRewardRateOnly = () => {
    if (!setRewardRateOnlyPoolIndex || setRewardRateOnlyValue === '') return
    const poolIdx = Number(setRewardRateOnlyPoolIndex)
    const poolConfig = getPoolConfigBySousId(poolIdx)
    const decimals = poolConfig?.rewardTokenDecimals ?? 18
    try {
      const rate = parseUnits(setRewardRateOnlyValue.trim(), decimals)
      if (rate <= 0n) return
      writeContract({
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_ABI as any,
        functionName: 'setRewardRate',
        args: [BigInt(setRewardRateOnlyPoolIndex), rate],
        chainId: CHAIN_ID,
      })
    } catch {
      // parseUnits 失败时由用户检查输入格式
    }
  }

  const handleAddPool = () => {
    if (!newPoolToken || !newPoolRewardRate || !newPoolDuration) return
    const decimals = parseInt(tokenDecimals) || 18
    writeContract({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_ABI as any,
      functionName: 'addPool',
      args: [
        newPoolToken as `0x${string}`,
        parseUnits(newPoolRewardRate, decimals),
        BigInt(newPoolDuration),
      ],
      chainId: CHAIN_ID,
    })
  }

  const handleSetPoolActive = () => {
    if (poolIndex === '') return
    writeContract({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_ABI as any,
      functionName: 'setPoolActive',
      args: [BigInt(poolIndex), poolActive],
      chainId: CHAIN_ID,
    })
  }

  const handleEmergencyWithdraw = () => {
    if (!withdrawAmount || !poolIndex) return
    writeContract({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_ABI as any,
      functionName: 'emergencyWithdrawReward',
      args: [BigInt(poolIndex), parseUnits(withdrawAmount, parseInt(tokenDecimals) || 18)],
      chainId: CHAIN_ID,
    })
  }

  const handleApproveToken = () => {
    if (!approveTokenAddress || !approveAmount) return
    const decimals = parseInt(tokenDecimals) || 18
    writeContract({
      address: approveTokenAddress as `0x${string}`,
      abi: [
        {
          name: 'approve',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          outputs: [{ name: '', type: 'bool' }],
        },
      ] as any,
      functionName: 'approve',
      args: [STAKING_CONTRACT_ADDRESS, parseUnits(approveAmount, decimals)],
      chainId: CHAIN_ID,
    })
  }

  // 链检查
  if (chainId !== CHAIN_ID) {
    return (
      <Page {...NBC_ADMIN_PAGE_LAYOUT}>
        <StyledPageHeader>
          <Heading as="h1" scale="xxl" color="secondary" mb="24px">
            {t('NBC Staking Admin')}
          </Heading>
        </StyledPageHeader>
        <Card>
          <Message variant="warning">
            <MessageText>
              {t('Please switch to NBC Chain (Chain ID: %chainId%)', { chainId: CHAIN_ID })}
            </MessageText>
            <MessageText>
              {t('Current Chain ID: %currentChainId%', { currentChainId: chainId })}
            </MessageText>
          </Message>
        </Card>
      </Page>
    )
  }

  // 权限检查
  if (!account) {
    return (
      <Page {...NBC_ADMIN_PAGE_LAYOUT}>
        <StyledPageHeader>
          <Heading as="h1" scale="xxl" color="secondary" mb="24px">
            {t('NBC Staking Admin')}
          </Heading>
        </StyledPageHeader>
        <Card>
          <Message variant="warning">
            <MessageText>{t('Please connect your wallet')}</MessageText>
          </Message>
        </Card>
      </Page>
    )
  }

  if (!isOwner) {
    return (
      <Page {...NBC_ADMIN_PAGE_LAYOUT}>
        <StyledPageHeader>
          <Heading as="h1" scale="xxl" color="secondary" mb="24px">
            {t('NBC Staking Admin')}
          </Heading>
        </StyledPageHeader>
        <Card>
          <Message variant="danger">
            <MessageText>
              {t('Access Denied: You are not the contract owner')}
            </MessageText>
            <MessageText>
              {t('Owner Address: %address%', { address: ownerStr ?? 'Unknown' })}
            </MessageText>
            <MessageText>
              {t('Your Address: %address%', { address: account })}
            </MessageText>
          </Message>
        </Card>
      </Page>
    )
  }

  return (
    <Page {...NBC_ADMIN_PAGE_LAYOUT}>
      <StyledPageHeader>
        <Heading as="h1" scale="xxl" color="secondary" mb="8px">
          {t('NBC Staking Admin Panel')}
        </Heading>
        <Text color="textSubtle" fontSize="16px" mb="20px">
          {t('Manage staking pools, reward rates, and configurations')}
        </Text>
        <Flex
          flexWrap="wrap"
          p="16px"
          borderRadius="12px"
          bg="backgroundAlt"
          style={{ border: '1px solid var(--colors-input)', gap: '48px' }}
        >
          <Box minWidth="140px" px="8px">
            <Text fontSize="12px" color="textSubtle" textTransform="uppercase" mb="4px">
              {t('Contract')}
            </Text>
            <Text fontSize="14px" fontFamily="monospace" title={STAKING_CONTRACT_ADDRESS}>
              {STAKING_CONTRACT_ADDRESS}
            </Text>
          </Box>
          <Box minWidth="140px" px="8px">
            <Text fontSize="12px" color="textSubtle" textTransform="uppercase" mb="4px">
              {t('Owner')}
            </Text>
            <Text fontSize="14px" fontFamily="monospace" title={ownerStr ?? ''}>
              {ownerStr ?? '—'}
            </Text>
          </Box>
          <Box minWidth="80px" px="8px">
            <Text fontSize="12px" color="textSubtle" textTransform="uppercase" mb="4px">
              {t('Total Pools')}
            </Text>
            <Text fontSize="14px" bold>
              {poolLength?.toString() ?? '0'}
            </Text>
          </Box>
        </Flex>
      </StyledPageHeader>

      <AdminShell mb="24px">
        <NbcStakingAdminSidebar section={section} />
        <Box width="100%" style={{ flex: '1 1 auto', minWidth: 0 }}>
      {/* 交易状态 */}
      {error != null ? (
        <Message variant="danger" mb="24px">
          <MessageText>{error instanceof Error ? error.message : String(error)}</MessageText>
        </Message>
      ) : null}
      {isPending === true && (
        <Message variant="warning" mb="24px">
          <MessageText>{t('Transaction pending...')}</MessageText>
        </Message>
      )}
      {isConfirming === true && (
        <Message variant="warning" mb="24px">
          <MessageText>{t('Waiting for confirmation...')}</MessageText>
        </Message>
      )}
      {isConfirmed === true && (
        <Message variant="success" mb="24px">
          <MessageText>{t('Transaction confirmed!')}</MessageText>
          {hash && (
            <MessageText fontSize="12px">
              {t('Hash: %hash%', { hash })}
            </MessageText>
          )}
        </Message>
      )}
      {/* 合约暂停状态横幅 */}
      {isPaused === true && (
        <Message variant="danger" mb="16px">
          <MessageText bold>⏸ {t('Contract is currently PAUSED — all user operations are frozen')}</MessageText>
        </Message>
      )}

      {/* 管理池：用 Box 替代 Card；外层与返佣 tab 一致（标题区全宽），内层左右留白与 NbcReferralServerGraphPanel 对齐 */}
      {section === 'pools' && (
        <Box py="16px" px="0px" mb="24px">
          <Heading scale="lg" mb="12px">
            {t('NBC admin pools page title')}
          </Heading>
          <Text fontSize="14px" color="textSubtle" mb="16px" lineHeight="1.55">
            {t('NBC admin pools page subtitle')}
          </Text>

          <Box px={NBC_ADMIN_SECTION_CONTENT_PX}>
          <Message variant="primary" mb="24px">
            <MessageText fontSize="14px" bold mb="10px" display="block">
              {t('NBC admin pools ops path title')}
            </MessageText>
            <MessageText fontSize="13px" lineHeight="1.55" display="block" mb="8px">
              {t('NBC admin pools ops path step 1')}
            </MessageText>
            <MessageText fontSize="13px" lineHeight="1.55" display="block" mb="8px">
              {t('NBC admin pools ops path step 2')}
            </MessageText>
            <MessageText fontSize="13px" lineHeight="1.55" display="block" mb="8px">
              {t('NBC admin pools ops path step 3')}
            </MessageText>
            <MessageText fontSize="12px" color="textSubtle" display="block">
              {t('NBC admin pools ops path footer')}
            </MessageText>
          </Message>

          {/* 使用说明（可折叠） */}
          <Box mb="24px">
            <Button
              variant="text"
              scale="sm"
              onClick={() => setShowPoolsGuide((v) => !v)}
              style={{ padding: 0, marginBottom: showPoolsGuide ? 12 : 0 }}
            >
              {t('NBC admin pools guide toggle')} {showPoolsGuide ? '▲' : '▼'}
            </Button>
            {showPoolsGuide && (
              <Box p="16px" style={{ background: 'rgba(118, 69, 217, 0.08)', borderRadius: '8px', border: '1px solid rgba(118, 69, 217, 0.2)' }}>
                <Text fontSize="14px" color="textSubtle" mb="8px">
                  {t('NBC admin pools guide intro')}
                </Text>
                <Box as="ul" pl="20px" mb="12px">
                  <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                    {t('NBC admin pools guide item 1')}
                  </Text>
                  <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                    {t('NBC admin pools guide item 2')}
                  </Text>
                  <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                    {t('NBC admin pools guide item 3')}
                  </Text>
                  <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                    {t('NBC admin pools guide item 4')}
                  </Text>
                </Box>
                <Message variant="warning" mb="0">
                  <MessageText fontSize="12px">
                    {t('NBC admin pools guide warning')}
                  </MessageText>
                </Message>
              </Box>
            )}
          </Box>

          {/* 代币授权 */}
          <Box mb="24px" p="16px" style={{ border: '1px solid rgba(118, 69, 217, 0.2)', borderRadius: '8px' }}>
            <Text bold mb="8px" fontSize="18px">
              {t('NBC admin pools section approve title')}
            </Text>
            <Text fontSize="14px" color="textSubtle" mb="12px">
              {t('NBC admin pools section approve subtitle')}
            </Text>
            
            {/* 批准数量说明 */}
            <Box mb="16px" p="12px" style={{ background: 'rgba(255, 193, 7, 0.1)', borderRadius: '8px', border: '1px solid rgba(255, 193, 7, 0.3)' }}>
              <Text bold mb="8px" fontSize="15px" color="warning">
                {t('📌 About Approval Amount:')}
              </Text>
              <Box as="ul" pl="20px" mb="8px">
                <Text as="li" fontSize="13px" color="textSubtle" mb="4px">
                  <strong>{t('Minimum Requirement:')}</strong> {t('Approval amount must be >= the reward amount you plan to send in notifyRewardAmount')}
                </Text>
                <Text as="li" fontSize="13px" color="textSubtle" mb="4px">
                  <strong>{t('Recommended:')}</strong> {t('Approve a larger amount (e.g., 10x your planned reward) to avoid frequent re-approvals')}
                </Text>
                <Text as="li" fontSize="13px" color="textSubtle" mb="4px">
                  <strong>{t('Maximum:')}</strong> {t('You can approve the maximum value (115792089237316195423570985008687907853269984665640564039457) to never need re-approval')}
                </Text>
                <Text as="li" fontSize="13px" color="textSubtle">
                  <strong>{t('Safety:')}</strong> {t('Approval only allows the contract to transfer up to the approved amount. You can revoke approval anytime by approving 0')}
                </Text>
              </Box>
              <Message variant="warning" mb="0">
                <MessageText fontSize="12px">
                  {t('⚠️ Important: If approval amount < reward amount, notifyRewardAmount will fail with "Transfer failed" error')}
                </MessageText>
              </Message>
            </Box>

            <Text fontSize="14px" color="textSubtle" mb="8px">
              {t('Token Address:')}
            </Text>
            <Input
              type="text"
              value={approveTokenAddress}
              onChange={(e) => setApproveTokenAddress(e.target.value)}
              placeholder="0x..."
              mb="16px"
            />
            <Text fontSize="14px" color="textSubtle" mb="8px">
              {t('Token Decimals (8 for BTC, 6 for USDT, 18 for most others):')}
            </Text>
            <Input
              type="number"
              value={tokenDecimals}
              onChange={(e) => setTokenDecimals(e.target.value)}
              placeholder="18"
              mb="16px"
            />
            <Text fontSize="14px" color="textSubtle" mb="8px">
              {t('Amount to Approve:')}
            </Text>
            <Text fontSize="12px" color="primary" mb="4px">
              {t('Example: For 267,425.28 tokens with 18 decimals, enter "267425.28" (system will convert to wei)')}
            </Text>
            <Input
              type="text"
              value={approveAmount}
              onChange={(e) => setApproveAmount(e.target.value)}
              placeholder="1"
              mb="16px"
            />
            <Button
              onClick={handleApproveToken}
              disabled={isPending || !approveTokenAddress || !approveAmount}
              variant="secondary"
              isLoading={isPending}
            >
              {t('Approve Token')}
            </Button>
          </Box>

          {/* 设置奖励率 */}
          <Box mb="24px" p="16px" style={{ border: '1px solid rgba(118, 69, 217, 0.2)', borderRadius: '8px' }}>
            <Text bold mb="8px" fontSize="18px">
              {t('NBC admin pools section deposit title')}
            </Text>
            <Text fontSize="14px" color="textSubtle" mb="12px">
              {t('NBC admin pools section deposit subtitle')}
            </Text>
            <Button
              variant="text"
              scale="sm"
              onClick={() => setShowPoolsTechDetails((v) => !v)}
              style={{ padding: 0, marginBottom: showPoolsTechDetails ? 12 : 8 }}
            >
              {t('NBC admin pools tech toggle')} {showPoolsTechDetails ? '▲' : '▼'}
            </Button>
            {showPoolsTechDetails && (
              <>
                <Box mb="16px" p="12px" style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px' }}>
                  <Text fontSize="13px" color="textSubtle" mb="4px">
                    <strong>{t('How it works:')}</strong>
                  </Text>
                  <Text fontSize="13px" color="textSubtle" mb="2px">
                    {t('• If period is finished: new rewardRate = reward / rewardsDuration')}
                  </Text>
                  <Text fontSize="13px" color="textSubtle" mb="2px">
                    {t('• If period is not finished: new rewardRate = (reward + leftover) / rewardsDuration')}
                  </Text>
                  <Text fontSize="13px" color="textSubtle">
                    {t('• leftover = remaining time × current rewardRate')}
                  </Text>
                </Box>
                <Message variant="warning" mb="12px">
                  <MessageText fontSize="12px" bold>
                    {t('Why does "Earned" stay 0 after entering 0.22 BTC?')}
                  </MessageText>
                  <MessageText fontSize="12px" mt="4px">
                    {t('Contract uses integer division: rewardRate = reward ÷ rewardsDuration.')}
                  </MessageText>
                  <MessageText fontSize="12px" mt="2px">
                    {t('BTC pool (8 decimals): 0.22 BTC = 22,000,000. For 1 year (31,536,000 sec), 22,000,000 ÷ 31,536,000 = 0, rewardRate becomes 1 wei/sec, earned rounds to 0.')}
                  </MessageText>
                  <MessageText fontSize="12px" mt="4px" bold>
                    {t('Solution:')}
                  </MessageText>
                  <MessageText fontSize="12px" mt="2px">
                    {t('• For 1-year period, BTC pool needs at least 0.31536 BTC (~31.5M satoshi) for rewardRate ≥ 1; use larger amount or shorter period for visible earned.')}
                  </MessageText>
                  <MessageText fontSize="12px" mt="2px">
                    {t('• Or set rewards duration to 1 day (86400 sec), then 0.22 BTC gives rewardRate = 254 and earned will accumulate.')}
                  </MessageText>
                </Message>
              </>
            )}
            <Text fontSize="14px" color="textSubtle" mb="8px">
              {t('NBC admin pools select pool label')}
            </Text>
            <Box as="select" mb="16px" value={poolIndex} onChange={(e) => setPoolIndex(e.target.value)} style={{ width: '100%', maxWidth: 320, padding: '12px 16px', borderRadius: 8, border: '1px solid var(--colors-input)', background: 'var(--colors-input)', color: 'inherit', fontSize: 14 }}>
              {STAKING_POOL_CONFIGS.map((c) => (
                <option key={c.sousId} value={c.sousId}>
                  {formatPoolSelectOption(c)}
                </option>
              ))}
              {[5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>
                  {t('NBC admin pool select other', { id: String(n) })}
                </option>
              ))}
            </Box>
            <Text fontSize="14px" color="textSubtle" mb="8px">
              {t('NBC admin pools token decimals label')}
            </Text>
            <Input
              type="number"
              value={tokenDecimals}
              onChange={(e) => setTokenDecimals(e.target.value)}
              placeholder="18"
              mb="16px"
            />

            {/* 奖励数量详细说明 */}
            <Text fontSize="14px" color="textSubtle" mb="8px" bold>
              {t('NBC admin pools reward amount label')}
            </Text>
            <Box mb="12px" p="12px" style={{ background: 'rgba(49, 208, 170, 0.1)', borderRadius: '8px', border: '1px solid rgba(49, 208, 170, 0.3)' }}>
              <Text fontSize="13px" color="textSubtle" mb="8px">
                <strong>{t('📌 What is reward amount?')}</strong>
              </Text>
              <Text fontSize="13px" color="textSubtle" mb="8px">
                {t('This is the total reward tokens you will distribute to all stakers over the reward period.')}
              </Text>
              <Text fontSize="13px" color="textSubtle" mb="8px">
                {t('System will calculate reward per second: reward per second = reward amount ÷ rewards duration (seconds)')}
              </Text>
              <Box p="8px" style={{ background: 'rgba(0, 0, 0, 0.2)', borderRadius: '4px' }}>
                <Text fontSize="12px" color="textSubtle" mb="4px">
                  <strong>{t('Example (1 year = 31,536,000 sec):')}</strong>
                </Text>
                <Text fontSize="12px" color="textSubtle" mb="2px">
                  {t('• 0.22 BTC → total 0.22 BTC over 1 year → ~0.000000007 BTC/sec')}
                </Text>
                <Text fontSize="12px" color="textSubtle" mb="2px">
                  {t('• 1 BTC → total 1 BTC over 1 year → ~0.0000000317 BTC/sec')}
                </Text>
                <Text fontSize="12px" color="textSubtle">
                  {t('• 100 USDT → total 100 USDT over 1 year → ~0.00000317 USDT/sec')}
                </Text>
              </Box>
            </Box>
            <Text fontSize="12px" color="primary" mb="8px">
              {t('NBC admin pools reward amount input hint')}
            </Text>
            <Input
              type="text"
              value={rewardAmount}
              onChange={(e) => setRewardAmount(e.target.value)}
              placeholder="0.22"
              mb="16px"
            />
            <Button
              onClick={handleNotifyReward}
              disabled={isPending || !rewardAmount || !poolIndex}
              isLoading={isPending}
            >
              {t('NBC admin pools submit deposit rewards')}
            </Button>
          </Box>

          {/* 仅设置 rewardRate（不重置周期） */}
          {(() => {
            const setRewardRatePoolConfig = getPoolConfigBySousId(Number(setRewardRateOnlyPoolIndex))
            const setRewardRateTokenSymbol = setRewardRatePoolConfig?.rewardTokenSymbol ?? t('Token')
            const setRewardRateDecimals = setRewardRatePoolConfig?.rewardTokenDecimals ?? 18
            const minEffective1b = 1 / 10 ** setRewardRateDecimals
            let wouldRoundToZero = false
            if (setRewardRateOnlyValue.trim()) {
              try {
                const parsed = parseFloat(setRewardRateOnlyValue.trim())
                if (parsed > 0) {
                  const rateWei = parseUnits(setRewardRateOnlyValue.trim(), setRewardRateDecimals)
                  wouldRoundToZero = rateWei === 0n
                }
              } catch {
                wouldRoundToZero = false
              }
            }
            return (
              <Box mb="24px" p="16px" style={{ border: '1px solid rgba(49, 208, 170, 0.3)', borderRadius: '8px' }}>
                <Text bold mb="8px" fontSize="18px">
                  {t('NBC admin pools section adjust rate title')}
                </Text>
                <Text fontSize="14px" color="textSubtle" mb="12px">
                  {t('NBC admin pools section adjust rate subtitle')}
                </Text>
                <Text fontSize="14px" color="textSubtle" mb="8px">
                  {t('NBC admin pools select pool label')}
                </Text>
                <Box as="select" mb="16px" value={setRewardRateOnlyPoolIndex} onChange={(e) => setSetRewardRateOnlyPoolIndex(e.target.value)} style={{ width: '100%', maxWidth: 320, padding: '12px 16px', borderRadius: 8, border: '1px solid var(--colors-input)', background: 'var(--colors-input)', color: 'inherit', fontSize: 14 }}>
                  {STAKING_POOL_CONFIGS.map((c) => (
                    <option key={c.sousId} value={c.sousId}>
                      {formatPoolSelectOption(c)}
                    </option>
                  ))}
                  {[5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>
                      {t('NBC admin pool select other', { id: String(n) })}
                    </option>
                  ))}
                </Box>
                <Text fontSize="14px" color="textSubtle" mb="8px" bold>
                  {t('Reward rate (tokens per second)')}
                </Text>
                <Text fontSize="12px" color="textSubtle" mb="4px">
                  {t('Enter tokens per second (e.g. 0.00001)')}
                  {setRewardRateTokenSymbol}
                  {t('；')}
                  {t('Min effective at current decimals')}
                  {`: ${minEffective1b.toFixed(setRewardRateDecimals)}`}
                </Text>
                {wouldRoundToZero && (
                  <Message variant="warning" mb="12px">
                    <MessageText fontSize="12px" bold>
                      {t('Value rounds to 0 at pool decimals; on-chain rewardRate = 0, earned stays 0.')}
                    </MessageText>
                    <MessageText fontSize="12px" mt="4px">
                      {t('Enter at least')} {minEffective1b.toFixed(setRewardRateDecimals)} {t('(1 wei per second)')}
                    </MessageText>
                  </Message>
                )}
                <Input
                  type="text"
                  value={setRewardRateOnlyValue}
                  onChange={(e) => setSetRewardRateOnlyValue(e.target.value)}
                  placeholder="0.00001"
                  mb="16px"
                />
                <Button
                  onClick={handleSetRewardRateOnly}
                  disabled={isPending || !setRewardRateOnlyPoolIndex || setRewardRateOnlyValue === ''}
                  variant="secondary"
                  isLoading={isPending}
                >
                  {t('Set rewardRate only')}
                </Button>
              </Box>
            )
          })()}

          {/* 设置奖励周期 */}
          <Box mb="24px" p="16px" style={{ border: '1px solid rgba(118, 69, 217, 0.2)', borderRadius: '8px' }}>
            <Text bold mb="8px" fontSize="18px">
              {t('NBC admin pools section duration title')}
            </Text>
            <Text fontSize="14px" color="textSubtle" mb="12px">
              {t('NBC admin pools section duration subtitle')}
            </Text>
            <Message variant="warning" mb="12px">
              <MessageText fontSize="12px">
                {t('NBC admin pools duration warning 1')}
              </MessageText>
              <MessageText fontSize="12px">
                {t('NBC admin pools duration warning 2')}
              </MessageText>
            </Message>
            <Text fontSize="14px" color="textSubtle" mb="8px">
              {t('NBC admin pools select pool label')}
            </Text>
            <Box as="select" mb="16px" value={poolIndex} onChange={(e) => setPoolIndex(e.target.value)} style={{ width: '100%', maxWidth: 320, padding: '12px 16px', borderRadius: 8, border: '1px solid var(--colors-input)', background: 'var(--colors-input)', color: 'inherit', fontSize: 14 }}>
              {STAKING_POOL_CONFIGS.map((c) => (
                <option key={c.sousId} value={c.sousId}>
                  {formatPoolSelectOption(c)}
                </option>
              ))}
              {[5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>
                  {t('NBC admin pool select other', { id: String(n) })}
                </option>
              ))}
            </Box>
            <Text fontSize="14px" color="textSubtle" mb="8px">
              {t('Rewards Duration (seconds, 31536000 = 1 year):')}
            </Text>
            <Flex flexWrap="wrap" mb="12px" style={{ gap: '8px' }}>
              {DURATION_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  scale="sm"
                  variant={rewardsDuration === preset.value ? 'primary' : 'tertiary'}
                  onClick={() => setRewardsDuration(preset.value)}
                >
                  {preset.label}
                </Button>
              ))}
            </Flex>
            <Input
              type="text"
              value={rewardsDuration}
              onChange={(e) => setRewardsDuration(e.target.value)}
              placeholder="31536000"
              mb="16px"
            />
            <Button
              onClick={handleSetRewardsDuration}
              disabled={isPending || !rewardsDuration || !poolIndex}
              isLoading={isPending}
            >
              {t('NBC admin pools submit duration')}
            </Button>
          </Box>

          {/* 激活/停用池 */}
          <Box mb="24px" p="16px" style={{ border: '1px solid rgba(118, 69, 217, 0.2)', borderRadius: '8px' }}>
            <Text bold mb="8px" fontSize="18px">
              {t('NBC admin pools section active title')}
            </Text>
            <Text fontSize="14px" color="textSubtle" mb="12px">
              {t('NBC admin pools section active subtitle')}
            </Text>
            <Text fontSize="14px" color="textSubtle" mb="8px">
              {t('NBC admin pools select pool label')}
            </Text>
            <Box as="select" mb="16px" value={poolIndex} onChange={(e) => setPoolIndex(e.target.value)} style={{ width: '100%', maxWidth: 320, padding: '12px 16px', borderRadius: 8, border: '1px solid var(--colors-input)', background: 'var(--colors-input)', color: 'inherit', fontSize: 14 }}>
              {STAKING_POOL_CONFIGS.map((c) => (
                <option key={c.sousId} value={c.sousId}>
                  {formatPoolSelectOption(c)}
                </option>
              ))}
              {[5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>
                  {t('NBC admin pool select other', { id: String(n) })}
                </option>
              ))}
            </Box>
            <Flex alignItems="center" mb="16px">
              <input
                type="checkbox"
                id="pool-active-checkbox"
                checked={poolActive}
                onChange={(e) => setPoolActive(e.target.checked)}
                style={{ marginRight: '8px', cursor: 'pointer' }}
              />
              <Text as="label" htmlFor="pool-active-checkbox" style={{ cursor: 'pointer' }}>{t('Active')}</Text>
            </Flex>
            <Button
              onClick={handleSetPoolActive}
              disabled={isPending || poolIndex === ''}
              isLoading={isPending}
            >
              {t('NBC admin pools submit active')}
            </Button>
          </Box>

          {/* 紧急提取奖励（危险操作需确认） */}
          <Box mb="24px" p="16px" style={{ border: '2px solid rgba(255, 77, 77, 0.4)', borderRadius: '12px', background: 'rgba(255, 77, 77, 0.04)' }}>
            <Text bold mb="8px" fontSize="18px" color="failure">
              {t('NBC admin pools section emergency title')}
            </Text>
            <Text fontSize="14px" color="textSubtle" mb="12px">
              {t('NBC admin pools section emergency subtitle')}
            </Text>
            <Message variant="danger" mb="12px">
              <MessageText fontSize="12px">
                {t('NBC admin pools emergency warning 1')}
              </MessageText>
              <MessageText fontSize="12px">
                {t('NBC admin pools emergency warning 2')}
              </MessageText>
            </Message>
            <Text fontSize="14px" color="textSubtle" mb="8px">
              {t('NBC admin pools select pool label')}
            </Text>
            <Box as="select" mb="16px" value={poolIndex} onChange={(e) => setPoolIndex(e.target.value)} style={{ width: '100%', maxWidth: 320, padding: '12px 16px', borderRadius: 8, border: '1px solid var(--colors-input)', background: 'var(--colors-input)', color: 'inherit', fontSize: 14 }}>
              {STAKING_POOL_CONFIGS.map((c) => (
                <option key={c.sousId} value={c.sousId}>
                  {formatPoolSelectOption(c)}
                </option>
              ))}
              {[5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>
                  {t('NBC admin pool select other', { id: String(n) })}
                </option>
              ))}
            </Box>
            <Text fontSize="14px" color="textSubtle" mb="8px">
              {t('NBC admin pools token decimals label')}
            </Text>
            <Input
              type="number"
              value={tokenDecimals}
              onChange={(e) => setTokenDecimals(e.target.value)}
              placeholder="18"
              mb="16px"
            />
            <Text fontSize="14px" color="textSubtle" mb="8px">
              {t('NBC admin pools withdraw amount label')}
            </Text>
            <Text fontSize="12px" color="primary" mb="8px">
              {t('NBC admin pools withdraw amount hint')}
            </Text>
            <Input
              type="text"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="0.001"
              mb="16px"
            />
            <Flex alignItems="flex-start" mb="16px">
              <input
                type="checkbox"
                id="emergency-withdraw-confirm"
                checked={emergencyWithdrawConfirmed}
                onChange={(e) => setEmergencyWithdrawConfirmed(e.target.checked)}
                style={{ marginRight: '8px', marginTop: 4, cursor: 'pointer' }}
              />
              <Text as="label" htmlFor="emergency-withdraw-confirm" fontSize="14px" color="textSubtle" style={{ cursor: 'pointer' }}>
                {t('NBC admin pools emergency confirm label')}
              </Text>
            </Flex>
            <Button
              onClick={handleEmergencyWithdraw}
              disabled={isPending || !withdrawAmount || !poolIndex || !emergencyWithdrawConfirmed}
              variant="danger"
              isLoading={isPending}
            >
              {t('NBC admin pools submit emergency')}
            </Button>
          </Box>
          </Box>
        </Box>
      )}

      {/* 添加新池：用 Box 替代 Card，与页面背景统一 */}
      {section === 'add-pool' && (
        <Box p="24px" mb="24px">
          <Heading scale="lg" mb="24px">
            {t('Add New Reward Pool')}
          </Heading>

          {/* 详细使用说明（可折叠） */}
          <Box mb="24px">
            <Button
              variant="text"
              scale="sm"
              onClick={() => setShowAddGuide((v) => !v)}
              style={{ padding: 0, marginBottom: showAddGuide ? 12 : 0 }}
            >
              {t('📖 Complete Operation Guide')} {showAddGuide ? '▲' : '▼'}
            </Button>
            {showAddGuide && (
          <Box p="20px" style={{ background: 'rgba(118, 69, 217, 0.08)', borderRadius: '8px', border: '1px solid rgba(118, 69, 217, 0.2)' }}>
            
            {/* 步骤 1: 部署代币 */}
            <Box mb="20px" p="16px" style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
              <Text bold mb="8px" fontSize="16px" color="primary">
                {t('Step 1: Deploy Token Contract')}
              </Text>
              <Text fontSize="14px" color="textSubtle" mb="8px">
                {t('1.1 Select the token contract file from contracts/tokens/ directory:')}
              </Text>
              <Box as="ul" pl="20px" mb="12px">
                <Text as="li" fontSize="13px" color="textSubtle" mb="2px">
                  {t('• NBCToken.sol, ETHToken.sol, SOLToken.sol, etc. (18 decimals)')}
                </Text>
                <Text as="li" fontSize="13px" color="textSubtle" mb="2px">
                  {t('• BTCToken.sol (8 decimals)')}
                </Text>
                <Text as="li" fontSize="13px" color="textSubtle">
                  {t('• USDTToken.sol (6 decimals)')}
                </Text>
              </Box>
              <Text fontSize="14px" color="textSubtle" mb="8px">
                {t('1.2 Deploy using Remix or other tools with constructor parameters:')}
              </Text>
              <Box p="12px" mb="8px" style={{ background: 'rgba(0, 0, 0, 0.2)', borderRadius: '4px', fontFamily: 'monospace' }}>
                <Text fontSize="12px" color="textSubtle" mb="4px">
                  {t('For 18 decimals (NBC, ETH, SOL, etc.):')}
                </Text>
                <Text fontSize="12px" color="textSubtle" mb="4px" style={{ fontStyle: 'italic' }}>
                  {t('initialSupply: 1000000 * 10^18  // 1,000,000 tokens')}
                </Text>
                <Text fontSize="12px" color="textSubtle" mb="4px" style={{ fontStyle: 'italic' }}>
                  {t('owner: 0xYourOwnerAddress')}
                </Text>
                <Text fontSize="12px" color="textSubtle" mb="4px" mt="8px">
                  {t('For 8 decimals (BTC):')}
                </Text>
                <Text fontSize="12px" color="textSubtle" mb="4px" style={{ fontStyle: 'italic' }}>
                  {t('initialSupply: 500 * 10^8  // 500 BTC')}
                </Text>
                <Text fontSize="12px" color="textSubtle" mb="4px" style={{ fontStyle: 'italic' }}>
                  {t('owner: 0xYourOwnerAddress')}
                </Text>
                <Text fontSize="12px" color="textSubtle" mb="4px" mt="8px">
                  {t('For 6 decimals (USDT):')}
                </Text>
                <Text fontSize="12px" color="textSubtle" mb="4px" style={{ fontStyle: 'italic' }}>
                  {t('initialSupply: 7000 * 10^6  // 7,000 USDT')}
                </Text>
                <Text fontSize="12px" color="textSubtle" style={{ fontStyle: 'italic' }}>
                  {t('owner: 0xYourOwnerAddress')}
                </Text>
              </Box>
              <Text fontSize="14px" color="textSubtle">
                <strong>{t('1.3 Record the deployed token contract address (e.g., 0x8cEb9a93405CDdf3D76f72327F868Bd3E8755D89)')}</strong>
              </Text>
            </Box>

            {/* 步骤 2: 添加池 */}
            <Box mb="20px" p="16px" style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
              <Text bold mb="8px" fontSize="16px" color="primary">
                {t('Step 2: Add Pool (Current Page)')}
              </Text>
              <Text fontSize="14px" color="textSubtle" mb="8px">
                {t('Fill in the form below with:')}
              </Text>
              <Box as="ol" pl="20px" mb="8px">
                <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                  {t('Token Address: The deployed token contract address from Step 1')}
                </Text>
                <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                  {t('Token Decimals: 8 for BTC, 6 for USDT, 18 for others')}
                </Text>
                <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                  {t('Initial Reward Rate: Tokens per second (e.g., 0.00848)')}
                </Text>
                <Text as="li" fontSize="14px" color="textSubtle">
                  {t('Rewards Duration: 31536000 (1 year) recommended')}
                </Text>
              </Box>
              <Text fontSize="14px" color="textSubtle">
                {t('Then click "Add Pool" button')}
              </Text>
            </Box>

            {/* 步骤 3: 批准代币 */}
            <Box mb="20px" p="16px" style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
              <Text bold mb="8px" fontSize="16px" color="primary">
                {t('Step 3: Approve Token (Go to "Manage Pools" Tab)')}
              </Text>
              <Text fontSize="14px" color="textSubtle" mb="8px">
                {t('After adding the pool, switch to "Manage Pools" tab and:')}
              </Text>
              <Box as="ol" pl="20px" mb="8px">
                <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                  {t('Find "Approve Token" section')}
                </Text>
                <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                  {t('Enter token address (same as Step 2)')}
                </Text>
                <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                  {t('Enter token decimals (same as Step 2)')}
                </Text>
                <Text as="li" fontSize="14px" color="textSubtle">
                  {t('Enter approval amount (must be >= reward amount you plan to send)')}
                </Text>
              </Box>
              <Message variant="warning" mb="0">
                <MessageText fontSize="12px">
                  {t('⚠️ Important: Approval is required before setting reward rate!')}
                </MessageText>
              </Message>
            </Box>

            {/* 步骤 4: 设置奖励率 */}
            <Box mb="0" p="16px" style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
              <Text bold mb="8px" fontSize="16px" color="primary">
                {t('Step 4: Set Initial Reward Rate (In "Manage Pools" Tab)')}
              </Text>
              <Text fontSize="14px" color="textSubtle" mb="8px">
                {t('In "Manage Pools" tab, find "Set Reward Rate" section and:')}
              </Text>
              <Box as="ol" pl="20px" mb="8px">
                <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                  {t('Enter Pool Index (0-based, e.g., 10 for the 11th pool)')}
                </Text>
                <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                  {t('Enter reward amount (e.g., 267425.28 tokens)')}
                </Text>
                <Text as="li" fontSize="14px" color="textSubtle">
                  {t('Click "Notify Reward Amount" button')}
                </Text>
              </Box>
              <Text fontSize="13px" color="textSubtle" style={{ fontStyle: 'italic' }}>
                {t('Note: The system will automatically calculate new rewardRate based on rewardsDuration')}
              </Text>
            </Box>
            <Message variant="primary" mb="0">
              <MessageText fontSize="12px">
                {t('💡 Tip: After adding a pool, use "Set Reward Rate" to adjust the reward rate based on actual staked amount')}
              </MessageText>
            </Message>
          </Box>
            )}
          </Box>

          <Box mb="24px">
            <Text fontSize="14px" color="textSubtle" mb="8px" bold>
              {t('Step 1: Reward Token Address')}
            </Text>
            <Text fontSize="13px" color="textSubtle" mb="8px">
              {t('Enter the ERC20 token contract address that will be used as reward token')}
            </Text>
            <Input
              type="text"
              value={newPoolToken}
              onChange={(e) => setNewPoolToken(e.target.value)}
              placeholder="0x..."
              mb="16px"
            />
          </Box>

          <Box mb="24px">
            <Text fontSize="14px" color="textSubtle" mb="8px" bold>
              {t('Step 2: Token Decimals')}
            </Text>
            <Text fontSize="13px" color="textSubtle" mb="8px">
              {t('Enter the token decimals (8 for BTC, 6 for USDT, 18 for most others)')}
            </Text>
            <Input
              type="number"
              value={tokenDecimals}
              onChange={(e) => setTokenDecimals(e.target.value)}
              placeholder="18"
              mb="16px"
            />
          </Box>

          <Box mb="24px">
            <Text fontSize="14px" color="textSubtle" mb="8px" bold>
              {t('Step 2: Initial Reward Rate')}
            </Text>
            <Text fontSize="13px" color="textSubtle" mb="8px">
              {t('Enter the reward rate in tokens per second. Make sure to consider the token decimals (e.g., 18 decimals for most tokens)')}
            </Text>
            <Input
              type="text"
              value={newPoolRewardRate}
              onChange={(e) => setNewPoolRewardRate(e.target.value)}
              placeholder="0.00000641"
              mb="16px"
            />
          </Box>

          <Box mb="24px">
            <Text fontSize="14px" color="textSubtle" mb="8px" bold>
              {t('Step 4: Rewards Duration')}
            </Text>
            <Text fontSize="13px" color="textSubtle" mb="8px">
              {t('Enter the reward period duration in seconds. Recommended: 31536000 (1 year)')}
            </Text>
            <Flex flexWrap="wrap" mb="12px" style={{ gap: '8px' }}>
              {DURATION_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  scale="sm"
                  variant={newPoolDuration === preset.value ? 'primary' : 'tertiary'}
                  onClick={() => setNewPoolDuration(preset.value)}
                >
                  {preset.label}
                </Button>
              ))}
            </Flex>
            <Input
              type="text"
              value={newPoolDuration}
              onChange={(e) => setNewPoolDuration(e.target.value)}
              placeholder="31536000"
              mb="16px"
            />
          </Box>

          {/* APR 预估计算器 */}
          <Box mb="24px" p="16px" style={{ background: 'rgba(118, 69, 217, 0.1)', borderRadius: '8px', border: '1px solid rgba(118, 69, 217, 0.3)' }}>
            <Text bold mb="12px" fontSize="16px" color="primary">
              {t('APR Calculator')}
            </Text>
            <Text fontSize="13px" color="textSubtle" mb="12px">
              {t('Enter target APR and expected params to get suggested reward rate.')}
            </Text>
            
            <Flex style={{ gap: '16px', flexWrap: 'wrap' }} mb="12px">
              <Box style={{ flex: '1', minWidth: '100px' }}>
                <Text fontSize="12px" color="textSubtle" mb="4px">{t('Target APR (%)')}</Text>
                <Input
                  type="text"
                  value={targetAPR}
                  onChange={(e) => setTargetAPR(e.target.value)}
                  placeholder="30"
                  scale="sm"
                />
              </Box>
              <Box style={{ flex: '1', minWidth: '140px' }}>
                <Text fontSize="12px" color="textSubtle" mb="4px">{t('Expected NBC Staked')}</Text>
                <Input
                  type="text"
                  value={expectedStakeAmount}
                  onChange={(e) => setExpectedStakeAmount(e.target.value)}
                  placeholder="1000000"
                  scale="sm"
                />
              </Box>
              <Box style={{ flex: '1', minWidth: '100px' }}>
                <Text fontSize="12px" color="textSubtle" mb="4px">{t('NBC Price ($)')}</Text>
                <Input
                  type="text"
                  value={nbcPrice}
                  onChange={(e) => setNbcPrice(e.target.value)}
                  placeholder="0.06"
                  scale="sm"
                />
              </Box>
              <Box style={{ flex: '1', minWidth: '120px' }}>
                <Text fontSize="12px" color="textSubtle" mb="4px">{t('Reward Token Price ($)')}</Text>
                <Input
                  type="text"
                  value={rewardTokenPrice}
                  onChange={(e) => setRewardTokenPrice(e.target.value)}
                  placeholder="89000"
                  scale="sm"
                />
              </Box>
              <Box style={{ flex: '1', minWidth: '140px' }}>
                <Text fontSize="12px" color="textSubtle" mb="4px">{t('Reward Token Decimals')}</Text>
                <select
                  value={aprCalculatorDecimals}
                  onChange={(e) => setAprCalculatorDecimals(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(118, 69, 217, 0.3)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'inherit',
                    fontSize: '14px',
                  }}
                >
                  <option value="6">6 (USDT 等)</option>
                  <option value="8">8 (BTC 等)</option>
                  <option value="18">18 (ETH/BNB 等)</option>
                </select>
              </Box>
            </Flex>
            
            <Box p="12px" style={{ background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px' }}>
              {suggestedRewardRate !== null && suggestedRewardRate > 0 && suggestedRewardRate < minEffectiveRatePerSecond && (
                <Message variant="warning" mb="12px">
                  <MessageText fontSize="12px" bold>
                    {t('Suggested value rounds to 0 at current decimals; target APR not reachable.')}
                  </MessageText>
                  <MessageText fontSize="12px" mt="4px">
                    {t('Increase target APR or reduce expected staked so suggested value >= min effective; or use higher decimals.')}
                  </MessageText>
                  <MessageText fontSize="12px" mt="2px">
                    {t('Min effective (tokens/sec):')} {minEffectiveRatePerSecond.toFixed(parseInt(aprCalculatorDecimals, 10) || 18)}
                  </MessageText>
                </Message>
              )}
              <Flex justifyContent="space-between" alignItems="center" mb="8px">
                <Text fontSize="14px" color="textSubtle">{t('Suggested reward rate (tokens/sec):')}</Text>
                <Flex alignItems="center" style={{ gap: '8px' }}>
                  <Text fontSize="16px" bold color={suggestedRewardRate ? 'success' : 'textSubtle'}>
                    {suggestedRewardRate !== null ? suggestedRewardRate.toFixed(11) : '--'}
                  </Text>
                  {suggestedRewardRate !== null && (
                    <Button
                      scale="xs"
                      variant="secondary"
                      onClick={() => setNewPoolRewardRate(suggestedRewardRate.toFixed(11))}
                    >
                      {t('Fill')}
                    </Button>
                  )}
                </Flex>
              </Flex>
              <Flex justifyContent="space-between" alignItems="center" mb="8px">
                <Text fontSize="13px" color="textSubtle">{t('Min effective (current decimals):')}</Text>
                <Text fontSize="13px" color="textSubtle">
                  {minEffectiveRatePerSecond.toFixed(parseInt(aprCalculatorDecimals, 10) || 18)}
                </Text>
              </Flex>
              
              {suggestedRewardRate !== null && (
                <Flex justifyContent="space-between" alignItems="center" mb="8px">
                  <Text fontSize="13px" color="textSubtle">{t('Annual consumption (tokens):')}</Text>
                  <Text fontSize="14px" color="textSubtle">
                    {(suggestedRewardRate * 31536000).toFixed(6)}
                  </Text>
                </Flex>
              )}
              
              {newPoolRewardRate && (
                <Flex justifyContent="space-between" alignItems="center" mt="8px" pt="8px" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <Text fontSize="14px" color="textSubtle">{t('Current reward rate APR:')}</Text>
                  <Text fontSize="16px" bold color={estimatedAPR && estimatedAPR > 0 ? 'primary' : 'textSubtle'}>
                    {estimatedAPR !== null && !isNaN(estimatedAPR) ? `${estimatedAPR.toFixed(2)}%` : '--'}
                  </Text>
                </Flex>
              )}
              
              <Text fontSize="11px" color="textSubtle" mt="8px">
                {t('Note: Actual APR varies with staked amount. More staked = lower APR')}
              </Text>
            </Box>
          </Box>

          <Button
            onClick={handleAddPool}
            disabled={isPending || !newPoolToken || !newPoolRewardRate || !newPoolDuration}
            isLoading={isPending}
          >
            {t('Add Pool')}
          </Button>
        </Box>
      )}

      {/* 提现监控面板 */}
      {section === 'monitor' && (
        <Box p="24px" mb="24px">
          <Heading scale="lg" mb="8px">
            🔍 {t('Withdraw Approval Queue')}
          </Heading>
          <Text fontSize="14px" color="textSubtle" mb="24px">
            {t('Review user withdraw requests, approve or reject them on-chain, and keep emergency contract controls available here.')}
          </Text>

          {/* 合约暂停控制 */}
          <Box mb="24px" p="16px" style={{ border: `2px solid ${isPaused ? 'rgba(255,77,77,0.5)' : 'rgba(49,208,170,0.4)'}`, borderRadius: '12px', background: isPaused ? 'rgba(255,77,77,0.06)' : 'rgba(49,208,170,0.04)' }}>
            <Flex justifyContent="space-between" alignItems="center" mb="8px">
              <Box>
                <Text bold fontSize="18px" color={isPaused ? 'failure' : 'success'}>
                  {isPaused ? `⏸ ${t('Contract PAUSED')}` : `▶ ${t('Contract RUNNING')}`}
                </Text>
                <Text fontSize="13px" color="textSubtle" mt="4px">
                  {isPaused
                    ? t('All stake / withdraw / claim operations are frozen for users.')
                    : t('Contract is active. Users can stake, withdraw, and claim rewards.')}
                </Text>
              </Box>
              <Button
                onClick={() => { handlePause(); setTimeout(() => refetchPaused(), 3000) }}
                disabled={isPending}
                variant={isPaused ? 'primary' : 'danger'}
                isLoading={isPending}
                scale="md"
              >
                {isPaused ? t('Unpause Contract') : t('Pause Contract')}
              </Button>
            </Flex>
            {!isPaused && (
              <Message variant="warning" mb="0">
                <MessageText fontSize="12px">
                  {t('⚠️ Pausing will immediately stop all user interactions. Use only when suspicious activity is detected.')}
                </MessageText>
              </Message>
            )}
          </Box>

          <Box p="16px" style={{ border: '1px solid rgba(118, 69, 217, 0.2)', borderRadius: '8px' }}>
            <Flex justifyContent="space-between" alignItems="center" mb="12px" flexWrap="wrap" style={{ gap: '8px' }}>
              <Box>
                <Text bold fontSize="16px">
                  📋 {t('Withdraw Requests')} ({withdrawRequests.length} {t('total')})
                </Text>
                <Text fontSize="12px" color="textSubtle" mt="4px">
                  {t('Users submit requests with withdraw(); admins approve or reject; approved users must still execute their own withdrawal.')}
                </Text>
              </Box>
              <Flex style={{ gap: '8px' }} flexWrap="wrap">
                <Button
                  scale="sm"
                  variant={monitorFilter === 'pending' ? 'primary' : 'tertiary'}
                  onClick={() => setMonitorFilter('pending')}
                >
                  ⏳ {t('Pending')} ({withdrawRequests.filter((r) => !r.approved && !r.rejected && !r.executed).length})
                </Button>
                <Button
                  scale="sm"
                  variant={monitorFilter === 'approved' ? 'success' : 'tertiary'}
                  onClick={() => setMonitorFilter('approved')}
                >
                  ✅ {t('Approved')} ({withdrawRequests.filter((r) => r.approved && !r.executed).length})
                </Button>
                <Button
                  scale="sm"
                  variant={monitorFilter === 'rejected' ? 'danger' : 'tertiary'}
                  onClick={() => setMonitorFilter('rejected')}
                >
                  ❌ {t('Rejected')} ({withdrawRequests.filter((r) => r.rejected).length})
                </Button>
                <Button
                  scale="sm"
                  variant={monitorFilter === 'all' ? 'secondary' : 'tertiary'}
                  onClick={() => setMonitorFilter('all')}
                >
                  {t('All')}
                </Button>
                <Button
                  scale="sm"
                  variant="secondary"
                  onClick={handleFetchRequests}
                  isLoading={isLoadingRequests}
                  disabled={isLoadingRequests}
                >
                  {t('Refresh')}
                </Button>
              </Flex>
            </Flex>

            {withdrawRequests.length === 0 ? (
              <Box textAlign="center" py="32px">
                <Text fontSize="14px" color="textSubtle" mb="12px">
                  {t('No requests loaded yet.')}
                </Text>
                <Button scale="sm" variant="secondary" onClick={handleFetchRequests} isLoading={isLoadingRequests}>
                  {t('Load Requests')}
                </Button>
              </Box>
            ) : (
              <Box style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {withdrawRequests
                  .filter((r) => {
                    if (monitorFilter === 'pending') return !r.approved && !r.rejected && !r.executed
                    if (monitorFilter === 'approved') return r.approved && !r.executed
                    if (monitorFilter === 'rejected') return r.rejected
                    return true
                  })
                  .sort((a, b) => b.requestId - a.requestId)
                  .map((req) => {
                    const isPendingRequest = !req.approved && !req.rejected && !req.executed
                    const isApprovedPending = req.approved && !req.executed
                    const amountReadable = (Number(req.amount) / 1e18).toFixed(4)
                    const requestTime = req.requestedAt > 0 ? new Date(req.requestedAt * 1000).toLocaleString() : '—'
                    const statusColor = req.rejected ? 'failure' : req.executed ? 'textSubtle' : req.approved ? 'success' : 'warning'
                    const statusLabel = req.executed
                      ? `✅ ${t('Executed')}`
                      : req.rejected
                        ? `❌ ${t('Rejected')}`
                        : req.approved
                          ? `✅ ${t('Approved')} - ${t('Awaiting user execution')}`
                          : `⏳ ${t('Pending Approval')}`

                    return (
                      <Box
                        key={req.requestId}
                        mb="10px"
                        p="14px 16px"
                        style={{
                          borderRadius: '10px',
                          border: isPendingRequest
                            ? '1px solid rgba(255,193,7,0.5)'
                            : isApprovedPending
                              ? '1px solid rgba(49,208,170,0.4)'
                              : '1px solid rgba(255,255,255,0.08)',
                          background: isPendingRequest
                            ? 'rgba(255,193,7,0.05)'
                            : isApprovedPending
                              ? 'rgba(49,208,170,0.04)'
                              : 'rgba(255,255,255,0.02)',
                        }}
                      >
                        <Flex justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" style={{ gap: '8px' }}>
                          <Box style={{ flex: 1, minWidth: 0 }}>
                            <Flex alignItems="center" mb="4px" style={{ gap: '8px' }}>
                              <Text fontSize="12px" color="textSubtle">
                                #{req.requestId}
                              </Text>
                              <Text fontSize="12px" bold color={statusColor}>
                                {statusLabel}
                              </Text>
                            </Flex>
                            <Text fontSize="13px" fontFamily="monospace" mb="2px" style={{ wordBreak: 'break-all' }}>
                              {t('User')}: {req.user}
                            </Text>
                            <Text fontSize="13px" color="textSubtle">
                              {t('Pool')} {req.poolIndex} · {amountReadable} NBC · {requestTime}
                            </Text>
                          </Box>
                          {isPendingRequest && (
                            <Flex style={{ gap: '8px' }} alignItems="center">
                              <Button
                                scale="sm"
                                variant="success"
                                onClick={() => handleApprove(req.requestId)}
                                disabled={isPending && actionRequestId === req.requestId}
                                isLoading={isPending && actionRequestId === req.requestId}
                              >
                                ✅ {t('Approve')}
                              </Button>
                              <Button
                                scale="sm"
                                variant="danger"
                                onClick={() => handleReject(req.requestId)}
                                disabled={isPending && actionRequestId === req.requestId}
                                isLoading={isPending && actionRequestId === req.requestId}
                              >
                                ❌ {t('Reject')}
                              </Button>
                            </Flex>
                          )}
                        </Flex>
                      </Box>
                    )
                  })}
              </Box>
            )}
          </Box>
        </Box>
      )}

      {section === 'financial' && <NbcStakingAdminFinancialTab />}

      {section === 'referral' && <NbcStakingAdminReferralTab />}

      {/* 设置：用 Box 替代 Card，与页面背景统一 */}
      {section === 'settings' && (
        <Box p="24px" mb="24px">
          <Heading scale="lg" mb="24px">
            {t('Settings & Information')}
          </Heading>

          {/* 快速参考指南（可折叠） */}
          <Box mb="24px">
            <Button
              variant="text"
              scale="sm"
              onClick={() => setShowSettingsGuide((v) => !v)}
              style={{ padding: 0, marginBottom: showSettingsGuide ? 12 : 0 }}
            >
              {t('📖 Quick Reference Guide')} {showSettingsGuide ? '▲' : '▼'}
            </Button>
            {showSettingsGuide && (
          <Box p="20px" style={{ background: 'rgba(118, 69, 217, 0.08)', borderRadius: '8px', border: '1px solid rgba(118, 69, 217, 0.2)' }}>
            
            {/* 代币精度参考 */}
            <Box mb="20px" p="16px" style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
              <Text bold mb="12px" fontSize="16px" color="primary">
                {t('Token Decimals Reference:')}
              </Text>
              <Box as="ul" pl="20px" mb="8px">
                <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                  <strong>{t('18 decimals:')}</strong> {t('NBC, ETH, SOL, BNB, XRP, LTC, DOGE, PEPE, SUI')}
                </Text>
                <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                  <strong>{t('8 decimals:')}</strong> {t('BTC (Bitcoin)')}
                </Text>
                <Text as="li" fontSize="14px" color="textSubtle">
                  <strong>{t('6 decimals:')}</strong> {t('USDT (Tether USD)')}
                </Text>
              </Box>
            </Box>

            {/* 常见问题 */}
            <Box mb="20px" p="16px" style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
              <Text bold mb="12px" fontSize="16px" color="primary">
                {t('Common Issues & Solutions:')}
              </Text>
              <Box mb="8px">
                <Text fontSize="14px" color="textSubtle" mb="4px" bold>
                  {t('1. Precision Mismatch:')}
                </Text>
                <Text fontSize="13px" color="textSubtle" pl="16px" mb="8px">
                  {t('Problem: Wrong decimals cause incorrect amount calculations.')}
                </Text>
                <Text fontSize="13px" color="textSubtle" pl="16px">
                  {t('Solution: Always use correct decimals (BTC: 8, USDT: 6, others: 18)')}
                </Text>
              </Box>
              <Box mb="8px">
                <Text fontSize="14px" color="textSubtle" mb="4px" bold>
                  {t('2. Insufficient Approval:')}
                </Text>
                <Text fontSize="13px" color="textSubtle" pl="16px" mb="8px">
                  {t('Problem: notifyRewardAmount fails if approval amount < reward amount.')}
                </Text>
                <Text fontSize="13px" color="textSubtle" pl="16px">
                  {t('Solution: Ensure approval amount >= reward amount you plan to send')}
                </Text>
              </Box>
              <Box mb="8px">
                <Text fontSize="14px" color="textSubtle" mb="4px" bold>
                  {t('3. Wrong Pool Index:')}
                </Text>
                <Text fontSize="13px" color="textSubtle" pl="16px" mb="8px">
                  {t('Problem: Using wrong pool index modifies wrong pool.')}
                </Text>
                <Text fontSize="13px" color="textSubtle" pl="16px">
                  {t('Solution: Index starts from 0. 1st pool = 0, 11th pool = 10. Check total pools above.')}
                </Text>
              </Box>
              <Box mb="0">
                <Text fontSize="14px" color="textSubtle" mb="4px" bold>
                  {t('4. Period Not Finished:')}
                </Text>
                <Text fontSize="13px" color="textSubtle" pl="16px" mb="8px">
                  {t('Problem: setRewardsDuration can only be called after period ends.')}
                </Text>
                <Text fontSize="13px" color="textSubtle" pl="16px">
                  {t('Solution: Wait for period to end, or use notifyRewardAmount to reset the period')}
                </Text>
              </Box>
            </Box>
          </Box>
            )}
          </Box>

          <Box mb="24px">
            <Text bold mb="8px">{t('Contract Information')}</Text>
            <Text fontSize="14px" color="textSubtle">
              {t('Contract Address: %address%', { address: STAKING_CONTRACT_ADDRESS })}
            </Text>
            <Text fontSize="14px" color="textSubtle">
              {t('Owner Address: %address%', { address: ownerStr ?? '—' })}
            </Text>
            <Text fontSize="14px" color="textSubtle">
              {t('Total Pools: %count%', { count: poolLength?.toString() || '0' })}
            </Text>
            <Text fontSize="14px" color="textSubtle">
              {t('Your Address: %address%', { address: account })}
            </Text>
          </Box>

          <Box mb="24px">
            <Text bold mb="8px">{t('Common Values')}</Text>
            <Text fontSize="14px" color="textSubtle">
              {t('1 Year (seconds): 31536000')}
            </Text>
            <Text fontSize="14px" color="textSubtle">
              {t('6 Months (seconds): 15552000')}
            </Text>
            <Text fontSize="14px" color="textSubtle">
              {t('3 Months (seconds): 7776000')}
            </Text>
            <Text fontSize="14px" color="textSubtle">
              {t('1 Month (seconds): 2592000')}
            </Text>
          </Box>

          <Box mb="24px">
            <Text bold mb="8px">{t('Important Notes')}</Text>
            <Message variant="warning">
              <MessageText>
                {t('1. setRewardsDuration can only be called after periodFinish')}
              </MessageText>
              <MessageText>
                {t('2. notifyRewardAmount will reset the period and calculate new rewardRate')}
              </MessageText>
              <MessageText>
                {t('3. If period is not finished, leftover rewards will be included in calculation')}
              </MessageText>
              <MessageText>
                {t('4. Always verify amounts before submitting transactions')}
              </MessageText>
            </Message>
          </Box>
        </Box>
      )}
        </Box>
      </AdminShell>
    </Page>
  )
}

export default NbcStakingAdminView
