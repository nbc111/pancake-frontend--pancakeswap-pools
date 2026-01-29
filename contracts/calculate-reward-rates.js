/**
 * 质押池奖励率计算脚本
 * 用于在 Remix 中计算各池的 rewardRate 和一年期总奖励
 *
 * 使用方法：
 * 1. 在 Remix 的 JavaScript 环境中运行此脚本
 * 2. 修改 totalStakedNBC 和 targetAPR 参数
 * 3. 复制输出的参数到 Remix 合约调用中
 */

// ============ 配置参数 ============

// 总质押量（NBC，wei 单位，18位精度）
// ⚠️ 重要说明：
// 1. 这是"预期总质押量"或"设计目标"，用于计算应该设置的 rewardRate
// 2. 实际运行时，总质押量会从 0 开始，随着用户质押而增加
// 3. 实际 APR 会根据当前真实总质押量动态计算：APR = (年总奖励 / 当前总质押量) × 100
// 4. 如果当前总质押量 = 0，APR 显示为 0；随着用户质押，APR 会动态变化
// 5. 这个值用于"设计"奖励机制：基于预期质押量设置固定的 rewardRate
//
// 示例：1,000,000 NBC = 1000000000000000000000000
// 建议：根据你的预期设置（例如：预期会有 500,000 NBC 质押，就设置为 500,000）
const totalStakedNBC = BigInt('1000000000000000000000000') // 修改此值

// 目标 APR（年化收益率，例如：100 表示 100%）
// ⚠️ 这是"目标 APR"，基于预期总质押量计算
// 实际 APR 会根据真实总质押量动态变化：
// - 如果实际质押量 < 预期 → 实际 APR > 目标 APR（对早期用户更有利）
// - 如果实际质押量 > 预期 → 实际 APR < 目标 APR（奖励被稀释）
const targetAPR = 100 // 修改此值

// 一年期的秒数
const SECONDS_PER_YEAR = 31536000

// ============ 兑换比例配置 ============
// 基于 NBC = 0.11 USD 的兑换比例
const CONVERSION_RATES = {
  BTC: 804545, // 1 BTC = 804,545 NBC
  ETH: 27454, // 1 ETH = 27,454 NBC
  SOL: 1145, // 1 SOL = 1,145 NBC
  BNB: 7809, // 1 BNB = 7,809 NBC
  XRP: 17.27, // 1 XRP = 17.27 NBC
  LTC: 700, // 1 LTC = 700 NBC
  DOGE: 1.21, // 1 DOGE = 1.21 NBC
  PEPE: 0, // PEPE 兑换比例（需要根据实际价格设置，如果为 0 则跳过计算）
  USDT: 9.09, // 1 USDT = 9.09 NBC
  SUI: 13.27, // 1 SUI = 13.27 NBC
}

// ============ 代币精度配置 ============
const TOKEN_DECIMALS = {
  BTC: 8,
  ETH: 18,
  SOL: 18,
  BNB: 18,
  XRP: 18,
  LTC: 18,
  DOGE: 18,
  PEPE: 18,
  USDT: 6,
  SUI: 18,
}

// ============ 代币地址配置 ============
// 按照正确的池索引顺序排列
const TOKEN_ADDRESSES = {
  BTC: '0xb225C29Da2CaB86991b7e0651c63f0fD5C16613C',
  ETH: '0x1Feba2E24a6b7F1D07F55Aa7ba59a4a4bAF9f908',
  SOL: '0xd5eECCC885Ef850d90AE40E716c3dFCe5C3D4c81',
  BNB: '0x9C43237490272BfdD2F1d1ca0B34f20b1A3C9f5c',
  XRP: '0x48e1772534fabBdcaDe9ca4005E5Ee8BF4190093',
  LTC: '0x8d22041C22d696fdfF0703852a706a40Ff65a7de',
  DOGE: '0x8cEb9a93405CDdf3D76f72327F868Bd3E8755D89',
  PEPE: '0xd365877026A43107Efd9825bc3ABFe1d7A450F82',
  USDT: '0x4E4D07268eFFB4d3507a69F64b5780Eb16551f85',
  SUI: '0x9011191E84Ad832100Ddc891E360f8402457F55E',
}

// ============ 池索引映射（正确的顺序）============
// 按照正确的池索引顺序定义代币列表
const POOL_ORDER = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'LTC', 'DOGE', 'PEPE', 'USDT', 'SUI']

// ============ 计算函数 ============

/**
 * 计算每秒奖励率（rewardRate）
 * @param {string} tokenSymbol - 代币符号
 * @returns {bigint} 每秒奖励率（wei 单位）
 */
function calculateRewardRate(tokenSymbol) {
  const conversionRate = CONVERSION_RATES[tokenSymbol]
  const rewardDecimals = TOKEN_DECIMALS[tokenSymbol]

  if (!conversionRate || !rewardDecimals) {
    throw new Error(`未找到 ${tokenSymbol} 的配置`)
  }

  // APR 转换为小数
  const aprDecimal = targetAPR / 100

  // 年总奖励（NBC，wei 单位）
  const totalStakedNumber = Number(totalStakedNBC)
  const annualRewardNBCWei = BigInt(Math.floor(totalStakedNumber * aprDecimal))

  // 转换为奖励代币数量
  const conversionRateScaled = BigInt(Math.floor(conversionRate * 1e18))
  const rewardTokenMultiplier = BigInt(10 ** rewardDecimals)
  const nbcDecimals = BigInt(10 ** 18)

  // 年总奖励代币（wei 单位）
  // 公式：annualRewardToken = (annualRewardNBCWei * rewardTokenMultiplier) / conversionRateScaled
  // 说明：
  // - annualRewardNBCWei 是 NBC 的年总奖励（wei 单位，18位精度）
  // - rewardTokenMultiplier 是奖励代币的精度（例如 BTC 是 10^8）
  // - conversionRateScaled 是兑换比例（例如 804545 * 10^18，表示 1 BTC = 804,545 NBC）
  // - 结果：将 NBC 奖励转换为奖励代币的 wei 单位
  const annualRewardToken = (annualRewardNBCWei * rewardTokenMultiplier) / conversionRateScaled

  // 每秒奖励率
  const rewardRate = annualRewardToken / BigInt(SECONDS_PER_YEAR)

  return rewardRate
}

