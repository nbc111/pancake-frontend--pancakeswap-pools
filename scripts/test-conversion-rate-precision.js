#!/usr/bin/env node

/**
 * 测试 conversionRateScaled 的精度问题
 */

const { ethers } = require('ethers')

// 测试 BTC 的情况
const tokenPriceUSD = 95000
const nbcPriceUSD = 0.07
const conversionRate = tokenPriceUSD / nbcPriceUSD

console.log('========================================')
console.log('   测试 conversionRateScaled 精度')
console.log('========================================\n')

console.log(`代币价格: $${tokenPriceUSD}`)
console.log(`NBC 价格: $${nbcPriceUSD}`)
console.log(`兑换比例: ${conversionRate}`)
console.log(`兑换比例 (精确): ${conversionRate.toFixed(20)}`)

// 方法 1: 当前的方法（使用 toFixed(18)）
const conversionRateStr = conversionRate.toFixed(18)
const conversionRateParts = conversionRateStr.split('.')
const integerPart = conversionRateParts[0]
const decimalPart = (conversionRateParts[1] || '').padEnd(18, '0').substring(0, 18)
const conversionRateScaled1 = ethers.BigNumber.from(integerPart + decimalPart)

console.log('\n方法 1 (当前方法):')
console.log(`  conversionRateStr: ${conversionRateStr}`)
console.log(`  integerPart: ${integerPart}`)
console.log(`  decimalPart: ${decimalPart}`)
console.log(`  conversionRateScaled: ${conversionRateScaled1.toString()}`)
console.log(`  还原值: ${Number(conversionRateScaled1.toString()) / 1e18}`)

// 方法 2: 使用更精确的方法（直接乘以 1e18）
const conversionRateScaled2 = ethers.BigNumber.from(Math.floor(conversionRate * 1e18))

console.log('\n方法 2 (直接乘以 1e18):')
console.log(`  conversionRateScaled: ${conversionRateScaled2.toString()}`)
console.log(`  还原值: ${Number(conversionRateScaled2.toString()) / 1e18}`)

// 方法 3: 使用字符串操作但更精确
const conversionRateStr2 = conversionRate.toString()
const parts = conversionRateStr2.split('.')
const integerPart2 = parts[0]
const decimalPart2 = (parts[1] || '').padEnd(18, '0').substring(0, 18)
const conversionRateScaled3 = ethers.BigNumber.from(integerPart2 + decimalPart2)

console.log('\n方法 3 (使用 toString()):')
console.log(`  conversionRateStr: ${conversionRateStr2}`)
console.log(`  integerPart: ${integerPart2}`)
console.log(`  decimalPart: ${decimalPart2}`)
console.log(`  conversionRateScaled: ${conversionRateScaled3.toString()}`)
console.log(`  还原值: ${Number(conversionRateScaled3.toString()) / 1e18}`)

// 计算误差
const exactValue = conversionRate * 1e18
const error1 = Math.abs(Number(conversionRateScaled1.toString()) - exactValue)
const error2 = Math.abs(Number(conversionRateScaled2.toString()) - exactValue)
const error3 = Math.abs(Number(conversionRateScaled3.toString()) - exactValue)

console.log('\n误差分析:')
console.log(`  精确值: ${exactValue}`)
console.log(`  方法 1 误差: ${error1} (${(error1 / exactValue * 100).toFixed(6)}%)`)
console.log(`  方法 2 误差: ${error2} (${(error2 / exactValue * 100).toFixed(6)}%)`)
console.log(`  方法 3 误差: ${error3} (${(error3 / exactValue * 100).toFixed(6)}%)`)

console.log('\n结论:')
if (error2 < error1 && error2 < error3) {
  console.log('  推荐使用方法 2 (直接乘以 1e18)')
} else if (error3 < error1) {
  console.log('  推荐使用方法 3 (使用 toString())')
} else {
  console.log('  当前方法 (方法 1) 已经足够精确')
}
