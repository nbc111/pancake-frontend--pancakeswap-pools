#!/usr/bin/env node

/**
 * 重新设置质押池的 rewardRate
 * 
 * 币圈正常做法：
 * 1. 基于目标 APR 和预期质押量计算 rewardRate
 * 2. 支持预览模式（dry-run）先查看结果
 * 3. 有完整的安全检查和确认步骤
 * 4. 支持单个池或所有池
 * 5. 使用实时价格计算兑换比例
 * 
 * 使用方法：
 *   node reset-reward-rate.js --pool BTC --target-apr 100 --expected-staked 1000000
 *   node reset-reward-rate.js --pool all --target-apr 100 --expected-staked 1000000 --dry-run
 *   node reset-reward-rate.js --pool BTC --target-apr 100 --expected-staked 1000000 --execute
 */

const axios = require('axios')
const { ethers } = require('ethers')
const { formatUnits, parseUnits } = require('ethers/lib/utils')
require('dotenv').config()

// 解析命令行参数
const args = process.argv.slice(2)
const getArg = (name, defaultValue) => {
  const index = args.indexOf(`--${name}`)
  return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue
}
const hasFlag = (name) => args.includes(`--${name}`)

const CONFIG = {
  // 区块链配置
  RPC_URL: process.env.RPC_URL || 'https://rpc.nbcex.com',
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  STAKING_CONTRACT_ADDRESS: process.env.STAKING_CONTRACT_ADDRESS || '0x32580B2001EA941529c79bcb819b8f6F3c886c60',

  // 目标配置（可通过命令行参数覆盖）
  TARGET_APR: parseFloat(getArg('target-apr', process.env.TARGET_APR || '100')), // 目标 APR (%)
  // 预期质押量：如果命令行参数是数字（NBC），转换为 wei；否则直接使用（已经是 wei）
  EXPECTED_STAKED_NBC: (() => {
    const arg = getArg('expected-staked', process.env.EXPECTED_STAKED_NBC || '1000000')
    // 如果是纯数字（小于 1e20），认为是 NBC 数量，转换为 wei
    const num = parseFloat(arg)
    if (!isNaN(num) && num < 1e20) {
      return parseUnits(num.toString(), 18).toString()
    }
    return arg
  })(),

  // 运行模式
  DRY_RUN: hasFlag('dry-run'), // 预览模式，不实际执行
  EXECUTE: hasFlag('execute'), // 执行模式，需要确认
  POOL: getArg('pool', 'all'), // 要更新的池 (BTC, ETH, SOL, ... 或 all)
  USE_ONE_YEAR_REWARD: hasFlag('use-one-year'), // 只发送 1 年奖励，而不是整个 rewardsDuration 期间的奖励（用于 rewardsDuration 异常大的情况）

  // 价格 API
  NBCEX_API_BASE: 'https://www.nbcex.com/v1/rest/api/market/ticker',
  NBCEX_ACCESS_KEY: '3PswIE0Z9w26R9MC5XrGU8b6LD4bQIWWO1x3nwix1xI=',
  GATEIO_API_URL: 'https://api.gateio.ws/api/v4/spot/tickers',
  OKX_API_URL: 'https://www.okx.com/api/v5/market/ticker',
  BINANCE_API_URL: 'https://api.binance.com/api/v3/ticker/price',
  COINGECKO_API_URL: 'https://api.coingecko.com/api/v3/simple/price',
  SECONDS_PER_YEAR: 31536000,
}

