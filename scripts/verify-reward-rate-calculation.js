const axios = require('axios')
const { ethers } = require('ethers')
const { formatUnits, parseUnits } = require('ethers/lib/utils')
require('dotenv').config()

const CONFIG = {
  // 区块链配置
  RPC_URL: process.env.RPC_URL || 'https://rpc.nbcex.com',
  STAKING_CONTRACT_ADDRESS: process.env.STAKING_CONTRACT_ADDRESS || '0x107B4E8F1b849b69033FbF4AAcb10B72d29A16E1',

  // 质押配置
  TOTAL_STAKED_NBC: process.env.TOTAL_STAKED_NBC || '1000000000000000000000000', // 预期总质押量
  TARGET_APR: parseFloat(process.env.TARGET_APR || '100'), // 目标 APR
  SECONDS_PER_YEAR: 31536000,

  // 价格 API
  NBC_API_URL:
    'https://www.nbcex.com/v1/rest/api/market/ticker?symbol=nbcusdt&accessKey=3PswIE0Z9w26R9MC5XrGU8b6LD4bQIWWO1x3nwix1xI=',
  NBCEX_API_BASE: 'https://www.nbcex.com/v1/rest/api/market/ticker',
  NBCEX_ACCESS_KEY: '3PswIE0Z9w26R9MC5XrGU8b6LD4bQIWWO1x3nwix1xI=',
  GATEIO_API_URL: 'https://api.gateio.ws/api/v4/spot/tickers',
  OKX_API_URL: 'https://www.okx.com/api/v5/market/ticker',
  BINANCE_API_URL: 'https://api.binance.com/api/v3/ticker/price',
  COINGECKO_API_URL: 'https://api.coingecko.com/api/v3/simple/price',
  PRICE_API_TIMEOUT: 30000,
  PRICE_API_RETRIES: 3,
}

// 代币配置
const TOKEN_CONFIG = {
  BTC: {
    poolIndex: 1,
    address: '0xb225C29Da2CaB86991b7e0651c63f0fD5C16613C',
    decimals: 8,
    nbcexSymbol: 'btcusdt',
    gateioSymbol: 'BTC_USDT',
    binanceSymbol: 'BTCUSDT',
    okxSymbol: 'BTC-USDT',
  },
  ETH: {
    poolIndex: 2,
    address: '0x934EbeB6D7D3821B604A5D10F80619d5bcBe49C3',
    decimals: 18,
    nbcexSymbol: 'ethusdt',
    gateioSymbol: 'ETH_USDT',
    binanceSymbol: 'ETHUSDT',
    okxSymbol: 'ETH-USDT',
  },
  SOL: {
    poolIndex: 3,
    address: '0xd5eECCC885Ef850d90AE40E716c3dFCe5C3D4c81',
    decimals: 18,
    nbcexSymbol: 'solusdt',
    gateioSymbol: 'SOL_USDT',
    binanceSymbol: 'SOLUSDT',
    okxSymbol: 'SOL-USDT',
  },
  BNB: {
    poolIndex: 4,
    address: '0x9C43237490272BfdD2F1d1ca0B34f20b1A3C9f5c',
    decimals: 18,
    nbcexSymbol: 'bnbusdt',
    gateioSymbol: 'BNB_USDT',
    binanceSymbol: 'BNBUSDT',
    okxSymbol: 'BNB-USDT',
  },
  XRP: {
    poolIndex: 5,
    address: '0x48e1772534fabBdcaDe9ca4005E5Ee8BF4190093',
    decimals: 18,
    nbcexSymbol: 'xrpusdt',
    gateioSymbol: 'XRP_USDT',
    binanceSymbol: 'XRPUSDT',
    okxSymbol: 'XRP-USDT',
  },
  LTC: {
    poolIndex: 6,
    address: '0x8d22041C22d696fdfF0703852a706a40Ff65a7de',
    decimals: 18,
    nbcexSymbol: 'ltcusdt',
    gateioSymbol: 'LTC_USDT',
    binanceSymbol: 'LTCUSDT',
    okxSymbol: 'LTC-USDT',
  },
  DOGE: {
    poolIndex: 7,
    address: '0x8cEb9a93405CDdf3D76f72327F868Bd3E8755D89',
    decimals: 18,
    nbcexSymbol: 'dogeusdt',
    gateioSymbol: 'DOGE_USDT',
    binanceSymbol: 'DOGEUSDT',
    okxSymbol: 'DOGE-USDT',
  },
  USDT: {
    poolIndex: 9,
    address: '0xfd1508502696d0E1910eD850c6236d965cc4db11',
    decimals: 6,
    nbcexSymbol: 'usdtusdt',
    gateioSymbol: 'USDT_USDT',
    binanceSymbol: 'USDTUSDT',
    okxSymbol: 'USDT-USDT',
  },
  SUI: {
    poolIndex: 10,
    address: '0x9011191E84Ad832100Ddc891E360f8402457F55E',
    decimals: 18,
    nbcexSymbol: 'suiusdt',
    gateioSymbol: 'SUI_USDT',
    binanceSymbol: 'SUIUSDT',
    okxSymbol: 'SUI-USDT',
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
      headers: { Accept: 'application/json' },
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
    throw new Error(`Failed to fetch NBC price: ${error.message}`)
  }
}

