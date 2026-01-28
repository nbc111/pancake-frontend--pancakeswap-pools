#!/usr/bin/env node

/**
 * 立即重置 DOGE 池的 rewardRate（不等待周期结束）
 * 
 * 策略：
 * 1. 发送 0 奖励来重置周期（开始新的 1 年周期）
 * 2. 立即发送新奖励来设置正确的 rewardRate
 * 
 * 注意：由于合约限制，发送 0 奖励后，新的 rewardRate = 剩余奖励 / rewardsDuration
 *       如果剩余奖励太大，可能需要多次操作或等待
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
  'function owner() view returns (address)',
]

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
]

async function main() {
  console.log('\n' + '='.repeat(80))
  console.log('   立即重置 DOGE 池的 rewardRate（两步策略）')
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
  const dogeToken = new ethers.Contract(CONFIG.DOGE_TOKEN_ADDRESS, ERC20_ABI, wallet)

  // 1. 查询当前状态
  console.log('📊 查询当前状态...')
  const pool = await stakingContract.pools(7)
  const currentRewardRate = pool[2]
  const periodFinish = Number(pool[3])
  const rewardsDuration = Number(pool[5])
  const currentTime = Math.floor(Date.now() / 1000)
  const remainingTime = periodFinish - currentTime
  const remainingReward = currentRewardRate.mul(remainingTime)

  console.log(`   当前 rewardRate: ${formatUnits(currentRewardRate, 18)} DOGE/s`)
  console.log(`   周期结束时间: ${new Date(periodFinish * 1000).toISOString()}`)
  console.log(`   剩余时间: ${(remainingTime / 86400).toFixed(2)} 天`)
  console.log(`   rewardsDuration: ${rewardsDuration} 秒 = ${(rewardsDuration / (365 * 24 * 60 * 60)).toFixed(2)} 年`)
  console.log(`   剩余奖励: ${formatUnits(remainingReward, 18)} DOGE`)
  console.log('')

  // 2. 计算目标 rewardRate
  console.log('🎯 计算目标 rewardRate...')
  // 简化计算：基于目标 APR 和预期质押量
  // 这里使用之前计算的结果：目标 rewardRate = 0.00848 DOGE/s
  const targetRewardRate = parseUnits('0.00848', 18)
  const totalRewardNeeded = targetRewardRate.mul(rewardsDuration)
  
  console.log(`   目标 rewardRate: ${formatUnits(targetRewardRate, 18)} DOGE/s`)
  console.log(`   需要的总奖励: ${formatUnits(totalRewardNeeded, 18)} DOGE`)
  console.log('')

  // 3. 分析策略
  console.log('💡 策略分析:')
  console.log('   步骤 1: 发送 0 奖励来重置周期')
  console.log('      - 新的 rewardRate = 剩余奖励 / rewardsDuration')
  const newRewardRateAfterZero = remainingReward.div(rewardsDuration)
  console.log(`      - 新的 rewardRate: ${formatUnits(newRewardRateAfterZero, 18)} DOGE/s`)
  
  if (newRewardRateAfterZero.lt(targetRewardRate)) {
    console.log('      - ✅ 可以达到目标值！')
    console.log('      - 只需要发送 0 奖励即可')
  } else {
    console.log('      - ❌ 仍高于目标值')
    console.log('')
    console.log('   步骤 2: 立即发送新奖励（在同一个区块或下一个区块）')
    console.log('      - 关键：步骤 1 后，periodFinish 已更新为当前时间 + rewardsDuration')
    console.log('      - 如果立即发送（在同一区块），剩余时间 = rewardsDuration')
    console.log('      - 剩余奖励 = 新 rewardRate × rewardsDuration')
    console.log('      - 新的 rewardRate = (新奖励 + 剩余奖励) / rewardsDuration')
    console.log('      - 但如果我们等待到下一个区块，剩余奖励会减少')
    console.log('      - 或者：发送足够大的奖励来\"覆盖\"剩余奖励')
    console.log('')
    console.log('   💡 更好的策略：发送一个计算好的奖励量')
    console.log('      - 使得 (新奖励 + 剩余奖励) / rewardsDuration = 目标值')
    const neededReward = targetRewardRate.mul(rewardsDuration).sub(remainingReward)
    if (neededReward.gt(0)) {
      console.log(`      - 需要发送: ${formatUnits(neededReward, 18)} DOGE`)
      console.log('      - ✅ 可以达到目标值！')
    } else {
      console.log('      - ⚠️  剩余奖励已超过需要的总奖励')
      console.log('      - 需要等待周期结束或使用其他方法')
    }
  }
  console.log('')

  if (!CONFIG.EXECUTE) {
    console.log('⚠️  预览模式：不会实际执行交易')
    console.log('   要实际执行，请使用 --execute 参数')
    return
  }

  // 4. 执行步骤 1: 发送 0 奖励
  console.log('📤 步骤 1: 发送 0 奖励来重置周期...')
  try {
    // 注意：发送 0 奖励需要先批准 0 额度，或者使用特殊方法
    // 但实际上，我们可以发送一个非常小的奖励（比如 1 wei）来触发重置
    const zeroReward = ethers.BigNumber.from('0')
    
    // 检查是否需要批准
    const owner = await stakingContract.owner()
    try {
      const allowance = await dogeToken.allowance(owner, CONFIG.STAKING_CONTRACT_ADDRESS)
      if (allowance.eq(0)) {
        console.log('   ⚠️  需要先批准代币...')
        const approveTx = await dogeToken.approve(CONFIG.STAKING_CONTRACT_ADDRESS, ethers.constants.MaxUint256)
        await approveTx.wait()
        console.log('   ✅ 批准成功')
      }
    } catch (error) {
      // 如果 allowance 函数不存在，跳过批准检查
      console.log('   ⚠️  无法检查批准状态，继续执行...')
    }
    
    // 发送 0 奖励（实际上发送 1 wei 来触发函数）
    const minReward = ethers.BigNumber.from('1')
    const tx1 = await stakingContract.notifyRewardAmount(7, minReward)
    console.log(`   🔗 交易哈希: ${tx1.hash}`)
    console.log('   ⏳ 等待确认...')
    const receipt1 = await tx1.wait()
    console.log(`   ✅ 步骤 1 完成！区块: ${receipt1.blockNumber}`)
    
    // 验证新的 rewardRate
    const poolAfter = await stakingContract.pools(7)
    const newRewardRate = poolAfter[2]
    console.log(`   ✅ 新的 rewardRate: ${formatUnits(newRewardRate, 18)} DOGE/s`)
    console.log('')
    
    // 5. 执行步骤 2: 发送新奖励
    if (newRewardRate.gt(targetRewardRate)) {
      console.log('📤 步骤 2: 发送新奖励来设置正确的 rewardRate...')
      
      // 检查余额
      const balance = await dogeToken.balanceOf(owner)
      if (balance.lt(totalRewardNeeded)) {
        console.log(`   ⚠️  余额不足: ${formatUnits(balance, 18)} DOGE < ${formatUnits(totalRewardNeeded, 18)} DOGE`)
        console.log('   💡 需要先 mint DOGE')
        // 这里可以调用 mint 函数
        // 为了简化，我们假设余额充足
        return
      }
      
      const tx2 = await stakingContract.notifyRewardAmount(7, totalRewardNeeded)
      console.log(`   🔗 交易哈希: ${tx2.hash}`)
      console.log('   ⏳ 等待确认...')
      const receipt2 = await tx2.wait()
      console.log(`   ✅ 步骤 2 完成！区块: ${receipt2.blockNumber}`)
      
      // 验证最终的 rewardRate
      const poolFinal = await stakingContract.pools(7)
      const finalRewardRate = poolFinal[2]
      console.log(`   ✅ 最终的 rewardRate: ${formatUnits(finalRewardRate, 18)} DOGE/s`)
      console.log(`   ✅ 目标 rewardRate: ${formatUnits(targetRewardRate, 18)} DOGE/s`)
      
      if (finalRewardRate.lte(targetRewardRate.mul(110).div(100))) {
        console.log('   ✅ 成功达到目标值！')
      } else {
        console.log('   ⚠️  仍未完全达到目标值，可能需要调整')
      }
    } else {
      console.log('✅ 步骤 1 后已达到目标值，无需步骤 2')
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
