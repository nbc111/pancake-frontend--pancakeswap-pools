# 在 Remix 中修复池状态

## 🔍 当前状态分析

根据你提供的数据，所有池的 `active = true`，但部分池的 `periodFinish` 已过期。

### 问题原因

池显示为 "Old" 的原因：
- ✅ `active = true` （已激活）
- ❌ `periodFinish <= 当前时间` （奖励期已过期）

### 解决方案

需要为每个过期的池重新设置奖励，这会自动更新 `periodFinish`。

## 📋 快速参考

**详细参数表请查看**: [Remix 中 notifyRewardAmount 参数设置](./REMMIX_NOTIFY_REWARD_PARAMS.md)

## 🛠️ 修复步骤

### 第一步：检查当前时间戳

在 Remix 中：
1. 找到 **`getPoolInfo`** 函数
2. 或者使用 JavaScript 计算：
   ```javascript
   Math.floor(Date.now() / 1000)
   ```

### 第二步：为过期池重新设置奖励

对于每个过期的池，需要：

1. **批准代币给质押合约**
2. **调用 `notifyRewardAmount`** 设置新的奖励

### 第三步：在 Remix 中操作

#### 3.1 批准代币（以 BTC 为例）

1. 在 Remix 中，点击 **"At Address"** 输入框
2. 输入 BTC 代币地址：`0xb225C29Da2CaB86991b7e0651c63f0fD5C16613C`
3. 点击 **"At Address"** 按钮
4. 找到 **`approve`** 函数
5. 填写参数：
   - **spender**: `0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789` (质押合约地址)
   - **amount**: 一年期总奖励（见下方计算）
6. 点击 **"transact"** 并确认交易

#### 3.2 设置奖励

1. 回到质押合约（地址：`0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`）
2. 找到 **`notifyRewardAmount`** 函数
3. 填写参数：
   - **poolIndex**: 池索引（1-10）
   - **reward**: 一年期总奖励（见下方计算）
4. 点击 **"transact"** 并确认交易

## 📊 各池的奖励率配置

根据你提供的数据，当前各池的奖励率：

| 池索引 | 代币 | 当前奖励率 (wei/秒) | 一年期总奖励 (wei) | notifyRewardAmount 参数 |
|--------|------|-------------------|------------------|----------------------|
| 1 | BTC | 231481481 | 7300000000000000 | poolIndex: `1`<br>reward: `7300000000000000` |
| 2 | ETH | 289351851 | 9120000000000000000 | poolIndex: `2`<br>reward: `9120000000000000000` |
| 3 | SOL | 3861003861 | 121800000000000000000 | poolIndex: `3`<br>reward: `121800000000000000000` |
| 4 | BNB | 173611111318647 | 5476800000000000000000 | poolIndex: `4`<br>reward: `5476800000000000000000` |
| 5 | XRP | 578703703703703703 | 18252000000000000000000 | poolIndex: `5`<br>reward: `18252000000000000000000` |
| 6 | LTC | 1157407407407407407 | 36504000000000000000000 | poolIndex: `6`<br>reward: `36504000000000000000000` |
| 7 | DOGE | 578703703703703703 | 18252000000000000000000 | poolIndex: `7`<br>reward: `18252000000000000000000` |
| 8 | PEPE | 385802469135802469 | 12168000000000000000000 | poolIndex: `8`<br>reward: `12168000000000000000000` |
| 9 | USDT | 57870 | 1825200000 | poolIndex: `9`<br>reward: `1825200000` |
| 10 | SUI | 1653439153439153439 | 52128000000000000000000 | poolIndex: `10`<br>reward: `52128000000000000000000` |

**计算公式**：
```
一年期总奖励 = rewardRate * 31536000
```

## 🎯 快速修复脚本

如果你想一次性修复所有池，可以使用以下方法：

### 方法一：逐个修复（推荐）

1. 从池 0 (BTC) 开始
2. 对每个过期的池：
   - 批准代币
   - 调用 `notifyRewardAmount`
3. 验证结果

### 方法二：使用 Hardhat 脚本

创建一个脚本批量修复：

```javascript
const hre = require("hardhat");

async function fixPools() {
  const stakingAddress = "0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789";
  const staking = await hre.ethers.getContractAt(
    "NbcMultiRewardStaking",
    stakingAddress
  );

  // 各池的奖励率配置
  const pools = [
    { index: 0, rewardRate: "231481481", token: "0xb225C29Da2CaB86991b7e0651c63f0fD5C16613C" },
    { index: 1, rewardRate: "289351851", token: "0x934EbeB6D7D3821B604A5D10F80619d5bcBe49C3" },
    // ... 其他池
  ];

  for (const pool of pools) {
    const annualReward = BigInt(pool.rewardRate) * BigInt(31536000);
    
    // 1. 批准代币
    const token = await hre.ethers.getContractAt("IERC20", pool.token);
    await token.approve(stakingAddress, annualReward);
    
    // 2. 设置奖励
    await staking.notifyRewardAmount(pool.index, annualReward);
    
    console.log(`池 ${pool.index} 已修复`);
  }
}

fixPools();
```

## ✅ 验证修复结果

修复后，检查每个池的状态：

1. 在 Remix 中找到 **`getPoolInfo`** 函数
2. 输入池索引
3. 点击 **"call"** 按钮
4. 检查：
   - **periodFinish**: 应该大于当前时间戳（大约是一年后）
   - **active**: 应该是 `true`
   - **rewardRate**: 应该与之前一致

如果 `periodFinish > 当前时间` 且 `active = true`，池应该显示为 "Live"。

## ⚠️ 注意事项

1. **代币余额**：确保你的账户有足够的奖励代币用于设置奖励
2. **Gas 费**：确保账户有足够的 NBC 作为 gas 费
3. **奖励率**：如果奖励率需要调整，需要先调用 `setRewardsDuration`（只能在奖励期结束后）
4. **批量操作**：建议逐个池修复，避免一次性操作过多导致 gas 费过高

## 📚 相关文档

- [Remix 快速配置指南](./REMMIX_QUICK_GUIDE.md) - Remix 使用说明
- [激活质押池指南](./staking/ACTIVATE_POOLS.md) - 详细的激活步骤
