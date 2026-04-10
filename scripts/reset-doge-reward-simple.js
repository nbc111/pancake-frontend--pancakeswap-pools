#!/usr/bin/env node

/**
 * 简化版：直接重置 DOGE 池的 rewardRate
 * 
 * 基于 Remix 数据显示 rewardsDuration = 1 年（31536000 秒）
 * 策略：发送计算好的奖励量来达到目标 rewardRate
 */

const { ethers } = require('ethers')
const { formatUnits, parseUnits } = require('ethers/lib/utils')
require('dotenv').config()

const CONFIG = {
  RPC_URL: process.env.RPC_URL || 'https://rpc.nbcex.com',
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  DOGE_TOKEN_ADDRESS: '0x8cEb9a93405CDdf3D76f72327F868Bd3E8755D89',
  STAKING_CONTRACT_ADDRESS: process.env.STAKING_CONTRACT_ADDRESS || '0x32580B2001EA941529c79bcb819b8f6F3c886c60',
  TARGET_APR: parseFloat(process.argv.find(arg => arg.startsWith('--target-apr'))?.split('=')[1] || '50'),
  EXPECTED_STAKED: parseFloat(process.argv.find(arg => arg.startsWith('--expected-staked'))?.split('=')[1] || '1000000'),
  EXECUTE: process.argv.includes('--execute'),
  USE_REMIX_DURATION: process.argv.includes('--use-remix-duration'), // 使用 Remix 显示的 1 年 duration
}

const STAKING_ABI = [
  'function pools(uint256) view returns (address, uint256, uint256, uint256, uint256, uint256, uint256, bool)',
  'function notifyRewardAmount(uint256 poolIndex, uint256 reward)',
  'function owner() view returns (address)',
]

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
]

