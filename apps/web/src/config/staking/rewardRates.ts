/**
 * 单币质押奖励率配置
 * 基于 NBC = 0.11 USD 的兑换比例
 * 用于计算一年期的奖励率
 */

/**
 * 兑换比例配置（1 个奖励代币 = X NBC）
 * 基于图片中的兑换比例：NBC = 0.11 USD
 */
export const CONVERSION_RATES = {
  BTC: 804545, // 1 BTC = 804,545 NBC
  ETH: 27454, // 1 ETH = 27,454 NBC
  USDT: 9.09, // 1 USDT = 9.09 NBC
  BNB: 7809, // 1 BNB = 7,809 NBC
  SOL: 1145, // 1 SOL = 1,145 NBC
  DOGE: 1.21, // 1 DOGE = 1.21 NBC
  XRP: 17.27, // 1 XRP = 17.27 NBC
  LTC: 700, // 1 LTC = 700 NBC
  ETC: 112, // 1 ETC = 112 NBC
  SUI: 13.27, // 1 SUI = 13.27 NBC
} as const

/**
 * 奖励代币精度配置
 */
export const REWARD_TOKEN_DECIMALS: Record<string, number> = {
  BTC: 8,
  ETH: 18,
  USDT: 6,
  BNB: 18,
  SOL: 18,
  DOGE: 18,
  XRP: 18,
  LTC: 18,
  ETC: 18,
  SUI: 18,
}

/**
 * 一年期的秒数
 */
export const SECONDS_PER_YEAR = 365 * 24 * 60 * 60

/**
 * 计算一年期的奖励率（每秒）
 *
 * @param apr 目标 APR（年化收益率，例如：100 表示 100%）
 * @param totalStakedNBC 总质押量（NBC，wei 单位，18 位精度）
 * @param conversionRate 兑换比例（1 奖励代币 = X NBC）
 * @param rewardTokenDecimals 奖励代币精度
 * @returns 每秒奖励率（wei 单位，考虑奖励代币精度）
 *
 * @example
 * // 假设总质押量 1,000,000 NBC，目标 APR 100%，BTC 池
 * const rewardRate = calculateRewardRate(
 *   100,                                    // 100% APR
 *   BigInt('1000000000000000000000000'),    // 1M NBC (wei)
 *   CONVERSION_RATES.BTC,                   // 804545
 *   8                                       // BTC 精度
 * )
 */
export function calculateRewardRate(
  apr: number,
  totalStakedNBC: bigint,
  conversionRate: number,
  rewardTokenDecimals: number,
): bigint {
  // APR 转换为小数（例如 100% = 1.0）
  const aprDecimal = apr / 100

  // 年总奖励（NBC，wei 单位）
  // 使用 BigInt 计算，避免精度丢失
  // 年总奖励 = 总质押量 * APR
  const totalStakedNumber = Number(totalStakedNBC)
  const annualRewardNBCWei = BigInt(Math.floor(totalStakedNumber * aprDecimal))

  // 转换为奖励代币数量（考虑兑换比例和精度）
  // 公式：年总奖励代币 = (年总奖励 NBC (wei) * 10^rewardDecimals) / (兑换比例 * 10^18)
  // 为了保持精度，我们使用高精度计算
  const conversionRateScaled = BigInt(Math.floor(conversionRate * 1e18)) // 兑换比例放大 10^18
  const rewardTokenMultiplier = BigInt(10 ** rewardTokenDecimals) // 奖励代币精度倍数
  const nbcDecimals = BigInt(10 ** 18) // NBC 精度倍数

  // 年总奖励代币（wei 单位，考虑奖励代币精度）
  // annualRewardToken = (annualRewardNBCWei * rewardTokenMultiplier) / (conversionRateScaled / nbcDecimals)
  // 简化：annualRewardToken = (annualRewardNBCWei * rewardTokenMultiplier * nbcDecimals) / conversionRateScaled
  const annualRewardToken = (annualRewardNBCWei * rewardTokenMultiplier * nbcDecimals) / conversionRateScaled

  // 每秒奖励 = 年总奖励 / 一年秒数
  const rewardPerSecond = annualRewardToken / BigInt(SECONDS_PER_YEAR)

  return rewardPerSecond
}

/**
 * 反向计算：根据奖励率计算 APR
 *
 * @param rewardRate 每秒奖励率（wei 单位，考虑奖励代币精度）
 * @param totalStakedNBC 总质押量（NBC，wei 单位）
 * @param conversionRate 兑换比例（1 奖励代币 = X NBC）
 * @param rewardTokenDecimals 奖励代币精度
 * @returns APR（年化收益率，%）
 */
