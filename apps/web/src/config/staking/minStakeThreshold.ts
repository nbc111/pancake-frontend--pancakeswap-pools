/**
 * 计算最小质押量门槛
 * 
 * 目标：确保 APR <= 30%
 * 
 * 公式：
 * APR = (annualRewardNBC / totalStakedNBC) * 100
 * 
 * 如果 APR <= 30%，那么：
 * totalStakedNBC >= annualRewardNBC / 0.3
 * 
 * 最小质押量 = annualRewardNBC / 0.3
 */

import { calculateAPRFromRewardRate } from './rewardRates'
import { SECONDS_PER_YEAR } from './rewardRates'

/**
 * 根据 rewardRate 和目标 APR 计算最小质押量
 * 
 * @param rewardRate 每秒奖励率（wei 单位，考虑奖励代币精度）
 * @param conversionRate 兑换比例（1 奖励代币 = X NBC）
 * @param rewardTokenDecimals 奖励代币精度
 * @param targetAPR 目标 APR（%，默认 30）
 * @param rewardsDuration 奖励周期时长（秒），如果未提供则使用默认的 SECONDS_PER_YEAR
 * @returns 最小质押量（NBC，wei 单位）
 */
export function calculateMinStakeThreshold(
  rewardRate: bigint,
  conversionRate: number,
  rewardTokenDecimals: number,
  targetAPR: number = 30,
  rewardsDuration?: bigint,
): bigint {
  if (rewardRate === 0n) return 0n
  if (targetAPR <= 0) return 0n

  // 使用合约的实际 rewardsDuration，如果未提供则使用默认的 SECONDS_PER_YEAR
  const duration = rewardsDuration || BigInt(SECONDS_PER_YEAR)
  
  // 总奖励（奖励代币，wei 单位）= rewardRate × rewardsDuration
  const totalRewardToken = rewardRate * duration
  
  // 转换为年化奖励：需要将 rewardsDuration 转换为年化比例
  const annualRewardToken = (totalRewardToken * BigInt(SECONDS_PER_YEAR)) / duration

  // 转换为 NBC（wei 单位）
  const conversionRateScaled = BigInt(Math.floor(conversionRate * 1e18))
  const rewardTokenMultiplier = BigInt(10 ** rewardTokenDecimals)

  // 年总奖励 NBC（wei 单位）
  const annualRewardNBC = (annualRewardToken * conversionRateScaled) / rewardTokenMultiplier

  // 最小质押量 = 年总奖励 / (目标 APR / 100)
  // 例如：如果目标 APR 是 30%，那么最小质押量 = annualRewardNBC / 0.3
  const targetAPRDecimal = targetAPR / 100
  const minStakeThreshold = (annualRewardNBC * BigInt(100)) / BigInt(Math.floor(targetAPRDecimal * 100))

  return minStakeThreshold
}

/**
 * 检查用户质押量是否达到最小门槛
 * 
 * @param userStakeAmount 用户质押量（NBC，wei 单位）
 * @param currentTotalStaked 当前总质押量（NBC，wei 单位）
 * @param rewardRate 每秒奖励率（wei 单位，考虑奖励代币精度）
 * @param conversionRate 兑换比例（1 奖励代币 = X NBC）
 * @param rewardTokenDecimals 奖励代币精度
 * @param targetAPR 目标 APR（%，默认 30）
 * @param rewardsDuration 奖励周期时长（秒），如果未提供则使用默认的 SECONDS_PER_YEAR
 * @returns 检查结果对象
 */
export function checkStakeThreshold(
  userStakeAmount: bigint,
  currentTotalStaked: bigint,
  rewardRate: bigint,
  conversionRate: number,
  rewardTokenDecimals: number,
  targetAPR: number = 30,
  rewardsDuration?: bigint,
): {
  isValid: boolean
  minStakeThreshold: bigint
  currentAPR: number
  targetAPR: number
  newTotalStaked: bigint
  newAPR: number
  message?: string
} {
  const minStakeThreshold = calculateMinStakeThreshold(
    rewardRate,
    conversionRate,
    rewardTokenDecimals,
    targetAPR,
    rewardsDuration,
  )

  // 计算当前 APR
  const currentAPR = calculateAPRFromRewardRate(
    rewardRate,
    currentTotalStaked,
    conversionRate,
    rewardTokenDecimals,
    rewardsDuration,
  )

  // 计算用户质押后的总质押量
  const newTotalStaked = currentTotalStaked + userStakeAmount

  // 计算用户质押后的 APR
  const newAPR = calculateAPRFromRewardRate(
    rewardRate,
    newTotalStaked,
    conversionRate,
    rewardTokenDecimals,
    rewardsDuration,
  )

  // 检查：如果用户质押后，总质押量达到最小门槛，且 APR <= 目标 APR
  const isValid = newTotalStaked >= minStakeThreshold && newAPR <= targetAPR

  let message: string | undefined
  if (!isValid) {
    if (newTotalStaked < minStakeThreshold) {
      const minStakeNBC = Number(minStakeThreshold) / 1e18
      const currentTotalNBC = Number(currentTotalStaked) / 1e18
      const userStakeNBC = Number(userStakeAmount) / 1e18
      const requiredNBC = minStakeNBC - currentTotalNBC
      const remainingNBC = Math.max(0, requiredNBC - userStakeNBC)
      
      message = `为了保持 APR <= ${targetAPR}%，需要总质押量至少 ${minStakeNBC.toFixed(2)} NBC。当前总质押量：${currentTotalNBC.toFixed(2)} NBC，您的质押量：${userStakeNBC.toFixed(2)} NBC。还需要至少 ${remainingNBC.toFixed(2)} NBC。`
    } else if (newAPR > targetAPR) {
      message = `质押后 APR 将达到 ${newAPR.toFixed(2)}%，超过目标 APR ${targetAPR}%。`
    }
  }

  return {
    isValid,
    minStakeThreshold,
    currentAPR,
    targetAPR,
    newTotalStaked,
    newAPR,
    message,
  }
}