/**
 * 获取代币价格（多级回退）
 */
async function getTokenPrice(symbol, config) {
  if (symbol === 'USDT') {
    return 1.0
  }

  // 1. 尝试 NBC Exchange
  try {
    const url = `${CONFIG.NBCEX_API_BASE}?symbol=${config.nbcexSymbol}&accessKey=${CONFIG.NBCEX_ACCESS_KEY}`
    const response = await axios.get(url, { timeout: CONFIG.PRICE_API_TIMEOUT })
    const data = response.data.data || response.data
    if (data && data.buy) {
      return parseFloat(data.buy)
    }
  } catch (error) {
    // 继续尝试下一个
  }

  // 2. 尝试 Gate.io
  try {
    const response = await axios.get(`${CONFIG.GATEIO_API_URL}?currency_pair=${config.gateioSymbol}`, {
      timeout: CONFIG.PRICE_API_TIMEOUT,
    })
    if (response.data && response.data[0] && response.data[0].last) {
      return parseFloat(response.data[0].last)
    }
  } catch (error) {
    // 继续尝试下一个
  }

  // 3. 尝试 OKX
  try {
    const response = await axios.get(`${CONFIG.OKX_API_URL}?instId=${config.okxSymbol}`, {
      timeout: CONFIG.PRICE_API_TIMEOUT,
    })
    if (response.data && response.data.data && response.data.data[0] && response.data.data[0].last) {
      return parseFloat(response.data.data[0].last)
    }
  } catch (error) {
    // 继续尝试下一个
  }

  // 4. 尝试 Binance
  try {
    const response = await axios.get(`${CONFIG.BINANCE_API_URL}?symbol=${config.binanceSymbol}`, {
      timeout: CONFIG.PRICE_API_TIMEOUT,
    })
    if (response.data && response.data.price) {
      return parseFloat(response.data.price)
    }
  } catch (error) {
    // 继续尝试下一个
  }

  // 5. 尝试 CoinGecko
  try {
    const coingeckoId = {
      BTC: 'bitcoin',
      ETH: 'ethereum',
      SOL: 'solana',
      BNB: 'binancecoin',
      XRP: 'ripple',
      LTC: 'litecoin',
      DOGE: 'dogecoin',
      SUI: 'sui',
    }[symbol]

    if (coingeckoId) {
      const response = await axios.get(`${CONFIG.COINGECKO_API_URL}?ids=${coingeckoId}&vs_currencies=usd`, {
        timeout: CONFIG.PRICE_API_TIMEOUT,
      })
      if (response.data && response.data[coingeckoId] && response.data[coingeckoId].usd) {
        return response.data[coingeckoId].usd
      }
    }
  } catch (error) {
    // 所有 API 都失败
  }

  return null
}

/**
 * 按照 U 本位计算正确的奖励率
 */
