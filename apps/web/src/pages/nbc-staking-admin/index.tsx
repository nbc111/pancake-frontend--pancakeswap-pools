import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { styled } from 'styled-components'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
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
  TabMenu,
  Tab,
} from '@pancakeswap/uikit'
import Page from 'components/Layout/Page'

/**
 * 与 nbc-staking 标题左边距一致。
 * admin 的 header 在 Page (Container) 内，多一层 px 16px/24px，需用负 margin 抵消：
 * 小屏 16px + 与 staking 一致的 8px = -24px；sm 及以上 24px + 8px = -32px。
 */
const StyledPageHeader = styled(PageHeader)`
  margin-left: -24px;
  margin-right: -24px;

  ${({ theme }) => theme.mediaQueries.sm} {
    margin-left: -32px;
    margin-right: -32px;
    padding-top: 8px;
  }

  ${({ theme }) => theme.mediaQueries.lg} {
    padding-top: 8px;
  }
`
import { STAKING_CONTRACT_ADDRESS, STAKING_ABI, CHAIN_ID } from 'config/staking/constants'
import { getPoolConfigBySousId, STAKING_POOL_CONFIGS } from 'config/staking/poolConfig'
import { CHAIN_QUERY_NAME, getChainId } from 'config/chains'
import { ChainId } from '@pancakeswap/chains'
import { useSetAtom } from 'jotai'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { accountActiveChainAtom } from 'wallet/atoms/accountStateAtoms'
import { parseUnits } from 'viem'

const NBC_CHAIN_ID = 1281 as ChainId
const TAB_KEYS = ['pools', 'add', 'settings'] as const
const DURATION_PRESETS = [
  { label: '1年', value: '31536000' },
  { label: '6月', value: '15552000' },
  { label: '3月', value: '7776000' },
  { label: '1月', value: '2592000' },
  { label: '1天', value: '86400' },
] as const

