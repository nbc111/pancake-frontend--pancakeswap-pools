# 在 Remix 中实现质押兑换比例配置

## 📊 兑换比例表（基于 NBC = 0.11 USD）

根据你提供的兑换比例表，以下是各主流币与 NBC 的兑换比例：

| 币种 | 单价 (USD) | 需要 NBC (≈) | 兑换比例 | 代币精度 |
|------|-----------|-------------|---------|---------|
| BTC  | 88,500    | 804,545     | 1 BTC = 804,545 NBC | 8 |
| ETH  | 3,020     | 27,454      | 1 ETH = 27,454 NBC | 18 |
| USDT | 1         | 9.09        | 1 USDT = 9.09 NBC | 6 |
| BNB  | 859       | 7,809       | 1 BNB = 7,809 NBC | 18 |
| SOL  | 126       | 1,145       | 1 SOL = 1,145 NBC | 18 |
| DOGE | 0.133     | 1.21        | 1 DOGE = 1.21 NBC | 18 |
| XRP  | 1.90      | 17.27       | 1 XRP = 17.27 NBC | 18 |
| LTC  | 77        | 700         | 1 LTC = 700 NBC | 18 |
| ETC  | 12.3      | 112         | 1 ETC = 112 NBC | 18 |
| SUI  | 1.46      | 13.27       | 1 SUI = 13.27 NBC | 18 |

## 🎯 实现目标

在 Remix 中配置质押池，实现：
1. **质押时间**：一年期（31,536,000 秒）
2. **兑换比例**：按照上表中的比例
3. **奖励率**：根据目标 APR 和总质押量计算

## 📐 计算公式

### 1. 计算每秒奖励率（rewardRate）

**公式**：
```
rewardRate = (总质押量 × APR × 10^rewardDecimals × 10^18) / (兑换比例 × 10^18 × 31536000)
```

**简化公式**（当 APR = 100% 时）：
```
rewardRate = (总质押量 × 10^rewardDecimals) / (兑换比例 × 31536000)
```

### 2. 计算一年期总奖励（用于 notifyRewardAmount）

**公式**：
```
一年期总奖励 = rewardRate × 31536000
```

## 🔧 在 Remix 中的实现步骤

### 第一步：准备参数

假设：
- **总质押量**：1,000,000 NBC = `1000000000000000000000000` (wei, 18位精度)
- **目标 APR**：100%
- **质押时间**：一年 = `31536000` 秒

### 第二步：计算各池的 rewardRate

#### 方法一：使用 JavaScript 计算（推荐）

在 Remix 的 JavaScript 环境中，可以使用以下代码计算：

```javascript
// 配置参数
const totalStakedNBC = BigInt('1000000000000000000000000'); // 1M NBC (wei)
const apr = 100; // 100%
const secondsPerYear = 31536000;

// 兑换比例配置
const conversionRates = {
  BTC: 804545,
  ETH: 27454,
  USDT: 9.09,
  BNB: 7809,
  SOL: 1145,
  DOGE: 1.21,
  XRP: 17.27,
  LTC: 700,
  ETC: 112,
  SUI: 13.27
};

// 代币精度配置
const tokenDecimals = {
  BTC: 8,
  ETH: 18,
  USDT: 6,
  BNB: 18,
  SOL: 18,
  DOGE: 18,
  XRP: 18,
  LTC: 18,
  ETC: 18,
  SUI: 18
};

// 计算 rewardRate 的函数
function calculateRewardRate(tokenSymbol) {
  const conversionRate = conversionRates[tokenSymbol];
  const rewardDecimals = tokenDecimals[tokenSymbol];
  
  // APR 转换为小数
  const aprDecimal = apr / 100;
  
  // 年总奖励（NBC，wei 单位）
  const annualRewardNBCWei = BigInt(Math.floor(Number(totalStakedNBC) * aprDecimal));
  
  // 转换为奖励代币数量
  const conversionRateScaled = BigInt(Math.floor(conversionRate * 1e18));
  const rewardTokenMultiplier = BigInt(10 ** rewardDecimals);
  const nbcDecimals = BigInt(10 ** 18);
  
  // 年总奖励代币（wei 单位）
  const annualRewardToken = (annualRewardNBCWei * rewardTokenMultiplier * nbcDecimals) / conversionRateScaled;
  
  // 每秒奖励率
  const rewardRate = annualRewardToken / BigInt(secondsPerYear);
  
  return rewardRate;
}

// 计算各池的 rewardRate
console.log('BTC rewardRate:', calculateRewardRate('BTC').toString());
console.log('ETH rewardRate:', calculateRewardRate('ETH').toString());
console.log('USDT rewardRate:', calculateRewardRate('USDT').toString());
// ... 其他代币
```

#### 方法二：手动计算（示例：BTC 池）

假设总质押量 = 1,000,000 NBC，APR = 100%：

1. **年总奖励（NBC）** = 1,000,000 NBC
2. **转换为 BTC** = 1,000,000 / 804,545 = 1.243 BTC
3. **转换为 wei** = 1.243 × 10^8 = 124,300,000 (BTC 精度为 8)
4. **每秒奖励率** = 124,300,000 / 31,536,000 = 3.94 (约等于 4 wei/秒)

**注意**：实际计算需要考虑精度，建议使用 JavaScript 计算。

### 第三步：在 Remix 中添加池

#### 3.1 获取质押合约地址

假设质押合约地址：`0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`

#### 3.2 添加池（以 BTC 为例）

