#!/usr/bin/env node

/**
 * 通过提取多余的 DOGE 来修复 rewardRate
 * 
 * 问题：质押合约中有大量 DOGE（155 万），导致 rewardRate 无法降低
 * 解决方案：
 * 1. 使用 emergencyWithdrawReward 提取多余的 DOGE
 * 2. 只保留需要的奖励量（约 26.7 万 DOGE）
 * 3. 然后重新设置 rewardRate
 */

const { ethers } = require('ethers')
const { formatUnits, parseUnits } = require('ethers/lib/utils')
require('dotenv').config()

const CONFIG = {
  RPC_URL: process.env.RPC_URL || 'https://rpc.nbcex.com',
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  DOGE_TOKEN_ADDRESS: '0x8cEb9a93405CDdf3D76f72327F868Bd3E8755D89',
  STAKING_CONTRACT_ADDRESS: process.env.STAKING_CONTRACT_ADDRESS || '0x107B4E8F1b849b69033FbF4AAcb10B72d29A16E1',
  TARGET_APR: parseFloat(process.argv.find(arg => arg.startsWith('--target-apr'))?.split('=')[1] || '50'),
  EXPECTED_STAKED: parseFloat(process.argv.find(arg => arg.startsWith('--expected-staked'))?.split('=')[1] || '1000000'),
  EXECUTE: process.argv.includes('--execute'),
}

const STAKING_ABI = [
  'function pools(uint256) view returns (address, uint256, uint256, uint256, uint256, uint256, uint256, bool)',
  'function notifyRewardAmount(uint256 poolIndex, uint256 reward)',
  'function emergencyWithdrawReward(uint256 poolIndex, uint256 amount) external',
  'function owner() view returns (address)',
]

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
]

