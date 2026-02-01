import React, { useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
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
import { STAKING_CONTRACT_ADDRESS, STAKING_ABI, CHAIN_ID } from 'config/staking/constants'
import { getPoolConfigBySousId } from 'config/staking/poolConfig'
import { parseUnits } from 'viem'

const NbcStakingAdmin: React.FC = () => {
  const { t } = useTranslation()
  const { address: account } = useAccount()
  const chainId = useChainId()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

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
  const [activeTab, setActiveTab] = useState<'pools' | 'add' | 'settings'>('pools')
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
        <PageHeader>
          <Heading as="h1" scale="xxl" color="secondary" mb="24px">
            {t('NBC Staking Admin')}
          </Heading>
        </PageHeader>
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
        <PageHeader>
          <Heading as="h1" scale="xxl" color="secondary" mb="24px">
            {t('NBC Staking Admin')}
          </Heading>
        </PageHeader>
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
        <PageHeader>
          <Heading as="h1" scale="xxl" color="secondary" mb="24px">
            {t('NBC Staking Admin')}
          </Heading>
        </PageHeader>
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
      <PageHeader>
        <Heading as="h1" scale="xxl" color="secondary" mb="24px">
          {t('NBC Staking Admin Panel')}
        </Heading>
        <Text color="textSubtle" mb="24px">
          {t('Manage staking pools, reward rates, and configurations')}
        </Text>
        <Text color="textSubtle" fontSize="14px">
          {t('Contract: %address%', { address: STAKING_CONTRACT_ADDRESS })}
        </Text>
        <Text color="textSubtle" fontSize="14px">
          {t('Owner: %address%', { address: ownerStr ?? 'Unknown' })}
        </Text>
        <Text color="textSubtle" fontSize="14px">
          {t('Total Pools: %count%', { count: poolLength?.toString() || '0' })}
        </Text>
      </PageHeader>

      {/* 标签页 */}
      <Flex mb="24px" style={{ gap: '8px' }}>
        <Button
          variant={activeTab === 'pools' ? 'primary' : 'subtle'}
          onClick={() => setActiveTab('pools')}
        >
          {t('管理现有池')}
        </Button>
        <Button
          variant={activeTab === 'add' ? 'primary' : 'subtle'}
          onClick={() => setActiveTab('add')}
        >
          {t('添加新池')}
        </Button>
        <Button
          variant={activeTab === 'settings' ? 'primary' : 'subtle'}
          onClick={() => setActiveTab('settings')}
        >
          {t('设置')}
        </Button>
      </Flex>

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

      {/* 管理池 */}
      {activeTab === 'pools' && (
        <Card p="24px" mb="24px">
          <Heading scale="lg" mb="24px">
            {t('Manage Existing Pools')}
          </Heading>
          
          {/* 使用说明 */}
          <Box mb="24px" p="16px" style={{ background: 'rgba(118, 69, 217, 0.1)', borderRadius: '8px' }}>
            <Text bold mb="12px" fontSize="16px">
              {t('📖 使用说明 - 管理池')}
            </Text>
            <Text fontSize="14px" color="textSubtle" mb="8px">
              {t('此页面用于管理现有的质押池。你可以：')}
            </Text>
            <Box as="ul" pl="20px" mb="16px">
              <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                {t('1. 设置奖励率：发送奖励代币并更新池的奖励率')}
              </Text>
              <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                {t('2. 设置奖励周期：修改奖励周期（仅在当前周期结束后可用）')}
              </Text>
              <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                {t('3. 设置池状态：启用或禁用池')}
              </Text>
              <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                {t('4. 紧急提取：从合约中提取多余的奖励代币')}
              </Text>
            </Box>
            <Message variant="warning" mb="8px">
              <MessageText fontSize="12px">
                {t('⚠️ 重要：设置奖励率之前，必须先：')}
              </MessageText>
              <MessageText fontSize="12px">
                {t('1. 批准奖励代币给质押合约（使用下方的「批准代币」功能）')}
              </MessageText>
              <MessageText fontSize="12px">
                {t('2. 确保钱包中有足够的代币')}
              </MessageText>
            </Message>
          </Box>

          {/* 代币授权 */}
          <Box mb="24px" p="16px" style={{ border: '1px solid rgba(118, 69, 217, 0.2)', borderRadius: '8px' }}>
            <Text bold mb="8px" fontSize="18px">{t('批准代币（设置奖励率之前必须执行）')}</Text>
            <Text fontSize="14px" color="textSubtle" mb="12px">
              {t('在调用 notifyRewardAmount 之前，必须先批准奖励代币给质押合约。')}
            </Text>
            
            {/* 批准数量说明 */}
            <Box mb="16px" p="12px" style={{ background: 'rgba(255, 193, 7, 0.1)', borderRadius: '8px', border: '1px solid rgba(255, 193, 7, 0.3)' }}>
              <Text bold mb="8px" fontSize="15px" color="warning">
                {t('📌 关于批准数量：')}
              </Text>
              <Box as="ul" pl="20px" mb="8px">
                <Text as="li" fontSize="13px" color="textSubtle" mb="4px">
                  <strong>{t('最小要求：')}</strong> {t('批准数量必须 >= 你计划发送的奖励数量')}
                </Text>
                <Text as="li" fontSize="13px" color="textSubtle" mb="4px">
                  <strong>{t('建议：')}</strong> {t('批准较大数量（如 10 倍），避免频繁重新批准')}
                </Text>
                <Text as="li" fontSize="13px" color="textSubtle" mb="4px">
                  <strong>{t('最大值：')}</strong> {t('可批准最大值以永不需要重新批准')}
                </Text>
                <Text as="li" fontSize="13px" color="textSubtle">
                  <strong>{t('安全性：')}</strong> {t('批准只允许合约转移最多批准的数量。可随时批准 0 来撤销授权')}
                </Text>
              </Box>
              <Message variant="warning" mb="0">
                <MessageText fontSize="12px">
                  {t('⚠️ 重要：如果批准数量 < 奖励数量，notifyRewardAmount 将失败并显示 "Transfer failed" 错误')}
                </MessageText>
              </Message>
            </Box>

            <Text fontSize="14px" color="textSubtle" mb="8px">
              {t('代币地址：')}
            </Text>
            <Input
              type="text"
              value={approveTokenAddress}
              onChange={(e) => setApproveTokenAddress(e.target.value)}
              placeholder="0x..."
              mb="16px"
            />
            <Text fontSize="14px" color="textSubtle" mb="8px">
              {t('代币精度（BTC=8，USDT=6，其他大多数=18）：')}
            </Text>
            <Input
              type="number"
              value={tokenDecimals}
              onChange={(e) => setTokenDecimals(e.target.value)}
              placeholder="18"
              mb="16px"
            />
            <Text fontSize="14px" color="textSubtle" mb="8px">
              {t('批准数量：')}
            </Text>
            <Text fontSize="12px" color="primary" mb="4px">
              {t('直接输入代币数量，无需手动换算。如 BTC 输入 "1" 表示 1 个 BTC')}
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
            >
              {t('批准代币')}
            </Button>
          </Box>

          {/* 设置奖励率 */}
          <Box mb="24px" p="16px" style={{ border: '1px solid rgba(118, 69, 217, 0.2)', borderRadius: '8px' }}>
            <Text bold mb="8px" fontSize="18px">{t('1. 设置奖励率 (notifyRewardAmount)')}</Text>
            <Text fontSize="14px" color="textSubtle" mb="12px">
              {t('此函数通过发送奖励代币到合约来更新奖励率，并启动奖励周期。')}
            </Text>
            <Box mb="16px" p="12px" style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px' }}>
              <Text fontSize="13px" color="textSubtle" mb="4px">
                <strong>{t('工作原理：')}</strong>
              </Text>
              <Text fontSize="13px" color="textSubtle" mb="2px">
                {t('• 如果周期已结束：新奖励率 = 奖励 / 奖励周期')}
              </Text>
              <Text fontSize="13px" color="textSubtle" mb="2px">
                {t('• 如果周期未结束：新奖励率 = (奖励 + 剩余) / 奖励周期')}
              </Text>
              <Text fontSize="13px" color="textSubtle">
                {t('• 剩余 = 剩余时间 × 当前奖励率')}
              </Text>
            </Box>
            <Text fontSize="14px" color="textSubtle" mb="8px">
              {t('池索引（从 0 开始）：')}
            </Text>
            <Input
              type="number"
              value={poolIndex}
              onChange={(e) => setPoolIndex(e.target.value)}
              placeholder="0"
              mb="16px"
            />
            <Text fontSize="14px" color="textSubtle" mb="8px">
              {t('代币精度（BTC=8，USDT=6，其他大多数=18）：')}
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
              {t('奖励数量（整个周期内分发的总奖励）：')}
            </Text>
            <Box mb="12px" p="12px" style={{ background: 'rgba(49, 208, 170, 0.1)', borderRadius: '8px', border: '1px solid rgba(49, 208, 170, 0.3)' }}>
              <Text fontSize="13px" color="textSubtle" mb="8px">
                <strong>{t('📌 什么是奖励数量？')}</strong>
              </Text>
              <Text fontSize="13px" color="textSubtle" mb="8px">
                {t('这是你要在整个「奖励周期」内分发给所有质押者的奖励代币总量。')}
              </Text>
              <Text fontSize="13px" color="textSubtle" mb="8px">
                {t('系统会自动计算每秒分发多少：每秒奖励 = 奖励数量 ÷ 奖励周期（秒）')}
              </Text>
              <Box p="8px" style={{ background: 'rgba(0, 0, 0, 0.2)', borderRadius: '4px' }}>
                <Text fontSize="12px" color="textSubtle" mb="4px">
                  <strong>{t('举例（奖励周期 = 1年 = 31,536,000 秒）：')}</strong>
                </Text>
                <Text fontSize="12px" color="textSubtle" mb="2px">
                  {t('• 输入 0.22 BTC → 一年总共分发 0.22 BTC → 每秒约 0.000000007 BTC')}
                </Text>
                <Text fontSize="12px" color="textSubtle" mb="2px">
                  {t('• 输入 1 BTC → 一年总共分发 1 BTC → 每秒约 0.0000000317 BTC')}
                </Text>
                <Text fontSize="12px" color="textSubtle">
                  {t('• 输入 100 USDT → 一年总共分发 100 USDT → 每秒约 0.00000317 USDT')}
                </Text>
              </Box>
            </Box>
            <Message variant="warning" mb="12px">
              <MessageText fontSize="12px" bold>
                {t('⚠️ 为何填了 0.22 BTC 但「已赚取」仍为 0？')}
              </MessageText>
              <MessageText fontSize="12px" mt="4px">
                {t('合约使用整数除法：rewardRate = reward ÷ rewardsDuration。')}
              </MessageText>
              <MessageText fontSize="12px" mt="2px">
                {t('BTC 池（8 位小数）：0.22 BTC = 22,000,000。若周期为 1 年（31,536,000 秒），22,000,000 ÷ 31,536,000 = 0，rewardRate 会被设为 1 wei/秒，已赚取仍会舍入为 0。')}
              </MessageText>
              <MessageText fontSize="12px" mt="4px" bold>
                {t('解决办法：')}
              </MessageText>
              <MessageText fontSize="12px" mt="2px">
                {t('• 1 年周期下 BTC 池至少填 0.31536 BTC（≈31,536,000 satoshi），rewardRate 才 ≥ 1；要看到明显已赚取建议填更大或缩短周期。')}
              </MessageText>
              <MessageText fontSize="12px" mt="2px">
                {t('• 或先把该池奖励周期改为 1 天（86400 秒），再填 0.22 BTC，可得 rewardRate = 254，已赚取会开始累积。')}
              </MessageText>
            </Message>
            <Text fontSize="12px" color="primary" mb="8px">
              {t('直接输入代币数量，无需手动换算精度。如 BTC 输入 "0.22" 表示 0.22 个 BTC')}
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
            >
              {t('发送奖励')}
            </Button>
          </Box>

          {/* 仅设置 rewardRate（不重置周期） */}
          {(() => {
            const setRewardRatePoolConfig = getPoolConfigBySousId(Number(setRewardRateOnlyPoolIndex))
            const setRewardRateTokenSymbol = setRewardRatePoolConfig?.rewardTokenSymbol ?? t('代币')
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
                <Text bold mb="8px" fontSize="18px">{t('1b. 仅设置 rewardRate（不重置周期）')}</Text>
                <Text fontSize="14px" color="textSubtle" mb="12px">
                  {t('只修改每秒发放的 rewardRate，不转入代币、不修改 periodFinish，当前奖励期不变。')}
                </Text>
                <Text fontSize="14px" color="textSubtle" mb="8px">
                  {t('池索引（0=BTC，1=ETH，2=USDT，3=BNB，4=LTC）：')}
                </Text>
                <Input
                  type="number"
                  value={setRewardRateOnlyPoolIndex}
                  onChange={(e) => setSetRewardRateOnlyPoolIndex(e.target.value)}
                  placeholder="0"
                  mb="16px"
                />
                <Text fontSize="14px" color="textSubtle" mb="8px" bold>
                  {t('每秒发放数量（代币单位）')}
                </Text>
                <Text fontSize="12px" color="textSubtle" mb="4px">
                  {t('直接填「每秒发多少个代币」即可，如 0.00001 表示每秒 0.00001 个')}
                  {setRewardRateTokenSymbol}
                  {t('；')}
                  {t('当前精度下最小有效值')}
                  {`: ${minEffective1b.toFixed(setRewardRateDecimals)}`}
                </Text>
                {wouldRoundToZero && (
                  <Message variant="warning" mb="12px">
                    <MessageText fontSize="12px" bold>
                      {t('当前值在该池代币精度下会变为 0，链上 rewardRate 将为 0，已赚取会一直为 0。')}
                    </MessageText>
                    <MessageText fontSize="12px" mt="4px">
                      {t('请至少填')} {minEffective1b.toFixed(setRewardRateDecimals)} {t('（每秒 1 个最小单位）')}
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
                >
                  {t('仅设置 rewardRate')}
                </Button>
              </Box>
            )
          })()}

          {/* 设置奖励周期 */}
          <Box mb="24px" p="16px" style={{ border: '1px solid rgba(118, 69, 217, 0.2)', borderRadius: '8px' }}>
            <Text bold mb="8px" fontSize="18px">{t('2. 设置奖励周期')}</Text>
            <Text fontSize="14px" color="textSubtle" mb="12px">
              {t('修改池的奖励周期时长。')}
            </Text>
            <Message variant="warning" mb="12px">
              <MessageText fontSize="12px">
                {t('⚠️ 重要：只有在当前周期结束后才能调用此函数')}
              </MessageText>
              <MessageText fontSize="12px">
                {t('如果周期未结束，需要等待或使用 notifyRewardAmount 重置周期')}
              </MessageText>
            </Message>
            <Text fontSize="14px" color="textSubtle" mb="16px">
              {t('池索引：')}
            </Text>
            <Input
              type="number"
              value={poolIndex}
              onChange={(e) => setPoolIndex(e.target.value)}
              placeholder="0"
              mb="16px"
            />
            <Text fontSize="14px" color="textSubtle" mb="16px">
              {t('奖励周期（秒，1天=86400，1年=31536000）：')}
            </Text>
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
            >
              {t('设置奖励周期')}
            </Button>
          </Box>

          {/* 激活/停用池 */}
          <Box mb="24px" p="16px" style={{ border: '1px solid rgba(118, 69, 217, 0.2)', borderRadius: '8px' }}>
            <Text bold mb="8px" fontSize="18px">{t('3. 设置池状态')}</Text>
            <Text fontSize="14px" color="textSubtle" mb="12px">
              {t('启用或禁用质押池。禁用后，用户无法质押或提取。')}
            </Text>
            <Text fontSize="14px" color="textSubtle" mb="8px">
              {t('池索引：')}
            </Text>
            <Input
              type="number"
              value={poolIndex}
              onChange={(e) => setPoolIndex(e.target.value)}
              placeholder="0"
              mb="16px"
            />
            <Flex alignItems="center" mb="16px">
              <input
                type="checkbox"
                checked={poolActive}
                onChange={(e) => setPoolActive(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              <Text>{t('启用')}</Text>
            </Flex>
            <Button
              onClick={handleSetPoolActive}
              disabled={isPending || poolIndex === ''}
            >
              {t('设置池状态')}
            </Button>
          </Box>

          {/* 紧急提取奖励 */}
          <Box mb="24px" p="16px" style={{ border: '1px solid rgba(255, 77, 77, 0.3)', borderRadius: '8px' }}>
            <Text bold mb="8px" fontSize="18px">{t('4. 紧急提取奖励')}</Text>
            <Text fontSize="14px" color="textSubtle" mb="12px">
              {t('从合约中提取奖励代币。当合约中有多余代币时使用。')}
            </Text>
            <Message variant="danger" mb="12px">
              <MessageText fontSize="12px">
                {t('⚠️ 警告：这将从合约中提取奖励代币到 Owner 地址')}
              </MessageText>
              <MessageText fontSize="12px">
                {t('请谨慎使用 - 提取过多可能影响池的奖励发放')}
              </MessageText>
            </Message>
            <Text fontSize="14px" color="textSubtle" mb="16px">
              {t('池索引：')}
            </Text>
            <Input
              type="number"
              value={poolIndex}
              onChange={(e) => setPoolIndex(e.target.value)}
              placeholder="0"
              mb="16px"
            />
            <Text fontSize="14px" color="textSubtle" mb="8px">
              {t('代币精度（BTC=8，USDT=6，其他大多数=18）：')}
            </Text>
            <Input
              type="number"
              value={tokenDecimals}
              onChange={(e) => setTokenDecimals(e.target.value)}
              placeholder="18"
              mb="16px"
            />
            <Text fontSize="14px" color="textSubtle" mb="8px">
              {t('提取数量：')}
            </Text>
            <Text fontSize="12px" color="primary" mb="8px">
              {t('直接输入代币数量，无需手动换算')}
            </Text>
            <Input
              type="text"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="0.001"
              mb="16px"
            />
            <Button
              onClick={handleEmergencyWithdraw}
              disabled={isPending || !withdrawAmount || !poolIndex}
              variant="danger"
            >
              {t('紧急提取')}
            </Button>
          </Box>
        </Card>
      )}

      {/* 添加新池 */}
      {activeTab === 'add' && (
        <Card p="24px" mb="24px">
          <Heading scale="lg" mb="24px">
            {t('添加新奖励池')}
          </Heading>
          
          {/* 详细使用说明 */}
          <Box mb="24px" p="20px" style={{ background: 'rgba(118, 69, 217, 0.1)', borderRadius: '8px', border: '1px solid rgba(118, 69, 217, 0.3)' }}>
            <Text bold mb="16px" fontSize="18px">
              {t('📖 完整操作指南')}
            </Text>
            
            {/* 步骤 1: 部署代币 */}
            <Box mb="20px" p="16px" style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
              <Text bold mb="8px" fontSize="16px" color="primary">
                {t('第一步：部署代币合约')}
              </Text>
              <Text fontSize="14px" color="textSubtle" mb="8px">
                {t('1.1 从 contracts/tokens/ 目录选择代币合约文件：')}
              </Text>
              <Box as="ul" pl="20px" mb="12px">
                <Text as="li" fontSize="13px" color="textSubtle" mb="2px">
                  {t('• NBCToken.sol, ETHToken.sol, SOLToken.sol 等（18 位精度）')}
                </Text>
                <Text as="li" fontSize="13px" color="textSubtle" mb="2px">
                  {t('• BTCToken.sol（8 位精度）')}
                </Text>
                <Text as="li" fontSize="13px" color="textSubtle">
                  {t('• USDTToken.sol（6 位精度）')}
                </Text>
              </Box>
              <Text fontSize="14px" color="textSubtle" mb="8px">
                {t('1.2 使用 Remix 或其他工具部署，构造函数参数：')}
              </Text>
              <Box p="12px" mb="8px" style={{ background: 'rgba(0, 0, 0, 0.2)', borderRadius: '4px', fontFamily: 'monospace' }}>
                <Text fontSize="12px" color="textSubtle" mb="4px">
                  {t('18 位精度（NBC, ETH, SOL 等）：')}
                </Text>
                <Text fontSize="12px" color="textSubtle" mb="4px" style={{ fontStyle: 'italic' }}>
                  {t('initialSupply: 1000000 * 10^18  // 100万代币')}
                </Text>
                <Text fontSize="12px" color="textSubtle" mb="4px" style={{ fontStyle: 'italic' }}>
                  {t('owner: 0x你的Owner地址')}
                </Text>
                <Text fontSize="12px" color="textSubtle" mb="4px" mt="8px">
                  {t('8 位精度（BTC）：')}
                </Text>
                <Text fontSize="12px" color="textSubtle" mb="4px" style={{ fontStyle: 'italic' }}>
                  {t('initialSupply: 500 * 10^8  // 500 BTC')}
                </Text>
                <Text fontSize="12px" color="textSubtle" mb="4px" style={{ fontStyle: 'italic' }}>
                  {t('owner: 0x你的Owner地址')}
                </Text>
                <Text fontSize="12px" color="textSubtle" mb="4px" mt="8px">
                  {t('6 位精度（USDT）：')}
                </Text>
                <Text fontSize="12px" color="textSubtle" mb="4px" style={{ fontStyle: 'italic' }}>
                  {t('initialSupply: 7000 * 10^6  // 7,000 USDT')}
                </Text>
                <Text fontSize="12px" color="textSubtle" style={{ fontStyle: 'italic' }}>
                  {t('owner: 0x你的Owner地址')}
                </Text>
              </Box>
              <Text fontSize="14px" color="textSubtle">
                <strong>{t('1.3 记录部署后的代币合约地址（如 0x8cEb9a93405CDdf3D76f72327F868Bd3E8755D89）')}</strong>
              </Text>
            </Box>

            {/* 步骤 2: 添加池 */}
            <Box mb="20px" p="16px" style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
              <Text bold mb="8px" fontSize="16px" color="primary">
                {t('第二步：添加池（当前页面）')}
              </Text>
              <Text fontSize="14px" color="textSubtle" mb="8px">
                {t('在下方表单中填写：')}
              </Text>
              <Box as="ol" pl="20px" mb="8px">
                <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                  {t('代币地址：第一步中部署的代币合约地址')}
                </Text>
                <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                  {t('代币精度：BTC=8，USDT=6，其他=18')}
                </Text>
                <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                  {t('初始奖励率：使用下方 APR 计算器计算')}
                </Text>
                <Text as="li" fontSize="14px" color="textSubtle">
                  {t('奖励周期：建议 31536000（1年）')}
                </Text>
              </Box>
              <Text fontSize="14px" color="textSubtle">
                {t('然后点击「添加池」按钮')}
              </Text>
            </Box>

            {/* 步骤 3: 批准代币 */}
            <Box mb="20px" p="16px" style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
              <Text bold mb="8px" fontSize="16px" color="primary">
                {t('第三步：批准代币（切换到「管理现有池」标签）')}
              </Text>
              <Text fontSize="14px" color="textSubtle" mb="8px">
                {t('添加池后，切换到「管理现有池」标签：')}
              </Text>
              <Box as="ol" pl="20px" mb="8px">
                <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                  {t('找到「批准代币」区域')}
                </Text>
                <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                  {t('输入代币地址（与第二步相同）')}
                </Text>
                <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                  {t('输入代币精度（与第二步相同）')}
                </Text>
                <Text as="li" fontSize="14px" color="textSubtle">
                  {t('输入批准数量（必须 >= 你计划发送的奖励数量）')}
                </Text>
              </Box>
              <Message variant="warning" mb="0">
                <MessageText fontSize="12px">
                  {t('⚠️ 重要：设置奖励率之前必须先批准代币！')}
                </MessageText>
              </Message>
            </Box>

            {/* 步骤 4: 设置奖励率 */}
            <Box mb="0" p="16px" style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
              <Text bold mb="8px" fontSize="16px" color="primary">
                {t('第四步：设置初始奖励率（在「管理现有池」标签）')}
              </Text>
              <Text fontSize="14px" color="textSubtle" mb="8px">
                {t('在「管理现有池」标签中，找到「设置奖励率」区域：')}
              </Text>
              <Box as="ol" pl="20px" mb="8px">
                <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                  {t('输入池索引（从 0 开始，如第 11 个池索引为 10）')}
                </Text>
                <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                  {t('输入奖励数量（如 0.001 BTC）')}
                </Text>
                <Text as="li" fontSize="14px" color="textSubtle">
                  {t('点击「发送奖励」按钮')}
                </Text>
              </Box>
              <Text fontSize="13px" color="textSubtle" style={{ fontStyle: 'italic' }}>
                {t('注意：系统会根据奖励周期自动计算新的奖励率')}
              </Text>
            </Box>
            <Message variant="primary" mb="8px">
              <MessageText fontSize="12px">
                {t('💡 提示：添加池后，可在「管理现有池」中使用「设置奖励率」根据实际质押量调整')}
              </MessageText>
            </Message>
          </Box>

          <Box mb="24px">
            <Text fontSize="14px" color="textSubtle" mb="8px" bold>
              {t('步骤 1: 奖励代币地址')}
            </Text>
            <Text fontSize="13px" color="textSubtle" mb="8px">
              {t('输入作为奖励的 ERC20 代币合约地址')}
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
              {t('步骤 2: 代币精度')}
            </Text>
            <Text fontSize="13px" color="textSubtle" mb="8px">
              {t('输入代币精度（BTC=8，USDT=6，其他大多数=18）')}
            </Text>
            <Input
              type="number"
              value={tokenDecimals}
              onChange={(e) => setTokenDecimals(e.target.value)}
              placeholder="18"
              mb="16px"
            />
            
            <Text fontSize="14px" color="textSubtle" mb="8px" bold>
              {t('步骤 3: 初始奖励率')}
            </Text>
            <Text fontSize="13px" color="textSubtle" mb="8px">
              {t('请使用下方的「APR 计算器」计算奖励率，点击「填入」按钮自动填入此处。')}
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
              {t('步骤 4: 奖励周期')}
            </Text>
            <Text fontSize="13px" color="textSubtle" mb="8px">
              {t('输入奖励周期时长（秒）：1天=86400，1周=604800，1月=2592000，1年=31536000')}
            </Text>
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
              {t('APR 计算器')}
            </Text>
            <Text fontSize="13px" color="textSubtle" mb="12px">
              {t('输入目标 APR 和预期参数，自动计算建议的奖励率。按奖励代币精度取「最小有效值」，小于该值链上会变为 0。')}
            </Text>
            
            <Flex style={{ gap: '16px', flexWrap: 'wrap' }} mb="12px">
              <Box style={{ flex: '1', minWidth: '100px' }}>
                <Text fontSize="12px" color="textSubtle" mb="4px">{t('目标 APR (%)')}</Text>
                <Input
                  type="text"
                  value={targetAPR}
                  onChange={(e) => setTargetAPR(e.target.value)}
                  placeholder="30"
                  scale="sm"
                />
              </Box>
              <Box style={{ flex: '1', minWidth: '140px' }}>
                <Text fontSize="12px" color="textSubtle" mb="4px">{t('预期 NBC 质押量')}</Text>
                <Input
                  type="text"
                  value={expectedStakeAmount}
                  onChange={(e) => setExpectedStakeAmount(e.target.value)}
                  placeholder="1000000"
                  scale="sm"
                />
              </Box>
              <Box style={{ flex: '1', minWidth: '100px' }}>
                <Text fontSize="12px" color="textSubtle" mb="4px">{t('NBC 价格 ($)')}</Text>
                <Input
                  type="text"
                  value={nbcPrice}
                  onChange={(e) => setNbcPrice(e.target.value)}
                  placeholder="0.06"
                  scale="sm"
                />
              </Box>
              <Box style={{ flex: '1', minWidth: '120px' }}>
                <Text fontSize="12px" color="textSubtle" mb="4px">{t('奖励代币价格 ($)')}</Text>
                <Input
                  type="text"
                  value={rewardTokenPrice}
                  onChange={(e) => setRewardTokenPrice(e.target.value)}
                  placeholder="89000"
                  scale="sm"
                />
              </Box>
              <Box style={{ flex: '1', minWidth: '140px' }}>
                <Text fontSize="12px" color="textSubtle" mb="4px">{t('奖励代币精度')}</Text>
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
                    {t('该建议值在当前精度下链上会变为 0，无法达到目标 APR。')}
                  </MessageText>
                  <MessageText fontSize="12px" mt="4px">
                    {t('请提高目标 APR 或减少预期质押量，使建议值 ≥ 最小有效值；或换用更高精度的奖励代币。')}
                  </MessageText>
                  <MessageText fontSize="12px" mt="2px">
                    {t('最小有效值 (代币/秒):')} {minEffectiveRatePerSecond.toFixed(parseInt(aprCalculatorDecimals, 10) || 18)}
                  </MessageText>
                </Message>
              )}
              <Flex justifyContent="space-between" alignItems="center" mb="8px">
                <Text fontSize="14px" color="textSubtle">{t('建议奖励率 (代币/秒):')}</Text>
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
                      {t('填入')}
                    </Button>
                  )}
                </Flex>
              </Flex>
              <Flex justifyContent="space-between" alignItems="center" mb="8px">
                <Text fontSize="13px" color="textSubtle">{t('最小有效值 (当前精度):')}</Text>
                <Text fontSize="13px" color="textSubtle">
                  {minEffectiveRatePerSecond.toFixed(parseInt(aprCalculatorDecimals, 10) || 18)}
                </Text>
              </Flex>
              
              {suggestedRewardRate !== null && (
                <Flex justifyContent="space-between" alignItems="center" mb="8px">
                  <Text fontSize="13px" color="textSubtle">{t('年消耗量 (代币):')}</Text>
                  <Text fontSize="14px" color="textSubtle">
                    {(suggestedRewardRate * 31536000).toFixed(6)}
                  </Text>
                </Flex>
              )}
              
              {newPoolRewardRate && (
                <Flex justifyContent="space-between" alignItems="center" mt="8px" pt="8px" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <Text fontSize="14px" color="textSubtle">{t('当前奖励率对应 APR:')}</Text>
                  <Text fontSize="16px" bold color={estimatedAPR && estimatedAPR > 0 ? 'primary' : 'textSubtle'}>
                    {estimatedAPR !== null && !isNaN(estimatedAPR) ? `${estimatedAPR.toFixed(2)}%` : '--'}
                  </Text>
                </Flex>
              )}
              
              <Text fontSize="11px" color="textSubtle" mt="8px">
                {t('注意：实际 APR 会随质押量变化。质押越多 = APR 越低')}
              </Text>
            </Box>
          </Box>

          <Button
            onClick={handleAddPool}
            disabled={isPending || !newPoolToken || !newPoolRewardRate || !newPoolDuration}
          >
            {t('添加池')}
          </Button>
        </Card>
      )}

      {/* 设置 */}
      {activeTab === 'settings' && (
        <Card p="24px" mb="24px">
          <Heading scale="lg" mb="24px">
            {t('设置与信息')}
          </Heading>
          
          {/* 详细使用说明 */}
          <Box mb="24px" p="20px" style={{ background: 'rgba(118, 69, 217, 0.1)', borderRadius: '8px', border: '1px solid rgba(118, 69, 217, 0.3)' }}>
            <Text bold mb="16px" fontSize="18px">
              {t('📖 快速参考指南')}
            </Text>
            
            {/* 代币精度参考 */}
            <Box mb="20px" p="16px" style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
              <Text bold mb="12px" fontSize="16px" color="primary">
                {t('代币精度参考：')}
              </Text>
              <Box as="ul" pl="20px" mb="8px">
                <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                  <strong>{t('18 位精度：')}</strong> {t('NBC, ETH, SOL, BNB, XRP, LTC, DOGE, PEPE, SUI')}
                </Text>
                <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                  <strong>{t('8 位精度：')}</strong> {t('BTC (比特币)')}
                </Text>
                <Text as="li" fontSize="14px" color="textSubtle">
                  <strong>{t('6 位精度：')}</strong> {t('USDT (泰达币)')}
                </Text>
              </Box>
            </Box>

            {/* 常见问题 */}
            <Box mb="20px" p="16px" style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
              <Text bold mb="12px" fontSize="16px" color="primary">
                {t('常见问题与解决方案：')}
              </Text>
              <Box mb="8px">
                <Text fontSize="14px" color="textSubtle" mb="4px" bold>
                  {t('1. 精度不匹配：')}
                </Text>
                <Text fontSize="13px" color="textSubtle" pl="16px" mb="8px">
                  {t('问题：错误的精度导致金额计算错误。')}
                </Text>
                <Text fontSize="13px" color="textSubtle" pl="16px">
                  {t('解决：始终使用正确的精度（BTC: 8, USDT: 6, 其他: 18）')}
                </Text>
              </Box>
              <Box mb="8px">
                <Text fontSize="14px" color="textSubtle" mb="4px" bold>
                  {t('2. 批准数量不足：')}
                </Text>
                <Text fontSize="13px" color="textSubtle" pl="16px" mb="8px">
                  {t('问题：如果批准数量 < 奖励数量，notifyRewardAmount 会失败。')}
                </Text>
                <Text fontSize="13px" color="textSubtle" pl="16px">
                  {t('解决：确保批准数量 >= 你计划发送的奖励数量')}
                </Text>
              </Box>
              <Box mb="8px">
                <Text fontSize="14px" color="textSubtle" mb="4px" bold>
                  {t('3. 池索引错误：')}
                </Text>
                <Text fontSize="13px" color="textSubtle" pl="16px" mb="8px">
                  {t('问题：使用错误的池索引会修改错误的池。')}
                </Text>
                <Text fontSize="13px" color="textSubtle" pl="16px">
                  {t('解决：索引从 0 开始。第 1 个池 = 0，第 11 个池 = 10。')}
                </Text>
              </Box>
              <Box mb="0">
                <Text fontSize="14px" color="textSubtle" mb="4px" bold>
                  {t('4. 周期未结束：')}
                </Text>
                <Text fontSize="13px" color="textSubtle" pl="16px" mb="8px">
                  {t('问题：setRewardsDuration 只能在周期结束后调用。')}
                </Text>
                <Text fontSize="13px" color="textSubtle" pl="16px">
                  {t('解决：等待周期结束，或使用 notifyRewardAmount 重置周期')}
                </Text>
              </Box>
            </Box>
          </Box>

          <Box mb="24px">
            <Text bold mb="8px">{t('合约信息')}</Text>
            <Text fontSize="14px" color="textSubtle">
              {t('合约地址：%address%', { address: STAKING_CONTRACT_ADDRESS })}
            </Text>
            <Text fontSize="14px" color="textSubtle">
              {t('Owner 地址：%address%', { address: ownerStr ?? '未知' })}
            </Text>
            <Text fontSize="14px" color="textSubtle">
              {t('池总数：%count%', { count: poolLength?.toString() || '0' })}
            </Text>
            <Text fontSize="14px" color="textSubtle">
              {t('你的地址：%address%', { address: account })}
            </Text>
          </Box>

          <Box mb="24px">
            <Text bold mb="8px">{t('常用值参考')}</Text>
            <Text fontSize="14px" color="textSubtle">
              {t('1 年（秒）：31536000')}
            </Text>
            <Text fontSize="14px" color="textSubtle">
              {t('6 个月（秒）：15552000')}
            </Text>
            <Text fontSize="14px" color="textSubtle">
              {t('3 个月（秒）：7776000')}
            </Text>
            <Text fontSize="14px" color="textSubtle">
              {t('1 个月（秒）：2592000')}
            </Text>
          </Box>

          <Box mb="24px">
            <Text bold mb="8px">{t('重要说明')}</Text>
            <Message variant="warning">
              <MessageText>
                {t('1. setRewardsDuration 只能在 periodFinish 后调用')}
              </MessageText>
              <MessageText>
                {t('2. notifyRewardAmount 会重置周期并计算新的奖励率')}
              </MessageText>
              <MessageText>
                {t('3. 如果周期未结束，剩余奖励会包含在计算中')}
              </MessageText>
              <MessageText>
                {t('4. 提交交易前请务必核实金额')}
              </MessageText>
            </Message>
          </Box>
        </Card>
      )}
    </Page>
  )
}

// 指定页面支持的链（NBC Chain）
const NbcStakingAdminWithChains = NbcStakingAdmin as React.FC<Record<string, never>> & { chains?: number[] }
NbcStakingAdminWithChains.chains = [1281]

export default NbcStakingAdminWithChains
