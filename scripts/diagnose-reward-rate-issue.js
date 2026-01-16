const { ethers } = require('ethers')
const { formatUnits } = require('ethers/lib/utils')

const CONFIG = {
  RPC_URL: 'https://rpc.nbcex.com',
  STAKING_CONTRACT_ADDRESS: '0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789',
  SECONDS_PER_YEAR: 31536000,
  TARGET_APR: 100, // 目标 APR 100%
  EXPECTED_STAKED: '1000000000000000000000000', // 1,000,000 NBC
}

const BTC_CONFIG = {
  poolIndex: 1,
  decimals: 8,
  symbol: 'BTC',
}

// 不同价格场景
const PRICE_SCENARIOS = {
  current: { BTC: 93464, NBC: 0.07 },
  old: { BTC: 88500, NBC: 0.11 }, // 旧价格（NBC = 0.11 USD）
}

const STAKING_ABI = [
  'function getPoolInfo(uint256) view returns (address rewardToken, uint256 totalStakedAmount, uint256 rewardRate, uint256 periodFinish, bool active)',
]

function calculateRewardRate(targetAPR, totalStakedNBC, conversionRate, rewardTokenDecimals) {
  const aprDecimal = targetAPR / 100
  const totalStakedNumber = Number(totalStakedNBC)
  const annualRewardNBCWei = BigInt(Math.floor(totalStakedNumber * aprDecimal))
  
  const conversionRateScaled = BigInt(Math.floor(conversionRate * 1e18))
  const rewardTokenMultiplier = BigInt(10 ** rewardTokenDecimals)
  
  const annualRewardToken = (annualRewardNBCWei * rewardTokenMultiplier) / conversionRateScaled
  const rewardPerSecond = annualRewardToken / BigInt(CONFIG.SECONDS_PER_YEAR)
  
  return {
    rewardPerSecond,
    annualRewardToken,
    annualRewardNBCWei,
  }
}