function calculateCorrectRewardRate(tokenPriceUSD, nbcPriceUSD, tokenDecimals) {
  // APR 转换为小数
  const aprDecimal = CONFIG.TARGET_APR / 100

  // 年总奖励（NBC，wei 单位）
  const totalStakedNBC = ethers.BigNumber.from(CONFIG.TOTAL_STAKED_NBC)
  const aprMultiplier = Math.floor(aprDecimal * 10000)
  const annualRewardNBCWei = totalStakedNBC.mul(aprMultiplier).div(10000)

  // 兑换比例（1 奖励代币 = X NBC）
  const conversionRate = tokenPriceUSD / nbcPriceUSD

  // 转换为奖励代币数量
  const conversionRateStr = conversionRate.toFixed(18)
  const conversionRateParts = conversionRateStr.split('.')
  const integerPart = conversionRateParts[0]
  const decimalPart = (conversionRateParts[1] || '').padEnd(18, '0').substring(0, 18)
  const conversionRateScaled = ethers.BigNumber.from(integerPart + decimalPart)

  const rewardTokenMultiplier = ethers.BigNumber.from(10).pow(tokenDecimals)

  // 年总奖励代币（wei 单位）
  const annualRewardToken = annualRewardNBCWei.mul(rewardTokenMultiplier).div(conversionRateScaled)

  // 每秒奖励率（向上取整，确保不会因为向下取整导致 APR 不足）
  // 方法：先加 (SECONDS_PER_YEAR - 1)，再除以 SECONDS_PER_YEAR，这样会向上取整
  const secondsPerYearBN = ethers.BigNumber.from(CONFIG.SECONDS_PER_YEAR)
  const rewardRate = annualRewardToken.add(secondsPerYearBN.sub(1)).div(secondsPerYearBN)

  return {
    rewardRate,
    annualReward: annualRewardToken,
    conversionRate,
  }
}

/**
 * 从 rewardRate 反推 APR（基于实际质押量）
 */
