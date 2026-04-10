#!/usr/bin/env node

/**
 * 验证并修复 rewardRate
 * 
 * 这个脚本会：
 * 1. 检查当前合约中的 rewardRate
 * 2. 计算正确的 rewardRate
 * 3. 如果差异超过阈值，强制更新
 */

const { ethers } = require('ethers')
const { formatUnits } = require('ethers/lib/utils')
require('dotenv').config()

const CONFIG = {
  RPC_URL: process.env.RPC_URL || 'https://rpc.nbcex.com',
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  STAKING_CONTRACT_ADDRESS: process.env.STAKING_CONTRACT_ADDRESS || '0x32580B2001EA941529c79bcb819b8f6F3c886c60',
  TOTAL_STAKED_NBC: process.env.TOTAL_STAKED_NBC || '1000000000000000000000000',
  TARGET_APR: parseFloat(process.env.TARGET_APR || '100'),
  SECONDS_PER_YEAR: 31536000,
  MIN_CHANGE_THRESHOLD: 0.05, // 5% 变化阈值
}

// 从 dynamic-reward-adjuster.js 导入计算函数（简化版）
function calculateRewardRate(conversionRate, tokenDecimals) {
  const aprDecimal = CONFIG.TARGET_APR / 100
  const totalStakedNBC = ethers.BigNumber.from(CONFIG.TOTAL_STAKED_NBC)
  const aprMultiplier = Math.floor(aprDecimal * 10000)
  const annualRewardNBCWei = totalStakedNBC.mul(aprMultiplier).div(10000)

  const conversionRateStr = conversionRate.toFixed(18)
  const conversionRateParts = conversionRateStr.split('.')
  const integerPart = conversionRateParts[0]
  const decimalPart = (conversionRateParts[1] || '').padEnd(18, '0').substring(0, 18)
  const conversionRateScaled = ethers.BigNumber.from(integerPart + decimalPart)

  const rewardTokenMultiplier = ethers.BigNumber.from(10).pow(tokenDecimals)
  const annualRewardToken = annualRewardNBCWei.mul(rewardTokenMultiplier).div(conversionRateScaled)

  const secondsPerYearBN = ethers.BigNumber.from(CONFIG.SECONDS_PER_YEAR)
  const rewardRate = annualRewardToken.add(secondsPerYearBN.sub(1)).div(secondsPerYearBN)

  return {
    rewardRate,
    annualReward: annualRewardToken,
  }
}

// 简化的价格获取（使用固定值用于测试）
async function getPrices() {
  // 这里应该从 API 获取，但为了简化，使用固定值
  return {
    nbc: 0.07,
    btc: 93464,
    // 可以根据需要添加其他代币
  }
}

async function main() {
  console.log('='.repeat(80))
  console.log('   验证并修复 rewardRate')
  console.log('='.repeat(80))
  console.log('')

  try {
    // 获取价格
    const prices = await getPrices()
    const conversionRate = prices.btc / prices.nbc

    console.log('📊 价格信息:')
    console.log(`   NBC: $${prices.nbc}`)
    console.log(`   BTC: $${prices.btc.toLocaleString()}`)
    console.log(`   兑换比例: 1 BTC = ${conversionRate.toLocaleString()} NBC`)
    console.log('')

    // 计算正确的 rewardRate
    const correctRewardRate = calculateRewardRate(conversionRate, 8) // BTC 精度 8

    console.log('🔢 计算正确的 rewardRate:')
    console.log(`   目标 APR: ${CONFIG.TARGET_APR}%`)
    console.log(`   预期质押量: ${formatUnits(CONFIG.TOTAL_STAKED_NBC, 18)} NBC`)
    console.log(`   正确的 rewardRate: ${formatUnits(correctRewardRate.rewardRate, 8)} BTC/s`)
    console.log(`   年总奖励: ${formatUnits(correctRewardRate.annualReward, 8)} BTC`)
    console.log('')

    // 查询合约中的实际 rewardRate
    const provider = new ethers.providers.JsonRpcProvider(CONFIG.RPC_URL, {
      name: 'NBC Chain',
      chainId: 1281,
    })
    const stakingContract = new ethers.Contract(
      CONFIG.STAKING_CONTRACT_ADDRESS,
      ['function getPoolInfo(uint256) view returns (address rewardToken, uint256 totalStakedAmount, uint256 rewardRate, uint256 periodFinish, bool active)'],
      provider,
    )

    const poolInfo = await stakingContract.getPoolInfo(1) // BTC 池
    const currentRewardRate = poolInfo.rewardRate
    const currentTotalStaked = poolInfo.totalStakedAmount

    console.log('📋 当前合约状态:')
    console.log(`   当前 rewardRate: ${formatUnits(currentRewardRate, 8)} BTC/s`)
    console.log(`   当前质押量: ${formatUnits(currentTotalStaked, 18)} NBC`)
    console.log('')

    // 计算差异
    const currentRateNum = Number(currentRewardRate)
    const correctRateNum = Number(correctRewardRate.rewardRate)
    const diffPercent = ((correctRateNum - currentRateNum) / currentRateNum) * 100

    console.log('📊 差异分析:')
    console.log(`   差异: ${diffPercent > 0 ? '+' : ''}${diffPercent.toFixed(2)}%`)
    console.log(`   差异倍数: ${(currentRateNum / correctRateNum).toFixed(2)}x`)
    console.log('')

    // 判断是否需要更新
    const absDiff = Math.abs(diffPercent)
    if (absDiff < CONFIG.MIN_CHANGE_THRESHOLD * 100) {
      console.log('✅ rewardRate 已经正确，无需更新')
      return
    }

    console.log(`⚠️  rewardRate 差异过大 (${absDiff.toFixed(2)}%)，需要更新`)
    console.log('')

    // 如果需要更新，提示用户
    if (!CONFIG.PRIVATE_KEY) {
      console.log('⚠️  未设置 PRIVATE_KEY，无法自动更新')
      console.log('   请使用 reset-reward-rate.js 脚本手动更新')
      return
    }

    console.log('💡 建议:')
    console.log('   1. 使用 reset-reward-rate.js 脚本手动更新')
    console.log('   2. 或者等待 dynamic-reward-adjuster.js 下次运行（每 5 分钟）')
    console.log('   3. 确保服务器上的 dynamic-reward-adjuster.js 是最新版本')
    console.log('')

  } catch (error) {
    console.error('❌ 错误:', error.message)
    process.exit(1)
  }
}

main().catch(console.error)