/**
 * 计算一年期总奖励
 * @param {bigint} rewardRate - 每秒奖励率
 * @returns {bigint} 一年期总奖励（wei 单位）
 */
function calculateAnnualReward(rewardRate) {
  return rewardRate * BigInt(SECONDS_PER_YEAR)
}

// ============ 输出结果 ============

console.log('='.repeat(80))
console.log('质押池奖励率配置计算')
console.log('='.repeat(80))
console.log(`总质押量: ${totalStakedNBC.toString()} NBC (wei)`)
console.log(`目标 APR: ${targetAPR}%`)
console.log(`质押时间: 1 年 (${SECONDS_PER_YEAR} 秒)`)
console.log('='.repeat(80))
console.log('')

// 质押合约地址（假设）
const STAKING_CONTRACT = '0x107B4E8F1b849b69033FbF4AAcb10B72d29A16E1'

// 计算所有代币的配置（按照正确的池索引顺序）
const results = []

POOL_ORDER.forEach((tokenSymbol, index) => {
  try {
    // 检查代币地址是否存在
    const tokenAddress = TOKEN_ADDRESSES[tokenSymbol]
    if (!tokenAddress) {
      console.warn(`警告: ${tokenSymbol} 代币地址未配置，跳过`)
      return
    }

    // 检查兑换比例是否配置（PEPE 可能为 0，需要单独处理）
    if (tokenSymbol === 'PEPE' && CONVERSION_RATES[tokenSymbol] === 0) {
      console.warn(`警告: ${tokenSymbol} 兑换比例未配置，跳过计算`)
      return
    }

    const rewardRate = calculateRewardRate(tokenSymbol)
    const annualReward = calculateAnnualReward(rewardRate)
    const poolIndex = index + 1 // 池索引从 1 开始（索引 0 可能是 NBC）

    results.push({
      tokenSymbol,
      poolIndex,
      tokenAddress,
      rewardRate: rewardRate.toString(),
      annualReward: annualReward.toString(),
      conversionRate: CONVERSION_RATES[tokenSymbol],
      decimals: TOKEN_DECIMALS[tokenSymbol],
    })

    console.log(`\n${tokenSymbol} 池配置 (池索引: ${poolIndex}):`)
    console.log('-'.repeat(80))
    console.log(`代币地址: ${tokenAddress}`)
    console.log(`兑换比例: 1 ${tokenSymbol} = ${CONVERSION_RATES[tokenSymbol]} NBC`)
    console.log(`代币精度: ${TOKEN_DECIMALS[tokenSymbol]}`)
    console.log(`每秒奖励率 (rewardRate): ${rewardRate.toString()} wei`)
    console.log(`一年期总奖励: ${annualReward.toString()} wei`)
    console.log('')
    console.log('Remix 操作步骤:')
    console.log(`1. addPool:`)
    console.log(`   - rewardToken: ${tokenAddress}`)
    console.log(`   - rewardRate: ${rewardRate.toString()}`)
    console.log(`   - rewardsDuration: ${SECONDS_PER_YEAR}`)
    console.log(`2. approve (在 ${tokenSymbol} 代币合约中):`)
    console.log(`   - spender: ${STAKING_CONTRACT}`)
    console.log(`   - amount: ${annualReward.toString()}`)
    console.log(`3. notifyRewardAmount (在质押合约中):`)
    console.log(`   - poolIndex: ${poolIndex}`)
    console.log(`   - reward: ${annualReward.toString()}`)
    console.log('-'.repeat(80))
  } catch (error) {
    console.error(`计算 ${tokenSymbol} 时出错:`, error.message)
  }
})

// 输出汇总表格
console.log(`\n${'='.repeat(80)}`)
console.log('配置汇总表')
console.log('='.repeat(80))
console.log('| 代币 | 池索引 | 代币地址 | rewardRate (wei/秒) | 一年期总奖励 (wei) |')
console.log('|------|--------|----------|---------------------|-------------------|')
results.forEach((r) => {
  if (r.tokenAddress) {
    const addressShort = `${r.tokenAddress.substring(0, 10)}...`
    console.log(
      `| ${r.tokenSymbol.padEnd(4)} | ${r.poolIndex.toString().padEnd(6)} | ${addressShort.padEnd(
        8,
      )} | ${r.rewardRate.padEnd(19)} | ${r.annualReward.padEnd(17)} |`,
    )
  }
})
console.log('='.repeat(80))

// 输出 JSON 格式（便于复制）
console.log(`\n${'='.repeat(80)}`)
console.log('JSON 格式配置（便于复制）')
console.log('='.repeat(80))
console.log(JSON.stringify(results, null, 2))
console.log('='.repeat(80))
