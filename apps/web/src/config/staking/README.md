# 单币质押配置说明

本文档说明如何配置单币质押的奖励率参数，基于 NBC = 0.11 USD 的兑换比例。

## 文件说明

- `rewardRates.ts`: 兑换比例配置和奖励率计算函数
- `poolConfig.ts`: 质押池配置（代币地址、精度、Logo 等）
- `index.ts`: 统一导出

## 兑换比例配置

基于图片中的兑换比例（NBC = 0.11 USD）：

| 代币 | 兑换比例 | 说明 |
|------|---------|------|
| BTC  | 804,545 | 1 BTC = 804,545 NBC |
| ETH  | 27,454  | 1 ETH = 27,454 NBC |
| USDT | 9.09    | 1 USDT = 9.09 NBC |
| BNB  | 7,809   | 1 BNB = 7,809 NBC |
| SOL  | 1,145   | 1 SOL = 1,145 NBC |
| DOGE | 1.21    | 1 DOGE = 1.21 NBC |
| XRP  | 17.27   | 1 XRP = 17.27 NBC |
| LTC  | 700     | 1 LTC = 700 NBC |
| ETC  | 112     | 1 ETC = 112 NBC |
| SUI  | 13.27   | 1 SUI = 13.27 NBC |

## 使用方法

### 1. 计算奖励率（用于设置合约）

假设：
- 总质押量：1,000,000 NBC
- 目标 APR：100%
- 奖励代币：BTC

```typescript
import { calculateRewardRate, CONVERSION_RATES, REWARD_TOKEN_DECIMALS } from 'config/staking'

const totalStakedNBC = BigInt('1000000000000000000000000') // 1M NBC (wei)
const targetAPR = 100 // 100%

const rewardRate = calculateRewardRate(
  targetAPR,
  totalStakedNBC,
  CONVERSION_RATES.BTC,
  REWARD_TOKEN_DECIMALS.BTC
)

console.log('每秒奖励率:', rewardRate.toString(), 'wei')
```

### 2. 根据奖励率计算 APR（用于验证）

```typescript
import { calculateAPRFromRewardRate, CONVERSION_RATES, REWARD_TOKEN_DECIMALS } from 'config/staking'

const rewardRate = BigInt('39400000') // 示例：每秒奖励率（wei）
const totalStakedNBC = BigInt('1000000000000000000000000') // 1M NBC (wei)

const apr = calculateAPRFromRewardRate(
  rewardRate,
  totalStakedNBC,
  CONVERSION_RATES.BTC,
  REWARD_TOKEN_DECIMALS.BTC
)

console.log('APR:', apr, '%')
```

### 3. 获取池配置

```typescript
import { getPoolConfigBySymbol, getPoolConfigBySousId } from 'config/staking'

// 根据代币符号获取配置
const btcConfig = getPoolConfigBySymbol('BTC')

// 根据 sousId 获取配置
const poolConfig = getPoolConfigBySousId(1)
```

## 计算公式

### 奖励率计算

```
年总奖励（NBC）= 总质押量（NBC）× APR
年总奖励（代币）= 年总奖励（NBC）÷ 兑换比例
每秒奖励（代币）= 年总奖励（代币）÷ 365 × 24 × 60 × 60
```

### APR 计算

```
年总奖励（代币）= 每秒奖励（代币）× 365 × 24 × 60 × 60
年总奖励（NBC）= 年总奖励（代币）× 兑换比例
APR = (年总奖励（NBC）÷ 总质押量（NBC)) × 100%
```

## 注意事项

1. **精度处理**：
   - NBC 精度：18 位
   - BTC 精度：8 位
   - USDT 精度：6 位
   - 其他代币精度：18 位

2. **BigInt 使用**：
   - 所有计算使用 BigInt 避免精度丢失
   - 合约中的值都是 wei 单位

3. **一年期配置**：
   - 奖励周期：365 天
   - 秒数：31,536,000 秒

4. **动态调整**：
   - 奖励率需要根据实际总质押量动态调整
   - 建议定期检查并更新奖励率

## 示例配置

查看 `rewardRates.ts` 中的 `EXAMPLE_REWARD_RATES` 获取示例配置值。

这些示例基于：
- 总质押量：1,000,000 NBC
- 目标 APR：100%

实际使用时，请根据实际质押量和目标 APR 重新计算。

