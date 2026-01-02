const axios = require('axios')
const { ethers } = require('ethers')
const { formatUnits, parseUnits } = require('ethers/lib/utils')
require('dotenv').config()

const CONFIG = {
  // 交易所 API
  NBC_API_URL:
    'https://www.nbcex.com/v1/rest/api/market/ticker?symbol=nbcusdt&accessKey=3PswIE0Z9w26R9MC5XrGU8b6LD4bQIWWO1x3nwix1xI=',

  // 主流币价格 API（优先级：NBC交易所 -> OKX -> Binance -> CoinGecko）
  NBCEX_API_BASE: 'https://www.nbcex.com/v1/rest/api/market/ticker',
  NBCEX_ACCESS_KEY: '3PswIE0Z9w26R9MC5XrGU8b6LD4bQIWWO1x3nwix1xI=',
  OKX_API_URL: 'https://www.okx.com/api/v5/market/ticker',
  BINANCE_API_URL: 'https://api.binance.com/api/v3/ticker/price',
  COINGECKO_API_URL: 'https://api.coingecko.com/api/v3/simple/price',
  PRICE_API_TIMEOUT: 30000, // 30 秒
  PRICE_API_RETRIES: 3, // 重试 3 次

  // 区块链配置
  RPC_URL: process.env.RPC_URL || 'https://rpc.nbcex.com',
  PRIVATE_KEY: process.env.PRIVATE_KEY,

  // 合约地址
  STAKING_CONTRACT_ADDRESS: process.env.STAKING_CONTRACT_ADDRESS,

  // 质押配置
  TOTAL_STAKED_NBC: process.env.TOTAL_STAKED_NBC || '1000000000000000000000000', // 1,000,000 NBC
  TARGET_APR: parseFloat(process.env.TARGET_APR || '100'), // 100%
  REWARDS_DURATION: parseInt(process.env.REWARDS_DURATION || '31536000'), // 1年（秒）
  SECONDS_PER_YEAR: 31536000,

  // 价格调整配置
  BASE_NBC_PRICE: 0.11, // 基础 NBC 价格（USD），用于计算初始兑换比例
  PRICE_MULTIPLIER: parseFloat(process.env.PRICE_MULTIPLIER || '1.0'), // 价格影响系数（1.0 = 100%）
  MIN_PRICE_CHANGE: parseFloat(process.env.MIN_PRICE_CHANGE || '0.05'), // 最小价格变化才更新（5%）

  // 更新配置
  UPDATE_INTERVAL: parseInt(process.env.UPDATE_INTERVAL || '300000'), // 5分钟
}