function calculateAPRFromRewardRate(rewardRate, totalStakedNBC, tokenPrice, nbcPrice, tokenDecimals) {
  if (totalStakedNBC.isZero()) return 0

  // 年总奖励（代币，wei 单位）
  const annualRewardToken = rewardRate.mul(CONFIG.SECONDS_PER_YEAR)

  // 兑换比例
  const conversionRate = tokenPrice / nbcPrice

  // 转换为 NBC
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

    const actualRewardRate = poolInfo.rewardRate
    const totalStakedAmount = poolInfo.totalStakedAmount

    // 计算正确的奖励率（基于当前价格，U 本位）
    const correctCalculation = calculateCorrectRewardRate(tokenPrice, nbcPrice, config.decimals)

    // 计算实际 APR（基于实际质押量）
    const actualAPR = calculateAPRFromRewardRate(
      actualRewardRate,
      totalStakedAmount,
      tokenPrice,
      nbcPrice,
      config.decimals,
    )

    // 计算预期 APR（基于预期质押量）
    const expectedTotalStaked = ethers.BigNumber.from(CONFIG.TOTAL_STAKED_NBC)
    const expectedAPR = calculateAPRFromRewardRate(
      actualRewardRate,
      expectedTotalStaked,
      tokenPrice,
      nbcPrice,
      config.decimals,
    )

    // 计算正确的 APR（基于预期质押量和正确的奖励率）
    const correctAPR = calculateAPRFromRewardRate(
      correctCalculation.rewardRate,
      expectedTotalStaked,
      tokenPrice,
      nbcPrice,
      config.decimals,
    )

    // 计算年总奖励
    const actualAnnualReward = actualRewardRate.mul(CONFIG.SECONDS_PER_YEAR)
    const correctAnnualReward = correctCalculation.annualReward

    // 计算差异
    const rewardRateDiff = actualRewardRate.sub(correctCalculation.rewardRate)
    const rewardRateDiffPercent =
      !correctCalculation.rewardRate.isZero() && actualRewardRate.gt(0)
        ? Number(rewardRateDiff.mul(10000).div(correctCalculation.rewardRate)) / 100
        : 0

    return {
      symbol,
      poolIndex: config.poolIndex,
      actualRewardRate: actualRewardRate.toString(),
      correctRewardRate: correctCalculation.rewardRate.toString(),
      rewardRateDiff: rewardRateDiff.toString(),
      rewardRateDiffPercent,
      actualAnnualReward: Number(formatUnits(actualAnnualReward, config.decimals)),
      correctAnnualReward: Number(formatUnits(correctAnnualReward, config.decimals)),
      totalStakedNBC: formatUnits(totalStakedAmount, 18),
      actualAPR,
      expectedAPR,
      correctAPR,
      conversionRate: correctCalculation.conversionRate,
      tokenPrice,
      nbcPrice,
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
  console.log('='.repeat(80))
  console.log('   奖励率计算验证（U 本位）')
  console.log('='.repeat(80))
  console.log(`合约地址: ${CONFIG.STAKING_CONTRACT_ADDRESS}`)
  console.log(`预期总质押量: ${formatUnits(CONFIG.TOTAL_STAKED_NBC, 18)} NBC`)
  console.log(`目标 APR: ${CONFIG.TARGET_APR}%`)
  console.log('='.repeat(80))
  console.log('')

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
      const price = await getTokenPrice(symbol, config)
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
  console.log('🔍 验证奖励率计算...\n')
  const results = []
  for (const [symbol, config] of Object.entries(TOKEN_CONFIG)) {
    const tokenPrice = tokenPrices[symbol]
    if (!tokenPrice) {
      console.warn(`⚠️  跳过 ${symbol}（价格获取失败）`)
      continue
    }
    const result = await verifyPool(symbol, config, nbcPrice, tokenPrice)
    results.push(result)
  }

  // 输出结果
  console.log('='.repeat(80))
  console.log('   验证结果详情')
  console.log('='.repeat(80))
  console.log('')

  let successCount = 0
  let warningCount = 0
  let errorCount = 0

  for (const result of results) {
    if (result.error) {
      errorCount++
      console.log(`❌ ${result.symbol} 池 (索引: ${result.poolIndex}):`)
      console.log(`   错误: ${result.error}\n`)
      continue
    }

    console.log(`${result.symbol} 池 (索引: ${result.poolIndex}):`)
    console.log('-'.repeat(80))
    console.log(`当前价格:`)
    console.log(`  NBC: $${result.nbcPrice.toFixed(4)}`)
    console.log(`  ${result.symbol}: $${result.tokenPrice.toFixed(4)}`)
    console.log(`  兑换比例: 1 ${result.symbol} = ${result.conversionRate.toFixed(2)} NBC`)
    console.log('')
    console.log(`实际质押量: ${result.totalStakedNBC} NBC`)
    console.log('')
    console.log(`奖励率对比:`)
    console.log(`  实际 rewardRate: ${result.actualRewardRate} wei/s`)
    console.log(`  正确 rewardRate: ${result.correctRewardRate} wei/s`)
    console.log(
      `  差异: ${result.rewardRateDiff} wei/s (${
        result.rewardRateDiffPercent > 0 ? '+' : ''
      }${result.rewardRateDiffPercent.toFixed(2)}%)`,
    )
    console.log('')
    console.log(`年总奖励对比:`)
    console.log(`  实际年总奖励: ${result.actualAnnualReward.toFixed(6)} ${result.symbol}`)
    console.log(`  正确年总奖励: ${result.correctAnnualReward.toFixed(6)} ${result.symbol}`)
    console.log(`  差异: ${(result.actualAnnualReward - result.correctAnnualReward).toFixed(6)} ${result.symbol}`)
    console.log('')
    console.log(`APR 对比:`)
    console.log(`  实际 APR (基于实际质押量 ${result.totalStakedNBC} NBC): ${result.actualAPR.toFixed(2)}%`)
    console.log(
      `  预期 APR (基于预期质押量 ${formatUnits(
        CONFIG.TOTAL_STAKED_NBC,
        18,
      )} NBC，使用实际奖励率): ${result.expectedAPR.toFixed(2)}%`,
    )
    console.log(
      `  正确 APR (基于预期质押量 ${formatUnits(
        CONFIG.TOTAL_STAKED_NBC,
        18,
      )} NBC，使用正确奖励率): ${result.correctAPR.toFixed(2)}%`,
    )
    console.log('')

    // 判断状态
    const rewardRateMatch = result.rewardRateDiffPercent === 0 || Math.abs(result.rewardRateDiffPercent) < 0.01
    const aprMatch = Math.abs(result.expectedAPR - result.correctAPR) < 0.01

    if (rewardRateMatch && aprMatch) {
      successCount++
      console.log(`状态: ✅ 正确`)
    } else {
      warningCount++
      console.log(`状态: ⚠️  奖励率不匹配`)
      if (Math.abs(result.rewardRateDiffPercent) > 10) {
        console.log(`  ⚠️  警告: 奖励率差异超过 10%，需要更新！`)
      }
    }
    console.log('-'.repeat(80))
    console.log('')
  }

  // 输出汇总
  console.log('='.repeat(80))
  console.log('   统计汇总')
  console.log('='.repeat(80))
  console.log(`✅ 正确: ${successCount}`)
  console.log(`⚠️  警告: ${warningCount}`)
  console.log(`❌ 错误: ${errorCount}`)
  console.log('='.repeat(80))
  console.log('')
  console.log('💡 说明:')
  console.log('- 奖励率应该基于当前价格（U 本位）动态计算')
  console.log('- 如果奖励率差异较大，需要运行 dynamic-reward-adjuster.js 更新')
  console.log('- 实际 APR 会根据实际质押量动态变化，这是正常现象')
  console.log('='.repeat(80))
}

// 运行
main().catch((error) => {
  console.error('❌ 错误:', error)
  process.exit(1)
})
