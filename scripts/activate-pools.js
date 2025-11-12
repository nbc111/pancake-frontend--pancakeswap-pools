const hre = require('hardhat')
require('dotenv').config()

const STAKING_CONTRACT_ADDRESS = '0xDAF46477622a7287EC10f3565FC25bAEFf272C0A'

async function main() {
  console.log('开始激活质押池...')

  const [deployer] = await hre.ethers.getSigners()
  console.log('操作账户:', deployer.address)

  const balance = await hre.ethers.provider.getBalance(deployer.address)
  console.log('账户余额:', hre.ethers.formatEther(balance), 'NBC')

  // 获取合约实例
  const stakingFactory = await hre.ethers.getContractFactory('NbcMultiRewardStaking')
  const staking = stakingFactory.attach(STAKING_CONTRACT_ADDRESS)

  // 检查合约 owner
  const owner = await staking.owner()
  console.log('合约 Owner:', owner)
  console.log('当前账户是否为 Owner:', owner.toLowerCase() === deployer.address.toLowerCase())

  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.error('❌ 错误: 当前账户不是合约 Owner，无法激活池！')
    console.error('请使用 Owner 账户:', owner)
    return
  }

  // 检查池的当前状态
  console.log('\n检查池的当前状态...')
  for (let i = 0; i < 3; i++) {
    const poolInfo = await staking.getPoolInfo(i)
    console.log(`池 ${i} 状态:`, {
      rewardToken: poolInfo[0],
      totalStaked: poolInfo[1].toString(),
      rewardRate: poolInfo[2].toString(),
      periodFinish: poolInfo[3].toString(),
      active: poolInfo[4],
    })
  }

  // 激活所有池
  console.log('\n开始激活池...')
  for (let i = 0; i < 3; i++) {
    try {
      console.log(`激活池 ${i}...`)
      const tx = await staking.setPoolActive(i, true)
      console.log(`交易已发送: ${tx.hash}`)
      await tx.wait()
      console.log(`✅ 池 ${i} 已激活`)
    } catch (error) {
      console.error(`❌ 激活池 ${i} 失败:`, error.message)
    }
  }

  // 再次检查池的状态
  console.log('\n验证池的激活状态...')
  for (let i = 0; i < 3; i++) {
    const poolInfo = await staking.getPoolInfo(i)
    console.log(`池 ${i} active 状态:`, poolInfo[4])
  }

  console.log('\n✅ 完成！')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
