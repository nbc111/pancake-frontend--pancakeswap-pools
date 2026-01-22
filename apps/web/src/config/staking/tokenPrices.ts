/**
 * 代币价格获取工具
 * 使用 NBC Exchange API 获取实时价格，失败时使用 CoinGecko 作为备用（支持 CORS）
 * 
 * 改进：
 * - 添加请求延迟，避免并发过多触发限流
 * - 实现重试机制（指数退避）
 * - 添加本地缓存，减少 API 调用
 * - 优化 CoinGecko 批量请求
 */

const NBCEX_API_BASE = 'https://www.nbcex.com/v1/rest/api/market/ticker'
const NBCEX_ACCESS_KEY = '3PswIE0Z9w26R9MC5XrGU8b6LD4bQIWWO1x3nwix1xI='
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price'

// 缓存配置
const CACHE_KEY_PREFIX = 'nbc_staking_token_prices_'
const CACHE_DURATION = 5 * 60 * 1000 // 5 分钟缓存

// 请求延迟配置（避免并发过多）
const REQUEST_DELAY = 300 // 300ms 延迟

// 重试配置
const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 2000, 4000] // 指数退避：1s, 2s, 4s

interface PriceCache {
  price: number
  timestamp: number
}

interface NbcPriceResponse {
  status: string
  message: string | null
  data: {
    tradeName: string
    buy: number
    sell: number
    high: number
    low: number
    last: number
    open: number
    chg: number
    vol24hour: number
  }
}

interface CoinGeckoResponse {
  [coinId: string]: {
    usd: number
  }
}

/**
 * 代币符号到 NBC Exchange 交易对的映射
 */
const TOKEN_SYMBOL_MAP: Record<string, string> = {
  BTC: 'btcusdt',
  ETH: 'ethusdt',
  SOL: 'solusdt',
  BNB: 'bnbusdt',
  XRP: 'xrpusdt',
  LTC: 'ltcusdt',
  DOGE: 'dogeusdt',
  USDT: 'usdtusdt',
  SUI: 'suiusdt',
  PEPE: 'pepeusdt',
}

/**
 * 代币符号到 CoinGecko ID 的映射
 */
const COINGECKO_ID_MAP: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  BNB: 'binancecoin',
  XRP: 'ripple',
  LTC: 'litecoin',
  DOGE: 'dogecoin',
  USDT: 'tether',
  SUI: 'sui',
  PEPE: 'pepe',
}

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 从缓存获取价格
 */
function getCachedPrice(tokenSymbol: string): number | null {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${tokenSymbol}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const cache: PriceCache = JSON.parse(cached)
      const now = Date.now()
      if (now - cache.timestamp < CACHE_DURATION) {
        return cache.price
      }
    }
  } catch (error) {
    // 缓存读取失败，忽略错误
  }
  return null
}

/**
 * 保存价格到缓存
 */
