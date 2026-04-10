const { ethers } = require('ethers')
const { formatUnits } = require('ethers/lib/utils')

const CONFIG = {
  RPC_URL: 'https://rpc.nbcex.com',
  STAKING_CONTRACT_ADDRESS: '0x32580B2001EA941529c79bcb819b8f6F3c886c60',
  SECONDS_PER_YEAR: 31536000,
  TARGET_APR: 100, // 目标 APR 100%
}

const BTC_CONFIG = {
  poolIndex: 1,
  decimals: 8,
  symbol: 'BTC',
}

const PRICES = {
  BTC: 93464, // USDT
  NBC: 0.07,  // USDT
}

const STAKING_ABI = [
  'function getPoolInfo(uint256) view returns (address rewardToken, uint256 totalStakedAmount, uint256 rewardRate, uint256 periodFinish, bool active)',
]

/**
 * 计算正确的 rewardRate
 */
function calculateCorrectRewardRate(targetAPR, totalStakedNBC, conversionRate, rewardTokenDecimals) {
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

/**
 * 从 rewardRate 反推 APR
 */
function calculateAPRFromRewardRate(rewardRate, totalStakedNBC, conversionRate, rewardTokenDecimals) {
  if (totalStakedNBC === 0n) return 0
  if (rewardRate === 0n) return 0

  const annualRewardToken = rewardRate * BigInt(CONFIG.SECONDS_PER_YEAR)
  const conversionRateScaled = BigInt(Math.floor(conversionRate * 1e18))
  const rewardTokenMultiplier = BigInt(10 ** rewardTokenDecimals)
  
  const annualRewardNBC = (annualRewardToken * conversionRateScaled) / rewardTokenMultiplier
  const apr = (Number(annualRewardNBC) / Number(totalStakedNBC)) * 100

  return {
    apr,
    annualRewardToken,
    annualRewardNBC,
  }
}

async function main() {
  console.log('='.repeat(80))
  console.log('   查找正确的 rewardRate 设置')
  console.log('='.repeat(80))
  console.log('')

  const provider = new ethers.providers.JsonRpcProvider(CONFIG.RPC_URL)
  const stakingContract = new ethers.Contract(CONFIG.STAKING_CONTRACT_ADDRESS, STAKING_ABI, provider)

  try {
    const poolInfo = await stakingContract.getPoolInfo(BTC_CONFIG.poolIndex)
    const actualTotalStaked = poolInfo.totalStakedAmount
    const actualRewardRate = poolInfo.rewardRate

    const conversionRate = PRICES.BTC / PRICES.NBC

    console.log('📊 当前合约状态:')
    console.log('-'.repeat(80))
    console.log(`实际质押量: ${formatUnits(actualTotalStaked, 18)} NBC`)
    console.log(`实际 rewardRate: ${formatUnits(actualRewardRate, BTC_CONFIG.decimals)} BTC/s`)
    console.log(`年总奖励: ${formatUnits(actualRewardRate.mul(CONFIG.SECONDS_PER_YEAR), BTC_CONFIG.decimals)} BTC`)
    console.log('')

    // 反推：如果 rewardRate 是基于 100% APR 设置的，质押量应该是多少？
    const annualRewardBTC = Number(actualRewardRate) * CONFIG.SECONDS_PER_YEAR / 10 ** BTC_CONFIG.decimals
    const annualRewardNBC = annualRewardBTC * conversionRate
    const impliedStakedFor100APR = annualRewardNBC / (CONFIG.TARGET_APR / 100)

    console.log('🔍 反推分析:')
    console.log('-'.repeat(80))
    console.log(`如果 rewardRate 是基于 ${CONFIG.TARGET_APR}% APR 设置的:`)
    console.log(`  - 年总奖励: ${annualRewardBTC.toFixed(6)} BTC = ${annualRewardNBC.toFixed(2)} NBC`)
    console.log(`  - 预期质押量应该是: ${impliedStakedFor100APR.toFixed(2)} NBC`)
    console.log(`  - 实际质押量: ${formatUnits(actualTotalStaked, 18)} NBC`)
    console.log('')

    // 计算不同质押量下的正确 rewardRate
    const testStakedAmounts = [
      '1000000000000000000000000', // 1,000,000 NBC
      '100000000000000000000000',  // 100,000 NBC
      '10000000000000000000000',   // 10,000 NBC
      '1000000000000000000000',    // 1,000 NBC
      '100000000000000000000',     // 100 NBC
      '30000000000000000000',      // 30 NBC (实际)
    ]

    console.log('📋 不同质押量下的正确 rewardRate (目标 APR 100%):')
    console.log('-'.repeat(80))
    for (const stakedAmount of testStakedAmounts) {
      const staked = BigInt(stakedAmount)
      const result = calculateCorrectRewardRate(
        CONFIG.TARGET_APR,
        staked,
        conversionRate,
        BTC_CONFIG.decimals,
      )
      
      const stakedFormatted = formatUnits(staked, 18)
      const rewardRateFormatted = formatUnits(result.rewardPerSecond.toString(), BTC_CONFIG.decimals)
      const annualRewardFormatted = formatUnits(result.annualRewardToken.toString(), BTC_CONFIG.decimals)
      
      const isActual = stakedAmount === actualTotalStaked.toString()
      const marker = isActual ? ' ← 实际' : ''
      
      console.log(`${stakedFormatted.padEnd(15)} NBC → rewardRate: ${rewardRateFormatted.padEnd(15)} BTC/s (年奖励: ${annualRewardFormatted} BTC)${marker}`)
    }
    console.log('')

    // 验证：使用实际 rewardRate 和不同质押量计算 APR
    console.log('📋 使用实际 rewardRate 在不同质押量下的 APR:')
    console.log('-'.repeat(80))
    for (const stakedAmount of testStakedAmounts) {
      const staked = BigInt(stakedAmount)
      const result = calculateAPRFromRewardRate(
        BigInt(actualRewardRate.toString()),
        staked,
        conversionRate,
        BTC_CONFIG.decimals,
      )
      
      const stakedFormatted = formatUnits(staked, 18)
      const isActual = stakedAmount === actualTotalStaked.toString()
      const marker = isActual ? ' ← 实际' : ''
      
      console.log(`${stakedFormatted.padEnd(15)} NBC → APR: ${result.apr.toFixed(2).padStart(15)}%${marker}`)
    }
    console.log('')

    // 结论
    console.log('='.repeat(80))
    console.log('   结论')
    console.log('='.repeat(80))
    console.log('')
    console.log(`1. 当前 rewardRate (${formatUnits(actualRewardRate, BTC_CONFIG.decimals)} BTC/s) 对应的年奖励是 ${annualRewardBTC.toFixed(6)} BTC`)
    console.log(`2. 如果目标是 ${CONFIG.TARGET_APR}% APR，这个奖励量对应的质押量应该是 ${impliedStakedFor100APR.toFixed(2)} NBC`)
    console.log(`3. 实际质押量只有 ${formatUnits(actualTotalStaked, 18)} NBC，所以 APR 异常高`)
    console.log('')
    console.log(`4. 要获得合理的 APR (${CONFIG.TARGET_APR}%)，有两种方案:`)
    console.log(`   方案 A: 调整 rewardRate 到 ${formatUnits(calculateCorrectRewardRate(CONFIG.TARGET_APR, actualTotalStaked, conversionRate, BTC_CONFIG.decimals).rewardPerSecond.toString(), BTC_CONFIG.decimals)} BTC/s`)
    console.log(`   方案 B: 等待质押量增加到 ${impliedStakedFor100APR.toFixed(2)} NBC`)
    console.log('')

  } catch (error) {
    console.error('❌ 查询失败:', error.message)
    process.exit(1)
  }
}

main().catch(console.error)
