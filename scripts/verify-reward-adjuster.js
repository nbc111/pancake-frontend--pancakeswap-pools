#!/usr/bin/env node

/**
 * 验证 dynamic-reward-adjuster.js 脚本的逻辑和配置
 */

const fs = require('fs')
const path = require('path')

console.log('========================================')
console.log('   验证 dynamic-reward-adjuster.js')
console.log('========================================\n')

// 1. 检查文件是否存在
const scriptPath = path.join(__dirname, 'dynamic-reward-adjuster.js')
if (!fs.existsSync(scriptPath)) {
  console.error('❌ 错误: dynamic-reward-adjuster.js 文件不存在')
  process.exit(1)
}
console.log('✅ 脚本文件存在')

// 2. 读取脚本内容
const scriptContent = fs.readFileSync(scriptPath, 'utf-8')

// 3. 检查关键函数 calculateRewardRate
console.log('\n📋 检查 calculateRewardRate 函数...')
const calculateRewardRateMatch = scriptContent.match(/function calculateRewardRate\([^)]+\)\s*\{[\s\S]*?\n\}/)
if (!calculateRewardRateMatch) {
  console.error('❌ 错误: 找不到 calculateRewardRate 函数')
  process.exit(1)
}

const calculateRewardRateCode = calculateRewardRateMatch[0]

// 检查是否有错误的 nbcDecimals 乘法
if (calculateRewardRateCode.includes('nbcDecimals') && calculateRewardRateCode.includes('annualRewardToken')) {
  const hasError = calculateRewardRateCode.match(/annualRewardToken.*nbcDecimals|nbcDecimals.*annualRewardToken/)
  if (hasError) {
    console.error('❌ 错误: calculateRewardRate 函数中仍然包含错误的 nbcDecimals 乘法')
    console.error('   应该移除 nbcDecimals 的乘法操作')
    process.exit(1)
  }
}

// 检查计算逻辑
const hasCorrectCalculation = 
  calculateRewardRateCode.includes('annualRewardNBCWei') &&
  calculateRewardRateCode.includes('rewardTokenMultiplier') &&
  calculateRewardRateCode.includes('conversionRateScaled') &&
  calculateRewardRateCode.includes('annualRewardToken') &&
  calculateRewardRateCode.includes('annualRewardNBCWei.mul(rewardTokenMultiplier).div(conversionRateScaled)')

if (!hasCorrectCalculation) {
  console.warn('⚠️  警告: calculateRewardRate 函数的计算逻辑可能不正确')
  console.warn('   应该使用: annualRewardToken = annualRewardNBCWei * rewardTokenMultiplier / conversionRateScaled')
} else {
  console.log('✅ calculateRewardRate 函数逻辑正确')
}

// 4. 检查配置
console.log('\n📋 检查配置...')
const configMatch = scriptContent.match(/const CONFIG = \{[\s\S]*?\n\}/)
if (configMatch) {
  const configCode = configMatch[0]
  
  // 检查必要的配置项
  const requiredConfigs = [
    'RPC_URL',
    'STAKING_CONTRACT_ADDRESS',
    'TOTAL_STAKED_NBC',
    'TARGET_APR',
    'UPDATE_INTERVAL',
  ]
  
  let allConfigsPresent = true
  for (const config of requiredConfigs) {
    if (!configCode.includes(config)) {
      console.warn(`⚠️  警告: 配置中缺少 ${config}`)
      allConfigsPresent = false
    }
  }
  
  if (allConfigsPresent) {
    console.log('✅ 所有必要的配置项都存在')
  }
}

// 5. 检查 TOKEN_CONFIG
console.log('\n📋 检查代币配置...')
const tokenConfigMatch = scriptContent.match(/const TOKEN_CONFIG = \{[\s\S]*?\n\}/)
if (tokenConfigMatch) {
  const tokenConfigCode = tokenConfigMatch[0]
  
  // 检查是否包含所有必要的代币
  const requiredTokens = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'LTC', 'DOGE', 'USDT', 'SUI']
  let allTokensPresent = true
  for (const token of requiredTokens) {
    if (!tokenConfigCode.includes(`${token}:`)) {
      console.warn(`⚠️  警告: 代币配置中缺少 ${token}`)
      allTokensPresent = false
    }
  }
  
  if (allTokensPresent) {
    console.log('✅ 所有必要的代币配置都存在')
  }
}

// 6. 检查价格获取函数
console.log('\n📋 检查价格获取函数...')
const priceFunctions = [
  'getNBCPrice',
  'getTokenPriceFromNBCEX',
  'getTokenPriceFromGateIO',
  'getTokenPriceFromOKX',
  'getTokenPriceFromBinance',
  'getTokenPricesFromCoinGecko',
  'getTokenPrices',
]

let allPriceFunctionsPresent = true
for (const func of priceFunctions) {
  if (!scriptContent.includes(`function ${func}`) && !scriptContent.includes(`async function ${func}`)) {
    console.warn(`⚠️  警告: 缺少价格获取函数 ${func}`)
    allPriceFunctionsPresent = false
  }
}

if (allPriceFunctionsPresent) {
  console.log('✅ 所有价格获取函数都存在')
}

// 7. 检查主函数和定时执行
console.log('\n📋 检查主函数和定时执行...')
if (scriptContent.includes('async function main()')) {
  console.log('✅ main 函数存在')
} else {
  console.warn('⚠️  警告: main 函数不存在')
}

if (scriptContent.includes('setInterval')) {
  console.log('✅ 定时执行机制存在')
} else {
  console.warn('⚠️  警告: 定时执行机制不存在')
}

// 8. 检查依赖
console.log('\n📋 检查依赖...')
const requiredDependencies = ['axios', 'ethers', 'dotenv']
const packageJsonPath = path.join(__dirname, '..', 'package.json')
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies }
  
  let allDepsPresent = true
  for (const dep of requiredDependencies) {
    if (!allDeps[dep]) {
      console.warn(`⚠️  警告: 依赖 ${dep} 可能未安装`)
      allDepsPresent = false
    }
  }
  
  if (allDepsPresent) {
    console.log('✅ 所有必要的依赖都存在')
  }
} else {
  console.warn('⚠️  警告: 无法找到 package.json 文件')
}

// 9. 检查 .env 文件（如果存在）
console.log('\n📋 检查环境变量配置...')
const envPath = path.join(__dirname, '.env')
if (fs.existsSync(envPath)) {
  console.log('✅ .env 文件存在')
  const envContent = fs.readFileSync(envPath, 'utf-8')
  
  const requiredEnvVars = [
    'RPC_URL',
    'PRIVATE_KEY',
    'STAKING_CONTRACT_ADDRESS',
  ]
  
  let allEnvVarsPresent = true
  for (const envVar of requiredEnvVars) {
    if (!envContent.includes(`${envVar}=`)) {
      console.warn(`⚠️  警告: .env 文件中缺少 ${envVar}`)
      allEnvVarsPresent = false
    }
  }
  
  if (allEnvVarsPresent) {
    console.log('✅ 所有必要的环境变量都已配置')
  }
} else {
  console.warn('⚠️  警告: .env 文件不存在（可能需要在服务器上配置）')
}

// 10. 总结
console.log('\n========================================')
console.log('   验证完成')
console.log('========================================')
console.log('\n💡 提示:')
console.log('   - 如果所有检查都通过，脚本应该可以正常运行')
console.log('   - 如果看到警告，请检查相应的配置或代码')
console.log('   - 在服务器上运行时，确保 PM2 服务已正确配置')
console.log('   - 查看服务器日志: pm2 logs reward-adjuster')
console.log('')
