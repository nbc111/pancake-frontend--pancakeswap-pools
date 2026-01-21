# 为什么 rewardsDuration 是 56 年？

## 问题分析

### 当前状态
- `rewardsDuration`: 1768496779 秒 = 56.08 年
- `periodFinish`: 1800033164 (2027-01-15T17:12:44.000Z)
- 前端显示: "Ends in 363 days"

### 根本原因

**`rewardsDuration` 被错误地设置为一个时间戳值，而不是持续时间！**

- `1768496779` 作为时间戳 = `2026-01-15T17:06:19.000Z`
- 这个时间戳被错误地用作 `rewardsDuration`（持续时间）
- 导致合约认为奖励周期是 56 年，而不是 1 年

### 证据

1. **时间戳分析**:
   - `1768496779` 秒作为时间戳 = 2026-01-15
   - `periodFinish` = 2027-01-15
   - 两者相差正好 1 年（31536385 秒 ≈ 31536000 秒）

2. **关系分析**:
   - `periodFinish - rewardsDuration = 31536385 秒 ≈ 1 年`
   - 这说明 `periodFinish` 可能是通过 `lastUpdateTime + rewardsDuration` 计算的
   - 如果 `rewardsDuration` 是时间戳，而 `lastUpdateTime` 也是时间戳，就会导致这个问题

### 可能的原因

1. **初始化错误**: 在合约初始化时，错误地将时间戳传入 `setRewardsDuration`
2. **脚本错误**: 某个脚本错误地将时间戳用作 `rewardsDuration`
3. **手动设置错误**: 手动调用 `setRewardsDuration` 时使用了错误的值

## 解决方案

### 方案 1: 等待 periodFinish 到期后修复（推荐）

由于 `periodFinish` 还有 363 天到期，需要等待到期后才能修改 `rewardsDuration`。

**步骤**:

1. **等待 periodFinish 到期**（363 天后，即 2027-01-15）

2. **修复 rewardsDuration**:
   ```bash
   cd /www/staking/scripts
   node fix-rewards-duration.js --pool BTC --execute
   ```

3. **重新设置 rewardRate**:
   ```bash
   node reset-reward-rate.js --pool BTC --target-apr 100 --expected-staked 10000 --execute
   ```

### 方案 2: 创建定时任务（自动化）

创建一个定时任务，在 `periodFinish` 到期后自动修复：

```bash
# 在服务器上创建定时任务
# 使用 cron 或 PM2 在 2027-01-15 执行修复脚本
```

### 方案 3: 临时解决方案（不推荐）

如果不想等待，可以使用非常大的预期质押量，使计算出的 rewardRate 至少为 1 wei/s：

```bash
# 需要发送约 17.68 BTC 的总奖励
node reset-reward-rate.js --pool BTC --target-apr 100 --expected-staked 429000 --execute
```

但这需要非常大的资金，不推荐。

## 预防措施

1. **代码审查**: 确保所有设置 `rewardsDuration` 的代码都使用正确的值（31536000 秒）
2. **输入验证**: 在设置 `rewardsDuration` 时，验证值是否在合理范围内（例如，1 天到 10 年）
3. **测试**: 在测试环境中验证所有设置操作

## 当前影响

由于 `rewardsDuration` 是 56 年：
- 要得到合理的 `rewardRate`，需要发送非常大的总奖励
- 基于正常质押量（10,000 NBC）计算出的 `rewardRate` 会非常小（< 1 wei/s）
- BigInt 除法向下取整会导致 `rewardRate` 为 0
- 前端显示的 APR 会异常高（因为实际质押量很小）

## 建议

**强烈建议等待 `periodFinish` 到期后修复 `rewardsDuration`**，这是最安全和最经济的解决方案。

在此期间，可以：
- 保持当前状态
- 或者使用方案 3（如果资金充足）