const NbcStakingAdmin: React.FC = () => {
  const { t } = useTranslation()
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
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const activeTab = TAB_KEYS[activeTabIndex]
  const [showPoolsGuide, setShowPoolsGuide] = useState(false)
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
      <Page>
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
      <Page>
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
      <Page>
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
    <Page>
      <StyledPageHeader>
        <Heading as="h1" scale="xxl" color="secondary" mb="8px">
          {t('NBC Staking Admin Panel')}
        </Heading>
        <Text color="textSubtle" fontSize="16px" mb="20px">
          {t('Manage staking pools, reward rates, and configurations')}
        </Text>
        <Flex
          flexWrap="wrap"
          gap="48px"
          p="16px"
          borderRadius="12px"
          bg="backgroundAlt"
          style={{ border: '1px solid var(--colors-input)' }}
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

      {/* 标签页导航 */}
      <Box mb="24px">
        <TabMenu activeIndex={activeTabIndex} onItemClick={setActiveTabIndex} fullWidth>
          <Tab>{t('Manage Existing Pools')}</Tab>
          <Tab>{t('Add New Pool')}</Tab>
          <Tab>{t('Settings')}</Tab>
        </TabMenu>
      </Box>

      {/* 交易状态 */}
      {error && (
        <Message variant="danger" mb="24px">
          <MessageText>{error.message}</MessageText>
        </Message>
      )}
      {isPending && (
        <Message variant="warning" mb="24px">
          <MessageText>{t('Transaction pending...')}</MessageText>
        </Message>
      )}
      {isConfirming && (
        <Message variant="warning" mb="24px">
          <MessageText>{t('Waiting for confirmation...')}</MessageText>
        </Message>
      )}
      {isConfirmed && (
        <Message variant="success" mb="24px">
          <MessageText>{t('Transaction confirmed!')}</MessageText>
          {hash && (
            <MessageText fontSize="12px">
              {t('Hash: %hash%', { hash })}
            </MessageText>
          )}
        </Message>
      )}

      {/* 管理池：用 Box 替代 Card，避免标题区域出现「白底 + 外层背景」双层效果 */}
      {activeTab === 'pools' && (
        <Box p="24px" mb="24px">
          <Heading scale="lg" mb="24px">
            {t('Manage Existing Pools')}
          </Heading>
          
          {/* 使用说明（可折叠） */}
          <Box mb="24px">
            <Button
              variant="text"
              scale="sm"
              onClick={() => setShowPoolsGuide((v) => !v)}
              style={{ padding: 0, marginBottom: showPoolsGuide ? 12 : 0 }}
            >
              {t('📖 How to Use - Manage Pools')} {showPoolsGuide ? '▲' : '▼'}
            </Button>
            {showPoolsGuide && (
              <Box p="16px" style={{ background: 'rgba(118, 69, 217, 0.08)', borderRadius: '8px', border: '1px solid rgba(118, 69, 217, 0.2)' }}>
                <Text fontSize="14px" color="textSubtle" mb="8px">
                  {t('This page allows you to manage existing staking pools. You can:')}
                </Text>
                <Box as="ul" pl="20px" mb="12px">
                  <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                    {t('1. Set Reward Rate: Update the reward rate for a pool by sending reward tokens')}
                  </Text>
                  <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                    {t('2. Set Rewards Duration: Change the reward period (only after current period ends)')}
                  </Text>
                  <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                    {t('3. Set Pool Active Status: Enable or disable a pool')}
                  </Text>
                  <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                    {t('4. Emergency Withdraw: Extract excess reward tokens from the contract')}
                  </Text>
                </Box>
                <Message variant="warning" mb="0">
                  <MessageText fontSize="12px">
                    {t('⚠️ Important: Make sure you have approved the reward token to the contract before setting reward rate')}
                  </MessageText>
                </Message>
              </Box>
            )}
          </Box>

          {/* 代币授权 */}
          <Box mb="24px" p="16px" style={{ border: '1px solid rgba(118, 69, 217, 0.2)', borderRadius: '8px' }}>
            <Text bold mb="8px" fontSize="18px">{t('Approve Token (Required Before Setting Reward Rate)')}</Text>
            <Text fontSize="14px" color="textSubtle" mb="12px">
              {t('Before calling notifyRewardAmount, you must approve the reward token to the staking contract.')}
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
            <Text bold mb="8px" fontSize="18px">{t('Set Reward Rate (notifyRewardAmount)')}</Text>
            <Text fontSize="14px" color="textSubtle" mb="12px">
              {t('This function updates the reward rate by sending reward tokens to the contract.')}
            </Text>
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
            <Text fontSize="14px" color="textSubtle" mb="8px">
              {t('Pool Index:')}
            </Text>
            <Box as="select" mb="16px" value={poolIndex} onChange={(e) => setPoolIndex(e.target.value)} style={{ width: '100%', maxWidth: 320, padding: '12px 16px', borderRadius: 8, border: '1px solid var(--colors-input)', background: 'var(--colors-input)', color: 'inherit', fontSize: 14 }}>
              {STAKING_POOL_CONFIGS.map((c) => (
                <option key={c.sousId} value={c.sousId}>{c.sousId} — {c.rewardTokenSymbol}</option>
              ))}
              {[5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>{n} — {t('Other')}</option>
              ))}
            </Box>
            <Text fontSize="14px" color="textSubtle" mb="8px">
              {t('Token Decimals (8 for BTC, 6 for USDT, 18 for most others)')}
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
              {t('Reward Amount (DOGE, with 18 decimals):')}
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
            <Text fontSize="12px" color="primary" mb="8px">
              {t('Enter token amount directly (e.g. 0.22 for 0.22 BTC)')}
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
              {t('Notify Reward Amount')}
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
                <Text bold mb="8px" fontSize="18px">{t('1b. Set rewardRate only (no period reset)')}</Text>
                <Text fontSize="14px" color="textSubtle" mb="12px">
                  {t('Only update rewardRate per second, no token transfer, no periodFinish change.')}
                </Text>
                <Text fontSize="14px" color="textSubtle" mb="8px">
                  {t('Pool Index:')}
                </Text>
                <Box as="select" mb="16px" value={setRewardRateOnlyPoolIndex} onChange={(e) => setSetRewardRateOnlyPoolIndex(e.target.value)} style={{ width: '100%', maxWidth: 320, padding: '12px 16px', borderRadius: 8, border: '1px solid var(--colors-input)', background: 'var(--colors-input)', color: 'inherit', fontSize: 14 }}>
                  {STAKING_POOL_CONFIGS.map((c) => (
                    <option key={c.sousId} value={c.sousId}>{c.sousId} — {c.rewardTokenSymbol}</option>
                  ))}
                  {[5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>{n} — {t('Other')}</option>
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
            <Text bold mb="8px" fontSize="18px">{t('Set Rewards Duration')}</Text>
            <Text fontSize="14px" color="textSubtle" mb="12px">
              {t('Change the reward period duration for a pool.')}
            </Text>
            <Message variant="warning" mb="12px">
              <MessageText fontSize="12px">
                {t('⚠️ Important: This can only be called after the current period finishes (block.timestamp > periodFinish)')}
              </MessageText>
              <MessageText fontSize="12px">
                {t('If the period is not finished, you need to wait or use notifyRewardAmount to reset the period first')}
              </MessageText>
            </Message>
            <Text fontSize="14px" color="textSubtle" mb="8px">
              {t('Pool Index:')}
            </Text>
            <Box as="select" mb="16px" value={poolIndex} onChange={(e) => setPoolIndex(e.target.value)} style={{ width: '100%', maxWidth: 320, padding: '12px 16px', borderRadius: 8, border: '1px solid var(--colors-input)', background: 'var(--colors-input)', color: 'inherit', fontSize: 14 }}>
              {STAKING_POOL_CONFIGS.map((c) => (
                <option key={c.sousId} value={c.sousId}>{c.sousId} — {c.rewardTokenSymbol}</option>
              ))}
              {[5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>{n} — {t('Other')}</option>
              ))}
            </Box>
            <Text fontSize="14px" color="textSubtle" mb="8px">
              {t('Rewards Duration (seconds, 31536000 = 1 year):')}
            </Text>
            <Flex flexWrap="wrap" gap="8px" mb="12px">
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
              {t('Set Rewards Duration')}
            </Button>
          </Box>

          {/* 激活/停用池 */}
          <Box mb="24px" p="16px" style={{ border: '1px solid rgba(118, 69, 217, 0.2)', borderRadius: '8px' }}>
            <Text bold mb="8px" fontSize="18px">{t('Set Pool Active Status')}</Text>
            <Text fontSize="14px" color="textSubtle" mb="12px">
              {t('Enable or disable a staking pool. When disabled, users cannot stake or withdraw.')}
            </Text>
            <Text fontSize="14px" color="textSubtle" mb="8px">
              {t('Pool Index:')}
            </Text>
            <Box as="select" mb="16px" value={poolIndex} onChange={(e) => setPoolIndex(e.target.value)} style={{ width: '100%', maxWidth: 320, padding: '12px 16px', borderRadius: 8, border: '1px solid var(--colors-input)', background: 'var(--colors-input)', color: 'inherit', fontSize: 14 }}>
              {STAKING_POOL_CONFIGS.map((c) => (
                <option key={c.sousId} value={c.sousId}>{c.sousId} — {c.rewardTokenSymbol}</option>
              ))}
              {[5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>{n} — {t('Other')}</option>
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
              {t('Set Pool Active')}
            </Button>
          </Box>

          {/* 紧急提取奖励（危险操作需确认） */}
          <Box mb="24px" p="16px" style={{ border: '2px solid rgba(255, 77, 77, 0.4)', borderRadius: '12px', background: 'rgba(255, 77, 77, 0.04)' }}>
            <Text bold mb="8px" fontSize="18px" color="failure">{t('Emergency Withdraw Reward')}</Text>
            <Text fontSize="14px" color="textSubtle" mb="12px">
              {t('Extract reward tokens from the contract. Use this when there are excess tokens in the contract.')}
            </Text>
            <Message variant="danger" mb="12px">
              <MessageText fontSize="12px">
                {t('⚠️ Warning: This will withdraw reward tokens from the contract to the owner address')}
              </MessageText>
              <MessageText fontSize="12px">
                {t('Use this carefully - withdrawing too much may affect pool rewards')}
              </MessageText>
            </Message>
            <Text fontSize="14px" color="textSubtle" mb="8px">
              {t('Pool Index:')}
            </Text>
            <Box as="select" mb="16px" value={poolIndex} onChange={(e) => setPoolIndex(e.target.value)} style={{ width: '100%', maxWidth: 320, padding: '12px 16px', borderRadius: 8, border: '1px solid var(--colors-input)', background: 'var(--colors-input)', color: 'inherit', fontSize: 14 }}>
              {STAKING_POOL_CONFIGS.map((c) => (
                <option key={c.sousId} value={c.sousId}>{c.sousId} — {c.rewardTokenSymbol}</option>
              ))}
              {[5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>{n} — {t('Other')}</option>
              ))}
            </Box>
            <Text fontSize="14px" color="textSubtle" mb="8px">
              {t('Token Decimals (8 for BTC, 6 for USDT, 18 for most others)')}
            </Text>
            <Input
              type="number"
              value={tokenDecimals}
              onChange={(e) => setTokenDecimals(e.target.value)}
              placeholder="18"
              mb="16px"
            />
            <Text fontSize="14px" color="textSubtle" mb="8px">
              {t('Amount (DOGE, with 18 decimals):')}
            </Text>
            <Text fontSize="12px" color="primary" mb="8px">
              {t('Enter token amount directly')}
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
                {t('I understand: this will transfer tokens from contract to Owner. Use with caution.')}
              </Text>
            </Flex>
            <Button
              onClick={handleEmergencyWithdraw}
              disabled={isPending || !withdrawAmount || !poolIndex || !emergencyWithdrawConfirmed}
              variant="danger"
              isLoading={isPending}
            >
              {t('Emergency Withdraw')}
            </Button>
          </Box>
        </Box>
      )}

      {/* 添加新池：用 Box 替代 Card，与页面背景统一 */}
      {activeTab === 'add' && (
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
            <Flex flexWrap="wrap" gap="8px" mb="12px">
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

      {/* 设置：用 Box 替代 Card，与页面背景统一 */}
      {activeTab === 'settings' && (
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
    </Page>
  )
}

// 指定页面支持的链（NBC Chain）
const NbcStakingAdminWithChains = NbcStakingAdmin as React.FC<Record<string, never>> & { chains?: number[] }
NbcStakingAdminWithChains.chains = [1281]

export default NbcStakingAdminWithChains
