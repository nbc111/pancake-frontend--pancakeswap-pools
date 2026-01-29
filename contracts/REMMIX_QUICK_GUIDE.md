# Remix 快速配置指南 ⚡

使用 Remix 在浏览器中直接配置质押池，无需安装任何工具！

## 🚀 第一步：打开 Remix

1. 访问：https://remix.ethereum.org/
2. 等待页面加载完成

## 🔗 第二步：连接钱包

1. 点击左侧的 **"Deploy & Run Transactions"** 标签
2. 在 **"Environment"** 下拉菜单中选择 **"Injected Provider - MetaMask"**
3. 连接你的钱包（确保连接到 **NBC Chain，Chain ID: 1281**）
4. 确保账户有足够的 NBC 作为 gas 费

## 📋 第三步：加载质押合约

1. 在 **"At Address"** 输入框中输入：
   ```
   0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789
   ```
2. 点击 **"At Address"** 按钮
3. 在下方会显示合约的所有函数

## ✅ 第四步：检查当前状态

先检查池是否已添加：

1. 找到 **`poolLength`** 函数（view 函数，不需要 gas）
2. 点击 **"poolLength"** 按钮
3. 查看返回的池数量

如果返回 `0`，说明还没有添加任何池。

**如果返回非 0**（例如 11），说明池已添加，需要检查每个池的状态。

**检查单个池状态：**
1. 找到 **`getPoolInfo`** 函数（view 函数）
2. 输入池索引（例如 `0`）
3. 点击 **"call"** 按钮
4. 查看返回结果，特别关注：
   - **active**: 是否为 `true`
   - **periodFinish**: 是否大于当前时间戳

如果 `active = false` 或 `periodFinish = 0` 或已过期，池会显示为 "Old"。

**如果池显示为 "Old"**，请查看：[在 Remix 中修复池状态](./REMMIX_FIX_POOLS.md)

## 🎯 第五步：添加池（addPool）

为每个奖励代币添加池。以 **BTC 池**为例：

### 5.1 找到 `addPool` 函数

在合约函数列表中找到 **`addPool`** 函数。

### 5.2 填写参数

**参数说明：**
- **rewardToken**: 奖励代币地址
- **rewardRate**: 每秒奖励率（wei 单位）
- **rewardsDuration**: 奖励周期（秒）

**BTC 池示例：**
```
rewardToken: 0xb225C29Da2CaB86991b7e0651c63f0fD5C16613C
rewardRate: 39400000 (需要根据实际计算，见下方)
rewardsDuration: 31536000 (365 * 24 * 60 * 60，一年)
```

⚠️ **重要**：`rewardRate` 需要根据实际总质押量和目标 APR 计算。

### 5.3 计算奖励率

**方法一：使用前端配置函数**

在前端项目中运行：
```typescript
import { calculateRewardRate, CONVERSION_RATES, REWARD_TOKEN_DECIMALS } from 'config/staking'

// 假设总质押量 1,000,000 NBC，目标 APR 100%
const totalStakedNBC = BigInt('1000000000000000000000000') // 1M NBC
const targetAPR = 100 // 100%

const rewardRate = calculateRewardRate(
  targetAPR,
  totalStakedNBC,
  CONVERSION_RATES.BTC,
  REWARD_TOKEN_DECIMALS.BTC
)

console.log('每秒奖励率:', rewardRate.toString(), 'wei')
```

**方法二：使用示例值**

如果总质押量是 1,000,000 NBC，目标 APR 100%，可以使用以下示例值：

| 代币 | 每秒奖励率 (wei) | 说明 |
|------|----------------|------|
| BTC | 39400000 | 精度 8 |
| ETH | 8700000000000000 | 精度 18 |
| USDT | 2880000000 | 精度 6 |
| BNB | 2470000000000000 | 精度 18 |
| SOL | 363000000000000 | 精度 18 |
| DOGE | 384000000000000 | 精度 18 |
| XRP | 548000000000000 | 精度 18 |
| LTC | 222000000000000 | 精度 18 |
| SUI | 421000000000000 | 精度 18 |

### 5.4 执行 addPool

1. 填写好参数后，点击 **"transact"** 按钮
2. 在 MetaMask 中确认交易
3. 等待交易确认

## 🔄 第六步：激活池（setPoolActive）

添加池后，需要激活它：

1. 找到 **`setPoolActive`** 函数
2. 填写参数：
   - **poolIndex**: `0` (第一个池，根据实际索引调整)
   - **active**: `true`
