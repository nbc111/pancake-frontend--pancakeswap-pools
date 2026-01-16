import { useMemo } from 'react'
import { useAccount, useReadContract, useBalance } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { Pool } from '@pancakeswap/widgets-internal'
import { Token, ERC20Token } from '@pancakeswap/sdk'
import BigNumber from 'bignumber.js'
import STAKING_ABI from 'abis/nbcMultiRewardStaking.json'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'
import { useCakePrice } from 'hooks/useCakePrice'
import { FAST_INTERVAL } from 'config/constants'
import { STAKING_POOL_CONFIGS, type PoolConfig, calculateAPRFromRewardRate } from 'config/staking'
import { getTokenPricesFromNbcApi } from 'config/staking/tokenPrices'

const STAKING_CONTRACT_ADDRESS = '0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789' as `0x${string}`
const CHAIN_ID = 1281

const POOL_CONFIGS: PoolConfig[] = STAKING_POOL_CONFIGS

export const useNbcStakingPools = () => {
  const { address: account } = useAccount()
  const zero = '0x0000000000000000000000000000000000000000' as `0x${string}`
  const acct = account ?? zero

  const chainTimestamp = useCurrentBlockTimestamp()
  const currentChainTimestamp = chainTimestamp !== undefined ? Number(chainTimestamp) : undefined

  // 获取 NBC 实时价格
  const nbcPriceBN = useCakePrice()
  // 只有当价格大于 0 时才使用，避免使用 BIG_ZERO（0）
  const nbcPrice = nbcPriceBN && !nbcPriceBN.isZero() ? Number(nbcPriceBN.toString()) : null

  // 获取所有代币的实时价格
  const tokenSymbols = useMemo(() => POOL_CONFIGS.map((config) => config.rewardTokenSymbol), [])

  const { data: tokenPrices } = useQuery<Record<string, number | null>>({
    queryKey: ['nbcStakingTokenPrices', tokenSymbols],
    queryFn: () => getTokenPricesFromNbcApi(tokenSymbols),
    staleTime: FAST_INTERVAL * 6,
    refetchInterval: FAST_INTERVAL * 6,
    enabled: true,
  })

  // 获取原生 NBC 余额
  const { data: nativeBalance } = useBalance({
    address: account,
    chainId: CHAIN_ID,
  })

  // Pool 0
  const { data: staked0 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'balanceOf',
    args: [0, acct],
    chainId: CHAIN_ID,
    query: { enabled: !!account },
  })
  const { data: earned0 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'earned',
    args: [0, acct],
    chainId: CHAIN_ID,
    query: { enabled: !!account },
  })
  const { data: totalStaked0 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'totalStaked',
    args: [0],
    chainId: CHAIN_ID,
  })
  const { data: poolInfo0 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'getPoolInfo',
    args: [0],
    chainId: CHAIN_ID,
  })

  // Pool 1
  const { data: staked1 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'balanceOf',
    args: [1, acct],
    chainId: CHAIN_ID,
    query: { enabled: !!account },
  })
  const { data: earned1 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'earned',
    args: [1, acct],
    chainId: CHAIN_ID,
    query: { enabled: !!account },
  })
  const { data: totalStaked1 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'totalStaked',
    args: [1],
    chainId: CHAIN_ID,
  })
  const { data: poolInfo1 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'getPoolInfo',
    args: [1],
    chainId: CHAIN_ID,
  })

  // Pool 2
  const { data: staked2 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'balanceOf',
    args: [2, acct],
    chainId: CHAIN_ID,
    query: { enabled: !!account },
  })
  const { data: earned2 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'earned',
    args: [2, acct],
    chainId: CHAIN_ID,
    query: { enabled: !!account },
  })
  const { data: totalStaked2 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'totalStaked',
    args: [2],
    chainId: CHAIN_ID,
  })
  const { data: poolInfo2 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'getPoolInfo',
    args: [2],
    chainId: CHAIN_ID,
  })

  // Pool 3 (SOL)
  const { data: staked3 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'balanceOf',
    args: [3, acct],
    chainId: CHAIN_ID,
    query: { enabled: !!account },
  })
  const { data: earned3 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'earned',
    args: [3, acct],
    chainId: CHAIN_ID,
    query: { enabled: !!account },
  })
  const { data: totalStaked3 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'totalStaked',
    args: [3],
    chainId: CHAIN_ID,
  })
  const { data: poolInfo3 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'getPoolInfo',
    args: [3],
    chainId: CHAIN_ID,
  })

  // Pool 4 (BNB)
  const { data: staked4 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'balanceOf',
    args: [4, acct],
    chainId: CHAIN_ID,
    query: { enabled: !!account },
  })
  const { data: earned4 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'earned',
    args: [4, acct],
    chainId: CHAIN_ID,
    query: { enabled: !!account },
  })
  const { data: totalStaked4 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'totalStaked',
    args: [4],
    chainId: CHAIN_ID,
  })
  const { data: poolInfo4 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'getPoolInfo',
    args: [4],
    chainId: CHAIN_ID,
  })

  // Pool 5 (XRP)
  const { data: staked5 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'balanceOf',
    args: [5, acct],
    chainId: CHAIN_ID,
    query: { enabled: !!account },
  })
  const { data: earned5 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'earned',
    args: [5, acct],
    chainId: CHAIN_ID,
    query: { enabled: !!account },
  })
  const { data: totalStaked5 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'totalStaked',
    args: [5],
    chainId: CHAIN_ID,
  })
  const { data: poolInfo5 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'getPoolInfo',
    args: [5],
    chainId: CHAIN_ID,
  })

  // Pool 6 (LTC)
  const { data: staked6 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'balanceOf',
    args: [6, acct],
    chainId: CHAIN_ID,
    query: { enabled: !!account },
  })
  const { data: earned6 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'earned',
    args: [6, acct],
    chainId: CHAIN_ID,
    query: { enabled: !!account },
  })
  const { data: totalStaked6 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'totalStaked',
    args: [6],
    chainId: CHAIN_ID,
  })
  const { data: poolInfo6 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'getPoolInfo',
    args: [6],
    chainId: CHAIN_ID,
  })

  // Pool 7 (DOGE)
  const { data: staked7 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'balanceOf',
    args: [7, acct],
    chainId: CHAIN_ID,
    query: { enabled: !!account },
  })
  const { data: earned7 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'earned',
    args: [7, acct],
    chainId: CHAIN_ID,
    query: { enabled: !!account },
  })
  const { data: totalStaked7 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'totalStaked',
    args: [7],
    chainId: CHAIN_ID,
  })
  const { data: poolInfo7 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'getPoolInfo',
    args: [7],
    chainId: CHAIN_ID,
  })

  // Pool 8 (PEPE)
  const { data: staked8 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'balanceOf',
    args: [8, acct],
    chainId: CHAIN_ID,
    query: { enabled: !!account },
  })
  const { data: earned8 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'earned',
    args: [8, acct],
    chainId: CHAIN_ID,
    query: { enabled: !!account },
  })
  const { data: totalStaked8 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'totalStaked',
    args: [8],
    chainId: CHAIN_ID,
  })
  const { data: poolInfo8 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'getPoolInfo',
    args: [8],
    chainId: CHAIN_ID,
  })

  // Pool 9 (USDT)
  const { data: staked9 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'balanceOf',
    args: [9, acct],
    chainId: CHAIN_ID,
    query: { enabled: !!account },
  })
  const { data: earned9 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'earned',
    args: [9, acct],
    chainId: CHAIN_ID,
    query: { enabled: !!account },
  })
  const { data: totalStaked9 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'totalStaked',
    args: [9],
    chainId: CHAIN_ID,
  })
  const { data: poolInfo9 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'getPoolInfo',
    args: [9],
    chainId: CHAIN_ID,
  })

  // Pool 10 (SUI)
  const { data: staked10 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'balanceOf',
    args: [10, acct],
    chainId: CHAIN_ID,
    query: { enabled: !!account },
  })
  const { data: earned10 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'earned',
    args: [10, acct],
    chainId: CHAIN_ID,
    query: { enabled: !!account },
  })
  const { data: totalStaked10 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'totalStaked',
    args: [10],
    chainId: CHAIN_ID,
  })
  const { data: poolInfo10 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'getPoolInfo',
    args: [10],
    chainId: CHAIN_ID,
  })

  // 获取所有池的 rewardsDuration
  const { data: pool0Details } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'pools',
    args: [0],
    chainId: CHAIN_ID,
  })
  const { data: pool1Details } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'pools',
    args: [1],
    chainId: CHAIN_ID,
  })
  const { data: pool2Details } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'pools',
    args: [2],
    chainId: CHAIN_ID,
  })
  const { data: pool3Details } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'pools',
    args: [3],
    chainId: CHAIN_ID,
  })
  const { data: pool4Details } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'pools',
    args: [4],
    chainId: CHAIN_ID,
  })
  const { data: pool5Details } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'pools',
    args: [5],
    chainId: CHAIN_ID,
  })
  const { data: pool6Details } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'pools',
    args: [6],
    chainId: CHAIN_ID,
  })
  const { data: pool7Details } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'pools',
    args: [7],
    chainId: CHAIN_ID,
  })
  const { data: pool8Details } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'pools',
    args: [8],
    chainId: CHAIN_ID,
  })
  const { data: pool9Details } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'pools',
    args: [9],
    chainId: CHAIN_ID,
  })
  const { data: pool10Details } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'pools',
    args: [10],
    chainId: CHAIN_ID,
  })

  const pools = useMemo(() => {
    // 将数据组织成数组
    const poolDataQueries = [
      { staked: staked0, earned: earned0, totalStaked: totalStaked0, poolInfo: poolInfo0, poolDetails: pool0Details },
      { staked: staked1, earned: earned1, totalStaked: totalStaked1, poolInfo: poolInfo1, poolDetails: pool1Details },
      { staked: staked2, earned: earned2, totalStaked: totalStaked2, poolInfo: poolInfo2, poolDetails: pool2Details },
      { staked: staked3, earned: earned3, totalStaked: totalStaked3, poolInfo: poolInfo3, poolDetails: pool3Details },
      { staked: staked4, earned: earned4, totalStaked: totalStaked4, poolInfo: poolInfo4, poolDetails: pool4Details },
      { staked: staked5, earned: earned5, totalStaked: totalStaked5, poolInfo: poolInfo5, poolDetails: pool5Details },
      { staked: staked6, earned: earned6, totalStaked: totalStaked6, poolInfo: poolInfo6, poolDetails: pool6Details },
      { staked: staked7, earned: earned7, totalStaked: totalStaked7, poolInfo: poolInfo7, poolDetails: pool7Details },
      { staked: staked8, earned: earned8, totalStaked: totalStaked8, poolInfo: poolInfo8, poolDetails: pool8Details },
      { staked: staked9, earned: earned9, totalStaked: totalStaked9, poolInfo: poolInfo9, poolDetails: pool9Details },
      { staked: staked10, earned: earned10, totalStaked: totalStaked10, poolInfo: poolInfo10, poolDetails: pool10Details },
    ]

    const stakingLogoURI = '/images/custom-tokens/nbc.png'

    const result = POOL_CONFIGS.map((config, index) => {
      const { staked, earned, totalStaked, poolInfo, poolDetails } = poolDataQueries[index]
      
      // 从 poolDetails 中提取 rewardsDuration
      // pools 函数返回: [rewardToken, totalStaked, rewardRate, periodFinish, rewardsDuration, lastUpdateTime, rewardPerTokenStored, active]
      const rewardsDuration = poolDetails && Array.isArray(poolDetails) && poolDetails.length >= 5
        ? (typeof poolDetails[4] === 'bigint' ? poolDetails[4] : BigInt(poolDetails[4]?.toString() || '0'))
        : undefined

      const stakingToken = new ERC20Token(
        CHAIN_ID,
        '0x0000000000000000000000000000000000000000' as `0x${string}`, // 原生 NBC
        18,
        'NBC',
        'NBC',
      )
      ;(stakingToken as Token & { logoURI?: string }).logoURI = stakingLogoURI

      const earningToken = new ERC20Token(
        CHAIN_ID,
        config.rewardTokenAddress,
        config.rewardTokenDecimals,
        config.rewardTokenSymbol,
        config.rewardTokenName,
      )
      ;(earningToken as Token & { logoURI?: string }).logoURI = config.rewardTokenLogoURI

      // 计算 APR（使用兑换比例进行精确计算）
      let apr = 0
      // 优先使用 poolInfo 中的 totalStakedAmount，如果没有则使用 totalStaked 查询结果
      const totalStakedValue =
        Array.isArray(poolInfo) && poolInfo.length >= 2 && poolInfo[1]
          ? poolInfo[1] // poolInfo[1] 是 totalStakedAmount
          : totalStaked

      // 将 totalStakedValue 转换为 BigInt，以便在条件块外使用
      const totalStakedBigInt = totalStakedValue
        ? typeof totalStakedValue === 'bigint'
          ? totalStakedValue
          : BigInt(totalStakedValue?.toString() || '0')
        : 0n

      if (poolInfo && Array.isArray(poolInfo) && poolInfo.length >= 3) {
        // poolInfo 返回 [rewardToken, totalStakedAmount, rewardRate, periodFinish, active]
        const rewardRate = poolInfo[2] // rewardRate 是第三个元素（可能是 BigInt）
        const rewardRateBigInt = typeof rewardRate === 'bigint' ? rewardRate : BigInt(rewardRate?.toString() || '0')

        if (rewardRateBigInt > 0n && totalStakedBigInt > 0n) {
          // 使用实时价格计算兑换比例
          const tokenPrice = tokenPrices?.[config.rewardTokenSymbol]

          // 调试日志（仅在开发环境）
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.log(`[${config.rewardTokenSymbol}] Price check:`, {
              nbcPrice,
              tokenPrice,
              hasNbcPrice: !!nbcPrice && nbcPrice > 0,
              hasTokenPrice: !!tokenPrice && tokenPrice > 0,
              rewardRate: rewardRateBigInt.toString(),
              totalStaked: totalStakedBigInt.toString(),
            })
          }

          if (nbcPrice && nbcPrice > 0 && tokenPrice && tokenPrice > 0) {
            // 计算实时兑换比例：1 奖励代币 = (tokenPrice / nbcPrice) NBC
            const conversionRate = tokenPrice / nbcPrice

            if (conversionRate > 0) {
              apr = calculateAPRFromRewardRate(
                rewardRateBigInt,
                totalStakedBigInt,
                conversionRate,
                config.rewardTokenDecimals,
                rewardsDuration,
              )

              // 调试日志
              if (process.env.NODE_ENV === 'development') {
                // eslint-disable-next-line no-console
                console.log(`[${config.rewardTokenSymbol}] APR calculated:`, {
                  apr,
                  conversionRate,
                  rewardRate: rewardRateBigInt.toString(),
                  totalStaked: totalStakedBigInt.toString(),
                })
              }
            } else {
              apr = 0
            }
          } else if (config.rewardTokenSymbol === 'NBC') {
            // 如果价格未加载，使用简化计算（仅适用于 NBC 奖励池）
            const annualReward = Number(rewardRateBigInt) * 365 * 24 * 60 * 60
            const totalStakedNum = Number(totalStakedBigInt)
            apr = (annualReward / totalStakedNum) * 100
          } else {
            // 价格未加载时，记录警告
            if (process.env.NODE_ENV === 'development') {
              // eslint-disable-next-line no-console
              console.warn(`[${config.rewardTokenSymbol}] Price not loaded yet, APR set to 0`, {
                nbcPrice,
                tokenPrice,
              })
            }
            apr = 0
          }
        } else {
          apr = 0
        }
      }

      // 显示实际 APR（不设上限）
      // 在 DeFi 中，APR 超过 100% 是常见现象，特别是在新项目启动期或低流动性池中
      // 高 APR 通常伴随高风险，用户需要自行评估
      const totalStakedNBCNum = Number(totalStakedBigInt) / 1e18

      // 开发环境日志：记录 APR 和质押量信息，帮助调试
      if (process.env.NODE_ENV === 'development' && apr > 0) {
        // eslint-disable-next-line no-console
        console.log(`[${config.rewardTokenSymbol}] APR 信息:`, {
          实际APR: `${apr.toFixed(2)}%`,
          实际质押量: `${totalStakedNBCNum.toFixed(2)} NBC`,
          说明: apr > 1000 
            ? 'APR 较高，可能因为质押量较小或处于项目启动期。高 APR 通常伴随高风险，请谨慎评估。'
            : 'APR 在正常范围内',
        })
      }

      // 判断池是否已结束
      // poolInfo 返回 [rewardToken, totalStakedAmount, rewardRate, periodFinish, active]
      // 池结束的条件：active === false 或者 periodFinish 已过期
      let isPoolFinished = false
      let endTimestamp = 0
      if (Array.isArray(poolInfo) && poolInfo.length >= 5) {
        const periodFinish = poolInfo[3] // periodFinish 是第四个元素（索引3）
        const active = poolInfo[4] // active 是第五个元素（索引4）
        const currentTime = currentChainTimestamp ?? Math.floor(Date.now() / 1000) // 当前时间戳（秒）

        // 处理 BigInt 类型
        const periodFinishNum = typeof periodFinish === 'bigint' ? Number(periodFinish) : Number(periodFinish)

        // 设置 endTimestamp
        endTimestamp = periodFinishNum

        // 如果池被禁用（active === false），直接标记为已完成
        if (active === false) {
          isPoolFinished = true
        } else if (periodFinishNum > 0 && periodFinishNum <= currentTime) {
          // 奖励期已结束
          isPoolFinished = true
        } else {
          // 池还在运行中
          isPoolFinished = false
        }
      }

      // 使用 poolInfo 中的 totalStakedAmount 或 totalStaked 查询结果
      const finalTotalStaked =
        Array.isArray(poolInfo) && poolInfo.length >= 2 && poolInfo[1]
          ? typeof poolInfo[1] === 'bigint'
            ? poolInfo[1]
            : BigInt(poolInfo[1]?.toString() || '0')
          : totalStaked

      const pool: Pool.DeserializedPool<Token> = {
        sousId: config.sousId,
        stakingToken,
        earningToken,
        contractAddress: STAKING_CONTRACT_ADDRESS,
        poolCategory: 'BINANCE' as any, // 原生代币池
        tokenPerBlock: Array.isArray(poolInfo) && poolInfo[2] ? poolInfo[2].toString() : '0',
        isFinished: isPoolFinished,
        totalStaked: finalTotalStaked ? new BigNumber(finalTotalStaked.toString()) : new BigNumber(0),
        stakingLimit: undefined,
        startTimestamp: 0, // 池开始时间戳（0 表示已开始）
        endTimestamp: endTimestamp > 0 ? endTimestamp : undefined, // 奖励期结束时间戳
        apr,
        stakingTokenPrice: nbcPrice ?? 1, // NBC 实时价格
        earningTokenPrice: tokenPrices?.[config.rewardTokenSymbol] ?? 1, // 奖励代币实时价格
        userData: account
          ? {
              allowance: new BigNumber(0), // 原生代币不需要 allowance
              stakingTokenBalance: nativeBalance?.value
                ? new BigNumber(nativeBalance.value.toString())
                : new BigNumber(0),
              stakedBalance: staked ? new BigNumber(staked.toString()) : new BigNumber(0),
              pendingReward: earned ? new BigNumber(earned.toString()) : new BigNumber(0),
            }
          : undefined,
      }

      return pool
    })

    return result.filter((pool) => pool.sousId !== 0)
  }, [
    account,
    nativeBalance,
    staked0,
    earned0,
    totalStaked0,
    poolInfo0,
    staked1,
    earned1,
    totalStaked1,
    poolInfo1,
    staked2,
    earned2,
    totalStaked2,
    poolInfo2,
    staked3,
    earned3,
    totalStaked3,
    poolInfo3,
    staked4,
    earned4,
    totalStaked4,
    poolInfo4,
    staked5,
    earned5,
    totalStaked5,
    poolInfo5,
    staked6,
    earned6,
    totalStaked6,
    poolInfo6,
    staked7,
    earned7,
    totalStaked7,
    poolInfo7,
    staked8,
    earned8,
    totalStaked8,
    poolInfo8,
    staked9,
    earned9,
    totalStaked9,
    poolInfo9,
    staked10,
    earned10,
    totalStaked10,
    poolInfo10,
    currentChainTimestamp,
    nbcPrice,
    tokenPrices,
  ])

  return {
    pools,
    userDataLoaded: !!account,
  }
}