export function calculateAPRFromRewardRate(
  rewardRate: bigint,
  totalStakedNBC: bigint,
  conversionRate: number,
  rewardTokenDecimals: number,
): number {
  if (totalStakedNBC === 0n) return 0

  // 年总奖励（奖励代币，wei 单位）
  const annualRewardToken = rewardRate * BigInt(SECONDS_PER_YEAR)

  // 转换为 NBC（wei 单位）
  // 公式：年总奖励 NBC = (年总奖励代币 (wei) * 兑换比例 * 10^18) / (10^rewardDecimals)
  const conversionRateScaled = BigInt(Math.floor(conversionRate * 1e18))
  const rewardTokenMultiplier = BigInt(10 ** rewardTokenDecimals)
  const nbcDecimals = BigInt(10 ** 18)

  // annualRewardNBC = (annualRewardToken * conversionRateScaled) / (rewardTokenMultiplier * nbcDecimals)
  // 简化：annualRewardNBC = (annualRewardToken * conversionRateScaled) / (rewardTokenMultiplier * nbcDecimals)
  const annualRewardNBC = (annualRewardToken * conversionRateScaled) / (rewardTokenMultiplier * nbcDecimals)

  // APR = (年总奖励 / 总质押量) * 100
  const apr = (Number(annualRewardNBC) / Number(totalStakedNBC)) * 100

  return apr
}

/**
 * 示例配置：假设总质押量 1,000,000 NBC，目标 APR 100%
 * 这些值可以用于测试或作为默认配置
 */
export const EXAMPLE_CONFIG = {
  totalStakedNBC: BigInt('1000000000000000000000000'), // 1M NBC (wei)
  targetAPR: 100, // 100%
}

/**
 * 示例奖励率（基于示例配置计算）
 * 注意：这些是示例值，实际使用时需要根据实际质押量动态计算
 */
export const EXAMPLE_REWARD_RATES: Record<string, bigint> = {
  BTC: calculateRewardRate(
    EXAMPLE_CONFIG.targetAPR,
    EXAMPLE_CONFIG.totalStakedNBC,
    CONVERSION_RATES.BTC,
    REWARD_TOKEN_DECIMALS.BTC,
  ),
  ETH: calculateRewardRate(
    EXAMPLE_CONFIG.targetAPR,
    EXAMPLE_CONFIG.totalStakedNBC,
    CONVERSION_RATES.ETH,
    REWARD_TOKEN_DECIMALS.ETH,
  ),
  USDT: calculateRewardRate(
    EXAMPLE_CONFIG.targetAPR,
    EXAMPLE_CONFIG.totalStakedNBC,
    CONVERSION_RATES.USDT,
    REWARD_TOKEN_DECIMALS.USDT,
  ),
  BNB: calculateRewardRate(
    EXAMPLE_CONFIG.targetAPR,
    EXAMPLE_CONFIG.totalStakedNBC,
    CONVERSION_RATES.BNB,
    REWARD_TOKEN_DECIMALS.BNB,
  ),
  SOL: calculateRewardRate(
    EXAMPLE_CONFIG.targetAPR,
    EXAMPLE_CONFIG.totalStakedNBC,
    CONVERSION_RATES.SOL,
    REWARD_TOKEN_DECIMALS.SOL,
  ),
  DOGE: calculateRewardRate(
    EXAMPLE_CONFIG.targetAPR,
    EXAMPLE_CONFIG.totalStakedNBC,
    CONVERSION_RATES.DOGE,
    REWARD_TOKEN_DECIMALS.DOGE,
  ),
  XRP: calculateRewardRate(
    EXAMPLE_CONFIG.targetAPR,
    EXAMPLE_CONFIG.totalStakedNBC,
    CONVERSION_RATES.XRP,
    REWARD_TOKEN_DECIMALS.XRP,
  ),
  LTC: calculateRewardRate(
    EXAMPLE_CONFIG.targetAPR,
    EXAMPLE_CONFIG.totalStakedNBC,
    CONVERSION_RATES.LTC,
    REWARD_TOKEN_DECIMALS.LTC,
  ),
  ETC: calculateRewardRate(
    EXAMPLE_CONFIG.targetAPR,
    EXAMPLE_CONFIG.totalStakedNBC,
    CONVERSION_RATES.ETC,
    REWARD_TOKEN_DECIMALS.ETC,
  ),
  SUI: calculateRewardRate(
    EXAMPLE_CONFIG.targetAPR,
    EXAMPLE_CONFIG.totalStakedNBC,
    CONVERSION_RATES.SUI,
    REWARD_TOKEN_DECIMALS.SUI,
  ),
}

/**
 * 获取代币的兑换比例
 */
export function getConversionRate(tokenSymbol: string): number {
  return CONVERSION_RATES[tokenSymbol as keyof typeof CONVERSION_RATES] || 0
}

/**
 * 获取代币的精度
 */
export function getRewardTokenDecimals(tokenSymbol: string): number {
  return REWARD_TOKEN_DECIMALS[tokenSymbol] || 18
}
