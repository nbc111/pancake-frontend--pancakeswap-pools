# 修复说明

## 修复的问题

1. **精度丢失问题**: 修复了 `calculateRewardRate` 函数中将 BigInt 转换为 Number 导致的精度丢失
2. **rewardRate 为 0 的问题**: 当质押量很小时，计算出的 rewardRate 可能为 0，现在会设置为最小 1 wei/s，并显示警告

## 重要提示

当实际质押量很小（例如 30 NBC）时：
- 计算出的 `rewardRate` 会非常小
- 如果 `annualRewardToken` 小于 `SECONDS_PER_YEAR`，`rewardRate` 会被设置为 1 wei/s（最小值）
- 这会导致实际 APR **高于**目标 APR（因为使用了最小 rewardRate）

## 建议

### 选项 1: 使用更大的预期质押量（推荐）

如果实际质押量很小，建议使用一个更合理的预期质押量：

```bash
# 使用 1000 NBC 作为预期质押量（即使实际只有 30 NBC）
node reset-reward-rate.js --pool BTC --target-apr 100 --expected-staked 1000 --execute
```

这样计算出的 rewardRate 会更合理，实际 APR 会更接近目标 APR。

### 选项 2: 接受实际 APR 高于目标 APR

如果坚持使用实际质押量（30 NBC），可以接受实际 APR 会高于目标 APR 的事实。

### 选项 3: 使用实际质押量的倍数

使用实际质押量的某个倍数（例如 10 倍）：

```bash
# 使用 300 NBC（30 * 10）作为预期质押量
node reset-reward-rate.js --pool BTC --target-apr 100 --expected-staked 300 --execute
```

## 重新执行

修复后的脚本已经提交到 Git，请在服务器上执行：

```bash
# 1. 拉取最新代码
cd /www/staking
git pull origin main

# 2. 重新执行（使用更大的预期质押量，推荐）
cd scripts
node reset-reward-rate.js --pool BTC --target-apr 100 --expected-staked 1000 --execute

# 或者使用实际质押量的倍数
node reset-reward-rate.js --pool BTC --target-apr 100 --expected-staked 300 --execute
```

## 验证

执行后，检查结果：

```bash
# 检查合约中的 rewardRate
node check-staking-data.js | grep -A 5 "BTC 池"
```

应该看到 `rewardRate` 已经更新为合理的值（不再是 805 wei/s）。
