#!/usr/bin/env node

/**
 * 测试 dynamic-reward-adjuster.js 中的 calculateRewardRate 函数
 * 验证计算逻辑是否正确
 */

const { ethers } = require('ethers')

// 模拟 CONFIG
const CONFIG = {
  TOTAL_STAKED_NBC: '1000000000000000000000000', // 1,000,000 NBC
  TARGET_APR: 100, // 100%
  SECONDS_PER_YEAR: 31536000,
}

/**
 * 计算奖励率（基于兑换比例）- 从 dynamic-reward-adjuster.js 复制
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

  // 每秒奖励率（向上取整，确保不会因为向下取整导致 APR 不足）
  // 方法：先加 (SECONDS_PER_YEAR - 1)，再除以 SECONDS_PER_YEAR，这样会向上取整
  const secondsPerYearBN = ethers.BigNumber.from(CONFIG.SECONDS_PER_YEAR)
  const rewardRate = annualRewardToken.add(secondsPerYearBN.sub(1)).div(secondsPerYearBN)

  return {
    rewardRate,
    annualReward: annualRewardToken,
  }
}

/**
 * 反向计算 APR（验证计算是否正确）
 */
function calculateAPRFromRewardRate(rewardRate, totalStakedNBC, conversionRate, rewardTokenDecimals) {
  if (totalStakedNBC === 0n) return 0
  if (rewardRate === 0n) return 0

  const duration = BigInt(CONFIG.SECONDS_PER_YEAR)
  const totalRewardToken = rewardRate * duration
  const annualRewardToken = (totalRewardToken * BigInt(CONFIG.SECONDS_PER_YEAR)) / duration

  const conversionRateScaled = BigInt(Math.floor(conversionRate * 1e18))
  const rewardTokenMultiplier = BigInt(10 ** rewardTokenDecimals)

  const annualRewardNBC = (annualRewardToken * conversionRateScaled) / rewardTokenMultiplier
  const apr = (Number(annualRewardNBC) / Number(totalStakedNBC)) * 100

  return apr
}

console.log('========================================')
console.log('   测试 calculateRewardRate 函数')
console.log('========================================\n')

// 测试用例
const testCases = [
  {
    name: 'BTC',
    tokenPriceUSD: 95000,
    nbcPriceUSD: 0.07,
    tokenDecimals: 8,
    expectedAPR: 100, // 目标 APR
  },
  {
    name: 'ETH',
    tokenPriceUSD: 3300,
    nbcPriceUSD: 0.07,
    tokenDecimals: 18,
    expectedAPR: 100,
  },
  {
    name: 'USDT',
    tokenPriceUSD: 1.0,
    nbcPriceUSD: 0.07,
    tokenDecimals: 6,
    expectedAPR: 100,
  },
]

let allTestsPassed = true

for (const testCase of testCases) {
  console.log(`\n📊 测试 ${testCase.name}:`)
  console.log(`   代币价格: $${testCase.tokenPriceUSD}`)
  console.log(`   NBC 价格: $${testCase.nbcPriceUSD}`)
  
  // 计算兑换比例
  const conversionRate = testCase.tokenPriceUSD / testCase.nbcPriceUSD
  console.log(`   兑换比例: 1 ${testCase.name} = ${conversionRate.toFixed(2)} NBC`)
  
  // 计算 rewardRate
  const { rewardRate, annualReward } = calculateRewardRate(conversionRate, testCase.tokenDecimals)
  
  console.log(`   rewardRate: ${rewardRate.toString()} wei/s`)
  console.log(`   annualReward: ${annualReward.toString()} wei`)
  
  // 反向计算 APR 验证
  const totalStakedNBC = BigInt(CONFIG.TOTAL_STAKED_NBC)
  const calculatedAPR = calculateAPRFromRewardRate(
    BigInt(rewardRate.toString()),
    totalStakedNBC,
    conversionRate,
    testCase.tokenDecimals,
  )
  
  console.log(`   计算的 APR: ${calculatedAPR.toFixed(2)}%`)
  console.log(`   目标 APR: ${testCase.expectedAPR}%`)
  
  // 允许 1% 的误差（由于向上取整）
  const error = Math.abs(calculatedAPR - testCase.expectedAPR)
  const errorPercent = (error / testCase.expectedAPR) * 100
  
  if (errorPercent <= 1) {
    console.log(`   ✅ 测试通过 (误差: ${errorPercent.toFixed(2)}%)`)
  } else {
    console.log(`   ❌ 测试失败 (误差: ${errorPercent.toFixed(2)}%)`)
    allTestsPassed = false
  }
}

console.log('\n========================================')
if (allTestsPassed) {
  console.log('   ✅ 所有测试通过')
  console.log('   calculateRewardRate 函数逻辑正确')
} else {
  console.log('   ❌ 部分测试失败')
  console.log('   请检查 calculateRewardRate 函数的实现')
}
console.log('========================================\n')