1. 在 Remix 中，找到质押合约（地址：`0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`）
2. 找到 **`addPool`** 函数
3. 填写参数：
   - **rewardToken**: `0x5EaA2c6ae3bFf47D2188B64F743Ec777733a80ac` (BTC 代币地址)
   - **rewardRate**: 计算出的 rewardRate（例如：`39400000` wei/秒）
   - **rewardsDuration**: `31536000` (一年期秒数)
4. 点击 **"transact"** 并确认交易

#### 3.3 代币地址列表

根据 `poolConfig.ts`，各代币地址：

| 代币 | 地址 | 池索引 (sousId) |
|------|------|----------------|
| BTC  | `0x5EaA2c6ae3bFf47D2188B64F743Ec777733a80ac` | 1 |
| ETH  | `0x934EbeB6D7D3821B604A5D10F80619d5bcBe49C3` | 2 |
| SOL  | `0xd5eECCC885Ef850d90AE40E716c3dFCe5C3D4c81` | 3 |
| BNB  | `0x9C43237490272BfdD2F1d1ca0B34f20b1A3C9f5c` | 4 |
| XRP  | `0x48e1772534fabBdcaDe9ca4005E5Ee8BF4190093` | 5 |
| LTC  | `0x8d22041C22d696fdfF0703852a706a40Ff65a7de` | 6 |
| DOGE | `0x8cEb9a93405CDdf3D76f72327F868Bd3E8755D89` | 7 |
| PEPE | `0xd365877026A43107Efd9825bc3ABFe1d7A450F82` | 8 |
| USDT | `0xfd1508502696d0E1910eD850c6236d965cc4db11` | 9 |
| SUI  | `0x9011191E84Ad832100Ddc891E360f8402457F55E` | 10 |

### 第四步：设置奖励（notifyRewardAmount）

添加池后，需要设置奖励才能开始发放：

1. **批准代币给质押合约**：
   - 在代币合约中调用 `approve`
   - **spender**: `0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`
   - **amount**: 一年期总奖励（见下方计算）

2. **调用 notifyRewardAmount**：
   - 在质押合约中调用 `notifyRewardAmount`
   - **poolIndex**: 池索引（0-10）
   - **reward**: 一年期总奖励 = `rewardRate × 31536000`

## 📋 完整配置示例（基于 1M NBC 质押，100% APR）

### BTC 池配置

```javascript
// 计算参数
const totalStakedNBC = BigInt('1000000000000000000000000'); // 1M NBC
const apr = 100; // 100%
const conversionRate = 804545; // 1 BTC = 804,545 NBC
const rewardDecimals = 8; // BTC 精度

// 计算 rewardRate
const aprDecimal = apr / 100;
const annualRewardNBCWei = BigInt(Math.floor(Number(totalStakedNBC) * aprDecimal));
const conversionRateScaled = BigInt(Math.floor(conversionRate * 1e18));
const rewardTokenMultiplier = BigInt(10 ** rewardDecimals);
const nbcDecimals = BigInt(10 ** 18);
const annualRewardToken = (annualRewardNBCWei * rewardTokenMultiplier * nbcDecimals) / conversionRateScaled;
const rewardRate = annualRewardToken / BigInt(31536000);

console.log('BTC rewardRate:', rewardRate.toString()); // 每秒奖励率（wei）
console.log('BTC annualReward:', (rewardRate * BigInt(31536000)).toString()); // 一年期总奖励（wei）
```

**Remix 操作**：
1. `addPool`:
   - rewardToken: `0x5EaA2c6ae3bFf47D2188B64F743Ec777733a80ac`
   - rewardRate: `39400000` (示例值，需根据实际计算)
   - rewardsDuration: `31536000`

2. `approve` (在 BTC 代币合约中):
   - spender: `0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`
   - amount: `1243000000` (示例值，需根据实际计算)

3. `notifyRewardAmount` (在质押合约中):
   - poolIndex: `1` (假设 BTC 是第 1 个池)
   - reward: `1243000000` (一年期总奖励)

## ⚠️ 重要注意事项

1. **精度问题**：
   - 所有计算都需要考虑代币精度
   - NBC 使用 18 位精度
   - BTC 使用 8 位精度，USDT 使用 6 位精度，其他大部分使用 18 位精度

2. **实际质押量**：
   - 上述示例基于 1M NBC 的假设质押量
   - 实际使用时，需要根据**实际总质押量**重新计算 rewardRate

3. **APR 调整**：
   - 如果目标 APR 不是 100%，需要调整计算公式
   - 公式：`年总奖励 = 总质押量 × (APR / 100)`

4. **奖励期管理**：
   - 一年期结束后，需要重新调用 `notifyRewardAmount` 续期
   - 或者可以提前续期（合约会自动处理剩余奖励）

5. **代币余额**：
   - 确保账户有足够的奖励代币用于设置奖励
   - 建议预留一些额外的代币作为缓冲

## 🔍 验证配置

配置完成后，可以通过以下方式验证：

1. **调用 `getPoolInfo`**：
   - 检查 `rewardRate` 是否正确
   - 检查 `periodFinish` 是否是一年后

2. **计算 APR**：
   - 使用公式：`APR = (rewardRate × 31536000 × 兑换比例 × 10^18) / (总质押量 × 10^rewardDecimals) × 100`
   - 验证是否等于目标 APR

## 📚 相关文档

- [Remix 快速配置指南](./REMMIX_QUICK_GUIDE.md) - Remix 使用说明
- [修复池状态指南](./REMMIX_FIX_POOLS.md) - 如何修复过期池
- [奖励率计算代码](../apps/web/src/config/staking/rewardRates.ts) - 前端计算逻辑参考

