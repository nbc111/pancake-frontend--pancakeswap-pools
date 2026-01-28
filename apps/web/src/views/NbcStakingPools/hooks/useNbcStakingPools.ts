import { useMemo, useEffect } from 'react'
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
  // 只有当价格大于 0 时才使用，避免使用 BIG_ZERO（0）
  const nbcPrice = nbcPriceBN && !nbcPriceBN.isZero() ? Number(nbcPriceBN.toString()) : null

  // 获取所有代币的实时价格
  const tokenSymbols = useMemo(() => POOL_CONFIGS.map((config) => config.rewardTokenSymbol), [])

  const {
    data: tokenPrices,
    isLoading: tokenPricesLoading,
    isError: tokenPricesIsError,
    error: tokenPricesError,
    status: tokenPricesStatus,
  } = useQuery<Record<string, number | null>>({
    queryKey: ['nbcStakingTokenPrices', tokenSymbols],
    queryFn: () => getTokenPricesFromNbcApi(tokenSymbols),
    staleTime: FAST_INTERVAL * 12, // 增加到 2 分钟，减少 API 调用
    refetchInterval: FAST_INTERVAL * 12, // 2 分钟刷新一次（配合缓存使用）
    enabled: true,
    retry: 2, // 失败时重试 2 次
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // 指数退避
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
  const {
    data: pool0Details,
    error: pool0DetailsError,
    isLoading: pool0DetailsLoading,
    isError: pool0DetailsIsError,
    status: pool0DetailsStatus,
  } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'pools',
    args: [0],
    chainId: CHAIN_ID,
    query: {
      enabled: true,
      retry: 3,
    },
  })
  const { data: pool1Details, error: pool1DetailsError, isLoading: pool1DetailsLoading } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'pools',
    args: [1],
    chainId: CHAIN_ID,
    query: {
      enabled: true,
      retry: 3,
    },
  })
  const { data: pool2Details, error: pool2DetailsError, isLoading: pool2DetailsLoading } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'pools',
    args: [2],
    chainId: CHAIN_ID,
    query: {
      enabled: true,
      retry: 3,
    },
  })
  const { data: pool3Details, error: pool3DetailsError, isLoading: pool3DetailsLoading } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'pools',
    args: [3],
    chainId: CHAIN_ID,
    query: {
      enabled: true,
      retry: 3,
    },
  })
  const { data: pool4Details, error: pool4DetailsError, isLoading: pool4DetailsLoading } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'pools',
    args: [4],
    chainId: CHAIN_ID,
    query: {
      enabled: true,
      retry: 3,
    },
  })
  const { data: pool5Details, error: pool5DetailsError, isLoading: pool5DetailsLoading } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'pools',
    args: [5],
    chainId: CHAIN_ID,
    query: {
      enabled: true,
      retry: 3,
    },
  })
  const { data: pool6Details, error: pool6DetailsError, isLoading: pool6DetailsLoading } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'pools',
    args: [6],
    chainId: CHAIN_ID,
    query: {
      enabled: true,
      retry: 3,
    },
  })
  const { data: pool7Details, error: pool7DetailsError, isLoading: pool7DetailsLoading } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'pools',
    args: [7],
    chainId: CHAIN_ID,
    query: {
      enabled: true,
      retry: 3,
    },
  })
  const { data: pool8Details, error: pool8DetailsError, isLoading: pool8DetailsLoading } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'pools',
    args: [8],
    chainId: CHAIN_ID,
    query: {
      enabled: true,
      retry: 3,
    },
  })
  const { data: pool9Details, error: pool9DetailsError, isLoading: pool9DetailsLoading } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'pools',
    args: [9],
    chainId: CHAIN_ID,
    query: {
      enabled: true,
      retry: 3,
    },
  })
  const { data: pool10Details, error: pool10DetailsError, isLoading: pool10DetailsLoading } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI as any,
    functionName: 'pools',
    args: [10],
    chainId: CHAIN_ID,
    query: {
      enabled: true,
      retry: 3,
    },
  })

  // 开发环境：立即诊断（组件挂载时立即运行，无依赖）
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.group('🔍 [NBC_STAKING_DIAG] [诊断] 组件挂载 - 立即诊断')
      // eslint-disable-next-line no-console
      console.log('📋 [NBC_STAKING_DIAG] 配置信息:', {
        合约地址: STAKING_CONTRACT_ADDRESS,
        链ID: CHAIN_ID,
        RPC端点: 'https://rpc.nbcex.com',
        ABI存在: !!STAKING_ABI,
        ABI类型: typeof STAKING_ABI,
        ABI是否为数组: Array.isArray(STAKING_ABI),
        pools函数存在: STAKING_ABI && Array.isArray(STAKING_ABI)
          ? STAKING_ABI.some((item: any) => item.name === 'pools' && item.type === 'function')
          : false,
      })
      // eslint-disable-next-line no-console
      console.log('💰 [NBC_STAKING_PRICES] tokenPrices 初始状态:', {
        tokenPrices存在: !!tokenPrices,
        tokenPrices类型: typeof tokenPrices,
        tokenPricesLoading,
        tokenPricesIsError,
        tokenPricesStatus,
        tokenPricesError: tokenPricesError ? tokenPricesError.message : null,
        tokenSymbols数量: tokenSymbols.length,
        tokenSymbols列表: tokenSymbols,
      })
      // eslint-disable-next-line no-console
      console.log('📊 [NBC_STAKING_POOLS] poolDetails 初始状态 (Pool 0):', {
        pool0Details存在: pool0Details !== undefined,
        pool0Details类型: typeof pool0Details,
        pool0Details是否为数组: Array.isArray(pool0Details),
        pool0Details长度: Array.isArray(pool0Details) ? pool0Details.length : 'N/A',
        pool0DetailsLoading,
        pool0DetailsError: pool0DetailsError ? pool0DetailsError.message : null,
        pool0DetailsIsError,
        pool0DetailsStatus,
      })
      // eslint-disable-next-line no-console
      console.log('🔗 [NBC_STAKING_DIAG] 其他合约调用状态:', {
        totalStaked0存在: totalStaked0 !== undefined,
        poolInfo0存在: poolInfo0 !== undefined,
      })
      // eslint-disable-next-line no-console
      console.groupEnd()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 空依赖数组，仅在挂载时运行一次

  // 开发环境：动态诊断（数据变化时更新）
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.group('🔄 [NBC_STAKING_DIAG] [诊断] 数据更新 - 动态诊断')
      // eslint-disable-next-line no-console
      console.log('💰 [NBC_STAKING_PRICES] tokenPrices 查询状态:', {
        tokenPrices存在: !!tokenPrices,
        tokenPrices类型: typeof tokenPrices,
        tokenPrices键: tokenPrices ? Object.keys(tokenPrices) : [],
        tokenPrices值: tokenPrices ? Object.entries(tokenPrices).map(([k, v]) => `${k}: ${v ? v.toFixed(4) : 'null'}`).join(', ') : 'null',
        tokenPricesLoading,
        tokenPricesIsError,
        tokenPricesStatus,
        tokenPricesError: tokenPricesError ? tokenPricesError.message : null,
        tokenSymbols数量: tokenSymbols.length,
        tokenSymbols列表: tokenSymbols,
      })
      // eslint-disable-next-line no-console
      console.groupEnd()
    }
  }, [tokenPrices, tokenPricesLoading, tokenPricesIsError, tokenPricesStatus, tokenPricesError, tokenSymbols])

  // 开发环境：记录其他合约调用状态（用于对比诊断）
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // 检查其他合约调用是否成功（用于对比诊断）
      const otherCallsStatus = {
        totalStaked0: { data: totalStaked0, exists: totalStaked0 !== undefined },
        poolInfo0: { data: poolInfo0, exists: poolInfo0 !== undefined },
      }
      
      const allOtherCallsSuccess = Object.values(otherCallsStatus).every(status => status.exists)
      
      if (!allOtherCallsSuccess) {
        // eslint-disable-next-line no-console
        console.warn('[诊断] 其他合约调用也失败，可能是合约地址或网络问题', {
          其他调用状态: otherCallsStatus,
          合约地址: STAKING_CONTRACT_ADDRESS,
          链ID: CHAIN_ID,
        })
      } else {
        // eslint-disable-next-line no-console
        console.log('[诊断] 其他合约调用成功，说明合约可访问，问题可能特定于 pools 函数', {
          其他调用状态: otherCallsStatus,
        })
      }
    }
  }, [totalStaked0, poolInfo0])

  // 开发环境：记录 poolDetails 查询状态（使用 useEffect 确保在数据变化时记录）
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const poolDetailsStatus = [
        {
          pool: 0,
          data: pool0Details,
          error: pool0DetailsError,
          loading: pool0DetailsLoading,
          isError: pool0DetailsIsError,
          status: pool0DetailsStatus,
        },
        { pool: 1, data: pool1Details, error: pool1DetailsError, loading: pool1DetailsLoading },
        { pool: 2, data: pool2Details, error: pool2DetailsError, loading: pool2DetailsLoading },
        { pool: 3, data: pool3Details, error: pool3DetailsError, loading: pool3DetailsLoading },
        { pool: 4, data: pool4Details, error: pool4DetailsError, loading: pool4DetailsLoading },
        { pool: 5, data: pool5Details, error: pool5DetailsError, loading: pool5DetailsLoading },
        { pool: 6, data: pool6Details, error: pool6DetailsError, loading: pool6DetailsLoading },
        { pool: 7, data: pool7Details, error: pool7DetailsError, loading: pool7DetailsLoading },
        { pool: 8, data: pool8Details, error: pool8DetailsError, loading: pool8DetailsLoading },
        { pool: 9, data: pool9Details, error: pool9DetailsError, loading: pool9DetailsLoading },
        { pool: 10, data: pool10Details, error: pool10DetailsError, loading: pool10DetailsLoading },
      ]
      
      // 先输出汇总信息
      const loadingCount = poolDetailsStatus.filter(p => p.loading).length
      const errorCount = poolDetailsStatus.filter(p => p.error).length
      const successCount = poolDetailsStatus.filter(p => p.data && !p.loading && !p.error).length
      const undefinedCount = poolDetailsStatus.filter(p => !p.data && !p.loading && !p.error).length
      
        if (loadingCount > 0 || errorCount > 0 || undefinedCount > 0 || successCount > 0) {
          // eslint-disable-next-line no-console
          console.group('📊 [NBC_STAKING_POOLS] [诊断] poolDetails 查询状态变化')
          // eslint-disable-next-line no-console
          console.log('[NBC_STAKING_POOLS] 汇总:', {
          总数: poolDetailsStatus.length,
          加载中: loadingCount,
          成功: successCount,
          错误: errorCount,
          未定义: undefinedCount,
        })
      }
      
      poolDetailsStatus.forEach(({ pool, data, error, loading, isError, status }) => {
        // Pool 0 有更详细的状态信息
        const detailedStatus = pool === 0 ? { isError, status } : {}
        
          if (error) {
            // eslint-disable-next-line no-console
            console.error(`[NBC_STAKING_POOLS] [Pool ${pool}] poolDetails 查询错误:`, {
            错误信息: error.message,
            错误名称: error.name,
            错误堆栈: error.stack,
            错误详情: error,
            链ID: CHAIN_ID,
            合约地址: STAKING_CONTRACT_ADDRESS,
            函数名: 'pools',
            参数: [pool],
            ABI存在: !!STAKING_ABI,
            ABI类型: typeof STAKING_ABI,
            ...detailedStatus,
          })
          } else if (loading) {
            // eslint-disable-next-line no-console
            console.log(`[NBC_STAKING_POOLS] [Pool ${pool}] poolDetails 正在加载...`, {
            链ID: CHAIN_ID,
            合约地址: STAKING_CONTRACT_ADDRESS,
            ...detailedStatus,
          })
          } else if (data === undefined && !loading && !error) {
            // eslint-disable-next-line no-console
            console.warn(`[NBC_STAKING_POOLS] [Pool ${pool}] poolDetails 查询返回 undefined (无错误，无加载中)`, {
            链ID: CHAIN_ID,
            合约地址: STAKING_CONTRACT_ADDRESS,
            函数名: 'pools',
            参数: [pool],
            ...detailedStatus,
            可能原因: [
              '1. RPC 节点未响应或超时（静默失败）',
              '2. 合约地址不存在或错误',
              '3. 链 ID 配置错误',
              '4. wagmi publicClient 未正确配置链 1281',
              '5. 网络连接问题',
              '6. RPC 端点返回了空响应',
            ],
            诊断建议: [
              '1. 打开浏览器开发者工具 → Network 标签',
              '2. 筛选 rpc.nbcex.com 请求',
              '3. 查看是否有失败的请求或超时',
              '4. 检查请求的响应内容',
              '5. 验证合约地址是否正确（在区块浏览器查看）',
              '6. 确认链 ID 1281 已正确配置',
              '7. 检查 RPC 端点 https://rpc.nbcex.com 是否可访问',
            ],
          })
        } else if (data && Array.isArray(data)) {
          if (data.length >= 5) {
            const rewardsDuration = data[4]
            if (rewardsDuration !== undefined) {
              // eslint-disable-next-line no-console
              console.log(`[NBC_STAKING_POOLS] [Pool ${pool}] poolDetails 查询成功`, {
                rewardsDuration: rewardsDuration.toString(),
                数据长度: data.length,
                完整数据: data.map((item, idx) => ({
                  索引: idx,
                  值: typeof item === 'bigint' ? item.toString() : item,
                  类型: typeof item,
                })),
              })
            } else {
              // eslint-disable-next-line no-console
              console.warn(`[NBC_STAKING_POOLS] [Pool ${pool}] poolDetails 数据存在但 rewardsDuration (索引4) 为 undefined`, {
                数据长度: data.length,
                数据内容: data,
              })
            }
          } else {
            // eslint-disable-next-line no-console
            console.warn(`[NBC_STAKING_POOLS] [Pool ${pool}] poolDetails 数据长度不足 (期望 >= 5，实际: ${data.length})`, {
              数据: data,
            })
          }
        } else if (data !== undefined && !Array.isArray(data)) {
          // eslint-disable-next-line no-console
          console.warn(`[NBC_STAKING_POOLS] [Pool ${pool}] poolDetails 返回的数据不是数组`, {
            数据类型: typeof data,
            数据值: data,
            期望类型: 'array',
          })
        }
      })
      
      if (loadingCount > 0 || errorCount > 0 || undefinedCount > 0 || successCount > 0) {
        // eslint-disable-next-line no-console
        console.groupEnd()
      }
    }
  }, [
    pool0Details, pool1Details, pool2Details, pool3Details, pool4Details, pool5Details,
    pool6Details, pool7Details, pool8Details, pool9Details, pool10Details,
    pool0DetailsError, pool1DetailsError, pool2DetailsError, pool3DetailsError, pool4DetailsError, pool5DetailsError,
    pool6DetailsError, pool7DetailsError, pool8DetailsError, pool9DetailsError, pool10DetailsError,
    pool0DetailsLoading, pool1DetailsLoading, pool2DetailsLoading, pool3DetailsLoading, pool4DetailsLoading, pool5DetailsLoading,
    pool6DetailsLoading, pool7DetailsLoading, pool8DetailsLoading, pool9DetailsLoading, pool10DetailsLoading,
    pool0DetailsIsError, pool0DetailsStatus,
  ])

  const pools = useMemo(() => {
    // 开发环境：记录 tokenPrices 状态
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.group('🔧 [NBC_STAKING_DIAG] [useNbcStakingPools] useMemo 执行')
      // eslint-disable-next-line no-console
      console.log('💰 [NBC_STAKING_PRICES] tokenPrices 状态:', {
        tokenPrices存在: !!tokenPrices,
        tokenPrices类型: typeof tokenPrices,
        tokenPrices键: tokenPrices ? Object.keys(tokenPrices) : [],
        tokenPrices值: tokenPrices ? Object.entries(tokenPrices).map(([k, v]) => `${k}: ${v ? v.toFixed(4) : 'null'}`).join(', ') : 'null',
        nbcPrice: nbcPrice ? nbcPrice.toFixed(6) : 'null',
        tokenPricesLoading,
        tokenPricesIsError,
        tokenPricesStatus,
        tokenPricesError: tokenPricesError ? tokenPricesError.message : null,
      })
      
      // 检查 poolDetails 查询状态
      const poolDetailsLoadingStates = [
        { pool: 0, loading: pool0DetailsLoading, data: pool0Details, error: pool0DetailsError },
        { pool: 1, loading: pool1DetailsLoading, data: pool1Details, error: pool1DetailsError },
        { pool: 2, loading: pool2DetailsLoading, data: pool2Details, error: pool2DetailsError },
        { pool: 3, loading: pool3DetailsLoading, data: pool3Details, error: pool3DetailsError },
        { pool: 4, loading: pool4DetailsLoading, data: pool4Details, error: pool4DetailsError },
        { pool: 5, loading: pool5DetailsLoading, data: pool5Details, error: pool5DetailsError },
        { pool: 6, loading: pool6DetailsLoading, data: pool6Details, error: pool6DetailsError },
        { pool: 7, loading: pool7DetailsLoading, data: pool7Details, error: pool7DetailsError },
        { pool: 8, loading: pool8DetailsLoading, data: pool8Details, error: pool8DetailsError },
        { pool: 9, loading: pool9DetailsLoading, data: pool9Details, error: pool9DetailsError },
        { pool: 10, loading: pool10DetailsLoading, data: pool10Details, error: pool10DetailsError },
      ]
      
      const loadingPools = poolDetailsLoadingStates.filter(p => p.loading)
      const errorPools = poolDetailsLoadingStates.filter(p => p.error)
      const successPools = poolDetailsLoadingStates.filter(p => p.data && !p.loading && !p.error)
      const undefinedPools = poolDetailsLoadingStates.filter(p => !p.data && !p.loading && !p.error)
      
      // eslint-disable-next-line no-console
      console.log('📊 [NBC_STAKING_POOLS] poolDetails 查询状态汇总:', {
        总数: poolDetailsLoadingStates.length,
        加载中: loadingPools.length,
        成功: successPools.length,
        错误: errorPools.length,
        未定义: undefinedPools.length,
        加载中的池: loadingPools.map(p => p.pool),
        成功的池: successPools.map(p => p.pool),
        错误的池: errorPools.map(p => ({ pool: p.pool, error: p.error?.message })),
        未定义的池: undefinedPools.map(p => p.pool),
      })
      
      // 详细记录每个池的数据状态
      poolDetailsLoadingStates.forEach(({ pool, data, loading, error }) => {
        if (data && Array.isArray(data) && data.length >= 5) {
          // eslint-disable-next-line no-console
          console.log(`[NBC_STAKING_POOLS] [Pool ${pool}] useMemo 中的数据状态:`, {
            数据存在: true,
            数据类型: 'array',
            数据长度: data.length,
            索引4值: typeof data[4] === 'bigint' ? data[4].toString() : String(data[4]),
            索引4类型: typeof data[4],
          })
        } else {
          // eslint-disable-next-line no-console
          console.log(`[NBC_STAKING_POOLS] [Pool ${pool}] useMemo 中的数据状态:`, {
            数据存在: !!data,
            数据类型: Array.isArray(data) ? 'array' : typeof data,
            数据长度: Array.isArray(data) ? data.length : 'N/A',
            加载中: loading,
            错误: error ? error.message : null,
          })
        }
      })
      
      if (loadingPools.length > 0) {
        // eslint-disable-next-line no-console
        console.warn('[NBC_STAKING_POOLS] ⚠️ 部分 poolDetails 查询仍在加载中，useMemo 可能使用未完成的数据')
      }
      
      if (undefinedPools.length > 0) {
        // eslint-disable-next-line no-console
        console.warn('[NBC_STAKING_POOLS] ⚠️ 部分 poolDetails 查询返回 undefined（无错误，无加载中），可能是查询失败或超时')
      }
      
      // eslint-disable-next-line no-console
      console.groupEnd()
    }

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
      // rewardsDuration 在索引 4
      let rewardsDuration: bigint | undefined = undefined
      
      // 开发环境：详细记录提取过程
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log(`[NBC_STAKING_POOLS] [${config.rewardTokenSymbol}] useMemo 中提取 rewardsDuration:`, {
          poolDetails存在: !!poolDetails,
          poolDetails类型: Array.isArray(poolDetails) ? 'array' : typeof poolDetails,
          poolDetails长度: poolDetails && Array.isArray(poolDetails) ? poolDetails.length : 'N/A',
          poolDetails索引4存在: poolDetails && Array.isArray(poolDetails) && poolDetails.length > 4,
          poolDetails索引4值: poolDetails && Array.isArray(poolDetails) && poolDetails.length > 4
            ? (typeof poolDetails[4] === 'bigint' ? poolDetails[4].toString() : String(poolDetails[4]))
            : 'N/A',
          poolDetails索引4类型: poolDetails && Array.isArray(poolDetails) && poolDetails.length > 4
            ? typeof poolDetails[4]
            : 'N/A',
          poolDetails完整内容: poolDetails && Array.isArray(poolDetails)
            ? poolDetails.map((item, idx) => ({
                索引: idx,
                值: typeof item === 'bigint' ? item.toString() : (item?.toString() || String(item)),
                类型: typeof item,
              }))
            : 'N/A',
        })
      }
      
      // 更严格的数据验证和提取
      if (poolDetails !== undefined && poolDetails !== null) {
        if (Array.isArray(poolDetails)) {
          if (poolDetails.length >= 5) {
            // rewardsDuration 在索引 4
            const durationValue = poolDetails[4]
            
            // 开发环境：记录索引4的详细信息
            if (process.env.NODE_ENV === 'development') {
              // eslint-disable-next-line no-console
              console.log(`[NBC_STAKING_POOLS] [${config.rewardTokenSymbol}] 检查索引4的值:`, {
                值: durationValue,
                值类型: typeof durationValue,
                是否为undefined: durationValue === undefined,
                是否为null: durationValue === null,
                是否为bigint: typeof durationValue === 'bigint',
                字符串表示: durationValue?.toString(),
              })
            }
            
            if (durationValue !== undefined && durationValue !== null) {
              try {
                // 处理不同的数据类型
                let durationBigInt: bigint
                if (typeof durationValue === 'bigint') {
                  durationBigInt = durationValue
                } else if (typeof durationValue === 'number') {
                  durationBigInt = BigInt(Math.floor(durationValue))
                } else if (typeof durationValue === 'string') {
                  durationBigInt = BigInt(durationValue)
                } else {
                  // 尝试转换为字符串再转换为 BigInt
                  durationBigInt = BigInt(String(durationValue))
                }
                
                // 只有当值大于 0 时才使用（不再限制最大值，因为合约可能设置任何值）
                if (durationBigInt > 0n) {
                  rewardsDuration = durationBigInt
                  // 开发环境：确认成功提取
                  if (process.env.NODE_ENV === 'development') {
                    // eslint-disable-next-line no-console
                    console.log(`[NBC_STAKING_POOLS] [${config.rewardTokenSymbol}] ✅ rewardsDuration 提取成功:`, {
                      原始值: durationValue.toString(),
                      转换后: durationBigInt.toString(),
                      年数: (Number(durationBigInt) / (365 * 24 * 60 * 60)).toFixed(2),
                    })
                  }
                } else {
                  // 开发环境：值为 0 的情况
                  if (process.env.NODE_ENV === 'development') {
                    // eslint-disable-next-line no-console
                    console.warn(`[NBC_STAKING_POOLS] [${config.rewardTokenSymbol}] ⚠️ rewardsDuration 值为 0，将使用默认值`, {
                      原始值: durationValue.toString(),
                      转换后: durationBigInt.toString(),
                    })
                  }
                }
              } catch (error) {
                // eslint-disable-next-line no-console
                console.error(`[NBC_STAKING_POOLS] [${config.rewardTokenSymbol}] ❌ Error parsing rewardsDuration:`, error, {
                  原始值: durationValue,
                  原始值类型: typeof durationValue,
                  原始值字符串: String(durationValue),
                })
              }
            } else {
              // 开发环境：值为 null/undefined 的情况
              if (process.env.NODE_ENV === 'development') {
                // eslint-disable-next-line no-console
                console.warn(`[NBC_STAKING_POOLS] [${config.rewardTokenSymbol}] ⚠️ poolDetails[4] 为 null/undefined`, {
                  poolDetails长度: poolDetails.length,
                  poolDetails内容: poolDetails.map((item, idx) => ({
                    索引: idx,
                    值: typeof item === 'bigint' ? item.toString() : (item?.toString() || String(item)),
                    类型: typeof item,
                  })),
                })
              }
            }
          } else {
            // 开发环境：数组长度不足
            if (process.env.NODE_ENV === 'development') {
              // eslint-disable-next-line no-console
              console.warn(`[NBC_STAKING_POOLS] [${config.rewardTokenSymbol}] ⚠️ poolDetails 数组长度不足 (期望 >= 5，实际: ${poolDetails.length})`, {
                poolDetails长度: poolDetails.length,
                poolDetails内容: poolDetails.map((item, idx) => ({
                  索引: idx,
                  值: typeof item === 'bigint' ? item.toString() : (item?.toString() || String(item)),
                  类型: typeof item,
                })),
              })
            }
          }
        } else {
          // 开发环境：poolDetails 不是数组
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.warn(`[NBC_STAKING_POOLS] [${config.rewardTokenSymbol}] ⚠️ poolDetails 不是数组`, {
              poolDetails类型: typeof poolDetails,
              poolDetails值: poolDetails,
            })
          }
        }
      } else {
        // 开发环境：poolDetails 为 undefined 或 null
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.warn(`[NBC_STAKING_POOLS] [${config.rewardTokenSymbol}] ⚠️ poolDetails 为 undefined/null`, {
            poolDetails存在: poolDetails !== undefined,
            poolDetails为null: poolDetails === null,
          })
        }
      }
      
      // 开发环境日志：记录 rewardsDuration 信息
      if (process.env.NODE_ENV === 'development') {
        if (rewardsDuration && rewardsDuration > 0n) {
          const durationYears = Number(rewardsDuration) / (365 * 24 * 60 * 60)
          const isAbnormal = durationYears > 10 // 超过 10 年视为异常
          // eslint-disable-next-line no-console
          console.log(`[NBC_STAKING_POOLS] [${config.rewardTokenSymbol}] rewardsDuration:`, {
            秒数: rewardsDuration.toString(),
            年数: durationYears.toFixed(2),
            来源: '从合约读取',
            是否异常: isAbnormal ? '⚠️ 是（超过10年）' : '✅ 正常',
            poolDetails长度: poolDetails?.length || 0,
            poolDetails索引4: poolDetails?.[4]?.toString()?.substring(0, 20) || 'N/A',
          })
        } else {
          // eslint-disable-next-line no-console
          console.warn(`[NBC_STAKING_POOLS] [${config.rewardTokenSymbol}] rewardsDuration: 未读取到，将使用默认值 (1年)`, {
            poolDetails存在: !!poolDetails,
            poolDetails类型: Array.isArray(poolDetails) ? 'array' : typeof poolDetails,
            poolDetails长度: poolDetails && Array.isArray(poolDetails) ? poolDetails.length : 'N/A',
            poolDetails索引4: poolDetails && Array.isArray(poolDetails) && poolDetails.length > 4 
              ? poolDetails[4]?.toString()?.substring(0, 30) || 'null/undefined'
              : '索引不存在',
            poolDetails完整内容: poolDetails ? JSON.stringify(poolDetails, (key, value) =>
              typeof value === 'bigint' ? value.toString() : value,
            ).substring(0, 300) : 'null',
          })
        }
      }

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

          if (nbcPrice && nbcPrice > 0 && tokenPrice && tokenPrice > 0) {
            // 计算实时兑换比例：1 奖励代币 = (tokenPrice / nbcPrice) NBC
            const conversionRate = tokenPrice / nbcPrice

            if (conversionRate > 0 && Number.isFinite(conversionRate)) {
              apr = calculateAPRFromRewardRate(
                rewardRateBigInt,
                totalStakedBigInt,
                conversionRate,
                config.rewardTokenDecimals,
                rewardsDuration,
              )

              // APR 诊断日志（仅在开发环境）
              if (process.env.NODE_ENV === 'development') {
                const totalStakedFormatted = Number(totalStakedBigInt) / 1e18
                const rewardRateFormatted = Number(rewardRateBigInt) / 10 ** config.rewardTokenDecimals
                const isHighAPR = apr > 1000 // 超过1000%视为异常高
                const isExtremelyHighAPR = apr > 1000000 // 超过100万%视为极端异常
                
                // eslint-disable-next-line no-console
                console.group(`[NBC_STAKING_APR] [${config.rewardTokenSymbol}] 📊 APR计算结果`)
                // eslint-disable-next-line no-console
                console.log(`[NBC_STAKING_APR] APR: ${apr.toFixed(2)}%${isHighAPR ? ' ⚠️ 数值异常高' : ''}${isExtremelyHighAPR ? ' 🚨 极端异常' : ''}`)
                // eslint-disable-next-line no-console
                console.log(`[NBC_STAKING_APR] 💰 价格信息:`)
                // eslint-disable-next-line no-console
                console.log(`[NBC_STAKING_APR]   - ${config.rewardTokenSymbol} 价格: $${tokenPrice.toFixed(6)}`)
                // eslint-disable-next-line no-console
                console.log(`[NBC_STAKING_APR]   - NBC 价格: $${nbcPrice.toFixed(6)}`)
                // eslint-disable-next-line no-console
                console.log(`[NBC_STAKING_APR]   兑换比例: 1 ${config.rewardTokenSymbol} = ${conversionRate.toFixed(6)} NBC (计算: ${tokenPrice.toFixed(6)} / ${nbcPrice.toFixed(6)})`)
                // eslint-disable-next-line no-console
                console.log(`[NBC_STAKING_APR] 📊 池信息:`)
                // eslint-disable-next-line no-console
                console.log(`[NBC_STAKING_APR]   - 总质押量: ${totalStakedFormatted.toFixed(2)} NBC`)
                // eslint-disable-next-line no-console
                console.log(`[NBC_STAKING_APR]   - 奖励率: ${rewardRateFormatted.toFixed(8)} ${config.rewardTokenSymbol}/秒`)
                // eslint-disable-next-line no-console
                console.log(`[NBC_STAKING_APR]   - 奖励周期: ${rewardsDuration ? (Number(rewardsDuration) / (365 * 24 * 60 * 60)).toFixed(2) + ' 年' : '默认1年'}`)
                if (isExtremelyHighAPR) {
                  // eslint-disable-next-line no-console
                  console.error(`[NBC_STAKING_APR] 🚨 APR极端异常高！`)
                  // eslint-disable-next-line no-console
                  console.error(`[NBC_STAKING_APR]   这通常发生在以下情况：`)
                  // eslint-disable-next-line no-console
                  console.error(`[NBC_STAKING_APR]   1. 项目早期，总质押量极小（当前: ${totalStakedFormatted.toFixed(2)} NBC）`)
                  // eslint-disable-next-line no-console
                  console.error(`[NBC_STAKING_APR]   2. 奖励率设置相对于质押量过大（当前: ${rewardRateFormatted.toFixed(8)} ${config.rewardTokenSymbol}/秒）`)
                  // eslint-disable-next-line no-console
                  console.error(`[NBC_STAKING_APR]   3. 合约配置可能需要调整（奖励率或质押量）`)
                  // eslint-disable-next-line no-console
                  console.error(`[NBC_STAKING_APR]   注意：虽然 APR 计算正确，但如此高的 APR 可能不可持续`)
                } else if (isHighAPR) {
                  // eslint-disable-next-line no-console
                  console.warn(`[NBC_STAKING_APR] ⚠️ APR异常高，可能原因：总质押量过小(${totalStakedFormatted.toFixed(2)} NBC) 或奖励率过大(${rewardRateFormatted.toFixed(8)}/秒)`)
                }
                // eslint-disable-next-line no-console
                console.groupEnd()
              }
            } else {
              apr = 0
            }
          } else if (config.rewardTokenSymbol === 'NBC') {
            // 如果价格未加载，使用简化计算（仅适用于 NBC 奖励池）
            const annualReward = Number(rewardRateBigInt) * 365 * 24 * 60 * 60
            const totalStakedNum = Number(totalStakedBigInt)
            apr = (annualReward / totalStakedNum) * 100
            if (process.env.NODE_ENV === 'development') {
              // eslint-disable-next-line no-console
              console.log(`[NBC_STAKING_APR] [${config.rewardTokenSymbol}] 📊 APR (NBC池，简化计算): ${apr.toFixed(2)}%`)
            }
          } else {
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
        stakingTokenPrice: typeof nbcPrice === 'number' && Number.isFinite(nbcPrice) && nbcPrice > 0 ? nbcPrice : 1, // NBC 实时价格
        earningTokenPrice: (() => {
          const price = tokenPrices?.[config.rewardTokenSymbol]
          return typeof price === 'number' && Number.isFinite(price) && price > 0 ? price : 1
        })(), // 奖励代币实时价格，确保始终是有效正数
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

    return result
  }, [
    account,
    nativeBalance,
    tokenPrices,
    tokenPricesLoading,
    tokenPricesIsError,
    tokenPricesStatus,
    tokenPricesError,
    nbcPrice,
    staked0,
    earned0,
    totalStaked0,
    poolInfo0,
    pool0Details,
    staked1,
    earned1,
    totalStaked1,
    poolInfo1,
    pool1Details,
    staked2,
    earned2,
    totalStaked2,
    poolInfo2,
    pool2Details,
    staked3,
    earned3,
    totalStaked3,
    poolInfo3,
    pool3Details,
    staked4,
    earned4,
    totalStaked4,
    poolInfo4,
    pool4Details,
    staked5,
    earned5,
    totalStaked5,
    poolInfo5,
    pool5Details,
    staked6,
    earned6,
    totalStaked6,
    poolInfo6,
    pool6Details,
    staked7,
    earned7,
    totalStaked7,
    poolInfo7,
    pool7Details,
    staked8,
    earned8,
    totalStaked8,
    poolInfo8,
    pool8Details,
    staked9,
    earned9,
    totalStaked9,
    poolInfo9,
    pool9Details,
    staked10,
    earned10,
    totalStaked10,
    poolInfo10,
    pool10Details,
    currentChainTimestamp,
    nbcPrice,
    tokenPrices,
  ])

  return {
    pools,
    userDataLoaded: !!account,
  }
}
