# 检查池子是否已存在 - 快速指南

## 🎯 目的

在配置池子前，先检查池子是否已经存在，避免重复创建。

## 🔍 检查方法

### 方法 1：检查 poolLength（推荐）

1. **在 Remix 中加载质押合约**
   - 地址：`0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`

2. **调用 `poolLength` 函数**
   - 这是只读函数，不需要 gas
   - 点击 "call" 按钮

3. **查看返回值**
   - 例如：返回 `11` 表示已有 11 个池（索引 0-10）
   - 如果返回 `0`，说明还没有池子

### 方法 2：检查具体池的信息（更准确）

1. **在质押合约中调用 `getPoolInfo(poolIndex)`**
   - 例如：`getPoolInfo(1)` 检查 BTC 池

2. **查看返回结果**：
   ```
   返回格式：
   0: rewardToken: 0xb225C29Da2CaB86991b7e0651c63f0fD5C16613C
   1: totalStakedAmount: 0
   2: rewardRate: 3941332303819498915
   3: periodFinish: 1763759893
   4: active: true
   ```

3. **判断**：
   - ✅ **池子已存在**：如果 `rewardToken` 不是 `0x0000...`，说明池子已存在
   - ❌ **池子不存在**：如果 `rewardToken` 是 `0x0000...`，说明池子不存在

## 📋 各池的代币地址（用于验证）

| 池索引 | 代币 | 代币地址 |
|--------|------|----------|
| 1 | BTC | `0xb225C29Da2CaB86991b7e0651c63f0fD5C16613C` |
| 2 | ETH | `0x934EbeB6D7D3821B604A5D10F80619d5bcBe49C3` |
| 3 | SOL | `0xd5eECCC885Ef850d90AE40E716c3dFCe5C3D4c81` |
| 4 | BNB | `0x9C43237490272BfdD2F1d1ca0B34f20b1A3C9f5c` |
| 5 | XRP | `0x48e1772534fabBdcaDe9ca4005E5Ee8BF4190093` |
| 6 | LTC | `0x8d22041C22d696fdfF0703852a706a40Ff65a7de` |
| 7 | DOGE | `0x8cEb9a93405CDdf3D76f72327F868Bd3E8755D89` |
| 9 | USDT | `0xfd1508502696d0E1910eD850c6236d965cc4db11` |
| 10 | SUI | `0x9011191E84Ad832100Ddc891E360f8402457F55E` |

## ✅ 操作流程

### 如果池子已存在

只需要执行 2 步：

1. **approve**（在奖励代币合约中）
   - 批准质押合约可以转走奖励代币

2. **notifyRewardAmount**（在质押合约中）
   - 设置奖励，启动奖励发放

### 如果池子不存在

需要执行 3 步：

1. **addPool**（在质押合约中）
   - 创建新池

2. **approve**（在奖励代币合约中）
   - 批准质押合约可以转走奖励代币

3. **notifyRewardAmount**（在质押合约中）
   - 设置奖励，启动奖励发放

## 🔄 批量检查脚本（Remix JavaScript）

在 Remix 的 JavaScript 环境中运行：

```javascript
// 质押合约地址
const STAKING_CONTRACT = '0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789';

// 池配置
const POOLS = [
  { index: 1, token: 'BTC', address: '0xb225C29Da2CaB86991b7e0651c63f0fD5C16613C' },
  { index: 2, token: 'ETH', address: '0x934EbeB6D7D3821B604A5D10F80619d5bcBe49C3' },
  { index: 3, token: 'SOL', address: '0xd5eECCC885Ef850d90AE40E716c3dFCe5C3D4c81' },
  { index: 4, token: 'BNB', address: '0x9C43237490272BfdD2F1d1ca0B34f20b1A3C9f5c' },
  { index: 5, token: 'XRP', address: '0x48e1772534fabBdcaDe9ca4005E5Ee8BF4190093' },
  { index: 6, token: 'LTC', address: '0x8d22041C22d696fdfF0703852a706a40Ff65a7de' },
  { index: 7, token: 'DOGE', address: '0x8cEb9a93405CDdf3D76f72327F868Bd3E8755D89' },
  { index: 9, token: 'USDT', address: '0xfd1508502696d0E1910eD850c6236d965cc4db11' },
  { index: 10, token: 'SUI', address: '0x9011191E84Ad832100Ddc891E360f8402457F55E' },
];

// 注意：这个脚本需要在 Remix 中通过合约调用实现
// 实际使用时，需要在 Remix 中逐个调用 getPoolInfo 检查

console.log('检查池子状态：');
console.log('请在 Remix 中调用质押合约的 getPoolInfo 函数检查每个池');
console.log('如果 rewardToken 地址匹配，说明池子已存在');
```

## 📝 快速检查清单

在开始配置前，对每个池执行：

- [ ] 调用 `getPoolInfo(poolIndex)` 检查池子是否存在
- [ ] 如果池子已存在，记录下当前的 `rewardRate` 和 `periodFinish`
- [ ] 如果池子不存在，准备执行 `addPool`
- [ ] 确认需要设置的参数（从脚本获取）

## ⚠️ 注意事项

1. **不要重复创建池子**：如果池子已存在，再次调用 `addPool` 会创建新池（索引会递增）
2. **检查池索引**：确保使用正确的池索引（1-10，跳过 8）
3. **验证代币地址**：确保 `getPoolInfo` 返回的代币地址与预期一致