async function main() {
  console.log('='.repeat(80))
  console.log('   rewardRate 问题诊断')
  console.log('='.repeat(80))
  console.log('')

  const provider = new ethers.providers.JsonRpcProvider(CONFIG.RPC_URL)
  const stakingContract = new ethers.Contract(CONFIG.STAKING_CONTRACT_ADDRESS, STAKING_ABI, provider)

  try {
    const poolInfo = await stakingContract.getPoolInfo(BTC_CONFIG.poolIndex)
    const actualTotalStaked = poolInfo.totalStakedAmount
    const actualRewardRate = poolInfo.rewardRate

    console.log('📊 当前合约状态:')
    console.log('-'.repeat(80))
    console.log(`实际质押量: ${formatUnits(actualTotalStaked, 18)} NBC`)
    console.log(`实际 rewardRate: ${formatUnits(actualRewardRate, BTC_CONFIG.decimals)} BTC/s`)
    console.log(`年总奖励: ${formatUnits(actualRewardRate.mul(CONFIG.SECONDS_PER_YEAR), BTC_CONFIG.decimals)} BTC`)
    console.log('')

    // 分析：rewardRate 可能是基于什么设置的？
    console.log('🔍 分析：rewardRate 可能是基于什么设置的？')
    console.log('-'.repeat(80))
    
    const actualAnnualRewardBTC = Number(actualRewardRate) * CONFIG.SECONDS_PER_YEAR / 10 ** BTC_CONFIG.decimals

    // 场景 1: 使用当前价格
    const currentConversionRate = PRICE_SCENARIOS.current.BTC / PRICE_SCENARIOS.current.NBC
    const currentAnnualRewardNBC = actualAnnualRewardBTC * currentConversionRate
    const currentImpliedStaked = currentAnnualRewardNBC / (CONFIG.TARGET_APR / 100)

    console.log(`场景 1: 使用当前价格 (BTC = $${PRICE_SCENARIOS.current.BTC}, NBC = $${PRICE_SCENARIOS.current.NBC})`)
    console.log(`  - 兑换比例: 1 BTC = ${currentConversionRate.toLocaleString()} NBC`)
    console.log(`  - 年总奖励: ${actualAnnualRewardBTC.toFixed(6)} BTC = ${currentAnnualRewardNBC.toFixed(2)} NBC`)
    console.log(`  - 如果目标是 ${CONFIG.TARGET_APR}% APR，预期质押量应该是: ${currentImpliedStaked.toFixed(2)} NBC`)
    console.log('')

    // 场景 2: 使用旧价格
    const oldConversionRate = PRICE_SCENARIOS.old.BTC / PRICE_SCENARIOS.old.NBC
    const oldAnnualRewardNBC = actualAnnualRewardBTC * oldConversionRate
    const oldImpliedStaked = oldAnnualRewardNBC / (CONFIG.TARGET_APR / 100)

    console.log(`场景 2: 使用旧价格 (BTC = $${PRICE_SCENARIOS.old.BTC}, NBC = $${PRICE_SCENARIOS.old.NBC})`)
    console.log(`  - 兑换比例: 1 BTC = ${oldConversionRate.toLocaleString()} NBC`)
    console.log(`  - 年总奖励: ${actualAnnualRewardBTC.toFixed(6)} BTC = ${oldAnnualRewardNBC.toFixed(2)} NBC`)
    console.log(`  - 如果目标是 ${CONFIG.TARGET_APR}% APR，预期质押量应该是: ${oldImpliedStaked.toFixed(2)} NBC`)
    console.log('')

    // 场景 3: 如果基于预期质押量 1,000,000 NBC，正确的 rewardRate 应该是多少？
    console.log('📋 正确的 rewardRate 应该是多少？')
    console.log('-'.repeat(80))
    
    const expectedStaked = BigInt(CONFIG.EXPECTED_STAKED)
    const correctRewardRateCurrent = calculateRewardRate(
      CONFIG.TARGET_APR,
      expectedStaked,
      currentConversionRate,
      BTC_CONFIG.decimals,
    )
    const correctRewardRateOld = calculateRewardRate(
      CONFIG.TARGET_APR,
      expectedStaked,
      oldConversionRate,
      BTC_CONFIG.decimals,
    )

    console.log(`基于预期质押量 ${formatUnits(expectedStaked, 18)} NBC 和 ${CONFIG.TARGET_APR}% APR:`)
    console.log(`  - 使用当前价格: rewardRate = ${formatUnits(correctRewardRateCurrent.rewardPerSecond.toString(), BTC_CONFIG.decimals)} BTC/s`)
    console.log(`  - 使用旧价格: rewardRate = ${formatUnits(correctRewardRateOld.rewardPerSecond.toString(), BTC_CONFIG.decimals)} BTC/s`)
    console.log(`  - 实际 rewardRate: ${formatUnits(actualRewardRate, BTC_CONFIG.decimals)} BTC/s`)
    console.log('')

    // 计算差异
    const actualRewardRateNum = Number(actualRewardRate)
    const correctRewardRateCurrentNum = Number(correctRewardRateCurrent.rewardPerSecond)
    const correctRewardRateOldNum = Number(correctRewardRateOld.rewardPerSecond)
    
    const diffCurrent = ((actualRewardRateNum - correctRewardRateCurrentNum) / correctRewardRateCurrentNum) * 100
    const diffOld = ((actualRewardRateNum - correctRewardRateOldNum) / correctRewardRateOldNum) * 100

    console.log('📊 差异分析:')
    console.log('-'.repeat(80))
    console.log(`实际 rewardRate 比正确值（当前价格）: ${diffCurrent > 0 ? '高' : '低'} ${Math.abs(diffCurrent).toFixed(2)}%`)
    console.log(`实际 rewardRate 比正确值（旧价格）: ${diffOld > 0 ? '高' : '低'} ${Math.abs(diffOld).toFixed(2)}%`)
    console.log('')

    // 结论
    console.log('='.repeat(80))
    console.log('   结论')
    console.log('='.repeat(80))
    console.log('')
    console.log('❌ 问题确认:')
    console.log(`   1. 当前 rewardRate (${formatUnits(actualRewardRate, BTC_CONFIG.decimals)} BTC/s) 设置错误`)
    console.log(`   2. 正确的 rewardRate 应该是约 ${formatUnits(correctRewardRateCurrent.rewardPerSecond.toString(), BTC_CONFIG.decimals)} BTC/s (基于当前价格)`)
    console.log(`   3. 实际值比正确值高了约 ${Math.abs(diffCurrent).toFixed(0)} 倍`)
    console.log('')
    console.log('💡 原因分析:')
    console.log(`   - rewardRate 可能是基于错误的价格或预期质押量设置的`)
    console.log(`   - 或者设置时使用了错误的计算公式`)
    console.log('')
    console.log('✅ 解决方案:')
    console.log(`   1. 使用 dynamic-reward-adjuster.js 脚本重新设置正确的 rewardRate`)
    console.log(`   2. 或者手动调用合约的 notifyRewardAmount 函数，使用正确的 rewardRate`)
    console.log('')

  } catch (error) {
    console.error('❌ 查询失败:', error.message)
    process.exit(1)
  }
}

main().catch(console.error)
