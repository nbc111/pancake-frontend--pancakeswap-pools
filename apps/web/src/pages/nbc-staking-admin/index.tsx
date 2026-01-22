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

  const isOwner = account && ownerAddress && account.toLowerCase() === ownerAddress.toLowerCase()

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
              {t('Owner Address: %address%', { address: ownerAddress || 'Unknown' })}
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
          {t('Owner: %address%', { address: ownerAddress || 'Unknown' })}
        </Text>
        <Text color="textSubtle" fontSize="14px">
          {t('Total Pools: %count%', { count: poolLength?.toString() || '0' })}
        </Text>
      </PageHeader>

      {/* 标签页 */}
      <Flex mb="24px" gap="8px">
        <Button
          variant={activeTab === 'pools' ? 'primary' : 'subtle'}
          onClick={() => setActiveTab('pools')}
        >
          {t('Manage Pools')}
        </Button>
        <Button
          variant={activeTab === 'add' ? 'primary' : 'subtle'}
          onClick={() => setActiveTab('add')}
        >
          {t('Add New Pool')}
        </Button>
        <Button
          variant={activeTab === 'settings' ? 'primary' : 'subtle'}
          onClick={() => setActiveTab('settings')}
        >
          {t('Settings')}
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
              {t('📖 How to Use - Manage Pools')}
            </Text>
            <Text fontSize="14px" color="textSubtle" mb="8px">
              {t('This page allows you to manage existing staking pools. You can:')}
            </Text>
            <Box as="ul" pl="20px" mb="16px">
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
            <Message variant="warning" mb="8px">
              <MessageText fontSize="12px">
                {t('⚠️ Important: Before setting reward rate, you must:')}
              </MessageText>
              <MessageText fontSize="12px">
                {t('1. Approve the reward token to the staking contract (use "Approve Token" section below)')}
              </MessageText>
              <MessageText fontSize="12px">
                {t('2. Make sure you have enough tokens in your wallet')}
              </MessageText>
            </Message>
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
            <Text fontSize="12px" color="textSubtle" mb="4px" style={{ fontStyle: 'italic' }}>
              {t('Example: For 267,425.28 tokens with 18 decimals, enter "267425.28" (system will convert to wei)')}
            </Text>
            <Input
              type="text"
              value={approveAmount}
              onChange={(e) => setApproveAmount(e.target.value)}
              placeholder="1000000"
              mb="16px"
            />
            <Button
              onClick={handleApproveToken}
              disabled={isPending || !approveTokenAddress || !approveAmount}
              variant="secondary"
            >
              {t('Approve Token')}
            </Button>
          </Box>

          {/* 设置奖励率 */}
          <Box mb="24px" p="16px" style={{ border: '1px solid rgba(118, 69, 217, 0.2)', borderRadius: '8px' }}>
            <Text bold mb="8px" fontSize="18px">{t('1. Set Reward Rate (notifyRewardAmount)')}</Text>
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
              {t('Pool Index (0-10):')}
            </Text>
            <Input
              type="number"
              value={poolIndex}
              onChange={(e) => setPoolIndex(e.target.value)}
              placeholder="0"
              mb="16px"
            />
            <Text fontSize="14px" color="textSubtle" mb="16px">
              {t('Reward Amount (DOGE, with 18 decimals):')}
            </Text>
            <Input
              type="text"
              value={rewardAmount}
              onChange={(e) => setRewardAmount(e.target.value)}
              placeholder="267425.28"
              mb="16px"
            />
            <Button
              onClick={handleNotifyReward}
              disabled={isPending || !rewardAmount || !poolIndex}
            >
              {t('Notify Reward Amount')}
            </Button>
          </Box>

          {/* 设置奖励周期 */}
          <Box mb="24px" p="16px" style={{ border: '1px solid rgba(118, 69, 217, 0.2)', borderRadius: '8px' }}>
            <Text bold mb="8px" fontSize="18px">{t('2. Set Rewards Duration')}</Text>
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
            <Text fontSize="14px" color="textSubtle" mb="16px">
              {t('Pool Index:')}
            </Text>
            <Input
              type="number"
              value={poolIndex}
              onChange={(e) => setPoolIndex(e.target.value)}
              placeholder="0"
              mb="16px"
            />
            <Text fontSize="14px" color="textSubtle" mb="16px">
              {t('Rewards Duration (seconds, 31536000 = 1 year):')}
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
              {t('Set Rewards Duration')}
            </Button>
          </Box>

          {/* 激活/停用池 */}
          <Box mb="24px" p="16px" style={{ border: '1px solid rgba(118, 69, 217, 0.2)', borderRadius: '8px' }}>
            <Text bold mb="8px" fontSize="18px">{t('3. Set Pool Active Status')}</Text>
            <Text fontSize="14px" color="textSubtle" mb="12px">
              {t('Enable or disable a staking pool. When disabled, users cannot stake or withdraw.')}
            </Text>
            <Text fontSize="14px" color="textSubtle" mb="8px">
              {t('Pool Index:')}
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
              <Text>{t('Active')}</Text>
            </Flex>
            <Button
              onClick={handleSetPoolActive}
              disabled={isPending || poolIndex === ''}
            >
              {t('Set Pool Active')}
            </Button>
          </Box>

          {/* 紧急提取奖励 */}
          <Box mb="24px" p="16px" style={{ border: '1px solid rgba(255, 77, 77, 0.3)', borderRadius: '8px' }}>
            <Text bold mb="8px" fontSize="18px">{t('4. Emergency Withdraw Reward')}</Text>
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
            <Text fontSize="14px" color="textSubtle" mb="16px">
              {t('Pool Index:')}
            </Text>
            <Input
              type="number"
              value={poolIndex}
              onChange={(e) => setPoolIndex(e.target.value)}
              placeholder="0"
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
            <Text fontSize="14px" color="textSubtle" mb="16px">
              {t('Amount (with token decimals):')}
            </Text>
            <Input
              type="text"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="1000000"
              mb="16px"
            />
            <Button
              onClick={handleEmergencyWithdraw}
              disabled={isPending || !withdrawAmount || !poolIndex}
              variant="danger"
            >
              {t('Emergency Withdraw')}
            </Button>
          </Box>
        </Card>
      )}

      {/* 添加新池 */}
      {activeTab === 'add' && (
        <Card p="24px" mb="24px">
          <Heading scale="lg" mb="24px">
            {t('Add New Reward Pool')}
          </Heading>
          
          {/* 详细使用说明 */}
          <Box mb="24px" p="20px" style={{ background: 'rgba(118, 69, 217, 0.1)', borderRadius: '8px', border: '1px solid rgba(118, 69, 217, 0.3)' }}>
            <Text bold mb="16px" fontSize="18px">
              {t('📖 Complete Step-by-Step Guide')}
            </Text>
            
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
            <Box mb="12px" p="12px" style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px' }}>
              <Text fontSize="13px" color="textSubtle" mb="4px">
                <strong>{t('Example Calculation:')}</strong>
              </Text>
              <Text fontSize="13px" color="textSubtle" mb="2px">
                {t('Target APR: 50%, Expected Staked: 1,000,000 NBC')}
              </Text>
              <Text fontSize="13px" color="textSubtle" mb="2px">
                {t('Token Price: $0.127, NBC Price: $0.068')}
              </Text>
              <Text fontSize="13px" color="textSubtle" mb="2px">
                {t('Conversion Rate: 1 Token = 1.869 NBC')}
              </Text>
              <Text fontSize="13px" color="textSubtle">
                {t('Initial Reward Rate: 0.00848 tokens/second')}
              </Text>
            </Box>
            <Message variant="primary" mb="8px">
              <MessageText fontSize="12px">
                {t('💡 Tip: After adding a pool, use "Set Reward Rate" to adjust the reward rate based on actual staked amount')}
              </MessageText>
            </Message>
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
            <Text fontSize="14px" color="textSubtle" mb="8px" bold>
              {t('Step 3: Initial Reward Rate')}
            </Text>
            <Text fontSize="13px" color="textSubtle" mb="8px">
              {t('Enter the reward rate in tokens per second. The system will use the decimals specified above.')}
            </Text>
            <Text fontSize="13px" color="textSubtle" mb="8px" style={{ fontStyle: 'italic' }}>
              {t('Example: For 0.00848 tokens/second with 18 decimals, enter "0.00848"')}
            </Text>
            <Input
              type="text"
              value={newPoolRewardRate}
              onChange={(e) => setNewPoolRewardRate(e.target.value)}
              placeholder="0.00848"
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
            <Input
              type="text"
              value={newPoolDuration}
              onChange={(e) => setNewPoolDuration(e.target.value)}
              placeholder="31536000"
              mb="16px"
            />
          </Box>

          <Button
            onClick={handleAddPool}
            disabled={isPending || !newPoolToken || !newPoolRewardRate || !newPoolDuration}
          >
            {t('Add Pool')}
          </Button>
        </Card>
      )}

      {/* 设置 */}
      {activeTab === 'settings' && (
        <Card p="24px" mb="24px">
          <Heading scale="lg" mb="24px">
            {t('Settings & Information')}
          </Heading>
          
          {/* 详细使用说明 */}
          <Box mb="24px" p="20px" style={{ background: 'rgba(118, 69, 217, 0.1)', borderRadius: '8px', border: '1px solid rgba(118, 69, 217, 0.3)' }}>
            <Text bold mb="16px" fontSize="18px">
              {t('📖 Quick Reference Guide')}
            </Text>
            
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

            {/* 页面功能说明 */}
            <Box mb="0" p="16px" style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
              <Text bold mb="12px" fontSize="16px" color="primary">
                {t('Page Functions:')}
              </Text>
              <Box as="ul" pl="20px">
                <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                  {t('Contract Information: View contract address, owner address, and total pools')}
                </Text>
                <Text as="li" fontSize="14px" color="textSubtle" mb="4px">
                  {t('Common Values: Quick reference for time periods (1 year, 6 months, etc.)')}
                </Text>
                <Text as="li" fontSize="14px" color="textSubtle">
                  {t('Important Notes: Key reminders about contract functions and limitations')}
                </Text>
              </Box>
            </Box>
          </Box>

          <Box mb="24px">
            <Text bold mb="8px">{t('Contract Information')}</Text>
            <Text fontSize="14px" color="textSubtle">
              {t('Contract Address: %address%', { address: STAKING_CONTRACT_ADDRESS })}
            </Text>
            <Text fontSize="14px" color="textSubtle">
              {t('Owner Address: %address%', { address: ownerAddress || 'Unknown' })}
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
        </Card>
      )}
    </Page>
  )
}

// 指定页面支持的链（NBC Chain）
NbcStakingAdmin.chains = [1281]

export default NbcStakingAdmin
