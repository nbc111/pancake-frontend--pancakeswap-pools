const { ethers } = require('ethers')
const { formatUnits } = require('ethers/lib/utils')

const CONFIG = {
  RPC_URL: 'https://rpc.nbcex.com',
  STAKING_CONTRACT_ADDRESS: '0x32580B2001EA941529c79bcb819b8f6F3c886c60',
  SECONDS_PER_YEAR: 31536000,
  TARGET_APR: 100, // 目标 APR 100%
  EXPECTED_STAKED: '1000000000000000000000000', // 1,000,000 NBC (预期质押量)
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
 * 正向计算：从 APR 计算 rewardRate
 */
function calculateRewardRate(apr, totalStakedNBC, conversionRate, rewardTokenDecimals) {
  const aprDecimal = apr / 100
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
 * 反向计算：从 rewardRate 计算 APR
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
  console.log('   APR 计算逻辑验证')
  console.log('='.repeat(80))
  console.log('')

  const provider = new ethers.providers.JsonRpcProvider(CONFIG.RPC_URL)
  const stakingContract = new ethers.Contract(CONFIG.STAKING_CONTRACT_ADDRESS, STAKING_ABI, provider)

  try {
    // 查询合约数据
    const poolInfo = await stakingContract.getPoolInfo(BTC_CONFIG.poolIndex)
    const actualTotalStaked = poolInfo.totalStakedAmount
    const actualRewardRate = poolInfo.rewardRate

    const conversionRate = PRICES.BTC / PRICES.NBC

    console.log('📊 实际合约数据:')
    console.log('-'.repeat(80))
    console.log(`总质押量: ${formatUnits(actualTotalStaked, 18)} NBC`)
    console.log(`奖励率: ${formatUnits(actualRewardRate, BTC_CONFIG.decimals)} BTC/s`)
    console.log(`兑换比例: 1 BTC = ${conversionRate.toLocaleString()} NBC`)
    console.log('')

    // 测试 1: 使用预期质押量（1,000,000 NBC）和目标 APR（100%）计算 rewardRate
    console.log('🧪 测试 1: 正向计算（从 APR 100% 计算 rewardRate）')
    console.log('-'.repeat(80))
    const expectedStaked = BigInt(CONFIG.EXPECTED_STAKED)
    const forwardResult = calculateRewardRate(
      CONFIG.TARGET_APR,
      expectedStaked,
      conversionRate,
      BTC_CONFIG.decimals,
    )
    
    console.log(`输入:`)
    console.log(`  - 目标 APR: ${CONFIG.TARGET_APR}%`)
    console.log(`  - 预期质押量: ${formatUnits(expectedStaked, 18)} NBC`)
    console.log(`  - 兑换比例: ${conversionRate.toLocaleString()}`)
    console.log(`输出:`)
    console.log(`  - 计算出的 rewardRate: ${formatUnits(forwardResult.rewardPerSecond.toString(), BTC_CONFIG.decimals)} BTC/s`)
    console.log(`  - 年总奖励: ${formatUnits(forwardResult.annualRewardToken.toString(), BTC_CONFIG.decimals)} BTC`)
    console.log(`  - 实际合约 rewardRate: ${formatUnits(actualRewardRate.toString(), BTC_CONFIG.decimals)} BTC/s`)
    console.log(`  - 差异: ${((Number(forwardResult.rewardPerSecond) - Number(actualRewardRate)) / Number(actualRewardRate) * 100).toFixed(2)}%`)
    console.log('')

    // 测试 2: 使用实际质押量（30 NBC）和实际 rewardRate 计算 APR
    console.log('🧪 测试 2: 反向计算（从实际 rewardRate 计算 APR）')
    console.log('-'.repeat(80))
    const backwardResult = calculateAPRFromRewardRate(
      BigInt(actualRewardRate.toString()),
      BigInt(actualTotalStaked.toString()),
      conversionRate,
      BTC_CONFIG.decimals,
    )
    
    console.log(`输入:`)
    console.log(`  - 实际 rewardRate: ${formatUnits(actualRewardRate.toString(), BTC_CONFIG.decimals)} BTC/s`)
    console.log(`  - 实际质押量: ${formatUnits(actualTotalStaked, 18)} NBC`)
    console.log(`  - 兑换比例: ${conversionRate.toLocaleString()}`)
    console.log(`输出:`)
    console.log(`  - 计算出的 APR: ${backwardResult.apr.toFixed(2)}%`)
    console.log(`  - 年总奖励: ${formatUnits(backwardResult.annualRewardToken.toString(), BTC_CONFIG.decimals)} BTC`)
    console.log(`  - 年总奖励 NBC: ${formatUnits(backwardResult.annualRewardNBC.toString(), 18)} NBC`)
    console.log('')

    // 测试 3: 使用预期质押量（1,000,000 NBC）和实际 rewardRate 计算 APR
    console.log('🧪 测试 3: 使用预期质押量验证')
    console.log('-'.repeat(80))
    const expectedAPR = calculateAPRFromRewardRate(
      BigInt(actualRewardRate.toString()),
      expectedStaked,
      conversionRate,
      BTC_CONFIG.decimals,
    )
    
    console.log(`如果质押量是预期的 ${formatUnits(expectedStaked, 18)} NBC:`)
    console.log(`  - APR 应该是: ${expectedAPR.apr.toFixed(2)}%`)
    console.log(`  - 目标 APR: ${CONFIG.TARGET_APR}%`)
    console.log(`  - 差异: ${(expectedAPR.apr - CONFIG.TARGET_APR).toFixed(2)}%`)
    console.log('')

    // 分析
    console.log('='.repeat(80))
    console.log('   分析结论')
    console.log('='.repeat(80))
    console.log('')
    console.log(`1. 实际质押量: ${formatUnits(actualTotalStaked, 18)} NBC`)
    console.log(`2. 预期质押量: ${formatUnits(expectedStaked, 18)} NBC`)
    console.log(`3. 质押量比例: ${(Number(actualTotalStaked) / Number(expectedStaked) * 100).toFixed(2)}%`)
    console.log('')
    console.log(`4. 如果 rewardRate 是基于预期质押量设置的:`)
    console.log(`   - 预期 APR: ${CONFIG.TARGET_APR}%`)
    console.log(`   - 实际 APR: ${backwardResult.apr.toFixed(2)}%`)
    console.log(`   - APR 放大倍数: ${(backwardResult.apr / CONFIG.TARGET_APR).toFixed(2)}x`)
    console.log(`   - 这正好等于质押量比例的倒数: ${(Number(expectedStaked) / Number(actualTotalStaked)).toFixed(2)}x`)
    console.log('')
    console.log(`5. 结论:`)
    if (Math.abs(expectedAPR.apr - CONFIG.TARGET_APR) < 1) {
      console.log(`   ✅ rewardRate 设置正确，是基于预期质押量 ${formatUnits(expectedStaked, 18)} NBC 和 ${CONFIG.TARGET_APR}% APR 计算的`)
      console.log(`   ⚠️  但实际质押量只有 ${formatUnits(actualTotalStaked, 18)} NBC，导致 APR 异常高`)
      console.log(`   💡 这是正常的数学结果：APR = (年奖励 / 实际质押量) × 100`)
      console.log(`   💡 当实际质押量远小于预期时，APR 会成比例放大`)
    } else {
      console.log(`   ⚠️  rewardRate 设置可能有问题，需要检查`)
    }
    console.log('')

  } catch (error) {
    console.error('❌ 查询失败:', error.message)
    process.exit(1)
  }
}

main().catch(console.error)
