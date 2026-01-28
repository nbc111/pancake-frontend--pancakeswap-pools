const { ethers } = require('ethers')
const { formatUnits } = require('ethers/lib/utils')

const CONFIG = {
  RPC_URL: 'https://rpc.nbcex.com',
  STAKING_CONTRACT_ADDRESS: '0x107B4E8F1b849b69033FbF4AAcb10B72d29A16E1',
  SECONDS_PER_YEAR: 31536000,
}

const TOKEN_CONFIG = {
  BTC: { poolIndex: 1, decimals: 8, symbol: 'BTC' },
  ETH: { poolIndex: 2, decimals: 18, symbol: 'ETH' },
  SOL: { poolIndex: 3, decimals: 18, symbol: 'SOL' },
  BNB: { poolIndex: 4, decimals: 18, symbol: 'BNB' },
  XRP: { poolIndex: 5, decimals: 18, symbol: 'XRP' },
  LTC: { poolIndex: 6, decimals: 18, symbol: 'LTC' },
  DOGE: { poolIndex: 7, decimals: 18, symbol: 'DOGE' },
  USDT: { poolIndex: 9, decimals: 6, symbol: 'USDT' },
  SUI: { poolIndex: 10, decimals: 18, symbol: 'SUI' },
}

const STAKING_ABI = [
  'function getPoolInfo(uint256) view returns (address rewardToken, uint256 totalStakedAmount, uint256 rewardRate, uint256 periodFinish, bool active)',
  'function totalStaked(uint256) view returns (uint256)',
]

async function checkPool(symbol, config) {
  const provider = new ethers.providers.JsonRpcProvider(CONFIG.RPC_URL)
  const stakingContract = new ethers.Contract(CONFIG.STAKING_CONTRACT_ADDRESS, STAKING_ABI, provider)

  try {
    const poolInfo = await stakingContract.getPoolInfo(config.poolIndex)
    const totalStaked = poolInfo.totalStakedAmount

    const rewardRate = poolInfo.rewardRate
    const active = poolInfo.active

    // 计算年总奖励
    const annualRewardToken = rewardRate.mul(CONFIG.SECONDS_PER_YEAR)
    const annualRewardTokenFormatted = formatUnits(annualRewardToken, config.decimals)
    const totalStakedFormatted = formatUnits(totalStaked, 18)

    return {
      symbol,
      poolIndex: config.poolIndex,
      active,
      totalStaked: totalStaked.toString(),
      totalStakedFormatted: Number(totalStakedFormatted).toFixed(2),
      rewardRate: rewardRate.toString(),
      rewardRateFormatted: formatUnits(rewardRate, config.decimals),
      annualRewardToken: annualRewardToken.toString(),
      annualRewardTokenFormatted: Number(annualRewardTokenFormatted).toFixed(6),
    }
  } catch (error) {
    return {
      symbol,
      poolIndex: config.poolIndex,
      error: error.message,
    }
  }
}

async function main() {
  console.log('='.repeat(80))
  console.log('   查询合约中的质押量和奖励率')
  console.log('='.repeat(80))
  console.log(`合约地址: ${CONFIG.STAKING_CONTRACT_ADDRESS}`)
  console.log(`RPC URL: ${CONFIG.RPC_URL}`)
  console.log('='.repeat(80))
  console.log('')

  const results = []
  for (const [symbol, config] of Object.entries(TOKEN_CONFIG)) {
    const result = await checkPool(symbol, config)
    results.push(result)
  }

  // 输出结果
  console.log('='.repeat(80))
  console.log('   查询结果')
  console.log('='.repeat(80))
  console.log('')

  for (const result of results) {
    if (result.error) {
      console.log(`❌ ${result.symbol} 池 (索引: ${result.poolIndex}):`)
      console.log(`   错误: ${result.error}\n`)
      continue
    }

    console.log(`${result.symbol} 池 (索引: ${result.poolIndex}):`)
    console.log('-'.repeat(80))
    console.log(`池状态: ${result.active ? '✅ 激活' : '❌ 未激活'}`)
    console.log(`总质押量: ${result.totalStakedFormatted} NBC (${result.totalStaked} wei)`)
    console.log(`奖励率: ${result.rewardRateFormatted} ${result.symbol}/s (${result.rewardRate} wei/s)`)
    console.log(`年总奖励: ${result.annualRewardTokenFormatted} ${result.symbol} (${result.annualRewardToken} wei)`)
    console.log('-'.repeat(80))
    console.log('')
  }
}

main().catch(console.error)