function setCachedPrice(tokenSymbol: string, price: number): void {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${tokenSymbol}`
    const cache: PriceCache = {
      price,
      timestamp: Date.now(),
    }
    localStorage.setItem(cacheKey, JSON.stringify(cache))
  } catch (error) {
    // 缓存写入失败，忽略错误
  }
}

/**
 * 从 CoinGecko API 获取代币价格（备用，支持 CORS）
 * 带重试机制
 */
async function getTokenPriceFromCoinGecko(
  tokenSymbol: string,
  retryCount = 0,
): Promise<number | null> {
  // USDT 价格固定为 1
  if (tokenSymbol === 'USDT') {
    return 1.0
  }

  const coinId = COINGECKO_ID_MAP[tokenSymbol]
  if (!coinId) {
    return null
  }

  try {
    const url = `${COINGECKO_API_URL}?ids=${coinId}&vs_currencies=usd`
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000), // 10秒超时
    })

    // 处理限流错误（429）
    if (response.status === 429) {
      if (retryCount < MAX_RETRIES) {
        const delayMs = RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1]
        await delay(delayMs)
        return getTokenPriceFromCoinGecko(tokenSymbol, retryCount + 1)
      }
      return null
    }

    if (!response.ok) {
      return null
    }

    const result: CoinGeckoResponse = await response.json()

    // API 返回格式: { "ripple": { "usd": 2.03 } }
    if (result && result[coinId] && result[coinId].usd) {
      const price = result[coinId].usd
      if (price && price > 0 && Number.isFinite(price)) {
        // 保存到缓存
        setCachedPrice(tokenSymbol, price)
        return price
      }
    }

    return null
  } catch (error) {
    // 网络错误或其他错误，尝试重试
    if (retryCount < MAX_RETRIES && error instanceof Error && !error.name.includes('AbortError')) {
      const delayMs = RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1]
      await delay(delayMs)
      return getTokenPriceFromCoinGecko(tokenSymbol, retryCount + 1)
    }

    return null
  }
}

/**
 * 从 NBC Exchange API 获取代币价格，失败时自动尝试 CoinGecko（支持 CORS）
 * 带缓存和重试机制
 */
export async function getTokenPriceFromNbcApi(tokenSymbol: string): Promise<number | null> {
  // USDT 价格固定为 1
  if (tokenSymbol === 'USDT') {
    return 1.0
  }

  // NBC 价格由 useCakePrice() 单独处理，这里返回 null
  if (tokenSymbol === 'NBC') {
    return null
  }

  // 先检查缓存
  const cachedPrice = getCachedPrice(tokenSymbol)
  if (cachedPrice !== null) {
    return cachedPrice
  }

  const symbol = TOKEN_SYMBOL_MAP[tokenSymbol]
  if (!symbol) {
    console.warn(`No symbol mapping found for ${tokenSymbol}`)
    return null
  }

  // 首先尝试 NBC Exchange API
  try {
    const url = `${NBCEX_API_BASE}?symbol=${symbol}&accessKey=${NBCEX_ACCESS_KEY}`
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000), // 10秒超时
    })

    if (!response.ok) {
      // 尝试备用 API
      return getTokenPriceFromCoinGecko(tokenSymbol)
    }

    const result: NbcPriceResponse = await response.json()

    if (result.status !== 'success' || !result.data || result.data.buy === undefined || result.data.buy === null) {
      // 尝试备用 API
      return getTokenPriceFromCoinGecko(tokenSymbol)
    }

    const price = Number(result.data.buy)
    if (Number.isNaN(price) || price <= 0) {
      // 尝试备用 API
      return getTokenPriceFromCoinGecko(tokenSymbol)
    }

    // 保存到缓存
    setCachedPrice(tokenSymbol, price)
    return price
  } catch (error) {
    // NBC Exchange API 失败，尝试备用 API
    return getTokenPriceFromCoinGecko(tokenSymbol)
  }
}

/**
 * 批量从 CoinGecko 获取多个代币价格（优化：一次请求多个代币）
 */
async function getTokenPricesFromCoinGeckoBatch(
  tokenSymbols: string[],
): Promise<Record<string, number | null>> {
  const prices: Record<string, number | null> = {}
  
  // USDT 特殊处理
  if (tokenSymbols.includes('USDT')) {
    prices.USDT = 1.0
  }

  // 过滤出需要从 CoinGecko 获取的代币
  const symbolsToFetch = tokenSymbols.filter((s) => s !== 'USDT' && s !== 'NBC')
  if (symbolsToFetch.length === 0) {
    return prices
  }

  // 获取所有 CoinGecko ID
  const coinIds = symbolsToFetch
    .map((symbol) => ({ symbol, coinId: COINGECKO_ID_MAP[symbol] }))
    .filter((item) => item.coinId !== undefined)

  if (coinIds.length === 0) {
    return prices
  }

  try {
    // 批量请求：一次获取所有代币价格
    const idsParam = coinIds.map((item) => item.coinId).join(',')
    const url = `${COINGECKO_API_URL}?ids=${idsParam}&vs_currencies=usd`

    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000), // 15秒超时（批量请求可能需要更长时间）
    })

    if (response.status === 429) {
      // 限流，回退到单个请求
      for (const symbol of symbolsToFetch) {
        const price = await getTokenPriceFromCoinGecko(symbol)
        prices[symbol] = price
        // 添加延迟避免限流
        if (symbol !== symbolsToFetch[symbolsToFetch.length - 1]) {
          await delay(REQUEST_DELAY)
        }
      }
      return prices
    }

    if (!response.ok) {
      // 回退到单个请求
      for (const symbol of symbolsToFetch) {
        const price = await getTokenPriceFromCoinGecko(symbol)
        prices[symbol] = price
        if (symbol !== symbolsToFetch[symbolsToFetch.length - 1]) {
          await delay(REQUEST_DELAY)
        }
      }
      return prices
    }

    const result: CoinGeckoResponse = await response.json()

    // 处理批量响应
    coinIds.forEach(({ symbol, coinId }) => {
      if (result && result[coinId] && result[coinId].usd) {
        const price = result[coinId].usd
        if (price && price > 0 && Number.isFinite(price)) {
          prices[symbol] = price
          setCachedPrice(symbol, price)
        } else {
          prices[symbol] = null
        }
      } else {
        prices[symbol] = null
      }
    })
  } catch (error) {
    // 回退到单个请求
    for (const symbol of symbolsToFetch) {
      const price = await getTokenPriceFromCoinGecko(symbol)
      prices[symbol] = price
      if (symbol !== symbolsToFetch[symbolsToFetch.length - 1]) {
        await delay(REQUEST_DELAY)
      }
    }
  }

  return prices
}

/**
 * 批量获取代币价格
 * 改进：
 * - 添加请求延迟，避免并发过多
 * - 优先使用缓存
 * - 优化 CoinGecko 批量请求
 */
export async function getTokenPricesFromNbcApi(tokenSymbols: string[]): Promise<Record<string, number | null>> {
  const prices: Record<string, number | null> = {}

  try {
    // 先检查缓存，填充已缓存的代币
    const symbolsToFetch: string[] = []
    tokenSymbols.forEach((symbol) => {
      const cachedPrice = getCachedPrice(symbol)
      if (cachedPrice !== null) {
        prices[symbol] = cachedPrice
      } else {
        symbolsToFetch.push(symbol)
      }
    })

    if (symbolsToFetch.length === 0) {
      return prices
    }

    // 首先尝试 NBC Exchange API（带延迟）
    const nbcPrices: Record<string, number | null> = {}
    for (let i = 0; i < symbolsToFetch.length; i++) {
      const symbol = symbolsToFetch[i]
      try {
      const price = await getTokenPriceFromNbcApi(symbol)
        nbcPrices[symbol] = price
        // 添加延迟，避免并发过多
        if (i < symbolsToFetch.length - 1) {
          await delay(REQUEST_DELAY)
        }
      } catch (error) {
        nbcPrices[symbol] = null
      }
    }

    // 合并 NBC Exchange 结果
    Object.assign(prices, nbcPrices)

    // 对于 NBC Exchange 失败的代币，尝试 CoinGecko 批量请求
    const failedSymbols = symbolsToFetch.filter((symbol) => !prices[symbol] || prices[symbol] === null)
    if (failedSymbols.length > 0) {
      const coinGeckoPrices = await getTokenPricesFromCoinGeckoBatch(failedSymbols)
      Object.assign(prices, coinGeckoPrices)
    }

    let successCount = 0
    let failCount = 0
    tokenSymbols.forEach((symbol) => {
      if (prices[symbol] !== null && prices[symbol] !== undefined && prices[symbol]! > 0) {
        successCount++
      } else {
        failCount++
        // 如果所有 API 都失败，尝试使用缓存（即使过期）
        if (prices[symbol] === null || prices[symbol] === undefined) {
          try {
            const cacheKey = `${CACHE_KEY_PREFIX}${symbol}`
            const cached = localStorage.getItem(cacheKey)
            if (cached) {
              const cache: PriceCache = JSON.parse(cached)
              prices[symbol] = cache.price // 使用过期缓存作为降级方案
            }
          } catch {
            // 忽略缓存错误
          }
        }
      }
    })

  } catch (error) {
    // 确保最外层错误也被捕获
    // 返回部分结果，而不是抛出错误
    tokenSymbols.forEach((symbol) => {
      if (!(symbol in prices)) {
        // 尝试使用缓存
        const cachedPrice = getCachedPrice(symbol)
        prices[symbol] = cachedPrice
      }
    })
  }

  return prices
}
