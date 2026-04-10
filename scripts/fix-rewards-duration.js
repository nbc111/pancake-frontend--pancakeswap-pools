#!/usr/bin/env node

/**
 * 修复质押池的 rewardsDuration
 * 
 * 问题：某些池的 rewardsDuration 被错误设置为很大的值（如 56 年），导致 rewardRate 计算错误
 * 解决方案：将所有池的 rewardsDuration 设置为正确的值（31536000 秒 = 1 年）
 * 
 * 使用方法：
 *   node fix-rewards-duration.js                    # 检查所有池的 rewardsDuration
 *   node fix-rewards-duration.js --pool BTC          # 修复 BTC 池
 *   node fix-rewards-duration.js --pool all         # 修复所有池
 *   node fix-rewards-duration.js --pool all --execute # 执行修复（需要 --execute）
 */

const { ethers } = require('ethers')
const { formatUnits } = require('ethers/lib/utils')
require('dotenv').config()

// 解析命令行参数
const args = process.argv.slice(2)
const getArg = (name, defaultValue) => {
  const index = args.indexOf(`--${name}`)
  return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue
}
const hasFlag = (name) => args.includes(`--${name}`)

const CONFIG = {
  RPC_URL: process.env.RPC_URL || 'https://rpc.nbcex.com',
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  STAKING_CONTRACT_ADDRESS: process.env.STAKING_CONTRACT_ADDRESS || '0x32580B2001EA941529c79bcb819b8f6F3c886c60',
  REWARDS_DURATION: 31536000, // 1 年（秒）
  EXECUTE: hasFlag('execute'),
}

// 代币配置
const TOKEN_CONFIG = {
  BTC: { poolIndex: 1, symbol: 'BTC' },
  ETH: { poolIndex: 2, symbol: 'ETH' },
  SOL: { poolIndex: 3, symbol: 'SOL' },
  BNB: { poolIndex: 4, symbol: 'BNB' },
  XRP: { poolIndex: 5, symbol: 'XRP' },
  LTC: { poolIndex: 6, symbol: 'LTC' },
  DOGE: { poolIndex: 7, symbol: 'DOGE' },
  USDT: { poolIndex: 9, symbol: 'USDT' },
  SUI: { poolIndex: 10, symbol: 'SUI' },
}

// 合约 ABI
const STAKING_ABI = [
  'function setRewardsDuration(uint256 poolIndex, uint256 rewardsDuration) external',
  'function pools(uint256) view returns (address rewardToken, uint256 totalStakedAmount, uint256 rewardRate, uint256 periodFinish, uint256 lastUpdateTime, uint256 rewardsDuration, bool active)',
  'function owner() view returns (address)',
]

/**
 * 检查单个池的 rewardsDuration
 */
async function checkPoolRewardsDuration(provider, poolIndex, symbol) {
  const contract = new ethers.Contract(CONFIG.STAKING_CONTRACT_ADDRESS, STAKING_ABI, provider)
  
  try {
    const pool = await contract.pools(poolIndex)
    const duration = Number(pool.rewardsDuration)
    const years = duration / (365 * 24 * 60 * 60)
    const isCorrect = duration === CONFIG.REWARDS_DURATION
    
    return {
      poolIndex,
      symbol,
      duration,
      years,
      isCorrect,
      active: pool.active,
    }
  } catch (error) {
    console.error(`   ❌ 查询 ${symbol} 池失败:`, error.message)
    return null
  }
}

/**
 * 修复单个池的 rewardsDuration
 */
async function fixPoolRewardsDuration(poolIndex, symbol) {
  const provider = new ethers.providers.JsonRpcProvider(CONFIG.RPC_URL, { name: 'NBC Chain', chainId: 1281 })
  
  if (!CONFIG.PRIVATE_KEY) {
    throw new Error('未设置 PRIVATE_KEY，无法执行交易。请在 .env 文件中设置 PRIVATE_KEY')
  }
  
  const wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, provider)
  const contract = new ethers.Contract(CONFIG.STAKING_CONTRACT_ADDRESS, STAKING_ABI, wallet)
  
  // 1. 检查合约所有者
  const owner = await contract.owner()
  if (wallet.address.toLowerCase() !== owner.toLowerCase()) {
    throw new Error(`钱包地址 ${wallet.address} 不是合约所有者 ${owner}`)
  }
  
  // 2. 查询当前 rewardsDuration
  const pool = await contract.pools(poolIndex)
  const currentDuration = Number(pool.rewardsDuration)
  const years = currentDuration / (365 * 24 * 60 * 60)
  
  console.log(`\n${'='.repeat(80)}`)
  console.log(`修复 ${symbol} 池 (索引: ${poolIndex}) 的 rewardsDuration`)
  console.log(`${'='.repeat(80)}`)
  console.log(`当前 rewardsDuration: ${currentDuration} 秒 = ${years.toFixed(2)} 年`)
  console.log(`目标 rewardsDuration: ${CONFIG.REWARDS_DURATION} 秒 = 1 年`)
  
  if (currentDuration === CONFIG.REWARDS_DURATION) {
    console.log(`✅ ${symbol} 池的 rewardsDuration 已经是正确的值，无需修改`)
    return { success: true, symbol, skipped: true }
  }
  
  if (!CONFIG.EXECUTE) {
    console.log(`\n⚠️  预览模式：不会实际执行交易`)
    console.log(`   要实际执行，请使用 --execute 参数`)
    return { success: true, symbol, dryRun: true }
  }
  
  // 3. 执行修复
  console.log(`\n📤 发送交易...`)
  const tx = await contract.setRewardsDuration(poolIndex, CONFIG.REWARDS_DURATION)
  console.log(`   🔗 交易哈希: ${tx.hash}`)
  
  console.log(`⏳ 等待确认...`)
  const receipt = await tx.wait()
  console.log(`   ✅ 交易成功！`)
  console.log(`   📦 区块: ${receipt.blockNumber}`)
  const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice || receipt.gasPrice)
  console.log(`   ⛽ Gas 费用: ${formatUnits(gasUsed, 18)} NBC`)
  
  // 4. 验证
  const updatedPool = await contract.pools(poolIndex)
  const updatedDuration = Number(updatedPool.rewardsDuration)
  const updatedYears = updatedDuration / (365 * 24 * 60 * 60)
  console.log(`\n✅ 更新后的 rewardsDuration: ${updatedDuration} 秒 = ${updatedYears.toFixed(2)} 年`)
  
  if (updatedDuration === CONFIG.REWARDS_DURATION) {
    console.log(`✅ 修复成功！`)
  } else {
    console.log(`⚠️  警告：更新后的值不正确`)
  }
  
  return {
    success: true,
    symbol,
    poolIndex,
    oldDuration: currentDuration,
    newDuration: updatedDuration,
    txHash: tx.hash,
    blockNumber: receipt.blockNumber,
  }
}

