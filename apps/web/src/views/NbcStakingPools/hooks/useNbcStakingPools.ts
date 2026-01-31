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

const STAKING_CONTRACT_ADDRESS = '0x107B4E8F1b849b69033FbF4AAcb10B72d29A16E1' as `0x${string}`
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
  const nbcPrice = nbcPriceBN && !nbcPriceBN.isZero() ? Number(nbcPriceBN.toString()) : null

  // 获取所有代币的实时价格
  const tokenSymbols = useMemo(() => POOL_CONFIGS.map((config) => config.rewardTokenSymbol), [])

  const {
    data: tokenPrices,
  } = useQuery<Record<string, number | null>>({
    queryKey: ['nbcStakingTokenPrices', tokenSymbols],
    queryFn: () => getTokenPricesFromNbcApi(tokenSymbols),
    staleTime: FAST_INTERVAL * 12,
    refetchInterval: FAST_INTERVAL * 12,
    enabled: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // 获取原生 NBC 余额
  const { data: nativeBalance } = useBalance({
    address: account,
    chainId: CHAIN_ID,
  })

  // Pool 0 (BTC)
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
  const { data: pool0Details } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'pools',
    args: [0],
    chainId: CHAIN_ID,
  })
  const { data: userStake0 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'userStakes',
    args: [0, acct],
    chainId: CHAIN_ID,
    query: { enabled: !!account },
  })

  // Pool 1 (ETH)
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
  const { data: pool1Details } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'pools',
    args: [1],
    chainId: CHAIN_ID,
  })
  const { data: userStake1 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'userStakes',
    args: [1, acct],
    chainId: CHAIN_ID,
    query: { enabled: !!account },
  })

  // Pool 2 (USDT)
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
  const { data: pool2Details } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'pools',
    args: [2],
    chainId: CHAIN_ID,
  })
  const { data: userStake2 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'userStakes',
    args: [2, acct],
    chainId: CHAIN_ID,
    query: { enabled: !!account },
  })

  // Pool 3 (BNB)
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
  const { data: pool3Details } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'pools',
    args: [3],
    chainId: CHAIN_ID,
  })
  const { data: userStake3 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'userStakes',
    args: [3, acct],
    chainId: CHAIN_ID,
    query: { enabled: !!account },
  })

  // Pool 4 (LTC)
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
  const { data: pool4Details } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'pools',
    args: [4],
    chainId: CHAIN_ID,
  })
  const { data: userStake4 } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'userStakes',
    args: [4, acct],
    chainId: CHAIN_ID,
    query: { enabled: !!account },
  })

  const pools = useMemo(() => {
    // 将数据组织成数组（BTC, ETH, USDT, BNB, LTC）
    const poolDataQueries = [
      {
        staked: staked0,
        earned: earned0,
        totalStaked: totalStaked0,
        poolInfo: poolInfo0,
        poolDetails: pool0Details,
        userStake: userStake0,
      },
      {
        staked: staked1,
        earned: earned1,
        totalStaked: totalStaked1,
        poolInfo: poolInfo1,
        poolDetails: pool1Details,
        userStake: userStake1,
      },
      {
        staked: staked2,
        earned: earned2,
        totalStaked: totalStaked2,
        poolInfo: poolInfo2,
        poolDetails: pool2Details,
        userStake: userStake2,
      },
      {
        staked: staked3,
        earned: earned3,
        totalStaked: totalStaked3,
        poolInfo: poolInfo3,
        poolDetails: pool3Details,
        userStake: userStake3,
      },
      {
        staked: staked4,
        earned: earned4,
        totalStaked: totalStaked4,
        poolInfo: poolInfo4,
        poolDetails: pool4Details,
        userStake: userStake4,
      },
    ]

    const stakingLogoURI = '/images/custom-tokens/nbc.png'

    const result = POOL_CONFIGS.map((config, index) => {
      const { staked, earned, totalStaked, poolInfo, poolDetails, userStake } = poolDataQueries[index]
      // userStakes 合约返回 (amount, rewardPerTokenPaid, rewards, stakedAt)，取 stakedAt 用于已质押时长
      const stakedAtRaw =
        userStake != null
          ? Array.isArray(userStake)
            ? (userStake as [bigint, bigint, bigint, bigint])[3]
            : (userStake as { stakedAt?: bigint })?.stakedAt
          : undefined
      const stakedAtSeconds = stakedAtRaw != null && stakedAtRaw !== 0n ? Number(stakedAtRaw) : undefined
      
      // 从 poolDetails 中提取 rewardsDuration
      let rewardsDuration: bigint | undefined = undefined
      
      if (poolDetails !== undefined && poolDetails !== null && Array.isArray(poolDetails) && poolDetails.length >= 5) {
        const durationValue = poolDetails[4]
        if (durationValue !== undefined && durationValue !== null) {
          try {
            const durationBigInt = typeof durationValue === 'bigint' 
              ? durationValue 
              : BigInt(String(durationValue))
            if (durationBigInt > 0n) {
              rewardsDuration = durationBigInt
            }
          } catch {
            // 忽略解析错误
          }
        }
      }

      const stakingToken = new ERC20Token(
        CHAIN_ID,
        '0x0000000000000000000000000000000000000000' as `0x${string}`,
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

      // 计算 APR
      let apr = 0
      const totalStakedValue =
        Array.isArray(poolInfo) && poolInfo.length >= 2 && poolInfo[1]
          ? poolInfo[1]
          : totalStaked

      const totalStakedBigInt = totalStakedValue
        ? typeof totalStakedValue === 'bigint'
          ? totalStakedValue
          : BigInt(totalStakedValue?.toString() || '0')
        : 0n

      if (poolInfo && Array.isArray(poolInfo) && poolInfo.length >= 3) {
        const rewardRate = poolInfo[2]
        const rewardRateBigInt = typeof rewardRate === 'bigint' ? rewardRate : BigInt(rewardRate?.toString() || '0')

        if (rewardRateBigInt > 0n && totalStakedBigInt > 0n) {
          const tokenPrice = tokenPrices?.[config.rewardTokenSymbol]

          if (nbcPrice && nbcPrice > 0 && tokenPrice && tokenPrice > 0) {
            const conversionRate = tokenPrice / nbcPrice

            if (conversionRate > 0 && Number.isFinite(conversionRate)) {
              apr = calculateAPRFromRewardRate(
                rewardRateBigInt,
                totalStakedBigInt,
                conversionRate,
                config.rewardTokenDecimals,
                rewardsDuration,
              )
            }
          }
        }
      }

      // 判断池是否已结束
      let isPoolFinished = false
      let endTimestamp = 0
      if (Array.isArray(poolInfo) && poolInfo.length >= 5) {
        const periodFinish = poolInfo[3]
        const active = poolInfo[4]
        const currentTime = currentChainTimestamp ?? Math.floor(Date.now() / 1000)
        const periodFinishNum = typeof periodFinish === 'bigint' ? Number(periodFinish) : Number(periodFinish)
        endTimestamp = periodFinishNum

        if (active === false) {
          isPoolFinished = true
        } else if (periodFinishNum > 0 && periodFinishNum <= currentTime) {
          isPoolFinished = true
        }
      }

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
        poolCategory: 'BINANCE' as any,
        tokenPerBlock: Array.isArray(poolInfo) && poolInfo[2] ? poolInfo[2].toString() : '0',
        isFinished: isPoolFinished,
        totalStaked: finalTotalStaked ? new BigNumber(finalTotalStaked.toString()) : new BigNumber(0),
        stakingLimit: undefined,
        startTimestamp: 0,
        endTimestamp: endTimestamp > 0 ? endTimestamp : undefined,
        apr,
        stakingTokenPrice: typeof nbcPrice === 'number' && Number.isFinite(nbcPrice) && nbcPrice > 0 ? nbcPrice : 1,
        earningTokenPrice: (() => {
          const price = tokenPrices?.[config.rewardTokenSymbol]
          return typeof price === 'number' && Number.isFinite(price) && price > 0 ? price : 1
        })(),
        userData: account
          ? {
              allowance: new BigNumber(0),
              stakingTokenBalance: nativeBalance?.value
                ? new BigNumber(nativeBalance.value.toString())
                : new BigNumber(0),
              stakedBalance: staked ? new BigNumber(staked.toString()) : new BigNumber(0),
              pendingReward: earned ? new BigNumber(earned.toString()) : new BigNumber(0),
              stakedAt: stakedAtSeconds,
            }
          : undefined,
      }

      return pool
    })

    return result
  }, [
    account,
    nativeBalance,
    tokenPrices,
    nbcPrice,
    staked0, earned0, totalStaked0, poolInfo0, pool0Details, userStake0,
    staked1, earned1, totalStaked1, poolInfo1, pool1Details, userStake1,
    staked2, earned2, totalStaked2, poolInfo2, pool2Details, userStake2,
    staked3, earned3, totalStaked3, poolInfo3, pool3Details, userStake3,
    staked4, earned4, totalStaked4, poolInfo4, pool4Details, userStake4,
    currentChainTimestamp,
  ])

  return {
    pools,
    userDataLoaded: !!account,
  }
}
