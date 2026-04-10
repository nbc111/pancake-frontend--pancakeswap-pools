const { ethers } = require('ethers')
const { formatUnits } = require('ethers/lib/utils')

const CONFIG = {
  RPC_URL: 'https://rpc.nbcex.com',
  STAKING_CONTRACT_ADDRESS: '0x32580B2001EA941529c79bcb819b8f6F3c886c60',
  SECONDS_PER_YEAR: 31536000,
}

// 实际价格数据
const PRICES = {
  BTC: 93464, // USDT
  NBC: 0.07,  // USDT
}

const BTC_CONFIG = {
  poolIndex: 1,
  decimals: 8,
  symbol: 'BTC',
}

const STAKING_ABI = [
  'function getPoolInfo(uint256) view returns (address rewardToken, uint256 totalStakedAmount, uint256 rewardRate, uint256 periodFinish, bool active)',
]

function calculateAPR(rewardRate, totalStakedNBC, conversionRate, rewardTokenDecimals) {
  if (totalStakedNBC === 0n) return 0
  if (rewardRate === 0n) return 0

  // 年总奖励（奖励代币，wei 单位）
  const annualRewardToken = rewardRate * BigInt(CONFIG.SECONDS_PER_YEAR)

  // 转换为 NBC（wei 单位）
  const conversionRateScaled = BigInt(Math.floor(conversionRate * 1e18))
  const rewardTokenMultiplier = BigInt(10 ** rewardTokenDecimals)

  // annualRewardNBC = (annualRewardToken * conversionRateScaled) / rewardTokenMultiplier
  const annualRewardNBC = (annualRewardToken * conversionRateScaled) / rewardTokenMultiplier

  // APR = (年总奖励 / 总质押量) * 100
  const apr = (Number(annualRewardNBC) / Number(totalStakedNBC)) * 100

  return {
    apr,
    annualRewardToken,
    annualRewardNBC,
    conversionRateScaled,
    rewardTokenMultiplier,
  }
}