async function main() {
  console.log('\n' + '='.repeat(80))
  console.log('   通过提取多余的 DOGE 来修复 rewardRate')
  console.log('='.repeat(80))
  console.log(`时间: ${new Date().toISOString()}`)
  console.log(`模式: ${CONFIG.EXECUTE ? '执行模式' : '预览模式'}`)
  console.log(`目标 APR: ${CONFIG.TARGET_APR}%`)
  console.log(`预期质押量: ${CONFIG.EXPECTED_STAKED} NBC`)
  console.log('='.repeat(80) + '\n')

  if (!CONFIG.PRIVATE_KEY) {
    console.error('❌ 错误: 未设置 PRIVATE_KEY 环境变量')
    process.exit(1)
  }

  const provider = new ethers.providers.JsonRpcProvider(CONFIG.RPC_URL, { name: 'NBC Chain', chainId: 1281 })
  const wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, provider)
  const stakingContract = new ethers.Contract(CONFIG.STAKING_CONTRACT_ADDRESS, STAKING_ABI, wallet)
  const dogeToken = new ethers.Contract(CONFIG.DOGE_TOKEN_ADDRESS, ERC20_ABI, provider)

  // 1. 查询当前状态
  console.log('📊 查询当前状态...')
  const pool = await stakingContract.pools(7)
  const currentRewardRate = pool[2]
  const periodFinish = Number(pool[3])
  // 使用 Remix 显示的 rewardsDuration = 1 年（31536000 秒）
  // 如果查询结果显示是 56 年，可能是数据问题，使用 Remix 的值
  const rewardsDuration = process.argv.includes('--use-remix-duration') ? 31536000 : Number(pool[5])
  const currentTime = Math.floor(Date.now() / 1000)
  const remainingTime = periodFinish - currentTime
  const remainingReward = currentRewardRate.mul(remainingTime)
  
  // 查询合约余额
  const contractBalance = await dogeToken.balanceOf(CONFIG.STAKING_CONTRACT_ADDRESS)
  const owner = await stakingContract.owner()

  console.log(`   当前 rewardRate: ${formatUnits(currentRewardRate, 18)} DOGE/s`)
  console.log(`   周期结束时间: ${new Date(periodFinish * 1000).toISOString()}`)
  console.log(`   剩余时间: ${(remainingTime / 86400).toFixed(2)} 天`)
  console.log(`   rewardsDuration: ${rewardsDuration} 秒 = ${(rewardsDuration / (365 * 24 * 60 * 60)).toFixed(2)} 年`)
  console.log(`   计算出的剩余奖励: ${formatUnits(remainingReward, 18)} DOGE`)
  console.log(`   ⚠️  合约实际余额: ${formatUnits(contractBalance, 18)} DOGE`)
  console.log('')

  // 2. 计算目标 rewardRate 和需要的奖励
  console.log('🎯 计算目标 rewardRate...')
  const targetRewardRate = parseUnits('0.00848', 18)
  const totalRewardNeeded = targetRewardRate.mul(rewardsDuration)
  
  console.log(`   目标 rewardRate: ${formatUnits(targetRewardRate, 18)} DOGE/s`)
  console.log(`   需要的总奖励: ${formatUnits(totalRewardNeeded, 18)} DOGE`)
  console.log('')

  // 3. 计算需要提取的 DOGE 数量
  console.log('💡 分析:')
  console.log('   合约中的 DOGE 余额:', formatUnits(contractBalance, 18), 'DOGE')
  console.log('   需要的总奖励:', formatUnits(totalRewardNeeded, 18), 'DOGE')
  
  if (contractBalance.gt(totalRewardNeeded)) {
    const excessAmount = contractBalance.sub(totalRewardNeeded)
    console.log(`   多余的 DOGE: ${formatUnits(excessAmount, 18)} DOGE`)
    console.log('')
    console.log('   ✅ 解决方案:')
    console.log('      1. 提取多余的 DOGE:', formatUnits(excessAmount, 18), 'DOGE')
    console.log('      2. 保留需要的奖励量:', formatUnits(totalRewardNeeded, 18), 'DOGE')
    console.log('      3. 然后重新设置 rewardRate')
  } else {
    console.log('   ⚠️  合约余额不足，需要先 mint DOGE')
    const neededAmount = totalRewardNeeded.sub(contractBalance)
    console.log(`   需要 mint: ${formatUnits(neededAmount, 18)} DOGE`)
  }
  console.log('')

  if (!CONFIG.EXECUTE) {
    console.log('⚠️  预览模式：不会实际执行交易')
    console.log('   要实际执行，请使用 --execute 参数')
    return
  }

  // 4. 提取多余的 DOGE
  if (contractBalance.gt(totalRewardNeeded)) {
    const excessAmount = contractBalance.sub(totalRewardNeeded)
    console.log('📤 步骤 1: 提取多余的 DOGE...')
    try {
      const tx1 = await stakingContract.emergencyWithdrawReward(7, excessAmount)
      console.log(`   🔗 交易哈希: ${tx1.hash}`)
      console.log('   ⏳ 等待确认...')
      const receipt1 = await tx1.wait()
      console.log(`   ✅ 提取成功！区块: ${receipt1.blockNumber}`)
      
      // 验证余额
      const newBalance = await dogeToken.balanceOf(CONFIG.STAKING_CONTRACT_ADDRESS)
      console.log(`   ✅ 合约新余额: ${formatUnits(newBalance, 18)} DOGE`)
      console.log('')
    } catch (error) {
      console.error('❌ 提取失败:', error.message)
      process.exit(1)
    }
  }

  // 5. 重新设置 rewardRate
  console.log('📤 步骤 2: 重新设置 rewardRate...')
  try {
    // 查询当前余额（提取后）
    const currentBalance = await dogeToken.balanceOf(CONFIG.STAKING_CONTRACT_ADDRESS)
    
    // 如果余额不足，需要 mint
    if (currentBalance.lt(totalRewardNeeded)) {
      const neededAmount = totalRewardNeeded.sub(currentBalance)
      console.log(`   ⚠️  余额不足，需要 mint: ${formatUnits(neededAmount, 18)} DOGE`)
      // TODO: 实现 mint 逻辑
      return
    }
    
    // 发送新奖励来设置 rewardRate
    // 注意：由于我们已经提取了多余的 DOGE，现在合约余额应该接近需要的量
    // 但我们需要发送一个计算好的奖励量来设置正确的 rewardRate
    
    // 重新查询状态（提取后）
    const poolAfter = await stakingContract.pools(7)
    const rewardRateAfter = poolAfter[2]
    const periodFinishAfter = Number(poolAfter[3])
    const remainingTimeAfter = periodFinishAfter - currentTime
    const remainingRewardAfter = rewardRateAfter.mul(remainingTimeAfter)
    
    console.log(`   当前 rewardRate: ${formatUnits(rewardRateAfter, 18)} DOGE/s`)
    console.log(`   剩余奖励: ${formatUnits(remainingRewardAfter, 18)} DOGE`)
    console.log(`   合约余额: ${formatUnits(currentBalance, 18)} DOGE`)
    console.log('')
    
    // 策略：如果使用 Remix 的 1 年 duration，合约余额正好是需要的量
    // 我们可以发送合约余额作为奖励来设置正确的 rewardRate
    if (CONFIG.USE_REMIX_DURATION && currentBalance.gte(totalRewardNeeded.mul(95).div(100))) {
      // 发送合约余额（或接近的值）来设置 rewardRate
      const rewardToSend = currentBalance
      console.log(`   使用合约余额设置 rewardRate: ${formatUnits(rewardToSend, 18)} DOGE`)
      console.log(`   （如果 rewardsDuration 是 1 年，这将设置 rewardRate = ${formatUnits(rewardToSend.div(rewardsDuration), 18)} DOGE/s）`)
      
      const tx2 = await stakingContract.notifyRewardAmount(7, rewardToSend)
      console.log(`   🔗 交易哈希: ${tx2.hash}`)
      console.log('   ⏳ 等待确认...')
      const receipt2 = await tx2.wait()
      console.log(`   ✅ 设置成功！区块: ${receipt2.blockNumber}`)
    } else {
      // 计算需要发送的奖励
      const newRewardNeeded = totalRewardNeeded.sub(remainingRewardAfter)
      
      if (newRewardNeeded.gt(0) && newRewardNeeded.lte(currentBalance)) {
        console.log(`   需要发送: ${formatUnits(newRewardNeeded, 18)} DOGE`)
        const tx2 = await stakingContract.notifyRewardAmount(7, newRewardNeeded)
        console.log(`   🔗 交易哈希: ${tx2.hash}`)
        console.log('   ⏳ 等待确认...')
        const receipt2 = await tx2.wait()
        console.log(`   ✅ 设置成功！区块: ${receipt2.blockNumber}`)
      } else {
        console.log('   ⚠️  无法计算正确的奖励量')
        console.log('   可能需要等待周期结束或使用其他方法')
        return
      }
    }
    
    // 验证最终的 rewardRate
    const poolFinal = await stakingContract.pools(7)
    const finalRewardRate = poolFinal[2]
    console.log(`   ✅ 最终的 rewardRate: ${formatUnits(finalRewardRate, 18)} DOGE/s`)
    console.log(`   ✅ 目标 rewardRate: ${formatUnits(targetRewardRate, 18)} DOGE/s`)
    
    const diff = finalRewardRate.sub(targetRewardRate).mul(10000).div(targetRewardRate)
    if (diff.abs().lt(100)) { // 误差小于 1%
      console.log('   ✅ 成功达到目标值！')
    } else {
      console.log(`   ⚠️  与目标值有差异: ${formatUnits(diff, 2)}%`)
    }
  } catch (error) {
    console.error('❌ 设置失败:', error.message)
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