// 代币配置（从 calculate-reward-rates.js 中提取）
const TOKEN_CONFIG = {
  BTC: {
    poolIndex: 1,
    address: '0x5EaA2c6ae3bFf47D2188B64F743Ec777733a80ac',
    decimals: 8,
    coingeckoId: 'bitcoin',
    nbcexSymbol: 'btcusdt',
    binanceSymbol: 'BTCUSDT',
    okxSymbol: 'BTC-USDT',
  },
  ETH: {
    poolIndex: 2,
    address: '0x934EbeB6D7D3821B604A5D10F80619d5bcBe49C3',
    decimals: 18,
    coingeckoId: 'ethereum',
    nbcexSymbol: 'ethusdt',
    binanceSymbol: 'ETHUSDT',
    okxSymbol: 'ETH-USDT',
  },
  SOL: {
    poolIndex: 3,
    address: '0xd5eECCC885Ef850d90AE40E716c3dFCe5C3D4c81',
    decimals: 18,
    coingeckoId: 'solana',
    nbcexSymbol: 'solusdt',
    binanceSymbol: 'SOLUSDT',
    okxSymbol: 'SOL-USDT',
  },
  BNB: {
    poolIndex: 4,
    address: '0x9C43237490272BfdD2F1d1ca0B34f20b1A3C9f5c',
    decimals: 18,
    coingeckoId: 'binancecoin',
    nbcexSymbol: 'bnbusdt',
    binanceSymbol: 'BNBUSDT',
    okxSymbol: 'BNB-USDT',
  },
  XRP: {
    poolIndex: 5,
    address: '0x48e1772534fabBdcaDe9ca4005E5Ee8BF4190093',
    decimals: 18,
    coingeckoId: 'ripple',
    nbcexSymbol: 'xrpusdt',
    binanceSymbol: 'XRPUSDT',
    okxSymbol: 'XRP-USDT',
  },
  LTC: {
    poolIndex: 6,
    address: '0x8d22041C22d696fdfF0703852a706a40Ff65a7de',
    decimals: 18,
    coingeckoId: 'litecoin',
    nbcexSymbol: 'ltcusdt',
    binanceSymbol: 'LTCUSDT',
    okxSymbol: 'LTC-USDT',
  },
  DOGE: {
    poolIndex: 7,
    address: '0x8cEb9a93405CDdf3D76f72327F868Bd3E8755D89',
    decimals: 18,
    coingeckoId: 'dogecoin',
    nbcexSymbol: 'dogeusdt',
    binanceSymbol: 'DOGEUSDT',
    okxSymbol: 'DOGE-USDT',
  },
  USDT: {
    poolIndex: 9,
    address: '0xfd1508502696d0E1910eD850c6236d965cc4db11',
    decimals: 6,
    coingeckoId: 'tether',
    nbcexSymbol: 'usdtusdt', // USDT 价格固定为 1
    binanceSymbol: 'USDTUSDT', // USDT 价格固定为 1
    okxSymbol: 'USDT-USDT', // USDT 价格固定为 1
  },
  SUI: {
    poolIndex: 10,
    address: '0x9011191E84Ad832100Ddc891E360f8402457F55E',
    decimals: 18,
    coingeckoId: 'sui',
    nbcexSymbol: 'suiusdt',
    binanceSymbol: 'SUIUSDT',
    okxSymbol: 'SUI-USDT',
  },
}

// 合约 ABI
const STAKING_ABI = [
  'function notifyRewardAmount(uint256 poolIndex, uint256 reward) external',
  'function getPoolInfo(uint256 poolIndex) external view returns (address rewardToken, uint256 totalStakedAmount, uint256 rewardRate, uint256 periodFinish, bool active)',
]

/**
 * 获取 NBC 实时价格
 */
