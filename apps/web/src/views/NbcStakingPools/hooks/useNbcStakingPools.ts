import { useMemo } from 'react'
import { useAccount, useReadContract, useBalance } from 'wagmi'
import { Pool } from '@pancakeswap/widgets-internal'
import { Token, ERC20Token } from '@pancakeswap/sdk'
import BigNumber from 'bignumber.js'
import STAKING_ABI from 'abis/nbcMultiRewardStaking.json'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'

const STAKING_CONTRACT_ADDRESS = '0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789' as `0x${string}`
const CHAIN_ID = 1281

type PoolConfig = {
  sousId: number
  rewardTokenAddress: `0x${string}`
  rewardTokenSymbol: string
  rewardTokenName: string
  rewardTokenDecimals: number
  rewardTokenLogoURI: string
}

const POOL_CONFIGS: PoolConfig[] = [
  {
    sousId: 0,
    rewardTokenAddress: '0xfE473265296e058fd1999cFf7E4536F51f5a1Fe6' as `0x${string}`,
    rewardTokenSymbol: 'NBC',
    rewardTokenName: 'NBC Token',
    rewardTokenDecimals: 18,
    rewardTokenLogoURI: '/images/custom-tokens/nbc.png',
  },
  {
    sousId: 1,
    rewardTokenAddress: '0x5EaA2c6ae3bFf47D2188B64F743Ec777733a80ac' as `0x${string}`,
    rewardTokenSymbol: 'BTC',
    rewardTokenName: 'Bitcoin',
    rewardTokenDecimals: 8,
    rewardTokenLogoURI: '/images/custom-tokens/btc.png',
  },
  {
    sousId: 2,
    rewardTokenAddress: '0x934EbeB6D7D3821B604A5D10F80619d5bcBe49C3' as `0x${string}`,
    rewardTokenSymbol: 'ETH',
    rewardTokenName: 'Ether',
    rewardTokenDecimals: 18,
    rewardTokenLogoURI: '/images/custom-tokens/eth.png',
  },
  {
    sousId: 3,
    rewardTokenAddress: '0xd5eECCC885Ef850d90AE40E716c3dFCe5C3D4c81' as `0x${string}`,
    rewardTokenSymbol: 'SOL',
    rewardTokenName: 'Solana',
    rewardTokenDecimals: 18,
    rewardTokenLogoURI: '/images/custom-tokens/sol.png',
  },
  {
    sousId: 4,
    rewardTokenAddress: '0x9C43237490272BfdD2F1d1ca0B34f20b1A3C9f5c' as `0x${string}`,
    rewardTokenSymbol: 'BNB',
    rewardTokenName: 'Binance Coin',
    rewardTokenDecimals: 18,
    rewardTokenLogoURI: '/images/custom-tokens/bnb.png',
  },
  {
    sousId: 5,
    rewardTokenAddress: '0x48e1772534fabBdcaDe9ca4005E5Ee8BF4190093' as `0x${string}`,
    rewardTokenSymbol: 'XRP',
    rewardTokenName: 'Ripple',
    rewardTokenDecimals: 18,
    rewardTokenLogoURI: '/images/custom-tokens/xrp.png',
  },
  {
    sousId: 6,
    rewardTokenAddress: '0x8d22041C22d696fdfF0703852a706a40Ff65a7de' as `0x${string}`,
    rewardTokenSymbol: 'LTC',
    rewardTokenName: 'Litecoin',
    rewardTokenDecimals: 18,
    rewardTokenLogoURI: '/images/custom-tokens/ltc.png',
  },
  {
    sousId: 7,
    rewardTokenAddress: '0x8cEb9a93405CDdf3D76f72327F868Bd3E8755D89' as `0x${string}`,
    rewardTokenSymbol: 'DOGE',
    rewardTokenName: 'Dogecoin',
    rewardTokenDecimals: 18,
    rewardTokenLogoURI: '/images/custom-tokens/doge.png',
  },
  {
    sousId: 8,
    rewardTokenAddress: '0xd365877026A43107Efd9825bc3ABFe1d7A450F82' as `0x${string}`,
    rewardTokenSymbol: 'PEPE',
    rewardTokenName: 'Pepe',
    rewardTokenDecimals: 18,
    rewardTokenLogoURI: '/images/custom-tokens/pepe.png',
  },
  {
    sousId: 9,
    rewardTokenAddress: '0xfd1508502696d0E1910eD850c6236d965cc4db11' as `0x${string}`,
    rewardTokenSymbol: 'USDT',
    rewardTokenName: 'Tether USD',
    rewardTokenDecimals: 6,
    rewardTokenLogoURI: '/images/custom-tokens/usdt.png',
  },
  {
    sousId: 10,
    rewardTokenAddress: '0x9011191E84Ad832100Ddc891E360f8402457F55E' as `0x${string}`,
    rewardTokenSymbol: 'SUI',
    rewardTokenName: 'Sui',
    rewardTokenDecimals: 18,
    rewardTokenLogoURI: '/images/custom-tokens/sui.png',
  },
]