async function main() {
  console.log('\n' + '='.repeat(80))
  console.log('   重置 DOGE 池的 rewardRate（简化版）')
  console.log('='.repeat(80))
  console.log(`时间: ${new Date().toISOString()}`)
  console.log(`模式: ${CONFIG.EXECUTE ? '执行模式' : '预览模式'}`)
  console.log(`目标 APR: ${CONFIG.TARGET_APR}%`)
  console.log(`预期质押量: ${CONFIG.EXPECTED_STAKED} NBC`)
  if (CONFIG.USE_REMIX_DURATION) {
    console.log('⚠️  使用 Remix 显示的 rewardsDuration = 1 年（31536000 秒）')
  }
  console.log('='.repeat(80) + '\n')

  if (!CONFIG.PRIVATE_KEY) {
    console.error('❌ 错误: 未设置 PRIVATE_KEY 环境变量')
    process.exit(1)
  }

  const provider = new ethers.providers.JsonRpcProvider(CONFIG.RPC_URL, { name: 'NBC Chain', chainId: 1281 })
  const wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, provider)
  const stakingContract = new ethers.Contract(CONFIG.STAKING_CONTRACT_ADDRESS, STAKING_ABI, wallet)
  const dogeToken = new ethers.Contract(CONFIG.DOGE_TOKEN_ADDRESS, ERC20_ABI, wallet)

  // 1. 查询当前状态
  console.log('📊 查询当前状态...')
  const pool = await stakingContract.pools(7)
  const currentRewardRate = pool[2]
  const periodFinish = Number(pool[3])
  const rewardsDuration = CONFIG.USE_REMIX_DURATION ? 31536000 : Number(pool[5])
  const currentTime = Math.floor(Date.now() / 1000)
  const remainingTime = periodFinish - currentTime
  const remainingReward = currentRewardRate.mul(remainingTime)

  console.log(`   当前 rewardRate: ${formatUnits(currentRewardRate, 18)} DOGE/s`)
  console.log(`   周期结束时间: ${new Date(periodFinish * 1000).toISOString()}`)
  console.log(`   剩余时间: ${(remainingTime / 86400).toFixed(2)} 天`)
  console.log(`   rewardsDuration: ${rewardsDuration} 秒 = ${(rewardsDuration / (365 * 24 * 60 * 60)).toFixed(2)} 年`)
  console.log(`   剩余奖励: ${formatUnits(remainingReward, 18)} DOGE`)
  console.log('')

  // 2. 计算目标 rewardRate 和需要的奖励
  console.log('🎯 计算目标 rewardRate...')
  const targetRewardRate = parseUnits('0.00848', 18)
  const totalRewardNeeded = targetRewardRate.mul(rewardsDuration)
  const newRewardNeeded = totalRewardNeeded.sub(remainingReward)
  
  console.log(`   目标 rewardRate: ${formatUnits(targetRewardRate, 18)} DOGE/s`)
  console.log(`   需要的总奖励: ${formatUnits(totalRewardNeeded, 18)} DOGE`)
  console.log(`   剩余奖励: ${formatUnits(remainingReward, 18)} DOGE`)
  console.log(`   需要发送的新奖励: ${formatUnits(newRewardNeeded, 18)} DOGE`)
  console.log('')

  if (newRewardNeeded.lt(0)) {
    console.log('❌ 无法达到目标值：剩余奖励已超过需要的总奖励')
    console.log('   差额:', formatUnits(newRewardNeeded.mul(-1), 18), 'DOGE')
    console.log('')
    console.log('💡 解决方案:')
    console.log('   1. 等待周期结束（', (remainingTime / 86400).toFixed(0), '天后）')
    console.log('   2. 或者发送 0 奖励来重置周期（但 rewardRate 仍会很高）')
    return
  }

  if (!CONFIG.EXECUTE) {
    console.log('⚠️  预览模式：不会实际执行交易')
    console.log('   要实际执行，请使用 --execute 参数')
    return
  }

  // 3. 检查余额和批准
  console.log('📋 检查余额和批准...')
  const owner = await stakingContract.owner()
  const balance = await dogeToken.balanceOf(owner)
  console.log(`   余额: ${formatUnits(balance, 18)} DOGE`)
  console.log(`   需要: ${formatUnits(newRewardNeeded, 18)} DOGE`)
  
  if (balance.lt(newRewardNeeded)) {
    console.log('   ⚠️  余额不足，需要 mint DOGE')
    // 这里可以调用 mint 函数
    const mintAmount = newRewardNeeded.sub(balance).mul(110).div(100) // 多 mint 10%
    console.log(`   需要 mint: ${formatUnits(mintAmount, 18)} DOGE`)
    // TODO: 实现 mint 逻辑
    return
  }
  
  const allowance = await dogeToken.allowance(owner, CONFIG.STAKING_CONTRACT_ADDRESS)
  if (allowance.lt(newRewardNeeded)) {
    console.log('   ⚠️  需要批准代币...')
    const approveTx = await dogeToken.approve(CONFIG.STAKING_CONTRACT_ADDRESS, ethers.constants.MaxUint256)
    await approveTx.wait()
    console.log('   ✅ 批准成功')
  }
  console.log('')

  // 4. 执行交易
  console.log('📤 发送交易...')
  try {
    const tx = await stakingContract.notifyRewardAmount(7, newRewardNeeded)
    console.log(`   🔗 交易哈希: ${tx.hash}`)
    console.log('   ⏳ 等待确认...')
    const receipt = await tx.wait()
    console.log(`   ✅ 交易成功！区块: ${receipt.blockNumber}`)
    
    // 验证新的 rewardRate
    const poolAfter = await stakingContract.pools(7)
    const newRewardRate = poolAfter[2]
    console.log(`   ✅ 新的 rewardRate: ${formatUnits(newRewardRate, 18)} DOGE/s`)
    console.log(`   ✅ 目标 rewardRate: ${formatUnits(targetRewardRate, 18)} DOGE/s`)
    
    const diff = newRewardRate.sub(targetRewardRate).mul(10000).div(targetRewardRate)
    if (diff.abs().lt(100)) { // 误差小于 1%
      console.log('   ✅ 成功达到目标值！')
    } else {
      console.log(`   ⚠️  与目标值有差异: ${formatUnits(diff, 2)}%`)
    }
  } catch (error) {
    console.error('❌ 错误:', error.message)
    if (error.transaction) {
      console.error('   交易哈希:', error.transaction.hash)
    }
    process.exit(1)
  }

  console.log('\n' + '='.repeat(80))
  console.log('✅ 完成！')
  console.log('='.repeat(80))
}

main().catch((error) => {
  console.error('❌ 错误:', error.message)
  process.exit(1)
})