async function getNBCPrice() {
  try {
    console.log(`[${new Date().toISOString()}] 📊 Fetching NBC price from exchange...`)

    const response = await axios.get(CONFIG.NBC_API_URL, {
      timeout: 10000,
      headers: {
        Accept: 'application/json',
      },
    })

    // API 返回格式: { status: "success", data: { buy: 0.08184, ... } }
    const data = response.data.data || response.data
    const buyPrice = data.buy

    if (buyPrice === undefined || buyPrice === null) {
      throw new Error('Invalid API response: missing buy field')
    }

    const price = parseFloat(buyPrice)
    if (!price || price <= 0 || !isFinite(price)) {
      throw new Error(`Invalid price: ${response.data.buy}`)
    }

    console.log(`[${new Date().toISOString()}] ✅ NBC Price: $${price.toFixed(4)}`)
    return price
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error fetching NBC price:`, error.message)
    throw error
  }
}

/**
 * 从 NBC 交易所 API 获取代币价格（带重试机制）
 */
async function getTokenPriceFromNBCEX(symbol, nbcexSymbol, retries = CONFIG.PRICE_API_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const url = `${CONFIG.NBCEX_API_BASE}?symbol=${nbcexSymbol}&accessKey=${CONFIG.NBCEX_ACCESS_KEY}`
      const response = await axios.get(url, {
        timeout: CONFIG.PRICE_API_TIMEOUT,
        headers: {
          Accept: 'application/json',
        },
      })

      // API 返回格式: { status: "success", data: { buy: 90634.30, ... } }
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
      if (attempt === retries) {
        throw error
      }
      console.warn(
        `   ⚠️  ${symbol}: NBC交易所 API 获取价格失败 (尝试 ${attempt}/${retries})，${error.message}，重试中...`,
      )
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt)) // 递增延迟
    }
  }
}

/**
 * 从 OKX API 获取代币价格（带重试机制）
 */
async function getTokenPriceFromOKX(symbol, okxSymbol, retries = CONFIG.PRICE_API_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(CONFIG.OKX_API_URL, {
        params: { instId: okxSymbol },
        timeout: CONFIG.PRICE_API_TIMEOUT,
      })

      if (response.data && response.data.code === '0' && response.data.data && response.data.data.length > 0) {
        const price = parseFloat(response.data.data[0].last)
        if (price && price > 0) {
          return price
        }
      }
      throw new Error('Invalid response format')
    } catch (error) {
      if (attempt === retries) {
        throw error
      }
      console.warn(`   ⚠️  ${symbol}: OKX API 获取价格失败 (尝试 ${attempt}/${retries})，${error.message}，重试中...`)
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt)) // 递增延迟
    }
  }
}

/**
 * 从 Binance API 获取代币价格（带重试机制）
 */
async function getTokenPriceFromBinance(symbol, binanceSymbol, retries = CONFIG.PRICE_API_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(CONFIG.BINANCE_API_URL, {
        params: { symbol: binanceSymbol },
        timeout: CONFIG.PRICE_API_TIMEOUT,
      })

      if (response.data && response.data.price) {
        return parseFloat(response.data.price)
      }
      throw new Error('Invalid response format')
    } catch (error) {
      if (attempt === retries) {
        throw error
      }
      console.warn(`   ⚠️  ${symbol}: 获取价格失败 (尝试 ${attempt}/${retries})，${error.message}，重试中...`)
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt)) // 递增延迟
    }
  }
}

/**
 * 从 CoinGecko API 获取代币价格（备用，带重试机制）
 */
async function getTokenPricesFromCoinGecko(retries = CONFIG.PRICE_API_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const tokenIds = Object.values(TOKEN_CONFIG)
        .map((config) => config.coingeckoId)
        .join(',')

      const response = await axios.get(CONFIG.COINGECKO_API_URL, {
        params: {
          ids: tokenIds,
          vs_currencies: 'usd',
        },
        timeout: CONFIG.PRICE_API_TIMEOUT,
      })

      const prices = {}
      for (const [symbol, config] of Object.entries(TOKEN_CONFIG)) {
        const price = response.data[config.coingeckoId]?.usd
        if (price) {
          prices[symbol] = price
        }
      }
      return prices
    } catch (error) {
      if (attempt === retries) {
        throw error
      }
      console.warn(`   ⚠️  CoinGecko API 失败 (尝试 ${attempt}/${retries})，${error.message}，重试中...`)
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt))
    }
  }
}

/**
 * 获取主流币价格（优先级：NBC交易所 -> OKX -> Binance -> CoinGecko）
 */
async function getTokenPrices() {
  console.log(`[${new Date().toISOString()}] 📊 Fetching token prices from NBC Exchange...`)

  const prices = {}
  let useOKX = false
  let useBinance = false
  let useCoinGecko = false

  // 第一优先级：使用 NBC 交易所 API（逐个获取）
  try {
    for (const [symbol, config] of Object.entries(TOKEN_CONFIG)) {
      // USDT 价格固定为 1
      if (symbol === 'USDT') {
        prices[symbol] = 1.0
        console.log(`   ✅ ${symbol}: $1.0000`)
        continue
      }

      try {
        const price = await getTokenPriceFromNBCEX(symbol, config.nbcexSymbol)
        prices[symbol] = price
        console.log(`   ✅ ${symbol}: $${price.toFixed(4)} (来自 NBC交易所)`)
      } catch (error) {
        console.warn(`   ⚠️  ${symbol}: NBC交易所 API 失败，${error.message}`)
        // 如果 NBC 交易所失败，标记使用 OKX
        useOKX = true
      }
    }

    // 如果所有代币都成功获取，直接返回
    if (Object.keys(prices).length === Object.keys(TOKEN_CONFIG).length) {
      return prices
    }
  } catch (error) {
    console.warn(`[${new Date().toISOString()}] ⚠️  NBC交易所 API 整体失败: ${error.message}`)
    useOKX = true
  }

  // 第二优先级：如果 NBC 交易所失败，尝试使用 OKX（备用）
  if (useOKX || Object.keys(prices).length < Object.keys(TOKEN_CONFIG).length) {
    console.log(`[${new Date().toISOString()}] 📊 尝试使用 OKX API 作为备用...`)
    try {
      for (const [symbol, config] of Object.entries(TOKEN_CONFIG)) {
        // 跳过已获取的代币和 USDT
        if (prices[symbol] || symbol === 'USDT') {
          continue
        }

        try {
          const price = await getTokenPriceFromOKX(symbol, config.okxSymbol)
          prices[symbol] = price
          console.log(`   ✅ ${symbol}: $${price.toFixed(4)} (来自 OKX)`)
        } catch (error) {
          console.warn(`   ⚠️  ${symbol}: OKX API 失败，${error.message}`)
          useBinance = true
        }
      }

      // 如果所有代币都成功获取，直接返回
      if (Object.keys(prices).length === Object.keys(TOKEN_CONFIG).length) {
        return prices
      }
    } catch (error) {
      console.warn(`[${new Date().toISOString()}] ⚠️  OKX API 整体失败: ${error.message}`)
      useBinance = true
    }
  }

  // 第三优先级：如果 NBC 交易所和 OKX 都失败，尝试使用 Binance（备用）
  if (useBinance || Object.keys(prices).length < Object.keys(TOKEN_CONFIG).length) {
    console.log(`[${new Date().toISOString()}] 📊 尝试使用 Binance API 作为备用...`)
    try {
      for (const [symbol, config] of Object.entries(TOKEN_CONFIG)) {
        // 跳过已获取的代币和 USDT
        if (prices[symbol] || symbol === 'USDT') {
          continue
        }

        try {
          const price = await getTokenPriceFromBinance(symbol, config.binanceSymbol)
          prices[symbol] = price
          console.log(`   ✅ ${symbol}: $${price.toFixed(4)} (来自 Binance)`)
        } catch (error) {
          console.warn(`   ⚠️  ${symbol}: Binance API 失败，${error.message}`)
          useCoinGecko = true
        }
      }

      // 如果所有代币都成功获取，直接返回
      if (Object.keys(prices).length === Object.keys(TOKEN_CONFIG).length) {
        return prices
      }
    } catch (error) {
      console.warn(`[${new Date().toISOString()}] ⚠️  Binance API 整体失败: ${error.message}`)
      useCoinGecko = true
    }
  }

  // 第四优先级：如果 NBC 交易所、OKX 和 Binance 都失败，尝试使用 CoinGecko（最后备用）
  if (useCoinGecko || Object.keys(prices).length < Object.keys(TOKEN_CONFIG).length) {
    console.log(`[${new Date().toISOString()}] 📊 尝试使用 CoinGecko API 作为最后备用...`)
    try {
      const coinGeckoPrices = await getTokenPricesFromCoinGecko()
      // 合并价格，优先使用已获取的价格
      for (const [symbol, price] of Object.entries(coinGeckoPrices)) {
        if (!prices[symbol]) {
          prices[symbol] = price
          console.log(`   ✅ ${symbol}: $${price.toFixed(4)} (来自 CoinGecko)`)
        }
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ❌ CoinGecko API 也失败: ${error.message}`)
      // 如果 CoinGecko 也失败，至少返回已获取的价格
      if (Object.keys(prices).length === 0) {
        throw new Error('所有价格 API 都失败，无法获取代币价格')
      }
    }
  }

  // 检查是否有缺失的价格
  const missingPrices = []
  for (const [symbol] of Object.entries(TOKEN_CONFIG)) {
    if (!prices[symbol]) {
      missingPrices.push(symbol)
    }
  }

  if (missingPrices.length > 0) {
    console.warn(`[${new Date().toISOString()}] ⚠️  以下代币价格获取失败: ${missingPrices.join(', ')}`)
  }

  return prices
}