// 代币配置
const TOKEN_CONFIG = {
  BTC: {
    poolIndex: 1,
    address: '0xb225C29Da2CaB86991b7e0651c63f0fD5C16613C',
    decimals: 8,
    coingeckoId: 'bitcoin',
    nbcexSymbol: 'btcusdt',
    gateioSymbol: 'BTC_USDT',
    binanceSymbol: 'BTCUSDT',
    okxSymbol: 'BTC-USDT',
  },
  ETH: {
    poolIndex: 2,
    address: '0x1Feba2E24a6b7F1D07F55Aa7ba59a4a4bAF9f908',
    decimals: 18,
    coingeckoId: 'ethereum',
    nbcexSymbol: 'ethusdt',
    gateioSymbol: 'ETH_USDT',
    binanceSymbol: 'ETHUSDT',
    okxSymbol: 'ETH-USDT',
  },
  SOL: {
    poolIndex: 3,
    address: '0xd5eECCC885Ef850d90AE40E716c3dFCe5C3D4c81',
    decimals: 18,
    coingeckoId: 'solana',
    nbcexSymbol: 'solusdt',
    gateioSymbol: 'SOL_USDT',
    binanceSymbol: 'SOLUSDT',
    okxSymbol: 'SOL-USDT',
  },
  BNB: {
    poolIndex: 4,
    address: '0x9C43237490272BfdD2F1d1ca0B34f20b1A3C9f5c',
    decimals: 18,
    coingeckoId: 'binancecoin',
    nbcexSymbol: 'bnbusdt',
    gateioSymbol: 'BNB_USDT',
    binanceSymbol: 'BNBUSDT',
    okxSymbol: 'BNB-USDT',
  },
  XRP: {
    poolIndex: 5,
    address: '0x48e1772534fabBdcaDe9ca4005E5Ee8BF4190093',
    decimals: 18,
    coingeckoId: 'ripple',
    nbcexSymbol: 'xrpusdt',
    gateioSymbol: 'XRP_USDT',
    binanceSymbol: 'XRPUSDT',
    okxSymbol: 'XRP-USDT',
  },
  LTC: {
    poolIndex: 6,
    address: '0x8d22041C22d696fdfF0703852a706a40Ff65a7de',
    decimals: 18,
    coingeckoId: 'litecoin',
    nbcexSymbol: 'ltcusdt',
    gateioSymbol: 'LTC_USDT',
    binanceSymbol: 'LTCUSDT',
    okxSymbol: 'LTC-USDT',
  },
  DOGE: {
    poolIndex: 7,
    address: '0x8cEb9a93405CDdf3D76f72327F868Bd3E8755D89',
    decimals: 18,
    coingeckoId: 'dogecoin',
    nbcexSymbol: 'dogeusdt',
    gateioSymbol: 'DOGE_USDT',
    binanceSymbol: 'DOGEUSDT',
    okxSymbol: 'DOGE-USDT',
  },
  USDT: {
    poolIndex: 9,
    address: '0x55d398326f99059fF775485246999027B3197955',
    decimals: 6,
    coingeckoId: 'tether',
    nbcexSymbol: 'usdtusdt',
    gateioSymbol: 'USDT_USDT',
    binanceSymbol: 'USDTUSDT',
    okxSymbol: 'USDT-USDT',
  },
  SUI: {
    poolIndex: 10,
    address: '0x9011191E84Ad832100Ddc891E360f8402457F55E',
    decimals: 18,
    coingeckoId: 'sui',
    nbcexSymbol: 'suiusdt',
    gateioSymbol: 'SUI_USDT',
    binanceSymbol: 'SUIUSDT',
    okxSymbol: 'SUI-USDT',
  },
}

const STAKING_ABI = [
  'function getPoolInfo(uint256) view returns (address rewardToken, uint256 totalStakedAmount, uint256 rewardRate, uint256 periodFinish, bool active)',
  'function pools(uint256) view returns (address rewardToken, uint256 totalStakedAmount, uint256 rewardRate, uint256 periodFinish, uint256 lastUpdateTime, uint256 rewardsDuration, bool active)',
  'function notifyRewardAmount(uint256 poolIndex, uint256 reward)',
  'function owner() view returns (address)',
]

/**
 * 获取 NBC 价格
 */
async function getNBCPrice() {
  // 尝试多个 API
  const apis = [
    // 1. NBCEX API
    async () => {
      try {
        const url = `${CONFIG.NBCEX_API_BASE}?symbol=nbcusdt&accessKey=${CONFIG.NBCEX_ACCESS_KEY}`
        const response = await axios.get(url, { 
          timeout: 10000,
          httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }) // 忽略证书错误
        })
        if (response.data && response.data.data && response.data.data.last) {
          return parseFloat(response.data.data.last)
        }
      } catch (error) {
        throw new Error(`NBCEX: ${error.message}`)
      }
    },
    // 2. 使用固定价格作为备用（如果 API 都失败）
    async () => {
      console.warn(`⚠️  所有 API 失败，使用备用价格 0.07 USDT`)
      return 0.07
    },
  ]

  for (const api of apis) {
    try {
      const price = await api()
      if (price && price > 0) {
        return price
      }
    } catch (error) {
      if (api === apis[apis.length - 1]) {
        // 最后一个 API，抛出错误
        throw error
      }
      // 继续尝试下一个 API
    }
  }
  
  return null
}

