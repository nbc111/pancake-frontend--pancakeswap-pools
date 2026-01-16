# 修复 rewardsDuration 脚本说明

## 问题描述

某些质押池的 `rewardsDuration` 被错误设置为很大的值（如 56 年），导致 `rewardRate` 计算错误。

合约的 `notifyRewardAmount` 函数使用以下公式计算 `rewardRate`：
```solidity
rewardRate = (reward + leftover) / rewardsDuration
```

如果 `rewardsDuration` 不正确，即使传递正确的 `annualReward`，计算出的 `rewardRate` 也会错误。

## 解决方案

将所有池的 `rewardsDuration` 设置为正确的值：**31536000 秒 = 1 年**

## 脚本说明

### 1. fix-rewards-duration.js

修复单个或所有池的 `rewardsDuration`。

**使用方法：**

```bash
# 检查所有池的 rewardsDuration（不执行修复）
node fix-rewards-duration.js

# 预览修复 BTC 池（不实际执行）
node fix-rewards-duration.js --pool BTC

# 实际修复 BTC 池
node fix-rewards-duration.js --pool BTC --execute

# 修复所有池
node fix-rewards-duration.js --pool all --execute
```

**参数说明：**
- `--pool <SYMBOL|all>`: 要修复的池（BTC, ETH, SOL, BNB, XRP, LTC, DOGE, USDT, SUI 或 all）
- `--execute`: 实际执行修复（不加此参数则为预览模式）

### 2. fix-all-reward-issues.js

综合修复脚本，会依次执行：
1. 检查所有池的 `rewardsDuration`
2. 修复错误的 `rewardsDuration`
3. 重新设置正确的奖励率

**使用方法：**

```bash
# 预览模式（检查所有步骤，不实际执行）
node fix-all-reward-issues.js --target-apr 100 --expected-staked 1000000 --dry-run

# 修复单个池（BTC）
node fix-all-reward-issues.js --target-apr 100 --expected-staked 1000000 --pool BTC --execute

# 修复所有池
node fix-all-reward-issues.js --target-apr 100 --expected-staked 1000000 --pool all --execute
```

**参数说明：**
- `--target-apr <NUMBER>`: 目标 APR（例如：100 表示 100%）
- `--expected-staked <NUMBER>`: 预期质押量（NBC 数量，例如：1000000）
- `--pool <SYMBOL|all>`: 要修复的池
- `--execute`: 实际执行修复
- `--dry-run`: 预览模式（不实际执行）

## 执行步骤

### 步骤 1: 检查当前状态

```bash
cd /www/staking/scripts
node fix-rewards-duration.js
```

这会显示所有池的 `rewardsDuration` 状态，标记哪些是正确的（✅），哪些是错误的（❌）。

### 步骤 2: 修复 rewardsDuration

```bash
# 修复所有池
node fix-rewards-duration.js --pool all --execute
```

### 步骤 3: 重新设置奖励率

修复 `rewardsDuration` 后，需要重新设置正确的奖励率：

```bash
node reset-reward-rate.js --pool all --target-apr 100 --expected-staked 1000000 --execute
```

### 步骤 4: 验证

```bash
# 检查所有池的状态
node check-staking-data.js

# 或者使用综合脚本验证
node fix-all-reward-issues.js --target-apr 100 --expected-staked 1000000
```

## 注意事项

1. **执行前备份**: 在执行修复前，建议先检查当前状态并记录
2. **Gas 费用**: 每个池的修复需要消耗 Gas 费用
3. **合约所有者**: 只有合约所有者可以执行修复
4. **环境变量**: 确保 `.env` 文件中设置了正确的 `PRIVATE_KEY` 和 `RPC_URL`

## 常见问题

### Q1: 为什么 rewardsDuration 会被错误设置？

可能的原因：
- 部署时使用了错误的参数
- 之前手动调用 `setRewardsDuration` 时使用了错误的值

### Q2: 修复后需要重新设置奖励率吗？

是的。因为 `rewardRate` 的计算依赖于 `rewardsDuration`，修复 `rewardsDuration` 后，需要重新调用 `notifyRewardAmount` 来设置正确的 `rewardRate`。

### Q3: 如何验证修复是否成功？

```bash
# 检查 rewardsDuration
node fix-rewards-duration.js

# 检查 rewardRate 和 APR
node check-staking-data.js
```

### Q4: 修复会影响正在进行的奖励周期吗？

不会。`setRewardsDuration` 只修改 `rewardsDuration` 的值，不会影响当前正在进行的奖励周期。但建议在修复后立即重新设置奖励率。

## 相关脚本

- `reset-reward-rate.js`: 重新设置奖励率
- `check-staking-data.js`: 检查质押池状态
- `dynamic-reward-adjuster.js`: 动态调整奖励率（定时任务）