/**
 * 计算兑换比例
 */
function calculateConversionRate(tokenPriceUSD, nbcPriceUSD) {
  return tokenPriceUSD / nbcPriceUSD
}

/**
 * 计算奖励率（基于兑换比例）
 */
function calculateRewardRate(conversionRate, tokenDecimals) {
  // APR 转换为小数
  const aprDecimal = CONFIG.TARGET_APR / 100

  // 年总奖励（NBC，wei 单位）
  const totalStakedNBC = ethers.BigNumber.from(CONFIG.TOTAL_STAKED_NBC)
  const aprMultiplier = Math.floor(aprDecimal * 10000)
  const annualRewardNBCWei = totalStakedNBC.mul(aprMultiplier).div(10000)

  // 转换为奖励代币数量
  // 使用字符串操作避免科学计数法
  const conversionRateStr = conversionRate.toFixed(18) // 转换为固定小数格式
  const conversionRateParts = conversionRateStr.split('.')
  const integerPart = conversionRateParts[0]
  const decimalPart = (conversionRateParts[1] || '').padEnd(18, '0').substring(0, 18)

  // 构建 BigNumber：integerPart + decimalPart（作为整数）
  const conversionRateScaled = ethers.BigNumber.from(integerPart + decimalPart)

  const rewardTokenMultiplier = ethers.BigNumber.from(10).pow(tokenDecimals)

  // 年总奖励代币（wei 单位）
  const annualRewardToken = annualRewardNBCWei.mul(rewardTokenMultiplier).div(conversionRateScaled)

  // 每秒奖励率
  const rewardRate = annualRewardToken.div(CONFIG.SECONDS_PER_YEAR)

  return {
    rewardRate,
    annualReward: annualRewardToken,
  }
}

