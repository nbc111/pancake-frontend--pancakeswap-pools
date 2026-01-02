const { ethers } = require('ethers')
const { formatUnits } = require('ethers/lib/utils')
require('dotenv').config()

const CONFIG = {
  RPC_URL: process.env.RPC_URL || 'https://rpc.nbcex.com',
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  STAKING_CONTRACT_ADDRESS: process.env.STAKING_CONTRACT_ADDRESS || '0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789',
}

// 代币配置
const TOKEN_CONFIGS = {
  DOGE: {
    poolIndex: 7,
    tokenAddress: '0x8cEb9a93405CDdf3D76f72327F868Bd3E8755D89',
    decimals: 18,
    symbol: 'DOGE',
  },
  USDT: {
    poolIndex: 9,
    tokenAddress: '0xfd1508502696d0E1910eD850c6236d965cc4db11',
    decimals: 6,
    symbol: 'USDT',
  },
}

// 合约 ABI
const STAKING_ABI = [
  'function emergencyWithdrawReward(uint256 poolIndex, uint256 amount) external',
  'function owner() external view returns (address)',
]

// ERC20 ABI
const ERC20_ABI = ['function balanceOf(address) external view returns (uint256)']

async function main() {
  // 从命令行参数获取代币符号，默认为 DOGE
  const tokenSymbol = process.argv[2]?.toUpperCase() || 'DOGE'

  if (!TOKEN_CONFIGS[tokenSymbol]) {
    console.error(`❌ 错误: 不支持的代币符号: ${tokenSymbol}`)
    console.error(`   支持的代币: ${Object.keys(TOKEN_CONFIGS).join(', ')}`)
    process.exit(1)
  }

  const tokenConfig = TOKEN_CONFIGS[tokenSymbol]

  console.log('========================================')
  console.log('   从合约地址提取奖励代币')
  console.log('========================================')
  console.log(`合约地址: ${CONFIG.STAKING_CONTRACT_ADDRESS}`)
  console.log(`代币: ${tokenConfig.symbol}`)
  console.log(`代币地址: ${tokenConfig.tokenAddress}`)
  console.log(`池索引: ${tokenConfig.poolIndex}`)
  console.log('========================================\n')

  // 检查配置
  if (!CONFIG.PRIVATE_KEY) {
    console.error('❌ 错误: 未设置 PRIVATE_KEY 环境变量')
    process.exit(1)
  }

  // 连接区块链
  const provider = new ethers.providers.JsonRpcProvider(CONFIG.RPC_URL)
  const wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, provider)
  const stakingContract = new ethers.Contract(CONFIG.STAKING_CONTRACT_ADDRESS, STAKING_ABI, wallet)

  // 检查 owner 地址
  const contractOwner = await stakingContract.owner()
  const walletAddress = wallet.address

  console.log(`Owner 地址: ${contractOwner}`)
  console.log(`钱包地址: ${walletAddress}`)

  if (contractOwner.toLowerCase() !== walletAddress.toLowerCase()) {
    console.error(`❌ 错误: 钱包地址与合约 owner 地址不匹配!`)
    console.error(`   合约 owner: ${contractOwner}`)
    console.error(`   钱包地址: ${walletAddress}`)
    process.exit(1)
  }

  console.log('✅ Owner 地址验证通过\n')

  // 检查合约地址的代币余额
  const rewardToken = new ethers.Contract(tokenConfig.tokenAddress, ERC20_ABI, provider)
  const contractBalance = await rewardToken.balanceOf(CONFIG.STAKING_CONTRACT_ADDRESS)
  const ownerBalance = await rewardToken.balanceOf(walletAddress)

  console.log(`📊 余额信息:`)
  console.log(`   合约地址余额: ${formatUnits(contractBalance, tokenConfig.decimals)} ${tokenConfig.symbol}`)
  console.log(`   Owner 地址余额: ${formatUnits(ownerBalance, tokenConfig.decimals)} ${tokenConfig.symbol}\n`)

  if (contractBalance.isZero()) {
    console.log('⚠️  合约地址没有代币余额，无需提取')
    process.exit(0)
  }

  // 询问是否提取全部余额
  console.log(`💡 准备提取: ${formatUnits(contractBalance, tokenConfig.decimals)} ${tokenConfig.symbol}`)
  console.log(`   这将把代币从合约地址转回 owner 地址\n`)

  try {
    console.log('📤 发送交易...')
    const tx = await stakingContract.emergencyWithdrawReward(tokenConfig.poolIndex, contractBalance)
    console.log(`🔗 交易哈希: ${tx.hash}`)

    console.log('⏳ 等待确认...')
    const receipt = await tx.wait()
    console.log(`✅ 提取成功!`)
    console.log(`📦 区块号: ${receipt.blockNumber}`)

    const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice || receipt.gasPrice)
    console.log(`⛽ Gas 费用: ${formatUnits(gasUsed, 18)} NBC\n`)

    // 再次检查余额
    const newContractBalance = await rewardToken.balanceOf(CONFIG.STAKING_CONTRACT_ADDRESS)
    const newOwnerBalance = await rewardToken.balanceOf(walletAddress)

    console.log(`📊 提取后余额:`)
    console.log(`   合约地址余额: ${formatUnits(newContractBalance, tokenConfig.decimals)} ${tokenConfig.symbol}`)
    console.log(`   Owner 地址余额: ${formatUnits(newOwnerBalance, tokenConfig.decimals)} ${tokenConfig.symbol}`)
  } catch (error) {
    console.error('❌ 提取失败:', error.message)
    if (error.transaction) {
      console.error(`   交易哈希: ${error.transaction.hash}`)
    }
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('致命错误:', error)
  process.exit(1)
})
