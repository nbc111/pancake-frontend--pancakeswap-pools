# 重新设置 rewardRate 使用指南

## 概述

`reset-reward-rate.js` 脚本用于重新设置质押池的 rewardRate，使其符合目标 APR。

## 币圈正常做法

1. **基于目标 APR 和预期质押量计算** - 根据目标 APR（如 100%）和预期质押量（如 1,000,000 NBC）计算正确的 rewardRate
2. **使用实时价格** - 自动获取实时价格计算兑换比例
3. **预览模式** - 默认预览模式，先查看计算结果，确认无误后再执行
4. **安全检查** - 检查合约所有者、代币余额等
5. **支持单个或所有池** - 可以更新单个池或所有池

## 前置要求

1. 安装依赖：
   ```bash
   cd scripts
   npm install
   ```

2. 配置环境变量（创建 `.env` 文件）：
   ```bash
   # 区块链配置
   RPC_URL=https://rpc.nbcex.com
   PRIVATE_KEY=0x你的私钥（合约owner的私钥）
   
   # 合约地址
   STAKING_CONTRACT_ADDRESS=0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789
   
   # 质押配置（可选，可通过命令行参数覆盖）
   TARGET_APR=100
   EXPECTED_STAKED_NBC=1000000000000000000000000  # 1,000,000 NBC (wei)
   ```

## 使用方法

### 1. 预览模式（推荐先执行）

查看计算结果，不实际执行交易：

```bash
# 预览单个池（BTC）
node reset-reward-rate.js --pool BTC --target-apr 100 --expected-staked 1000000

# 预览所有池
node reset-reward-rate.js --pool all --target-apr 100 --expected-staked 1000000

# 明确指定预览模式
node reset-reward-rate.js --pool BTC --target-apr 100 --expected-staked 1000000 --dry-run
```

### 2. 执行模式

实际执行交易，更新合约：

```bash
# 更新单个池（BTC）
node reset-reward-rate.js --pool BTC --target-apr 100 --expected-staked 1000000 --execute

# 更新所有池
node reset-reward-rate.js --pool all --target-apr 100 --expected-staked 1000000 --execute
```

## 参数说明

- `--pool <POOL>`: 要更新的池（BTC, ETH, SOL, BNB, XRP, LTC, DOGE, USDT, SUI, 或 all）
- `--target-apr <APR>`: 目标 APR（百分比，如 100 表示 100%）
- `--expected-staked <AMOUNT>`: 预期质押量（NBC 数量，如 1000000 表示 1,000,000 NBC）
- `--dry-run`: 预览模式，不实际执行交易（默认模式）
- `--execute`: 执行模式，实际执行交易

## 计算逻辑

1. **获取实时价格**
   - NBC 价格（从 NBCEX API）
   - 奖励代币价格（从多个 API：NBCEX, Gate.io, Binance, CoinGecko）

2. **计算兑换比例**
   ```
   conversionRate = tokenPrice / nbcPrice
   ```

3. **计算 rewardRate**
   ```
   annualRewardNBC = expectedStakedNBC × targetAPR / 100
   annualRewardToken = (annualRewardNBC × 10^tokenDecimals) / (conversionRate × 10^18)
   rewardRate = annualRewardToken / SECONDS_PER_YEAR
   ```

4. **验证计算**
   - 使用预期质押量验证 APR 是否等于目标 APR
   - 使用当前质押量显示实际 APR

## 示例

### 示例 1: 预览 BTC 池（目标 APR 100%，预期质押量 1,000,000 NBC）

```bash
node reset-reward-rate.js --pool BTC --target-apr 100 --expected-staked 1000000
```

输出示例：
```
================================================================================
   重置 BTC 池的 rewardRate
================================================================================

📊 获取价格数据...
   ✅ NBC 价格: $0.070000 USDT
   ✅ BTC 价格: $93,464 USDT
   ✅ 兑换比例: 1 BTC = 1,335,200 NBC

📋 查询当前合约状态...
   ✅ 池状态: 激活
   ✅ 当前质押量: 30.0 NBC
   ✅ 当前 rewardRate: 0.00000798 BTC/s

🔢 计算新的 rewardRate...
   ✅ 目标 APR: 100%
   ✅ 预期质押量: 1000000.0 NBC
   ✅ 新 rewardRate: 0.00000002 BTC/s
   ✅ 年总奖励: 0.74895146 BTC

✅ 验证计算:
   - 使用预期质押量 (1000000.0 NBC): APR = 100.00%
   - 使用当前质押量 (30.0 NBC): APR = 3333333.33%

📊 对比分析:
   - 当前 rewardRate: 0.00000798 BTC/s
   - 新 rewardRate: 0.00000002 BTC/s
   - 变化: -99.75%

🔍 预览模式：不会实际执行交易
   要实际执行，请使用 --execute 参数
```

### 示例 2: 实际执行更新

```bash
node reset-reward-rate.js --pool BTC --target-apr 100 --expected-staked 1000000 --execute
```

## 注意事项

1. **私钥安全**
   - 私钥是合约所有者的私钥，请妥善保管
   - 不要将私钥提交到代码仓库

2. **预期质押量**
   - 预期质押量应该基于实际预期，而不是当前质押量
   - 如果实际质押量远小于预期，APR 会很高（这是正常的）

3. **价格波动**
   - 脚本使用实时价格，价格波动会影响兑换比例
   - 建议在价格相对稳定时执行

4. **Gas 费用**
   - 执行交易需要支付 Gas 费用（NBC）
   - 确保钱包有足够的 NBC 支付 Gas

5. **代币余额**
   - 合约所有者需要有足够的奖励代币余额
   - 脚本会检查余额，不足时会报错

## 常见问题

### Q: 为什么 APR 还是很高？

A: APR 是基于实际质押量计算的。如果实际质押量远小于预期质押量，APR 会很高。这是正常的数学结果。随着质押量增加，APR 会下降。

### Q: 可以基于当前质押量设置 rewardRate 吗？

A: 可以，但这样会导致质押量增加时 APR 下降。币圈正常做法是基于预期质押量设置，这样 APR 更稳定。

### Q: 如何调整目标 APR？

A: 使用 `--target-apr` 参数，例如 `--target-apr 50` 表示 50% APR。

### Q: 更新后多久生效？

A: 交易确认后立即生效。

## 相关脚本

- `check-staking-data.js` - 查询当前质押池数据
- `diagnose-reward-rate-issue.js` - 诊断 rewardRate 问题
- `dynamic-reward-adjuster.js` - 动态调整 rewardRate（基于价格变化）
