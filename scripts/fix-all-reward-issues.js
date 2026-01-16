#!/usr/bin/env node

/**
 * 综合修复脚本：修复 rewardsDuration 并重新设置正确的奖励率
 * 
 * 此脚本会：
 * 1. 检查所有池的 rewardsDuration
 * 2. 修复错误的 rewardsDuration（设置为 31536000 秒 = 1 年）
 * 3. 重新设置正确的奖励率（基于目标 APR 和预期质押量）
 * 
 * 使用方法：
 *   node fix-all-reward-issues.js --target-apr 100 --expected-staked 1000000 --dry-run
 *   node fix-all-reward-issues.js --target-apr 100 --expected-staked 1000000 --pool BTC --execute
 *   node fix-all-reward-issues.js --target-apr 100 --expected-staked 1000000 --pool all --execute
 */

const { execSync } = require('child_process')
const path = require('path')

// 解析命令行参数
const args = process.argv.slice(2)
const getArg = (name, defaultValue) => {
  const index = args.indexOf(`--${name}`)
  return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue
}
const hasFlag = (name) => args.includes(`--${name}`)

const CONFIG = {
  TARGET_APR: getArg('target-apr', '100'),
  EXPECTED_STAKED: getArg('expected-staked', '1000000'),
  POOL: getArg('pool', 'all'),
  EXECUTE: hasFlag('execute'),
  DRY_RUN: hasFlag('dry-run'),
}

/**
 * 执行命令
 */
function runCommand(command, description) {
  console.log(`\n${'='.repeat(80)}`)
  console.log(description)
  console.log('='.repeat(80))
  console.log(`执行: ${command}`)
  console.log('='.repeat(80))
  
  try {
    const output = execSync(command, { 
      encoding: 'utf-8',
      cwd: path.dirname(__filename),
      stdio: 'inherit'
    })
    return { success: true, output }
  } catch (error) {
    console.error(`❌ 执行失败:`, error.message)
    return { success: false, error: error.message }
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('\n' + '='.repeat(80))
  console.log('综合修复脚本：修复 rewardsDuration 并重新设置奖励率')
  console.log('='.repeat(80))
  console.log(`时间: ${new Date().toISOString()}`)
  console.log(`模式: ${CONFIG.EXECUTE ? '执行模式' : CONFIG.DRY_RUN ? '预览模式' : '检查模式'}`)
  console.log(`目标 APR: ${CONFIG.TARGET_APR}%`)
  console.log(`预期质押量: ${CONFIG.EXPECTED_STAKED} NBC`)
  console.log(`池: ${CONFIG.POOL}`)
  console.log('='.repeat(80))
  
  // 步骤 1: 检查 rewardsDuration
  console.log('\n📋 步骤 1: 检查所有池的 rewardsDuration')
  const checkCommand = `node fix-rewards-duration.js`
  const checkResult = runCommand(checkCommand, '检查 rewardsDuration')
  
  if (!checkResult.success) {
    console.error('❌ 检查失败，终止执行')
    process.exit(1)
  }
  
  // 步骤 2: 修复 rewardsDuration（如果需要）
  if (CONFIG.EXECUTE || CONFIG.DRY_RUN) {
    console.log('\n🔧 步骤 2: 修复 rewardsDuration')
    const fixCommand = `node fix-rewards-duration.js --pool ${CONFIG.POOL}${CONFIG.EXECUTE ? ' --execute' : ''}`
    const fixResult = runCommand(fixCommand, '修复 rewardsDuration')
    
    if (!fixResult.success) {
      console.error('❌ 修复 rewardsDuration 失败，终止执行')
      process.exit(1)
    }
  } else {
    console.log('\n⏭️  步骤 2: 跳过修复 rewardsDuration（预览模式）')
    console.log('   要执行修复，请使用 --execute 参数')
  }
  
  // 步骤 3: 重新设置奖励率
  if (CONFIG.EXECUTE || CONFIG.DRY_RUN) {
    console.log('\n💰 步骤 3: 重新设置奖励率')
    const resetCommand = `node reset-reward-rate.js --pool ${CONFIG.POOL} --target-apr ${CONFIG.TARGET_APR} --expected-staked ${CONFIG.EXPECTED_STAKED}${CONFIG.EXECUTE ? ' --execute' : ''}`
    const resetResult = runCommand(resetCommand, '重新设置奖励率')
    
    if (!resetResult.success) {
      console.error('❌ 重新设置奖励率失败')
      process.exit(1)
    }
  } else {
    console.log('\n⏭️  步骤 3: 跳过重新设置奖励率（预览模式）')
    console.log('   要执行设置，请使用 --execute 参数')
  }
  
  // 步骤 4: 最终验证
  console.log('\n✅ 步骤 4: 最终验证')
  const verifyCommand = `node check-staking-data.js`
  runCommand(verifyCommand, '验证最终状态')
  
  console.log('\n' + '='.repeat(80))
  console.log('修复完成！')
  console.log('='.repeat(80))
  console.log('\n💡 提示:')
  console.log('   - 如果 rewardsDuration 仍有问题，请单独运行:')
  console.log('     node fix-rewards-duration.js --pool all --execute')
  console.log('   - 如果奖励率仍有问题，请单独运行:')
  console.log('     node reset-reward-rate.js --pool all --target-apr 100 --expected-staked 1000000 --execute')
  console.log('   - 检查所有池的状态:')
  console.log('     node check-staking-data.js')
  console.log('='.repeat(80))
}

main().catch(error => {
  console.error('❌ 错误:', error.message)
  process.exit(1)
})