/**
 * 检查是否需要更新奖励率
 */
async function shouldUpdateReward(poolIndex, newRewardRate) {
  try {
    const provider = new ethers.providers.JsonRpcProvider(CONFIG.RPC_URL)
    const stakingContract = new ethers.Contract(CONFIG.STAKING_CONTRACT_ADDRESS, STAKING_ABI, provider)

    const poolInfo = await stakingContract.getPoolInfo(poolIndex)
    const currentRewardRate = ethers.BigNumber.from(poolInfo.rewardRate.toString())

    // 计算变化百分比
    if (currentRewardRate.isZero()) {
      return { shouldUpdate: true, changePercent: 100, currentRewardRate }
    }

    const changePercent = Number(newRewardRate.sub(currentRewardRate).mul(10000).div(currentRewardRate)) / 100
    const absChange = Math.abs(changePercent)

    if (absChange < CONFIG.MIN_PRICE_CHANGE * 100) {
      return { shouldUpdate: false, changePercent }
    }

    return { shouldUpdate: true, changePercent, currentRewardRate }
  } catch (error) {
    console.error(`   ❌ Error checking current reward rate:`, error.message)
    return { shouldUpdate: true, changePercent: 0 } // 出错时默认更新
  }
}

/**
 * 更新单个池的奖励率
 */
