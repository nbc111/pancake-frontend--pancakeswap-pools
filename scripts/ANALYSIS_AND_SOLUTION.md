# 问题分析和解决方案

## 问题分析

### 当前情况
- 实际质押量: 30 NBC
- 使用预期质押量: 1000 NBC
- 目标 APR: 100%
- BTC 价格: $94,654.8
- NBC 价格: $0.06966
- 兑换比例: 1 BTC = 1,358,811.37 NBC

### 计算结果
- 年总奖励 NBC: 1000 NBC
- 年总奖励 BTC: 1000 / 1,358,811.37 = 0.00073593 BTC = 73593 wei
- rewardRate: 73593 / 31536000 = 0.00233... wei/s

### 问题
1. **精度问题**: 当 `annualRewardToken` 小于 `SECONDS_PER_YEAR` 时，除法会得到 0（BigInt 向下取整）
2. **向上取整问题**: 如果使用向上取整到 1 wei/s，会导致 APR 过高（42851.48%）
3. **合约未更新**: 交易发送了，但合约中的 `rewardRate` 仍然是 803 wei/s

## 根本原因

当质押量较小且代币价格很高时，计算出的年总奖励会非常小，导致 `rewardRate` 非常小（甚至为 0）。

## 解决方案

### 方案 1: 使用更大的预期质押量（推荐）

使用一个更合理的预期质押量，例如 10,000 NBC 或 100,000 NBC：

```bash
# 使用 10,000 NBC 作为预期质押量
node reset-reward-rate.js --pool BTC --target-apr 100 --expected-staked 10000 --execute
```

这样计算出的 `rewardRate` 会更合理：
- 年总奖励 BTC: 10000 / 1,358,811.37 = 0.0073593 BTC = 735930 wei
- rewardRate: 735930 / 31536000 = 0.0233... wei/s（向上取整为 1 wei/s，但误差更小）

### 方案 2: 使用实际质押量的合理倍数

使用实际质押量的某个倍数（例如 100 倍）：

```bash
# 使用 3000 NBC（30 * 100）作为预期质押量
node reset-reward-rate.js --pool BTC --target-apr 100 --expected-staked 3000 --execute
```

### 方案 3: 接受 rewardRate 可能为 0

如果坚持使用较小的预期质押量，可以接受 `rewardRate` 可能为 0 的事实，或者使用一个非常小的值。

### 方案 4: 检查合约的 rewardsDuration

合约可能使用了不同的 `rewardsDuration`，导致 `rewardRate` 计算不同。检查合约中的 `rewardsDuration`：

```bash
node check-staking-data.js | grep -i "duration\|period"
```

## 推荐操作

### 步骤 1: 检查合约的 rewardsDuration

```bash
cd /www/staking/scripts
node check-staking-data.js | grep -A 10 "BTC 池"
```

### 步骤 2: 使用更大的预期质押量重新执行

```bash
# 使用 10,000 NBC（推荐）
node reset-reward-rate.js --pool BTC --target-apr 100 --expected-staked 10000 --execute

# 或者使用 100,000 NBC（更保守）
node reset-reward-rate.js --pool BTC --target-apr 100 --expected-staked 100000 --execute
```

### 步骤 3: 验证结果

```bash
node check-staking-data.js | grep -A 5 "BTC 池"
```

应该看到 `rewardRate` 已经更新为合理的值。

## 关于 APR 的说明

当实际质押量（30 NBC）远小于预期质押量（1000 NBC）时：
- 如果使用预期质押量计算 `rewardRate`，实际 APR 会远高于目标 APR
- 这是正常的，因为奖励是基于预期质押量计算的
- 当实际质押量增加时，APR 会自动降低

## 长期解决方案

考虑修改 `dynamic-reward-adjuster.js` 脚本，使其：
1. 使用实际质押量（而不是固定值）来计算 `rewardRate`
2. 或者使用实际质押量的某个倍数（例如 10 倍）作为预期质押量
3. 定期更新，确保 APR 保持在合理范围内