3. 点击 **"transact"** 并确认交易

## 💰 第七步：设置奖励（notifyRewardAmount）

在设置奖励之前，需要先批准代币给质押合约。

### 7.1 批准代币

1. 在 Remix 中，点击 **"At Address"** 输入框
2. 输入奖励代币地址（例如 BTC: `0xb225C29Da2CaB86991b7e0651c63f0fD5C16613C`）
3. 点击 **"At Address"** 按钮
4. 找到 **`approve`** 函数
5. 填写参数：
   - **spender**: `0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789` (质押合约地址)
   - **amount**: 一年期总奖励（`rewardRate * 31536000`，单位：wei）
6. 点击 **"transact"** 并确认交易

### 7.2 设置奖励

1. 回到质押合约（重新加载地址 `0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`）
2. 找到 **`notifyRewardAmount`** 函数
3. 填写参数：
   - **poolIndex**: `0` (根据实际索引)
   - **reward**: 一年期总奖励（`rewardRate * 31536000`，单位：wei）
4. 点击 **"transact"** 并确认交易

## ⏰ 第八步：设置奖励周期（可选）

如果需要确保奖励周期为一年：

1. 找到 **`setRewardsDuration`** 函数
2. 填写参数：
   - **poolIndex**: `0`
   - **rewardsDuration**: `31536000` (365 * 24 * 60 * 60)
3. 点击 **"transact"** 并确认交易

⚠️ **注意**：只有在当前奖励期结束后才能修改奖励周期。

## 📊 所有代币配置表

| 代币 | 代币地址 | 精度 | 每秒奖励率示例 (wei) |
|------|---------|------|---------------------|
| BTC | `0xb225C29Da2CaB86991b7e0651c63f0fD5C16613C` | 8 | 39400000 |
| ETH | `0x1Feba2E24a6b7F1D07F55Aa7ba59a4a4bAF9f908` | 18 | 8700000000000000 |
| SOL | `0xd5eECCC885Ef850d90AE40E716c3dFCe5C3D4c81` | 18 | 363000000000000 |
| BNB | `0x9C43237490272BfdD2F1d1ca0B34f20b1A3C9f5c` | 18 | 2470000000000000 |
| XRP | `0x48e1772534fabBdcaDe9ca4005E5Ee8BF4190093` | 18 | 548000000000000 |
| LTC | `0x8d22041C22d696fdfF0703852a706a40Ff65a7de` | 18 | 222000000000000 |
| DOGE | `0x8cEb9a93405CDdf3D76f72327F868Bd3E8755D89` | 18 | 384000000000000 |
| PEPE | `0xd365877026A43107Efd9825bc3ABFe1d7A450F82` | 18 | - |
| USDT | `0x4E4D07268eFFB4d3507a69F64b5780Eb16551f85` | 6 | 2880000000 |
| SUI | `0x9011191E84Ad832100Ddc891E360f8402457F55E` | 18 | 421000000000000 |

**奖励周期**: `31536000` (一年，365 * 24 * 60 * 60 秒)

## ✅ 验证配置

配置完成后，检查池状态：

1. 找到 **`getPoolInfo`** 函数（view 函数）
2. 输入池索引（例如 `0`）
3. 点击 **"call"** 按钮
4. 查看返回结果：
   - **rewardToken**: 应该是对应的代币地址
   - **totalStakedAmount**: 总质押量
   - **rewardRate**: 奖励率
   - **periodFinish**: 奖励期结束时间（应该大于当前时间）
   - **active**: 应该是 `true`

## 🎯 推荐流程

1. **先检查状态** - 使用 `poolLength` 和 `getPoolInfo` 查看当前状态
2. **逐个配置** - 从 BTC 开始，逐个添加和配置池
3. **验证结果** - 每个池配置后，使用 `getPoolInfo` 验证

## ⚠️ 注意事项

1. **权限**：只有合约所有者可以执行这些操作
2. **代币余额**：确保你的账户有足够的奖励代币用于设置奖励
3. **Gas 费**：确保账户有足够的 NBC 作为 gas 费
4. **奖励率计算**：奖励率需要根据实际总质押量动态计算，示例值仅供参考

## 📚 相关文档

- [完整配置指南](./SETUP_GUIDE.md) - 详细的配置说明
- [激活质押池指南](./staking/ACTIVATE_POOLS.md) - 激活步骤
- [奖励率配置](../apps/web/src/config/staking/README.md) - 奖励率计算说明