async function updatePoolReward(symbol, config, tokenPriceUSD, nbcPriceUSD) {
  try {
    // 1. 计算兑换比例
    const conversionRate = calculateConversionRate(tokenPriceUSD, nbcPriceUSD)
    const baseConversionRate = calculateConversionRate(tokenPriceUSD, CONFIG.BASE_NBC_PRICE)

    console.log(`\n[${new Date().toISOString()}] 🔄 Updating ${symbol} Pool (Index: ${config.poolIndex}):`)
    console.log(`   💰 Token Price: $${tokenPriceUSD.toFixed(4)}`)
    console.log(`   💰 NBC Price: $${nbcPriceUSD.toFixed(4)}`)
    console.log(`   📊 Conversion Rate: 1 ${symbol} = ${conversionRate.toFixed(2)} NBC`)
    console.log(`   📊 Base Rate: 1 ${symbol} = ${baseConversionRate.toFixed(2)} NBC`)
    const rateChangePercent = ((conversionRate / baseConversionRate - 1) * 100).toFixed(2)
    console.log(`   📈 Rate Change: ${rateChangePercent > 0 ? '+' : ''}${rateChangePercent}%`)

    // 2. 计算新奖励率
    const { rewardRate, annualReward } = calculateRewardRate(conversionRate, config.decimals)

    // 转换为 ethers BigNumber
    const rewardRateBN = ethers.BigNumber.from(rewardRate.toString())
    const annualRewardBN = ethers.BigNumber.from(annualReward.toString())

    // 3. 检查是否需要更新
    const { shouldUpdate, changePercent, currentRewardRate } = await shouldUpdateReward(config.poolIndex, rewardRateBN)

    if (!shouldUpdate) {
      console.log(`   ⏭️  Reward rate change too small (${changePercent.toFixed(2)}%), skipping update`)
      return { success: true, skipped: true, symbol }
    }

    if (currentRewardRate) {
      console.log(`   📈 Current Rate: ${currentRewardRate.toString()} wei/s`)
    }
    console.log(`   📈 New Rate: ${rewardRateBN.toString()} wei/s`)
    console.log(`   📈 Change: ${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%`)
    console.log(`   💎 Annual Reward: ${annualRewardBN.toString()} wei`)

    // 4. 连接区块链
    const provider = new ethers.providers.JsonRpcProvider(CONFIG.RPC_URL)
    const wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, provider)
    const stakingContract = new ethers.Contract(CONFIG.STAKING_CONTRACT_ADDRESS, STAKING_ABI, wallet)

    // 5. 检查奖励代币余额
    const rewardTokenABI = ['function balanceOf(address) external view returns (uint256)']
    const rewardToken = new ethers.Contract(config.address, rewardTokenABI, provider)

    // 检查合约地址的余额（因为代币已经转到合约地址了）
    const contractBalance = await rewardToken.balanceOf(CONFIG.STAKING_CONTRACT_ADDRESS)
    // 检查 owner 地址的余额（用于 transferFrom）
    const ownerBalance = await rewardToken.balanceOf(wallet.address)

    // 如果合约地址有足够的余额，说明代币已经准备好了
    if (contractBalance.gte(annualRewardBN)) {
      console.log(`   ✅ Contract has sufficient balance: ${formatUnits(contractBalance, config.decimals)} ${symbol}`)
      // 注意：虽然合约地址有余额，但 transferFrom 仍需要 owner 地址有足够的代币
      // 如果 owner 地址余额不足，transferFrom 会失败，但至少代币已经在合约里了
      if (ownerBalance.lt(annualRewardBN)) {
        console.warn(
          `   ⚠️  Warning: Owner balance (${formatUnits(
            ownerBalance,
            config.decimals,
          )} ${symbol}) is less than required.`,
        )
        console.warn(`   ⚠️  Contract has enough balance, but transferFrom may fail if owner doesn't have enough.`)
      }
    } else {
      // 如果合约地址余额不足，检查 owner 地址
      if (ownerBalance.lt(annualRewardBN)) {
        console.error(`   ❌ Insufficient reward token balance!`)
        console.error(`   Contract balance: ${formatUnits(contractBalance, config.decimals)} ${symbol}`)
        console.error(`   Owner balance: ${formatUnits(ownerBalance, config.decimals)} ${symbol}`)
        console.error(`   Required: ${formatUnits(annualRewardBN, config.decimals)} ${symbol}`)
        return { success: false, error: 'Insufficient balance', symbol }
      }
      console.log(`   ✅ Owner has sufficient balance: ${formatUnits(ownerBalance, config.decimals)} ${symbol}`)
    }

    // 6. 调用合约更新奖励
    console.log(`   📤 Sending transaction...`)
    const tx = await stakingContract.notifyRewardAmount(config.poolIndex, annualRewardBN)
    console.log(`   🔗 Transaction hash: ${tx.hash}`)

    // 7. 等待确认
    console.log(`   ⏳ Waiting for confirmation...`)
    const receipt = await tx.wait()

    console.log(`   ✅ Reward updated successfully!`)
    console.log(`   📦 Block: ${receipt.blockNumber}`)
    const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice || receipt.gasPrice)
    console.log(`   ⛽ Gas used: ${formatUnits(gasUsed, 18)} NBC`)

    return {
      success: true,
      symbol,
      poolIndex: config.poolIndex,
      conversionRate,
      rewardRate: rewardRateBN.toString(),
      annualReward: annualRewardBN.toString(),
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
    }
  } catch (error) {
    console.error(`   ❌ Error updating ${symbol} pool:`, error.message)
    if (error.transaction) {
      console.error(`   Transaction hash: ${error.transaction.hash}`)
    }
    return { success: false, symbol, error: error.message }
  }
}

