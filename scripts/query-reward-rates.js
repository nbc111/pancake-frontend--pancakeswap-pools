const { ethers } = require('ethers')
const { formatUnits } = require('ethers/lib/utils')
require('dotenv').config()

const CONFIG = {
  RPC_URL: process.env.RPC_URL || 'https://rpc.nbcex.com',
  STAKING_CONTRACT_ADDRESS: process.env.STAKING_CONTRACT_ADDRESS || '0x107B4E8F1b849b69033FbF4AAcb10B72d29A16E1',
  SECONDS_PER_YEAR: 31536000,
}

const TOKEN_CONFIG = {
  BTC: { poolIndex: 0, address: '0xb225C29Da2CaB86991b7e0651c63f0fD5C16613C', decimals: 8, symbol: 'BTC' },
  ETH: { poolIndex: 1, address: '0x1Feba2E24a6b7F1D07F55Aa7ba59a4a4bAF9f908', decimals: 18, symbol: 'ETH' },
  USDT: { poolIndex: 2, address: '0x4E4D07268eFFB4d3507a69F64b5780Eb16551f85', decimals: 6, symbol: 'USDT' },
}

const STAKING_ABI = [
  'function getPoolInfo(uint256) view returns (address rewardToken, uint256 totalStakedAmount, uint256 rewardRate, uint256 periodFinish, bool active)',
  'function totalStaked(uint256) view returns (uint256)',
]

/**
 * 查询单个池的奖励率
 */
async function queryPoolRewardRate(symbol, config) {
  const provider = new ethers.providers.JsonRpcProvider(CONFIG.RPC_URL)
  const stakingContract = new ethers.Contract(CONFIG.STAKING_CONTRACT_ADDRESS, STAKING_ABI, provider)

  try {
    const poolInfo = await stakingContract.getPoolInfo(config.poolIndex)
    const totalStaked = await stakingContract.totalStaked(config.poolIndex)

    const rewardToken = poolInfo.rewardToken
    const totalStakedAmount = poolInfo.totalStakedAmount
    const rewardRate = poolInfo.rewardRate
    const periodFinish = poolInfo.periodFinish
    const active = poolInfo.active

    // 验证代币地址
    const addressMatch = rewardToken.toLowerCase() === config.address.toLowerCase()

    // 计算年总奖励
    const annualReward = rewardRate.mul(CONFIG.SECONDS_PER_YEAR)
    const annualRewardNum = Number(formatUnits(annualReward, config.decimals))

    // 检查奖励期
    const currentTime = Math.floor(Date.now() / 1000)
    const periodValid = Number(periodFinish) > currentTime
    const periodFinishDate = new Date(Number(periodFinish) * 1000)
    const daysRemaining = periodValid ? Math.floor((Number(periodFinish) - currentTime) / 86400) : 0

    return {
      symbol,
      poolIndex: config.poolIndex,
      addressMatch,
      active,
      periodValid,
      periodFinish: periodFinishDate.toISOString(),
      daysRemaining,
      rewardRate: rewardRate.toString(),
      rewardRateFormatted: formatUnits(rewardRate, config.decimals),
      annualReward: annualReward.toString(),
      annualRewardFormatted: annualRewardNum.toFixed(6),
      totalStakedNBC: formatUnits(totalStakedAmount, 18),
      totalStakedFormatted: Number(formatUnits(totalStakedAmount, 18)).toFixed(2),
    }
  } catch (error) {
    return {
      symbol,
      poolIndex: config.poolIndex,
      error: error.message,
    }
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('='.repeat(80))
  console.log('   查询合约中的奖励率')
  console.log('='.repeat(80))
  console.log(`合约地址: ${CONFIG.STAKING_CONTRACT_ADDRESS}`)
  console.log(`RPC URL: ${CONFIG.RPC_URL}`)
  console.log('='.repeat(80))
  console.log('')

  const results = []
  for (const [symbol, config] of Object.entries(TOKEN_CONFIG)) {
    const result = await queryPoolRewardRate(symbol, config)
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
    console.log(`代币地址匹配: ${result.addressMatch ? '✅' : '❌'}`)
    console.log(`池状态: ${result.active ? '✅ 激活' : '❌ 未激活'}`)
    console.log(
      `奖励期: ${result.periodValid ? '✅ 有效' : '❌ 已过期'} (剩余 ${result.daysRemaining} 天, 结束时间: ${
        result.periodFinish
      })`,
    )
    console.log(`总质押量: ${result.totalStakedFormatted} NBC`)
    console.log(`奖励率 (rewardRate): ${result.rewardRate} wei/s`)
    console.log(`奖励率 (格式化): ${result.rewardRateFormatted} ${result.symbol}/s`)
    console.log(`年总奖励: ${result.annualReward} wei`)
    console.log(`年总奖励 (格式化): ${result.annualRewardFormatted} ${result.symbol}`)
    console.log('-'.repeat(80))
    console.log('')
  }

  // 输出汇总表格
  console.log('='.repeat(80))
  console.log('   汇总表格')
  console.log('='.repeat(80))
  console.log('| 代币 | 池索引 | 奖励率 (wei/s) | 奖励率 (格式化) | 年总奖励 (格式化) | 总质押量 (NBC) | 状态 |')
  console.log('|------|--------|----------------|-----------------|-------------------|---------------|------|')
  for (const result of results) {
    if (!result.error) {
      const status = result.active && result.periodValid ? '✅' : '❌'
      console.log(
        `| ${result.symbol.padEnd(4)} | ${result.poolIndex.toString().padEnd(6)} | ${result.rewardRate.padEnd(
          14,
        )} | ${result.rewardRateFormatted.padEnd(15)} | ${result.annualRewardFormatted.padEnd(
          17,
        )} | ${result.totalStakedFormatted.padEnd(13)} | ${status} |`,
      )
    }
  }
  console.log('='.repeat(80))
}

// 运行
main().catch((error) => {
  console.error('❌ 错误:', error)
  process.exit(1)
})