/**
 * 获取代币价格
 */
async function getTokenPrice(symbol, config) {
  const https = require('https')
  const httpsAgent = new https.Agent({ rejectUnauthorized: false }) // 忽略证书错误

  try {
    // 尝试 NBCEX
    const url = `${CONFIG.NBCEX_API_BASE}?symbol=${config.nbcexSymbol}&accessKey=${CONFIG.NBCEX_ACCESS_KEY}`
    const response = await axios.get(url, { 
      timeout: 10000,
      httpsAgent 
    })
    if (response.data && response.data.data && response.data.data.last) {
      return parseFloat(response.data.data.last)
    }
  } catch (error) {
    // 忽略错误，继续尝试其他 API
  }

  try {
    // 尝试 Gate.io
    const response = await axios.get(CONFIG.GATEIO_API_URL, { 
      timeout: 10000,
      httpsAgent 
    })
    const ticker = response.data.find((t) => t.currency_pair === config.gateioSymbol)
    if (ticker && ticker.last) {
      return parseFloat(ticker.last)
    }
  } catch (error) {
    // 忽略错误
  }

  try {
    // 尝试 Binance
    const response = await axios.get(`${CONFIG.BINANCE_API_URL}?symbol=${config.binanceSymbol}`, { 
      timeout: 10000,
      httpsAgent 
    })
    if (response.data && response.data.price) {
      return parseFloat(response.data.price)
    }
  } catch (error) {
    // 忽略错误
  }

  try {
    // 尝试 CoinGecko
    const response = await axios.get(
      `${CONFIG.COINGECKO_API_URL}?ids=${config.coingeckoId}&vs_currencies=usd`,
      { 
        timeout: 10000,
        httpsAgent 
      },
    )
    if (response.data && response.data[config.coingeckoId] && response.data[config.coingeckoId].usd) {
      return response.data[config.coingeckoId].usd
    }
  } catch (error) {
    // 忽略错误
  }

  // 如果所有 API 都失败，使用备用价格（仅用于测试）
  console.warn(`⚠️  所有 API 失败，使用备用价格（仅用于测试）`)
  const fallbackPrices = {
    BTC: 93464,
    ETH: 2500,
    SOL: 100,
    BNB: 300,
    XRP: 0.5,
    LTC: 70,
    DOGE: 0.08,
    USDT: 1,
    SUI: 1.5,
  }
  return fallbackPrices[symbol] || null
}

/**
 * 计算 rewardRate
 */
function calculateRewardRate(targetAPR, expectedStakedNBC, conversionRate, rewardTokenDecimals) {
  // 使用 BigInt 进行计算，避免精度丢失
  const aprDecimal = targetAPR / 100
  
  // 将 APR 转换为整数（使用 10000 作为精度，即 100.00% = 10000）
  const aprMultiplier = Math.floor(aprDecimal * 10000)
  
  // 计算年总奖励 NBC（wei 单位）
  // expectedStakedNBC 已经是 BigInt，直接使用
  const expectedStakedNBCBigInt = typeof expectedStakedNBC === 'bigint' 
    ? expectedStakedNBC 
    : BigInt(expectedStakedNBC.toString())
  
  // annualRewardNBCWei = expectedStakedNBC * aprMultiplier / 10000
  const annualRewardNBCWei = (expectedStakedNBCBigInt * BigInt(aprMultiplier)) / BigInt(10000)

  const conversionRateScaled = BigInt(Math.floor(conversionRate * 1e18))
  const rewardTokenMultiplier = BigInt(10 ** rewardTokenDecimals)

  const annualRewardToken = (annualRewardNBCWei * rewardTokenMultiplier) / conversionRateScaled
  const secondsPerYear = BigInt(CONFIG.SECONDS_PER_YEAR)
  
  // 计算每秒奖励率（使用向上取整，确保不会因为向下取整导致 APR 不足）
  // 方法：先加 (secondsPerYear - 1)，再除以 secondsPerYear，这样会向上取整
  const rewardPerSecond = (annualRewardToken + secondsPerYear - 1n) / secondsPerYear

  return {
    rewardPerSecond,
    annualRewardToken,
    annualRewardNBCWei,
  }
}