/**
 * 检查所有池的 rewardsDuration
 */
async function checkAllPools() {
  const provider = new ethers.providers.JsonRpcProvider(CONFIG.RPC_URL, { name: 'NBC Chain', chainId: 1281 })
  
  console.log('\n' + '='.repeat(80))
  console.log('检查所有池的 rewardsDuration')
  console.log('='.repeat(80))
  
  const results = []
  for (const [symbol, config] of Object.entries(TOKEN_CONFIG)) {
    const result = await checkPoolRewardsDuration(provider, config.poolIndex, symbol)
    if (result) {
      results.push(result)
    }
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('检查结果')
  console.log('='.repeat(80))
  
  let correctCount = 0
  let incorrectCount = 0
  
  results.forEach(result => {
    const status = result.isCorrect ? '✅' : '❌'
    const years = result.years.toFixed(2)
    console.log(`${status} ${result.symbol.padEnd(6)} 池: ${result.duration.toString().padStart(12)} 秒 = ${years.padStart(8)} 年`)
    
    if (result.isCorrect) {
      correctCount++
    } else {
      incorrectCount++
    }
  })
  
  console.log('\n' + '='.repeat(80))
  console.log(`汇总: ✅ 正确: ${correctCount}, ❌ 错误: ${incorrectCount}`)
  console.log('='.repeat(80))
  
  if (incorrectCount > 0) {
    console.log('\n💡 提示: 使用以下命令修复错误的池:')
    console.log(`   node fix-rewards-duration.js --pool all --execute`)
  }
  
  return results
}

/**
 * 主函数
 */
async function main() {
  console.log('\n' + '='.repeat(80))
  console.log('修复质押池 rewardsDuration')
  console.log('='.repeat(80))
  console.log(`时间: ${new Date().toISOString()}`)
  console.log(`模式: ${CONFIG.EXECUTE ? '执行模式' : '预览模式'}`)
  console.log(`目标 rewardsDuration: ${CONFIG.REWARDS_DURATION} 秒 (1 年)`)
  console.log('='.repeat(80))
  
  const poolArg = getArg('pool', null)
  
  if (!poolArg) {
    // 只检查，不修复
    await checkAllPools()
    return
  }
  
  if (poolArg.toLowerCase() === 'all') {
    // 修复所有池
    const results = []
    for (const [symbol, config] of Object.entries(TOKEN_CONFIG)) {
      try {
        const result = await fixPoolRewardsDuration(config.poolIndex, symbol)
        results.push(result)
      } catch (error) {
        console.error(`❌ 修复 ${symbol} 池失败:`, error.message)
        results.push({ success: false, symbol, error: error.message })
      }
    }
    
    console.log('\n' + '='.repeat(80))
    console.log('汇总')
    console.log('='.repeat(80))
    const successCount = results.filter(r => r.success && !r.skipped).length
    const skippedCount = results.filter(r => r.skipped).length
    const failedCount = results.filter(r => !r.success).length
    console.log(`✅ 成功: ${successCount}`)
    console.log(`⏭️  跳过: ${skippedCount}`)
    console.log(`❌ 失败: ${failedCount}`)
    console.log('='.repeat(80))
  } else {
    // 修复单个池
    const symbol = poolArg.toUpperCase()
    const config = TOKEN_CONFIG[symbol]
    
    if (!config) {
      console.error(`❌ 未知的代币符号: ${symbol}`)
      console.error(`   支持的代币: ${Object.keys(TOKEN_CONFIG).join(', ')}`)
      process.exit(1)
    }
    
    try {
      await fixPoolRewardsDuration(config.poolIndex, symbol)
    } catch (error) {
      console.error(`❌ 修复失败:`, error.message)
      process.exit(1)
    }
  }
}

main().catch(error => {
  console.error('❌ 错误:', error.message)
  process.exit(1)
})