async function main() {
  console.log('='.repeat(80))
  console.log('   BTC 池 APR 详细计算')
  console.log('='.repeat(80))
  console.log(`合约地址: ${CONFIG.STAKING_CONTRACT_ADDRESS}`)
  console.log(`RPC URL: ${CONFIG.RPC_URL}`)
  console.log('='.repeat(80))
  console.log('')

  const provider = new ethers.providers.JsonRpcProvider(CONFIG.RPC_URL)
  const stakingContract = new ethers.Contract(CONFIG.STAKING_CONTRACT_ADDRESS, STAKING_ABI, provider)

  try {
    // 查询合约数据
    const poolInfo = await stakingContract.getPoolInfo(BTC_CONFIG.poolIndex)
    const totalStakedNBC = poolInfo.totalStakedAmount
    const rewardRate = poolInfo.rewardRate
    const active = poolInfo.active

    // 格式化数据
    const totalStakedNBCFormatted = formatUnits(totalStakedNBC, 18)
    const rewardRateFormatted = formatUnits(rewardRate, BTC_CONFIG.decimals)

    // 计算兑换比例
    const conversionRate = PRICES.BTC / PRICES.NBC

    console.log('📊 从合约获取的数据:')
    console.log('-'.repeat(80))
    console.log(`池状态: ${active ? '✅ 激活' : '❌ 未激活'}`)
    console.log(`总质押量: ${totalStakedNBCFormatted} NBC (${totalStakedNBC.toString()} wei)`)
    console.log(`奖励率: ${rewardRateFormatted} BTC/s (${rewardRate.toString()} wei/s)`)
    console.log('')
    console.log('💰 价格数据:')
    console.log('-'.repeat(80))
    console.log(`BTC 价格: $${PRICES.BTC.toLocaleString()} USDT`)
    console.log(`NBC 价格: $${PRICES.NBC} USDT`)
    console.log(`兑换比例: 1 BTC = ${conversionRate.toLocaleString()} NBC`)
    console.log('')
    console.log('🔢 APR 计算过程:')
    console.log('-'.repeat(80))

    // 计算 APR
    const result = calculateAPR(
      BigInt(rewardRate.toString()),
      BigInt(totalStakedNBC.toString()),
      conversionRate,
      BTC_CONFIG.decimals,
    )

    // 年总奖励 BTC
    const annualRewardBTC = Number(result.annualRewardToken) / 10 ** BTC_CONFIG.decimals
    const annualRewardNBCFormatted = Number(result.annualRewardNBC) / 1e18

    console.log(`1. 年总奖励 BTC:`)
    console.log(`   rewardRate × SECONDS_PER_YEAR`)
    console.log(`   = ${rewardRate.toString()} × ${CONFIG.SECONDS_PER_YEAR}`)
    console.log(`   = ${result.annualRewardToken.toString()} wei`)
    console.log(`   = ${annualRewardBTC.toFixed(6)} BTC`)
    console.log('')
    console.log(`2. 转换为 NBC 价值:`)
    console.log(`   conversionRate = ${PRICES.BTC} / ${PRICES.NBC} = ${conversionRate.toFixed(2)}`)
    console.log(`   conversionRateScaled = ${conversionRate.toFixed(2)} × 10^18 = ${result.conversionRateScaled.toString()}`)
    console.log(`   rewardTokenMultiplier = 10^${BTC_CONFIG.decimals} = ${result.rewardTokenMultiplier.toString()}`)
    console.log(`   annualRewardNBC = (${result.annualRewardToken.toString()} × ${result.conversionRateScaled.toString()}) / ${result.rewardTokenMultiplier.toString()}`)
    console.log(`   = ${result.annualRewardNBC.toString()} wei`)
    console.log(`   = ${annualRewardNBCFormatted.toFixed(2)} NBC`)
    console.log('')
    console.log(`3. 计算 APR:`)
    console.log(`   APR = (annualRewardNBC / totalStakedNBC) × 100`)
    console.log(`   = (${annualRewardNBCFormatted.toFixed(2)} / ${totalStakedNBCFormatted}) × 100`)
    console.log(`   = ${result.apr.toFixed(2)}%`)
    console.log('')
    console.log('='.repeat(80))
    console.log(`   最终结果: APR = ${result.apr.toFixed(2)}%`)
    console.log('='.repeat(80))

    // 验证计算
    console.log('')
    console.log('✅ 验证计算:')
    console.log('-'.repeat(80))
    console.log(`年总奖励 BTC: ${annualRewardBTC.toFixed(6)} BTC`)
    console.log(`年总奖励 BTC 价值: ${(annualRewardBTC * PRICES.BTC).toLocaleString()} USDT`)
    console.log(`年总奖励 NBC: ${annualRewardNBCFormatted.toFixed(2)} NBC`)
    console.log(`年总奖励 NBC 价值: ${(annualRewardNBCFormatted * PRICES.NBC).toFixed(2)} USDT`)
    console.log(`总质押量 NBC: ${totalStakedNBCFormatted} NBC`)
    console.log(`总质押量 NBC 价值: ${(Number(totalStakedNBCFormatted) * PRICES.NBC).toFixed(2)} USDT`)
    console.log(`APR: ${result.apr.toFixed(2)}%`)
    console.log('')
    console.log(`如果 APR 为 ${result.apr.toFixed(2)}%，意味着:`)
    console.log(`- 质押 ${totalStakedNBCFormatted} NBC，一年可获得 ${annualRewardNBCFormatted.toFixed(2)} NBC`)
    console.log(`- 相当于 ${((annualRewardNBCFormatted / Number(totalStakedNBCFormatted)) * 100).toFixed(2)}% 的回报率`)

  } catch (error) {
    console.error('❌ 查询失败:', error.message)
    process.exit(1)
  }
}

main().catch(console.error)