/**
 * 从 rewardRate 计算 APR（用于验证）
 */
function calculateAPRFromRewardRate(rewardRate, totalStakedNBC, conversionRate, rewardTokenDecimals) {
  if (totalStakedNBC === 0n) return 0
  if (rewardRate === 0n) return 0

  const annualRewardToken = rewardRate * BigInt(CONFIG.SECONDS_PER_YEAR)
  const conversionRateScaled = BigInt(Math.floor(conversionRate * 1e18))
  const rewardTokenMultiplier = BigInt(10 ** rewardTokenDecimals)

  const annualRewardNBC = (annualRewardToken * conversionRateScaled) / rewardTokenMultiplier
  const apr = (Number(annualRewardNBC) / Number(totalStakedNBC)) * 100

  return apr
}

/**
 * 重置单个池的 rewardRate
 */
async function resetPoolRewardRate(symbol, config) {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`   重置 ${symbol} 池的 rewardRate`)
  console.log(`${'='.repeat(80)}\n`)

  try {
    // 1. 获取价格
    console.log('📊 获取价格数据...')
    const [nbcPrice, tokenPrice] = await Promise.all([
      getNBCPrice(),
      getTokenPrice(symbol, config),
    ])

    if (!nbcPrice || nbcPrice <= 0) {
      throw new Error(`无法获取 NBC 价格`)
    }
    if (!tokenPrice || tokenPrice <= 0) {
      throw new Error(`无法获取 ${symbol} 价格`)
    }

    const conversionRate = tokenPrice / nbcPrice

    console.log(`   ✅ NBC 价格: $${nbcPrice.toFixed(6)} USDT`)
    console.log(`   ✅ ${symbol} 价格: $${tokenPrice.toLocaleString()} USDT`)
    console.log(`   ✅ 兑换比例: 1 ${symbol} = ${conversionRate.toLocaleString()} NBC`)
    console.log('')

    // 2. 查询当前合约状态
    console.log('📋 查询当前合约状态...')
    // 创建 provider，使用静态网络配置避免自动检测失败
    const network = {
      name: 'NBC Chain',
      chainId: 1281,
    }
    const provider = new ethers.providers.JsonRpcProvider(CONFIG.RPC_URL, network)
    
    // 先测试 provider 连接
    try {
      await provider.getBlockNumber()
    } catch (error) {
      throw new Error(`Provider 连接失败: ${error.message}`)
    }
    
    const stakingContract = new ethers.Contract(CONFIG.STAKING_CONTRACT_ADDRESS, STAKING_ABI, provider)

    // 获取完整的池信息（包括 rewardsDuration）
    // 先尝试使用 pools 函数，如果失败则使用 getPoolInfo
    let poolData
    let currentTotalStaked
    let currentRewardRate
    let rewardsDuration
    let active
    
    try {
      // 尝试使用 pools 函数（返回完整信息包括 rewardsDuration）
      poolData = await stakingContract.pools(config.poolIndex)
      // pools 函数返回数组: [rewardToken, totalStakedAmount, rewardRate, periodFinish, lastUpdateTime, rewardsDuration, active]
      // ethers.js 可能返回对象或数组，需要兼容两种方式
      currentTotalStaked = poolData[1] || poolData.totalStakedAmount
      currentRewardRate = poolData[2] || poolData.rewardRate
      rewardsDuration = poolData[5] || poolData.rewardsDuration
      active = poolData[6] !== undefined ? poolData[6] : (poolData.active !== undefined ? poolData.active : true)
    } catch (error) {
      // 如果 pools 函数不存在，使用 getPoolInfo 并尝试其他方式获取 rewardsDuration
      console.log('   ⚠️  pools 函数不可用，使用 getPoolInfo')
      const poolInfo = await stakingContract.getPoolInfo(config.poolIndex)
      currentTotalStaked = poolInfo.totalStakedAmount
      currentRewardRate = poolInfo.rewardRate
      active = poolInfo.active
      
      // 尝试直接调用 pools 函数（使用 callStatic）
      try {
        const poolsResult = await provider.call({
          to: CONFIG.STAKING_CONTRACT_ADDRESS,
          data: stakingContract.interface.encodeFunctionData('pools', [config.poolIndex]),
        })
        const decoded = stakingContract.interface.decodeFunctionResult('pools', poolsResult)
        rewardsDuration = decoded[5]
      } catch (e) {
        // 如果还是失败，使用默认值 1 年
        console.log('   ⚠️  无法获取 rewardsDuration，使用默认值 1 年 (31536000 秒)')
        rewardsDuration = ethers.BigNumber.from(CONFIG.SECONDS_PER_YEAR)
      }
    }

    if (!active) {
      console.log(`   ⚠️  池未激活，跳过`)
      return { success: false, symbol, error: 'Pool not active' }
    }

    const rewardsDurationSeconds = Number(rewardsDuration.toString())
    const rewardsDurationYears = rewardsDurationSeconds / 31536000

    console.log(`   ✅ 池状态: 激活`)
    console.log(`   ✅ 当前质押量: ${formatUnits(currentTotalStaked, 18)} NBC`)
    console.log(`   ✅ 当前 rewardRate: ${formatUnits(currentRewardRate, config.decimals)} ${symbol}/s`)
    console.log(`   ✅ rewardsDuration: ${rewardsDurationSeconds} 秒 (${rewardsDurationYears.toFixed(2)} 年)`)
    console.log('')

    // 3. 计算新的 rewardRate
    console.log('🔢 计算新的 rewardRate...')
    const expectedStakedNBC = BigInt(CONFIG.EXPECTED_STAKED_NBC)
    const newRewardRate = calculateRewardRate(
      CONFIG.TARGET_APR,
      expectedStakedNBC,
      conversionRate,
      config.decimals,
    )

    const newRewardRateBN = ethers.BigNumber.from(newRewardRate.rewardPerSecond.toString())
    
    // 重要：合约使用 rewardsDuration 来计算 rewardRate
    // rewardRate = totalReward / rewardsDuration
    // 所以我们需要发送 totalReward = rewardRate * rewardsDuration
    // 但是，我们计算的是年总奖励，所以需要转换为 rewardsDuration 期间的总奖励
    const annualRewardBN = ethers.BigNumber.from(newRewardRate.annualRewardToken.toString())
    const rewardsDurationBN = ethers.BigNumber.from(rewardsDurationSeconds.toString())
    
    // 计算 rewardsDuration 期间的总奖励
    // 如果 rewardsDuration 是 1 年，totalReward = annualReward
    // 如果 rewardsDuration 是 56 年，totalReward = annualReward * 56
    let totalRewardForDuration
    if (CONFIG.USE_ONE_YEAR_REWARD) {
      // 如果使用 --use-one-year 选项，只发送 1 年的奖励
      // 这适用于 rewardsDuration 异常大的情况（如 56 年）
      totalRewardForDuration = annualRewardBN
      console.log(`   ⚠️  使用 --use-one-year 选项：只发送 1 年奖励（而不是整个 rewardsDuration 期间）`)
    } else {
      totalRewardForDuration = (annualRewardBN.mul(rewardsDurationBN)).div(ethers.BigNumber.from(CONFIG.SECONDS_PER_YEAR.toString()))
    }

    console.log(`   ✅ 目标 APR: ${CONFIG.TARGET_APR}%`)
    console.log(`   ✅ 预期质押量: ${formatUnits(expectedStakedNBC, 18)} NBC`)
    console.log(`   ✅ 新 rewardRate: ${formatUnits(newRewardRateBN, config.decimals)} ${symbol}/s`)
    console.log(`   ✅ 年总奖励: ${formatUnits(annualRewardBN, config.decimals)} ${symbol}`)
    console.log(`   ✅ ${CONFIG.USE_ONE_YEAR_REWARD ? '将发送' : 'rewardsDuration 期间总奖励'}: ${formatUnits(totalRewardForDuration, config.decimals)} ${symbol}`)
    
    // 如果 rewardRate 为 0 或非常小，警告用户
    if (newRewardRateBN.eq(0)) {
      console.log('')
      console.log('   ⚠️  警告: 计算出的 rewardRate 为 0，这可能是因为:')
      console.log('      1. 预期质押量太小')
      console.log('      2. 兑换比例太大（代币价格相对于 NBC 太高）')
      console.log('      3. 目标 APR 太低')
      console.log('')
      console.log('   💡 建议:')
      console.log('      - 使用更大的预期质押量（例如 1000 NBC）')
      console.log('      - 或者接受实际 APR 可能高于目标 APR（如果设置了最小 rewardRate）')
    }
    console.log('')

    // 4. 验证计算（使用预期质押量）
    const expectedAPR = calculateAPRFromRewardRate(
      BigInt(newRewardRate.rewardPerSecond.toString()),
      expectedStakedNBC,
      conversionRate,
      config.decimals,
    )
    console.log('✅ 验证计算:')
    console.log(`   - 使用预期质押量 (${formatUnits(expectedStakedNBC, 18)} NBC): APR = ${expectedAPR.toFixed(2)}%`)
    
    // 使用当前质押量计算 APR（用于显示）
    if (currentTotalStaked.gt(0)) {
      const currentAPR = calculateAPRFromRewardRate(
        BigInt(newRewardRate.rewardPerSecond.toString()),
        BigInt(currentTotalStaked.toString()),
        conversionRate,
        config.decimals,
      )
      console.log(`   - 使用当前质押量 (${formatUnits(currentTotalStaked, 18)} NBC): APR = ${currentAPR.toFixed(2)}%`)
    }
    console.log('')

    // 5. 对比当前值
    const currentRewardRateNum = Number(currentRewardRate)
    const newRewardRateNum = Number(newRewardRateBN)
    const diff = ((newRewardRateNum - currentRewardRateNum) / currentRewardRateNum) * 100

    console.log('📊 对比分析:')
    console.log(`   - 当前 rewardRate: ${formatUnits(currentRewardRate, config.decimals)} ${symbol}/s`)
    console.log(`   - 新 rewardRate: ${formatUnits(newRewardRateBN, config.decimals)} ${symbol}/s`)
    console.log(`   - 变化: ${diff > 0 ? '+' : ''}${diff.toFixed(2)}%`)
    console.log('')

    // 6. 如果是预览模式，只显示结果
    if (CONFIG.DRY_RUN) {
      console.log('🔍 预览模式：不会实际执行交易')
      console.log('   要实际执行，请使用 --execute 参数')
      return {
        success: true,
        symbol,
        dryRun: true,
        newRewardRate: newRewardRateBN.toString(),
        annualReward: annualRewardBN.toString(),
      }
    }

    // 7. 检查私钥
    if (!CONFIG.PRIVATE_KEY) {
      throw new Error('未设置 PRIVATE_KEY，无法执行交易。请在 .env 文件中设置 PRIVATE_KEY')
    }

    // 8. 检查合约所有者
    const wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, provider)
    const owner = await stakingContract.owner()
    if (wallet.address.toLowerCase() !== owner.toLowerCase()) {
      throw new Error(`钱包地址 ${wallet.address} 不是合约所有者 ${owner}`)
    }

    // 9. 检查代币余额（使用 rewardsDuration 期间的总奖励）
    const tokenContract = new ethers.Contract(config.address, ['function balanceOf(address) view returns (uint256)'], provider)
    const ownerBalance = await tokenContract.balanceOf(owner)
    
    if (ownerBalance.lt(totalRewardForDuration)) {
      const requiredLabel = CONFIG.USE_ONE_YEAR_REWARD ? '1 年奖励' : 'rewardsDuration 期间总奖励'
      throw new Error(
        `所有者余额不足: ${formatUnits(ownerBalance, config.decimals)} ${symbol} < ${formatUnits(totalRewardForDuration, config.decimals)} ${symbol} (${requiredLabel})`,
      )
    }

    console.log(`   ✅ 所有者余额充足: ${formatUnits(ownerBalance, config.decimals)} ${symbol}`)
    const requiredLabel = CONFIG.USE_ONE_YEAR_REWARD ? '1 年奖励' : 'rewardsDuration 期间总奖励'
    console.log(`   ✅ 需要发送: ${formatUnits(totalRewardForDuration, config.decimals)} ${symbol} (${requiredLabel})`)
    console.log('')

    // 10. 确认执行
    if (!CONFIG.EXECUTE) {
      console.log('⚠️  需要确认执行')
      console.log('   请使用 --execute 参数来实际执行交易')
      return {
        success: false,
        symbol,
        error: '需要 --execute 参数',
      }
    }

    // 11. 执行交易
    console.log('📤 发送交易...')
    if (CONFIG.USE_ONE_YEAR_REWARD) {
      console.log(`   💡 注意: 使用 --use-one-year 选项，只发送 1 年奖励`)
      console.log(`   💡 合约会将剩余奖励加上新奖励，然后除以 rewardsDuration (${rewardsDurationYears.toFixed(2)} 年) 来计算新的 rewardRate`)
    } else {
      console.log(`   💡 注意: 合约使用 rewardsDuration (${rewardsDurationYears.toFixed(2)} 年) 来计算 rewardRate`)
    }
    console.log(`   💡 发送的总奖励: ${formatUnits(totalRewardForDuration, config.decimals)} ${symbol}`)
    const stakingContractWithSigner = new ethers.Contract(CONFIG.STAKING_CONTRACT_ADDRESS, STAKING_ABI, wallet)
    const tx = await stakingContractWithSigner.notifyRewardAmount(config.poolIndex, totalRewardForDuration)
    console.log(`   🔗 交易哈希: ${tx.hash}`)

    console.log('⏳ 等待确认...')
    const receipt = await tx.wait()
    console.log(`   ✅ 交易成功！`)
    console.log(`   📦 区块: ${receipt.blockNumber}`)
    const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice || receipt.gasPrice)
    console.log(`   ⛽ Gas 费用: ${formatUnits(gasUsed, 18)} NBC`)
    console.log('')

    return {
      success: true,
      symbol,
      poolIndex: config.poolIndex,
      newRewardRate: newRewardRateBN.toString(),
      annualReward: annualRewardBN.toString(),
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
    }
  } catch (error) {
    console.error(`   ❌ 错误: ${error.message}`)
    return { success: false, symbol, error: error.message }
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('\n' + '='.repeat(80))
  console.log('   重新设置质押池 rewardRate')
  console.log('='.repeat(80))
  console.log(`   时间: ${new Date().toISOString()}`)
  console.log(`   模式: ${CONFIG.DRY_RUN ? '预览模式 (dry-run)' : CONFIG.EXECUTE ? '执行模式' : '预览模式'}`)
  console.log(`   目标 APR: ${CONFIG.TARGET_APR}%`)
  console.log(`   预期质押量: ${formatUnits(CONFIG.EXPECTED_STAKED_NBC, 18)} NBC`)
  console.log(`   要更新的池: ${CONFIG.POOL.toUpperCase()}`)
  console.log('='.repeat(80))

  if (!CONFIG.EXECUTE && !CONFIG.DRY_RUN) {
    console.log('\n⚠️  默认是预览模式，不会实际执行交易')
    console.log('   使用 --dry-run 明确指定预览模式')
    console.log('   使用 --execute 来实际执行交易\n')
  }

  try {
    const poolsToUpdate = CONFIG.POOL.toUpperCase() === 'ALL' ? Object.keys(TOKEN_CONFIG) : [CONFIG.POOL.toUpperCase()]

    if (!poolsToUpdate.every((p) => TOKEN_CONFIG[p])) {
      throw new Error(`无效的池名称。可用池: ${Object.keys(TOKEN_CONFIG).join(', ')}, all`)
    }

    const results = []
    for (const symbol of poolsToUpdate) {
      const config = TOKEN_CONFIG[symbol]
      const result = await resetPoolRewardRate(symbol, config)
      results.push(result)

      // 等待一下再处理下一个池
      if (symbol !== poolsToUpdate[poolsToUpdate.length - 1]) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }

    // 汇总
    console.log('\n' + '='.repeat(80))
    console.log('   汇总')
    console.log('='.repeat(80))
    const successCount = results.filter((r) => r.success).length
    const failedCount = results.filter((r) => !r.success).length

    console.log(`✅ 成功: ${successCount}`)
    console.log(`❌ 失败: ${failedCount}`)
    console.log('='.repeat(80) + '\n')

    if (CONFIG.DRY_RUN || !CONFIG.EXECUTE) {
      console.log('💡 提示: 这是预览模式，没有实际执行交易')
      console.log('   要实际执行，请使用 --execute 参数\n')
    }

    process.exit(failedCount > 0 ? 1 : 0)
  } catch (error) {
    console.error('\n❌ 致命错误:', error.message)
    process.exit(1)
  }
}

main().catch(console.error)
