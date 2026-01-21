# Annual ROI 骨架屏显示问题修复

## 问题描述

在质押弹窗中，"Annual ROI at current rates" 显示为骨架屏（Skeleton），而不是显示具体的数值（如 `$0.00` 或实际 ROI 值）。

## 根本原因分析

### 1. 显示条件过于严格

在 `packages/widgets-internal/pool/StakeModal.tsx` 中，原来的显示逻辑是：

```typescript
{Number.isFinite(annualRoi) && annualRoi >= 0 ? (
  <AnnualRoiDisplay>${formattedAnnualRoi}</AnnualRoiDisplay>
) : (
  <Skeleton width={60} />
)}
```

这个条件会在以下情况下显示骨架屏：
- `annualRoi` 为 `NaN`
- `annualRoi` 为 `Infinity` 或 `-Infinity`
- `annualRoi` 为负数（虽然理论上不应该发生）

### 2. 计算过程中可能产生无效值

在 ROI 计算过程中，以下情况可能导致 `NaN` 或 `Infinity`：

1. **初始状态**：当 `stakeAmount` 为空时，如果 `validStakingTokenPrice` 为 `NaN`，会导致 `usdValueStaked` 为 `NaN`
2. **价格数据未加载**：如果 `earningTokenPrice` 或 `stakingTokenPrice` 在某个时刻为 `0` 或 `undefined`，可能导致计算错误
3. **极高 APR**：当 APR 极高时，`getInterestBreakdown` 中的指数运算可能产生 `Infinity`
4. **除零错误**：虽然已经设置了默认值，但在某些边缘情况下仍可能出现除零

### 3. 缺少错误处理

原来的代码没有使用 `try-catch` 来捕获计算过程中的异常，如果 `getInterestBreakdown` 抛出错误，会导致整个计算失败。

## 修复方案

### 1. 改进输入验证

```typescript
// 确保所有输入参数都是有效数字
const validApr = typeof apr === 'number' && Number.isFinite(apr) && apr >= 0 ? apr : 0;
const validEarningTokenPrice = typeof earningTokenPrice === 'number' && Number.isFinite(earningTokenPrice) && earningTokenPrice > 0 ? earningTokenPrice : 1;
const validStakingTokenPrice = typeof stakingTokenPrice === 'number' && Number.isFinite(stakingTokenPrice) && stakingTokenPrice >= 0 ? stakingTokenPrice : 0;

// 处理 stakeAmount，确保它是非负数
const stakeAmountNum = stakeAmount && !isNaN(Number(stakeAmount)) && Number(stakeAmount) >= 0 ? Number(stakeAmount) : 0;
```

### 2. 添加条件检查，避免不必要的计算

```typescript
// 如果 stakeAmount 为 0 或无效，直接返回 0，不进行复杂计算
if (stakeAmountNum > 0 && validPrincipalInUSD > 0 && validApr > 0 && validEarningTokenPrice > 0) {
  // 进行 ROI 计算
}
```

### 3. 添加错误处理

```typescript
try {
  interestBreakdown = getInterestBreakdown({
    principalInUSD: validPrincipalInUSD,
    apr: validApr,
    earningTokenPrice: validEarningTokenPrice,
  })
  // ... 计算逻辑
} catch (error) {
  console.error('[StakeModal] ROI 计算错误:', error)
  interestEarned = 0
  annualRoi = 0
}
```

### 4. 确保最终值始终有效

```typescript
// 确保 annualRoi 始终是有效数字（>= 0 且有限）
if (!Number.isFinite(annualRoi) || annualRoi < 0) {
  annualRoi = 0
}
```

### 5. 移除骨架屏显示逻辑

```typescript
// 始终显示数值，即使为 $0.00
<AnnualRoiContainer>
  <AnnualRoiDisplay>${formattedAnnualRoi}</AnnualRoiDisplay>
  <IconButton>
    <CalculateIcon />
  </IconButton>
</AnnualRoiContainer>
```

## 修复后的行为

1. **初始状态**：当用户未输入质押金额时，显示 `$0.00`
2. **输入金额后**：根据 APR 和价格计算并显示实际的 ROI 值
3. **价格未加载**：显示 `$0.00`（而不是骨架屏）
4. **计算错误**：捕获异常，显示 `$0.00`（而不是骨架屏）
5. **极高 APR**：使用简化计算，避免溢出，显示合理的值

## 调试信息

在开发环境下，控制台会输出详细的 ROI 计算调试信息，包括：
- 输入参数（stakeAmount, APR, 价格等）
- 中间计算结果（interestBreakdown, interestEarned）
- 最终结果（annualRoi, formattedAnnualRoi）

这些信息有助于诊断问题。

## 相关文件

- `packages/widgets-internal/pool/StakeModal.tsx` - 主要修复文件
- `apps/web/src/views/NbcStakingPools/components/NbcStakeModal.tsx` - 传递参数给 StakeModal
- `apps/web/src/views/NbcStakingPools/hooks/useNbcStakingPools.ts` - 计算 APR 和价格
- `packages/utils/compoundApyHelpers.ts` - ROI 计算核心函数
