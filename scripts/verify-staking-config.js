const axios = require('axios')
const { ethers } = require('ethers')
const { formatUnits } = require('ethers/lib/utils')
require('dotenv').config()

const CONFIG = {
  // 区块链配置
  RPC_URL: process.env.RPC_URL || 'https://rpc.nbcex.com',
  STAKING_CONTRACT_ADDRESS: process.env.STAKING_CONTRACT_ADDRESS || '0x32580B2001EA941529c79bcb819b8f6F3c886c60',

  // 质押配置
  TOTAL_STAKED_NBC: process.env.TOTAL_STAKED_NBC || '1000000000000000000000000', // 预期总质押量
  TARGET_APR: parseFloat(process.env.TARGET_APR || '100'), // 目标 APR
  SECONDS_PER_YEAR: 31536000,

  // 价格 API
  NBC_API_URL:
    'https://www.nbcex.com/v1/rest/api/market/ticker?symbol=nbcusdt&accessKey=3PswIE0Z9w26R9MC5XrGU8b6LD4bQIWWO1x3nwix1xI=',
  NBCEX_API_BASE: 'https://www.nbcex.com/v1/rest/api/market/ticker',
  NBCEX_ACCESS_KEY: '3PswIE0Z9w26R9MC5XrGU8b6LD4bQIWWO1x3nwix1xI=',
}

// 代币配置（从 dynamic-reward-adjuster.js 中提取）
const TOKEN_CONFIG = {
  BTC: {
    poolIndex: 1,
    address: '0xb225C29Da2CaB86991b7e0651c63f0fD5C16613C',
    decimals: 8,
    nbcexSymbol: 'btcusdt',
  },
  ETH: {
    poolIndex: 2,
    address: '0x1Feba2E24a6b7F1D07F55Aa7ba59a4a4bAF9f908',
    decimals: 18,
    nbcexSymbol: 'ethusdt',
  },
  SOL: {
    poolIndex: 3,
    address: '0xd5eECCC885Ef850d90AE40E716c3dFCe5C3D4c81',
    decimals: 18,
    nbcexSymbol: 'solusdt',
  },
  BNB: {
    poolIndex: 4,
    address: '0x9C43237490272BfdD2F1d1ca0B34f20b1A3C9f5c',
    decimals: 18,
    nbcexSymbol: 'bnbusdt',
  },
  XRP: {
    poolIndex: 5,
    address: '0x48e1772534fabBdcaDe9ca4005E5Ee8BF4190093',
    decimals: 18,
    nbcexSymbol: 'xrpusdt',
  },
  LTC: {
    poolIndex: 6,
    address: '0x8d22041C22d696fdfF0703852a706a40Ff65a7de',
    decimals: 18,
    nbcexSymbol: 'ltcusdt',
  },
  DOGE: {
    poolIndex: 7,
    address: '0x8cEb9a93405CDdf3D76f72327F868Bd3E8755D89',
    decimals: 18,
    nbcexSymbol: 'dogeusdt',
  },
  USDT: {
    poolIndex: 9,
    address: '0x4E4D07268eFFB4d3507a69F64b5780Eb16551f85',
    decimals: 6,
    nbcexSymbol: 'usdtusdt',
  },
  SUI: {
    poolIndex: 10,
    address: '0x9011191E84Ad832100Ddc891E360f8402457F55E',
    decimals: 18,
    nbcexSymbol: 'suiusdt',
  },
}

const STAKING_ABI = [
  'function getPoolInfo(uint256) view returns (address rewardToken, uint256 totalStakedAmount, uint256 rewardRate, uint256 periodFinish, bool active)',
  'function totalStaked(uint256) view returns (uint256)',
]

/**
 * 获取 NBC 价格
 */
async function getNBCPrice() {
  try {
    const response = await axios.get(CONFIG.NBC_API_URL, {
      timeout: 10000,
      headers: {
        Accept: 'application/json',
      },
    })

    const data = response.data.data || response.data
    const buyPrice = data.buy

    if (buyPrice === undefined || buyPrice === null) {
      throw new Error('Invalid API response: missing buy field')
    }

    const price = parseFloat(buyPrice)
    if (!price || price <= 0 || !isFinite(price)) {
      throw new Error(`Invalid price: ${buyPrice}`)
    }

    return price
  } catch (error) {
    console.error(`❌ 获取 NBC 价格失败:`, error.message)
    throw error
  }
}

/**
 * 获取代币价格
 */
async function getTokenPrice(symbol, nbcexSymbol) {
  try {
    if (symbol === 'USDT') {
      return 1.0
    }

    const url = `${CONFIG.NBCEX_API_BASE}?symbol=${nbcexSymbol}&accessKey=${CONFIG.NBCEX_ACCESS_KEY}`
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        Accept: 'application/json',
      },
    })

    const data = response.data.data || response.data
    const buyPrice = data.buy

    if (buyPrice === undefined || buyPrice === null) {
      throw new Error('Invalid API response: missing buy field')
    }

    const price = parseFloat(buyPrice)
    if (!price || price <= 0 || !isFinite(price)) {
      throw new Error(`Invalid price: ${buyPrice}`)
    }

    return price
  } catch (error) {
    console.warn(`⚠️  获取 ${symbol} 价格失败:`, error.message)
    return null
  }
}

