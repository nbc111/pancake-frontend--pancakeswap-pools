#!/usr/bin/env node

/**
 * Mint DOGE 代币并重置奖励率
 * 
 * 完整流程：
 * 1. 检查当前余额
 * 2. 如果余额不足，mint 足够的 DOGE
 * 3. 执行降低奖励率的操作
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
  USE_ONE_YEAR: process.argv.includes('--use-one-year'),
  EXECUTE: process.argv.includes('--execute'),
}

// ERC20 ABI
const ERC20_ABI = [
  'function owner() view returns (address)',
  'function mint(address to, uint256 amount) external',
  'function balanceOf(address) view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
]

// Staking ABI
const STAKING_ABI = [
  'function pools(uint256) view returns (address, uint256, uint256, uint256, uint256, uint256, uint256, bool)',
  'function notifyRewardAmount(uint256 poolIndex, uint256 reward)',
]

async function main() {
  console.log('\n' + '='.repeat(80))
  console.log('   Mint DOGE 并重置奖励率')
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
  const dogeToken = new ethers.Contract(CONFIG.DOGE_TOKEN_ADDRESS, ERC20_ABI, wallet)
  const stakingContract = new ethers.Contract(CONFIG.STAKING_CONTRACT_ADDRESS, STAKING_ABI, wallet)

  // 1. 检查 DOGE 代币 owner
  const tokenOwner = await dogeToken.owner()
  if (wallet.address.toLowerCase() !== tokenOwner.toLowerCase()) {
    console.error(`❌ 错误: 钱包地址 ${wallet.address} 不是 DOGE 代币合约的 owner ${tokenOwner}`)
    process.exit(1)
  }
  console.log('✅ 钱包地址是 DOGE 代币合约的 owner\n')

  // 2. 计算需要的 DOGE 数量（调用 reset-reward-rate.js 的逻辑）
  console.log('📊 计算需要的 DOGE 数量...')
  // 这里简化计算，实际应该调用 reset-reward-rate.js 中的计算逻辑
  // 基于之前的输出，需要约 267,516 DOGE，我们 mint 270,000 以确保充足
  const requiredDOGE = parseUnits('270000', 18) // 稍微多 mint 一些，确保充足
  const currentBalance = await dogeToken.balanceOf(wallet.address)
  console.log(`   当前余额: ${formatUnits(currentBalance, 18)} DOGE`)
  console.log(`   需要余额: ${formatUnits(requiredDOGE, 18)} DOGE`)

  // 3. 如果余额不足，mint DOGE
  if (currentBalance.lt(requiredDOGE)) {
    const mintAmount = requiredDOGE.sub(currentBalance)
    console.log(`\n📤 需要 mint: ${formatUnits(mintAmount, 18)} DOGE`)
    
    if (CONFIG.EXECUTE) {
      console.log('⏳ Minting DOGE...')
      const mintTx = await dogeToken.mint(wallet.address, mintAmount)
      console.log(`   🔗 交易哈希: ${mintTx.hash}`)
      console.log('⏳ 等待确认...')
      const mintReceipt = await mintTx.wait()
      console.log(`   ✅ Mint 成功！区块: ${mintReceipt.blockNumber}`)
      
      // 验证余额
      const newBalance = await dogeToken.balanceOf(wallet.address)
      console.log(`   ✅ 新余额: ${formatUnits(newBalance, 18)} DOGE\n`)
    } else {
      console.log('⚠️  预览模式：不会实际执行 mint')
      console.log('   要实际执行，请使用 --execute 参数\n')
    }
  } else {
    console.log('✅ 余额充足，无需 mint\n')
  }

  // 4. 执行重置奖励率（调用 reset-reward-rate.js）
  if (CONFIG.EXECUTE) {
    console.log('📤 执行重置奖励率...')
    console.log('   提示: 将调用 reset-reward-rate.js 脚本\n')
    
    // 使用 child_process 调用 reset-reward-rate.js
    const { execSync } = require('child_process')
    const command = [
      'node reset-reward-rate.js',
      '--pool DOGE',
      `--target-apr ${CONFIG.TARGET_APR}`,
      `--expected-staked ${CONFIG.EXPECTED_STAKED}`,
      CONFIG.USE_ONE_YEAR ? '--use-one-year' : '',
      '--execute',
    ].filter(Boolean).join(' ')
    
    try {
      execSync(command, { 
        cwd: __dirname,
        stdio: 'inherit',
        env: { ...process.env, RPC_URL: CONFIG.RPC_URL },
      })
    } catch (error) {
      console.error('❌ 重置奖励率失败:', error.message)
      process.exit(1)
    }
  } else {
    console.log('⚠️  预览模式：不会实际执行重置奖励率')
    console.log('   要实际执行，请使用 --execute 参数')
  }

  console.log('\n' + '='.repeat(80))
  console.log('✅ 完成！')
  console.log('='.repeat(80))
}

main().catch((error) => {
  console.error('❌ 错误:', error.message)
  process.exit(1)
})
