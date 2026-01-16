/**
 * 代币价格获取工具
 * 使用 NBC Exchange API 获取实时价格，失败时使用 CoinGecko 作为备用（支持 CORS）
 */

const NBCEX_API_BASE = 'https://www.nbcex.com/v1/rest/api/market/ticker'
const NBCEX_ACCESS_KEY = '3PswIE0Z9w26R9MC5XrGU8b6LD4bQIWWO1x3nwix1xI='
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price'

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
 * 从 CoinGecko API 获取代币价格（备用，支持 CORS）
 */
async function getTokenPriceFromCoinGecko(tokenSymbol: string): Promise<number | null> {
  // USDT 价格固定为 1
  if (tokenSymbol === 'USDT') {
    return 1.0
  }

  const coinId = COINGECKO_ID_MAP[tokenSymbol]
  if (!coinId) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn(`[${tokenSymbol}] ⚠️ No CoinGecko ID mapping found`)
    }
    return null
  }

  try {
    const url = `${COINGECKO_API_URL}?ids=${coinId}&vs_currencies=usd`
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`[${tokenSymbol}] 🔄 Trying CoinGecko API: ${coinId} (URL: ${url})`)
    }
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000), // 10秒超时
    })

    if (!response.ok) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn(`[${tokenSymbol}] ❌ CoinGecko HTTP error! status: ${response.status}, statusText: ${response.statusText}`)
      }
      return null
    }

    const result: CoinGeckoResponse = await response.json()

    // API 返回格式: { "ripple": { "usd": 2.03 } }
    if (result && result[coinId] && result[coinId].usd) {
      const price = result[coinId].usd
      if (price && price > 0 && Number.isFinite(price)) {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log(`[${tokenSymbol}] ✅ Price from CoinGecko: $${price.toFixed(8)}`)
        }
        return price
      } else {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.warn(`[${tokenSymbol}] ⚠️ CoinGecko returned invalid price:`, price, `(result:`, result, `)`)
        }
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn(`[${tokenSymbol}] ⚠️ CoinGecko API returned invalid response format:`, {
          result,
          coinId,
          hasCoinId: !!result?.[coinId],
          hasUsd: !!result?.[coinId]?.usd,
        })
      }
    }

    return null
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn(`[${tokenSymbol}] ❌ CoinGecko API failed:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
    }
    return null
  }
}

/**
 * 从 NBC Exchange API 获取代币价格，失败时自动尝试 CoinGecko（支持 CORS）
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

  const symbol = TOKEN_SYMBOL_MAP[tokenSymbol]
  if (!symbol) {
    console.warn(`No symbol mapping found for ${tokenSymbol}`)
    return null
  }

  // 首先尝试 NBC Exchange API
  try {
    const url = `${NBCEX_API_BASE}?symbol=${symbol}&accessKey=${NBCEX_ACCESS_KEY}`
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`[${tokenSymbol}] 🔄 Trying NBC Exchange API: ${symbol}`)
    }
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000), // 10秒超时
    })

    if (!response.ok) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn(`[${tokenSymbol}] ❌ NBC Exchange HTTP error! status: ${response.status}`)
      }
      // 尝试备用 API
      return getTokenPriceFromCoinGecko(tokenSymbol)
    }

    const result: NbcPriceResponse = await response.json()

    // 添加详细的日志以便调试
    if (result.status !== 'success') {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn(`[${tokenSymbol}] ⚠️ NBC Exchange API returned non-success status:`, result.status, result.message)
      }
      // 尝试备用 API
      return getTokenPriceFromCoinGecko(tokenSymbol)
    }

    if (!result.data) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn(`[${tokenSymbol}] ⚠️ NBC Exchange API response missing data field:`, result)
      }
      // 尝试备用 API
      return getTokenPriceFromCoinGecko(tokenSymbol)
    }

    if (result.data.buy === undefined || result.data.buy === null) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn(`[${tokenSymbol}] ⚠️ NBC Exchange API response missing buy field:`, result.data)
      }
      // 尝试备用 API
      return getTokenPriceFromCoinGecko(tokenSymbol)
    }

    const price = Number(result.data.buy)
    if (Number.isNaN(price) || price <= 0) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn(`[${tokenSymbol}] ⚠️ NBC Exchange API invalid price value:`, result.data.buy)
      }
      // 尝试备用 API
      return getTokenPriceFromCoinGecko(tokenSymbol)
    }

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`[${tokenSymbol}] ✅ Price from NBC Exchange: $${price.toFixed(8)}`)
    }
    return price
  } catch (error) {
    // NBC Exchange API 失败，尝试备用 API
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn(`[${tokenSymbol}] ❌ NBC Exchange API failed, trying CoinGecko:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
    }
    return getTokenPriceFromCoinGecko(tokenSymbol)
  }
}

/**
 * 批量获取代币价格
 */
export async function getTokenPricesFromNbcApi(tokenSymbols: string[]): Promise<Record<string, number | null>> {
  const prices: Record<string, number | null> = {}

  try {
    // 并行获取所有代币价格，使用 Promise.allSettled 确保单个失败不影响其他
    const pricePromises = tokenSymbols.map(async (symbol) => {
      try {
        const price = await getTokenPriceFromNbcApi(symbol)
        return { symbol, price }
      } catch (error) {
        // 单个代币价格获取失败，记录但不抛出
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.warn(`[${symbol}] Price fetch failed:`, error instanceof Error ? error.message : error)
        }
        return { symbol, price: null }
      }
    })

    const results = await Promise.allSettled(pricePromises)
    let successCount = 0
    let failCount = 0

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const { symbol, price } = result.value
        prices[symbol] = price
        if (price !== null && price > 0) {
          successCount++
        } else {
          failCount++
        }
      } else {
        // 如果 Promise 本身被拒绝，记录错误并设置默认值
        const symbol = tokenSymbols[index]
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error(`[${symbol}] Price fetch promise rejected:`, result.reason)
        }
        prices[symbol] = null
        failCount++
      }
    })

    // 开发环境日志：汇总价格获取结果
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`[getTokenPricesFromNbcApi] 价格获取汇总:`, {
        成功: successCount,
        失败: failCount,
        总计: tokenSymbols.length,
        价格详情: Object.entries(prices).map(([symbol, price]) => 
          `${symbol}: ${price ? `$${price.toFixed(4)}` : 'null'}`
        ).join(', '),
      })
    }
  } catch (error) {
    // 确保最外层错误也被捕获
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('[getTokenPricesFromNbcApi] 整体错误:', error)
    }
    // 返回空对象或部分结果，而不是抛出错误
    tokenSymbols.forEach((symbol) => {
      if (!(symbol in prices)) {
        prices[symbol] = null
      }
    })
  }

  return prices
}