/**
 * 计算实际 APR（从 rewardRate 反向计算）
 */
function calculateActualAPR(rewardRate, totalStakedNBC, tokenPrice, nbcPrice, tokenDecimals) {
  if (totalStakedNBC.isZero()) return 0

  // 年总奖励（代币，wei 单位）
  const annualRewardToken = rewardRate.mul(CONFIG.SECONDS_PER_YEAR)

  // 兑换比例
  const conversionRate = tokenPrice / nbcPrice

  // 转换为 NBC（使用浮点数计算避免精度问题）
  const annualRewardTokenNum = Number(formatUnits(annualRewardToken, tokenDecimals))
  const annualRewardNBCNum = annualRewardTokenNum * conversionRate
  const totalStakedNBCNum = Number(formatUnits(totalStakedNBC, 18))

  // APR = (年总奖励 NBC / 总质押量 NBC) × 100
  const apr = (annualRewardNBCNum / totalStakedNBCNum) * 100

  return apr
}

/**
 * 验证单个池
 */
async function verifyPool(symbol, config, nbcPrice, tokenPrice) {
  const provider = new ethers.providers.JsonRpcProvider(CONFIG.RPC_URL)
  const stakingContract = new ethers.Contract(CONFIG.STAKING_CONTRACT_ADDRESS, STAKING_ABI, provider)

  try {
    // 获取池信息
    const poolInfo = await stakingContract.getPoolInfo(config.poolIndex)
    const totalStaked = await stakingContract.totalStaked(config.poolIndex)

    const rewardToken = poolInfo.rewardToken
    const totalStakedAmount = poolInfo.totalStakedAmount
    const rewardRate = poolInfo.rewardRate
    const periodFinish = poolInfo.periodFinish
    const active = poolInfo.active

    // 验证代币地址
    const addressMatch = rewardToken.toLowerCase() === config.address.toLowerCase()

    // 验证奖励期
    const currentTime = Math.floor(Date.now() / 1000)
    const periodValid = Number(periodFinish) > currentTime
    const periodFinishDate = new Date(Number(periodFinish) * 1000)
    const daysRemaining = Math.floor((Number(periodFinish) - currentTime) / 86400)

    // 计算实际 APR（基于实际质押量）
    let actualAPR = 0
    if (tokenPrice && !totalStakedAmount.isZero()) {
      actualAPR = calculateActualAPR(rewardRate, totalStakedAmount, tokenPrice, nbcPrice, config.decimals)
    }

    // 计算预期 APR（基于预期总质押量）
    const expectedTotalStaked = ethers.BigNumber.from(CONFIG.TOTAL_STAKED_NBC)
    let expectedAPR = 0
    if (tokenPrice && !expectedTotalStaked.isZero()) {
      expectedAPR = calculateActualAPR(rewardRate, expectedTotalStaked, tokenPrice, nbcPrice, config.decimals)
    }

    // 计算 APR 差异
    const aprDiff = actualAPR - expectedAPR
    const aprDiffPercent = expectedAPR > 0 ? (aprDiff / expectedAPR) * 100 : 0

    // 计算年总奖励
    const annualRewardToken = rewardRate.mul(CONFIG.SECONDS_PER_YEAR)
    const annualRewardTokenNum = Number(formatUnits(annualRewardToken, config.decimals))

    // 计算兑换比例
    const conversionRate = tokenPrice ? tokenPrice / nbcPrice : 0

    return {
      symbol,
      poolIndex: config.poolIndex,
      addressMatch,
      active,
      periodValid,
      periodFinish: periodFinishDate.toISOString(),
      daysRemaining,
      rewardRate: rewardRate.toString(),
      annualRewardToken: annualRewardTokenNum,
      totalStakedNBC: formatUnits(totalStakedAmount, 18),
      actualAPR,
      expectedAPR,
      aprDiff,
      aprDiffPercent,
      tokenPrice,
      nbcPrice,
      conversionRate,
    }
  } catch (error) {
    return {
      symbol,
      poolIndex: config.poolIndex,
      error: error.message,
    }
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================')
  console.log('   质押池配置验证')
  console.log('========================================\n')

  console.log(`合约地址: ${CONFIG.STAKING_CONTRACT_ADDRESS}`)
  console.log(`预期总质押量: ${formatUnits(CONFIG.TOTAL_STAKED_NBC, 18)} NBC`)
  console.log(`目标 APR: ${CONFIG.TARGET_APR}%`)
  console.log('========================================\n')

  // 获取价格
  console.log('📊 获取价格信息...')
  const nbcPrice = await getNBCPrice()
  console.log(`✅ NBC 价格: $${nbcPrice.toFixed(4)}\n`)

  const tokenPrices = {}
  for (const [symbol, config] of Object.entries(TOKEN_CONFIG)) {
    if (symbol === 'USDT') {
      tokenPrices[symbol] = 1.0
      console.log(`✅ ${symbol} 价格: $1.0000 (固定)`)
    } else {
      const price = await getTokenPrice(symbol, config.nbcexSymbol)
      if (price) {
        tokenPrices[symbol] = price
        console.log(`✅ ${symbol} 价格: $${price.toFixed(4)}`)
      } else {
        console.warn(`⚠️  ${symbol} 价格获取失败`)
      }
    }
  }
  console.log('')

  // 验证所有池
  console.log('🔍 验证池配置...\n')
  const results = []
  for (const [symbol, config] of Object.entries(TOKEN_CONFIG)) {
    const tokenPrice = tokenPrices[symbol]
    const result = await verifyPool(symbol, config, nbcPrice, tokenPrice)
    results.push(result)
  }

  // 输出结果
  console.log('========================================')
  console.log('   验证结果详情')
  console.log('========================================\n')

  for (const result of results) {
    if (result.error) {
      console.log(`❌ ${result.symbol} 池 (索引: ${result.poolIndex}):`)
      console.log(`   错误: ${result.error}\n`)
      continue
    }

    console.log(`${result.symbol} 池 (索引: ${result.poolIndex}):`)
    console.log(
      `   代币地址匹配: ${result.addressMatch ? '✅' : '❌'} ${
        result.addressMatch ? '' : `(期望: ${TOKEN_CONFIG[result.symbol].address})`
      }`,
    )
    console.log(`   池状态: ${result.active ? '✅ 激活' : '❌ 未激活'}`)
    console.log(
      `   奖励期: ${result.periodValid ? '✅ 有效' : '❌ 已过期'} (剩余 ${result.daysRemaining} 天, 结束时间: ${
        result.periodFinish
      })`,
    )
    console.log(`   总质押量: ${result.totalStakedNBC} NBC`)
    console.log(`   奖励率: ${result.rewardRate} wei/s`)
    console.log(`   年总奖励: ${result.annualRewardToken.toFixed(6)} ${result.symbol}`)
    console.log(`   兑换比例: 1 ${result.symbol} = ${result.conversionRate.toFixed(2)} NBC`)
    console.log(`   实际 APR: ${result.actualAPR.toFixed(2)}% ${result.totalStakedNBC === '0.0' ? '(无质押)' : ''}`)
    console.log(
      `   预期 APR: ${result.expectedAPR.toFixed(2)}% (基于预期质押量 ${formatUnits(CONFIG.TOTAL_STAKED_NBC, 18)} NBC)`,
    )

    if (result.totalStakedNBC !== '0.0') {
      if (Math.abs(result.aprDiffPercent) < 1) {
        console.log(
          `   APR 差异: ✅ ${result.aprDiff > 0 ? '+' : ''}${result.aprDiff.toFixed(2)}% (${
            result.aprDiffPercent > 0 ? '+' : ''
          }${result.aprDiffPercent.toFixed(2)}%)`,
        )
      } else if (Math.abs(result.aprDiffPercent) < 5) {
        console.log(
          `   APR 差异: ⚠️  ${result.aprDiff > 0 ? '+' : ''}${result.aprDiff.toFixed(2)}% (${
            result.aprDiffPercent > 0 ? '+' : ''
          }${result.aprDiffPercent.toFixed(2)}%)`,
        )
      } else {
        console.log(
          `   APR 差异: ⚠️  ${result.aprDiff > 0 ? '+' : ''}${result.aprDiff.toFixed(2)}% (${
            result.aprDiffPercent > 0 ? '+' : ''
          }${result.aprDiffPercent.toFixed(2)}%)`,
        )
        console.log(
          `   ⚠️  注意: 实际 APR 与预期差异较大，可能是因为实际质押量 (${result.totalStakedNBC} NBC) 与预期不同`,
        )
      }
    }
    console.log('')
  }

  // 汇总统计
  const successCount = results.filter((r) => !r.error && r.addressMatch && r.active && r.periodValid).length
  const errorCount = results.filter((r) => r.error).length
  const warningCount = results.filter(
    (r) => !r.error && (!r.addressMatch || !r.active || !r.periodValid || Math.abs(r.aprDiffPercent) > 5),
  ).length

  console.log('========================================')
  console.log('   统计汇总')
  console.log('========================================')
  console.log(`✅ 正常: ${successCount}`)
  console.log(`⚠️  警告: ${warningCount}`)
  console.log(`❌ 错误: ${errorCount}`)
  console.log('========================================\n')

  // 计算说明
  if (warningCount > 0 || errorCount > 0) {
    console.log('💡 说明:')
    console.log('   - APR 差异是因为实际质押量与预期质押量不同')
    console.log('   - 如果实际质押量 < 预期 → 实际 APR > 预期 APR（对用户更有利）')
    console.log('   - 如果实际质押量 > 预期 → 实际 APR < 预期 APR（奖励被稀释）')
    console.log('   - 这是正常现象，奖励率是固定的，但 APR 会根据实际质押量动态变化\n')
  }
}

main().catch(console.error)