export const useNbcStakingPools = () => {
  const { address: account } = useAccount()
  const zero = '0x0000000000000000000000000000000000000000' as `0x${string}`
  const acct = account ?? zero

  const chainTimestamp = useCurrentBlockTimestamp()
  const currentChainTimestamp = chainTimestamp !== undefined ? Number(chainTimestamp) : undefined

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

  const pools = useMemo(() => {
    // 将数据组织成数组
    const poolDataQueries = [
      { staked: staked0, earned: earned0, totalStaked: totalStaked0, poolInfo: poolInfo0 },
      { staked: staked1, earned: earned1, totalStaked: totalStaked1, poolInfo: poolInfo1 },
      { staked: staked2, earned: earned2, totalStaked: totalStaked2, poolInfo: poolInfo2 },
      { staked: staked3, earned: earned3, totalStaked: totalStaked3, poolInfo: poolInfo3 },
      { staked: staked4, earned: earned4, totalStaked: totalStaked4, poolInfo: poolInfo4 },
      { staked: staked5, earned: earned5, totalStaked: totalStaked5, poolInfo: poolInfo5 },
      { staked: staked6, earned: earned6, totalStaked: totalStaked6, poolInfo: poolInfo6 },
      { staked: staked7, earned: earned7, totalStaked: totalStaked7, poolInfo: poolInfo7 },
      { staked: staked8, earned: earned8, totalStaked: totalStaked8, poolInfo: poolInfo8 },
      { staked: staked9, earned: earned9, totalStaked: totalStaked9, poolInfo: poolInfo9 },
      { staked: staked10, earned: earned10, totalStaked: totalStaked10, poolInfo: poolInfo10 },
    ]

    const stakingLogoURI = '/images/custom-tokens/nbc.png'

    const result = POOL_CONFIGS.map((config, index) => {
      const { staked, earned, totalStaked, poolInfo } = poolDataQueries[index]

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

      // 计算 APR（简化计算，实际需要根据奖励速率和总质押量计算）
      let apr = 0
      // 优先使用 poolInfo 中的 totalStakedAmount，如果没有则使用 totalStaked 查询结果
      const totalStakedValue =
        Array.isArray(poolInfo) && poolInfo.length >= 2 && poolInfo[1]
          ? poolInfo[1] // poolInfo[1] 是 totalStakedAmount
          : totalStaked

      if (poolInfo && Array.isArray(poolInfo) && poolInfo.length >= 3) {
        // poolInfo 返回 [rewardToken, totalStakedAmount, rewardRate, periodFinish, active]
        const rewardRate = Number(poolInfo[2]) // rewardRate 是第三个元素
        const totalStakedNum = totalStakedValue
          ? typeof totalStakedValue === 'bigint'
            ? Number(totalStakedValue)
            : Number(totalStakedValue)
          : 0

        if (rewardRate > 0 && totalStakedNum > 0) {
          // 有质押时，基于实际总质押量计算 APR
          // 年化收益率 = (每秒奖励 * 365 * 24 * 60 * 60) / 总质押量 * 100
          const annualReward = rewardRate * 365 * 24 * 60 * 60
          apr = (annualReward / totalStakedNum) * 100
        } else {
          apr = 0
        }
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
        stakingTokenPrice: 1, // 暂时设置为 1，后续可以添加价格获取逻辑（从价格 API 获取 NBC 价格）
        earningTokenPrice: 1, // 暂时设置为 1，后续可以添加价格获取逻辑（从价格 API 获取奖励代币价格）
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
  ])

  return {
    pools,
    userDataLoaded: !!account,
  }
}