/**
 * 更新所有池
 */
async function updateAllPools() {
  console.log('\n========================================')
  console.log(`   Dynamic Reward Rate Adjustment`)
  console.log(`   ${new Date().toISOString()}`)
  console.log('========================================\n')

  try {
    // 1. 获取价格
    console.log('📊 Fetching prices...\n')
    const [nbcPrice, tokenPrices] = await Promise.all([getNBCPrice(), getTokenPrices()])

    console.log(`\n✅ Prices fetched successfully!\n`)

    // 2. 更新每个池
    const results = []
    for (const [symbol, config] of Object.entries(TOKEN_CONFIG)) {
      const tokenPrice = tokenPrices[symbol]
      if (!tokenPrice) {
        console.warn(`⚠️  ${symbol} price not available, skipping\n`)
        continue
      }

      const result = await updatePoolReward(symbol, config, tokenPrice, nbcPrice)
      results.push(result)

      // 等待一下再处理下一个池，避免 RPC 限流
      if (symbol !== Object.keys(TOKEN_CONFIG)[Object.keys(TOKEN_CONFIG).length - 1]) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }

    // 3. 汇总结果
    console.log('\n========================================')
    console.log('   Summary')
    console.log('========================================')
    const successCount = results.filter((r) => r.success && !r.skipped).length
    const skippedCount = results.filter((r) => r.skipped).length
    const failedCount = results.filter((r) => !r.success).length

    console.log(`✅ Success: ${successCount}`)
    console.log(`⏭️  Skipped: ${skippedCount}`)
    console.log(`❌ Failed: ${failedCount}`)
    console.log('========================================\n')

    return results
  } catch (error) {
    console.error('❌ Fatal error:', error.message)
    throw error
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================')
  console.log('   NBC Staking Dynamic Reward Adjuster')
  console.log('========================================')
  console.log(`Staking Contract: ${CONFIG.STAKING_CONTRACT_ADDRESS}`)
  console.log(`Base NBC Price: $${CONFIG.BASE_NBC_PRICE}`)
  console.log(`Target APR: ${CONFIG.TARGET_APR}%`)
  console.log(`Total Staked: ${formatUnits(CONFIG.TOTAL_STAKED_NBC, 18)} NBC`)
  console.log(`Update Interval: ${CONFIG.UPDATE_INTERVAL / 1000}s`)
  console.log(`Pools: ${Object.keys(TOKEN_CONFIG).length}`)
  console.log('========================================\n')

  // 立即执行一次
  await updateAllPools()

  // 定时执行
  setInterval(async () => {
    try {
      await updateAllPools()
    } catch (error) {
      console.error('Error in scheduled update:', error)
    }
  }, CONFIG.UPDATE_INTERVAL)
}

// 启动服务
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

module.exports = { getNBCPrice, getTokenPrices, calculateRewardRate, updateAllPools }
