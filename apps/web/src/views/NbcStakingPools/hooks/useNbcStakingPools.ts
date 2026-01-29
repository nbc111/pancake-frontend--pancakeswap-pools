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

  const pools = useMemo(() => {
    // 将数据组织成数组（只有 3 个池：BTC, ETH, USDT）
    const poolDataQueries = [
      { staked: staked0, earned: earned0, totalStaked: totalStaked0, poolInfo: poolInfo0, poolDetails: pool0Details },
      { staked: staked1, earned: earned1, totalStaked: totalStaked1, poolInfo: poolInfo1, poolDetails: pool1Details },
      { staked: staked2, earned: earned2, totalStaked: totalStaked2, poolInfo: poolInfo2, poolDetails: pool2Details },
    ]

    const stakingLogoURI = '/images/custom-tokens/nbc.png'

    const result = POOL_CONFIGS.map((config, index) => {
      const { staked, earned, totalStaked, poolInfo, poolDetails } = poolDataQueries[index]
      
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
    staked0, earned0, totalStaked0, poolInfo0, pool0Details,
    staked1, earned1, totalStaked1, poolInfo1, pool1Details,
    staked2, earned2, totalStaked2, poolInfo2, pool2Details,
    currentChainTimestamp,
  ])

  return {
    pools,
    userDataLoaded: !!account,
  }
}
