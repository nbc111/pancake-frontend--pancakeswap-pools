const { ethers } = require('ethers')
const { formatUnits, parseUnits } = require('ethers/lib/utils')
require('dotenv').config()

const CONFIG = {
  RPC_URL: process.env.RPC_URL || 'https://rpc.nbcex.com',
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  STAKING_CONTRACT_ADDRESS: process.env.STAKING_CONTRACT_ADDRESS || '0x32580B2001EA941529c79bcb819b8f6F3c886c60',
}

// 代币配置
const TOKEN_CONFIG = {
  BTC: {
    address: '0xb225C29Da2CaB86991b7e0651c63f0fD5C16613C',
    decimals: 8,
    symbol: 'BTC',
  },
  ETH: {
    address: '0x1Feba2E24a6b7F1D07F55Aa7ba59a4a4bAF9f908',
    decimals: 18,
    symbol: 'ETH',
  },
  SOL: {
    address: '0xd5eECCC885Ef850d90AE40E716c3dFCe5C3D4c81',
    decimals: 18,
    symbol: 'SOL',
  },
  BNB: {
    address: '0x9C43237490272BfdD2F1d1ca0B34f20b1A3C9f5c',
    decimals: 18,
    symbol: 'BNB',
  },
  XRP: {
    address: '0x48e1772534fabBdcaDe9ca4005E5Ee8BF4190093',
    decimals: 18,
    symbol: 'XRP',
  },
  LTC: {
    address: '0x8d22041C22d696fdfF0703852a706a40Ff65a7de',
    decimals: 18,
    symbol: 'LTC',
  },
  DOGE: {
    address: '0x8cEb9a93405CDdf3D76f72327F868Bd3E8755D89',
    decimals: 18,
    symbol: 'DOGE',
  },
  USDT: {
    address: '0x4E4D07268eFFB4d3507a69F64b5780Eb16551f85',
    decimals: 6,
    symbol: 'USDT',
  },
  SUI: {
    address: '0x9011191E84Ad832100Ddc891E360f8402457F55E',
    decimals: 18,
    symbol: 'SUI',
  },
}

// ERC20 ABI
const ERC20_ABI = [
  'function balanceOf(address) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
]

async function main() {
  // 从命令行参数获取代币符号，默认为 DOGE
  const tokenSymbol = process.argv[2]?.toUpperCase() || 'DOGE'

  if (!TOKEN_CONFIG[tokenSymbol]) {
    console.error(`❌ 错误: 不支持的代币符号: ${tokenSymbol}`)
    console.error(`   支持的代币: ${Object.keys(TOKEN_CONFIG).join(', ')}`)
    process.exit(1)
  }

  const tokenConfig = TOKEN_CONFIG[tokenSymbol]

  console.log('========================================')
  console.log('   授权代币给合约地址')
  console.log('========================================')
  console.log(`代币: ${tokenConfig.symbol}`)
  console.log(`代币地址: ${tokenConfig.address}`)
  console.log(`合约地址: ${CONFIG.STAKING_CONTRACT_ADDRESS}`)
  console.log('========================================\n')

  // 检查配置
  if (!CONFIG.PRIVATE_KEY) {
    console.error('❌ 错误: 未设置 PRIVATE_KEY 环境变量')
    process.exit(1)
  }

  // 连接区块链
  const provider = new ethers.providers.JsonRpcProvider(CONFIG.RPC_URL)
  const wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, provider)
  const tokenContract = new ethers.Contract(tokenConfig.address, ERC20_ABI, wallet)

  console.log(`钱包地址: ${wallet.address}\n`)

  // 检查余额
  const balance = await tokenContract.balanceOf(wallet.address)
  console.log(`📊 余额信息:`)
  console.log(`   Owner 地址余额: ${formatUnits(balance, tokenConfig.decimals)} ${tokenConfig.symbol}\n`)

  if (balance.isZero()) {
    console.error('❌ 错误: Owner 地址没有代币余额，无法授权')
    process.exit(1)
  }

  // 检查当前授权额度
  const currentAllowance = await tokenContract.allowance(wallet.address, CONFIG.STAKING_CONTRACT_ADDRESS)
  console.log(`📊 当前授权额度:`)
  console.log(`   ${formatUnits(currentAllowance, tokenConfig.decimals)} ${tokenConfig.symbol}\n`)

  // 如果已经有足够的授权额度，询问是否继续
  if (!currentAllowance.isZero()) {
    console.log(`⚠️  当前已有授权额度: ${formatUnits(currentAllowance, tokenConfig.decimals)} ${tokenConfig.symbol}`)
    console.log(`   如果继续，将授权最大额度（覆盖现有授权）\n`)
  }

  // 授权最大额度（uint256 max）
  const maxAmount = ethers.constants.MaxUint256

  try {
    console.log(`📤 发送授权交易...`)
    console.log(`   授权额度: 最大额度 (${maxAmount.toString()})\n`)

    const tx = await tokenContract.approve(CONFIG.STAKING_CONTRACT_ADDRESS, maxAmount)
    console.log(`🔗 交易哈希: ${tx.hash}`)

    console.log('⏳ 等待确认...')
    const receipt = await tx.wait()
    console.log(`✅ 授权成功!`)
    console.log(`📦 区块号: ${receipt.blockNumber}`)

    const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice || receipt.gasPrice)
    console.log(`⛽ Gas 费用: ${formatUnits(gasUsed, 18)} NBC\n`)

    // 再次检查授权额度
    const newAllowance = await tokenContract.allowance(wallet.address, CONFIG.STAKING_CONTRACT_ADDRESS)
    console.log(`📊 授权后额度:`)
    console.log(`   ${formatUnits(newAllowance, tokenConfig.decimals)} ${tokenConfig.symbol}`)
    console.log(`   (最大额度，合约可以转移任意数量的代币)\n`)

    console.log('✅ 授权完成！现在可以调用 notifyRewardAmount 函数了。')
  } catch (error) {
    console.error('❌ 授权失败:', error.message)
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
