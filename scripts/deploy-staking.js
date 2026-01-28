const hre = require("hardhat");

/**
 * 部署质押合约的脚本
 * 
 * 使用方法：
 * 1. 部署 BTC 质押合约：
 *    npx hardhat run scripts/deploy-staking.js --network nbc -- --token BTC
 * 
 * 2. 部署 ETH 质押合约：
 *    npx hardhat run scripts/deploy-staking.js --network nbc -- --token ETH
 */

// 代币配置
const TOKEN_CONFIGS = {
  BTC: {
    tokenAddress: '0xb225C29Da2CaB86991b7e0651c63f0fD5C16613C',
    rewardTokenAddress: '0xb225C29Da2CaB86991b7e0651c63f0fD5C16613C', // 奖励代币（通常与质押代币相同）
    rewardsDuration: 7 * 24 * 60 * 60, // 7天（秒）
  },
  ETH: {
    tokenAddress: '0x934EbeB6D7D3821B604A5D10F80619d5bcBe49C3',
    rewardTokenAddress: '0x934EbeB6D7D3821B604A5D10F80619d5bcBe49C3', // 奖励代币（通常与质押代币相同）
    rewardsDuration: 7 * 24 * 60 * 60, // 7天（秒）
  },
};

async function main() {
  const tokenType = process.argv[process.argv.indexOf('--token') + 1];
  
  if (!tokenType || !TOKEN_CONFIGS[tokenType]) {
    console.error('请指定代币类型: BTC 或 ETH');
    console.error('使用方法: npx hardhat run scripts/deploy-staking.js --network nbc -- --token BTC');
    process.exit(1);
  }

  const config = TOKEN_CONFIGS[tokenType];
  console.log(`\n开始部署 ${tokenType} 质押合约...`);
  
  // 获取部署账户
  const [deployer] = await hre.ethers.getSigners();
  console.log("部署账户:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("账户余额:", hre.ethers.formatEther(balance), "NBC");

  // 注意：这里需要质押合约的源代码
  // 如果合约代码在 contracts/StakingRewards.sol，使用以下代码：
  // const StakingRewards = await hre.ethers.getContractFactory("StakingRewards");
  // const staking = await StakingRewards.deploy(
  //   config.tokenAddress,
  //   config.rewardTokenAddress,
  //   config.rewardsDuration
  // );
  
  // 如果合约代码在其他位置，请修改 ContractFactory 的名称
  console.log("\n⚠️  警告：需要质押合约的源代码才能部署！");
  console.log("部署参数：");
  console.log("  - 质押代币地址:", config.tokenAddress);
  console.log("  - 奖励代币地址:", config.rewardTokenAddress);
  console.log("  - 奖励周期（秒）:", config.rewardsDuration);
  console.log("\n请将质押合约源代码放入 contracts/ 目录，然后修改此脚本。");
  
  // 示例部署代码（需要根据实际合约名称修改）：
  /*
  const StakingRewards = await hre.ethers.getContractFactory("StakingRewards");
  const staking = await StakingRewards.deploy(
    config.tokenAddress,
    config.rewardTokenAddress,
    config.rewardsDuration
  );
  
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  
  console.log(`\n✅ ${tokenType} 质押合约部署成功！`);
  console.log("合约地址:", stakingAddress);
  console.log("\n请更新前端代码中的 stakingAddress:");
  console.log(`stakingAddress: '${stakingAddress}',`);
  */
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

