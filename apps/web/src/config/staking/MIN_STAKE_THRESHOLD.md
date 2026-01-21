# 最小质押量门槛功能

## 概述

为了控制质押池的 APR 保持在合理范围内（≤ 30%），我们实现了最小质押量门槛功能。当用户尝试质押时，系统会检查质押后的总质押量是否达到最小门槛，如果未达到，将阻止质押并显示提示信息。

## 工作原理

### 计算公式

1. **年总奖励 NBC** = `(rewardRate × SECONDS_PER_YEAR × conversionRate) / rewardTokenDecimals`
2. **最小质押量** = `年总奖励 NBC / (目标 APR / 100)`
3. **检查条件**：`总质押量 >= 最小质押量` 且 `质押后 APR <= 目标 APR`

### 示例

假设：
- `rewardRate` = 805 wei/s (BTC 池)
- `conversionRate` = 1356882.302650 (1 BTC = 1356882.302650 NBC)
- `rewardTokenDecimals` = 8
- `目标 APR` = 30%

计算：
1. 年总奖励代币 = 805 × 31536000 = 25,386,480,000 wei = 253.8648 BTC
2. 年总奖励 NBC = 253.8648 × 1356882.302650 = 344,464,654.39 NBC
3. 最小质押量 = 344,464,654.39 / 0.3 = 1,148,215,514.63 NBC

## 实现细节

### 文件结构

- `apps/web/src/config/staking/minStakeThreshold.ts`: 核心计算函数
- `apps/web/src/views/NbcStakingPools/components/NbcStakeModal.tsx`: 前端检查和提示

### 主要函数

#### `calculateMinStakeThreshold`

根据 rewardRate 和目标 APR 计算最小质押量。

```typescript
calculateMinStakeThreshold(
  rewardRate: bigint,
  conversionRate: number,
  rewardTokenDecimals: number,
  targetAPR: number = 30,
  rewardsDuration?: bigint,
): bigint
```

#### `checkStakeThreshold`

检查用户质押量是否达到最小门槛。

```typescript
checkStakeThreshold(
  userStakeAmount: bigint,
  currentTotalStaked: bigint,
  rewardRate: bigint,
  conversionRate: number,
  rewardTokenDecimals: number,
  targetAPR: number = 30,
  rewardsDuration?: bigint,
): {
  isValid: boolean
  minStakeThreshold: bigint
  currentAPR: number
  targetAPR: number
  newTotalStaked: bigint
  newAPR: number
  message?: string
}
```

## 用户体验

### 警告提示

当 APR > 30% 时，质押模态框会显示警告信息：

```
To maintain APR ≤ 30%, minimum total stake is X NBC. Current: Y NBC. Need: Z NBC more.
```

### 阻止质押

如果用户质押后，总质押量仍未达到最小门槛，或者 APR 仍然 > 30%，系统会：
1. 显示错误提示
2. 阻止交易执行
3. 提示用户需要的最小质押量

## 配置

### 目标 APR

默认目标 APR 为 30%，可以在 `NbcStakeModal.tsx` 中修改：

```typescript
const TARGET_APR = 30 // 目标 APR 30%
```

### 奖励周期

默认使用 1 年（31536000 秒）作为奖励周期，与前端 APR 计算保持一致。

## 注意事项

1. **精度问题**：所有计算都使用 `BigInt` 进行，避免精度丢失
2. **价格更新**：兑换比例基于实时价格计算，价格变化会影响最小质押量
3. **合约 rewardsDuration**：虽然合约的 `rewardsDuration` 是 56 年，但前端计算使用 1 年，以保持一致性

## 未来改进

1. 支持动态调整目标 APR
2. 添加更详细的提示信息（包括预计 APR）
3. 支持批量质押检查
4. 添加最小质押量的可视化指示器
