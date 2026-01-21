# Annual ROI 显示分析

## 显示 `$0.00` 的情况分析

### 情况 1: 用户未输入质押金额
**状态**: ✅ **正确**
- `stakeAmount = ""` (空字符串)
- `stakeAmountNum = 0`
- `validPrincipalInUSD = 0`
- `getInterestBreakdown` 返回: `[0, 0, 0, 0, 0]`
- `annualRoi = 0`
- **显示 `$0.00` 是正确的**，因为用户还没有输入要质押的金额

### 情况 2: 用户输入了金额，但 APR 为 0
**状态**: ✅ **正确**
- 例如: `stakeAmount = "100"`, `apr = 0`
- `validPrincipalInUSD = 100 * stakingTokenPrice`
- `getInterestBreakdown` 计算:
  - `principal = validPrincipalInUSD / earningTokenPrice`
  - `interestEarned = principal * 0 * (365 / 365) = 0`
- `annualRoi = 0`
- **显示 `$0.00` 是正确的**，因为 APR 为 0 意味着没有收益

### 情况 3: 代币价格未加载
**状态**: ✅ **正确**
- 从控制台日志看，某些代币（XRP、PEPE）的价格是 `null/0`
- 这会导致 `apr` 被设置为 `0`（在 `useNbcStakingPools.ts` 中）
- `annualRoi = 0`
- **显示 `$0.00` 是正确的**，因为无法计算收益（缺少价格数据）

### 情况 4: 用户输入了金额，且 APR > 0
**状态**: ⚠️ **需要验证**
- 例如: `stakeAmount = "100"`, `apr = 30%`, `stakingTokenPrice = $0.067`, `earningTokenPrice = $1`
- `validPrincipalInUSD = 100 * 0.067 = $6.7`
- `getInterestBreakdown` 计算:
  - `principal = 6.7 / 1 = 6.7 tokens`
  - `interestEarned = 6.7 * 0.30 * 1 = 2.01 tokens` (简化计算，不考虑复利)
- `annualRoi = 2.01 * 1 = $2.01`
- **应该显示 `$2.01`，而不是 `$0.00`**

## ROI 计算公式

### 基本公式
```
annualRoi = interestEarned * earningTokenPrice
```

其中:
- `interestEarned = getInterestBreakdown()[3]` (1年的收益，单位: tokens)
- `earningTokenPrice` = 奖励代币的价格（USD）

### getInterestBreakdown 计算逻辑
```typescript
principal = principalInUSD / earningTokenPrice  // 将 USD 转换为 tokens
interestEarned = principal * (apr / 100) * (days / 365)  // 简单利息
// 或使用复利公式（如果 timesCompounded > 0）
```

## 验证步骤

1. **检查用户是否输入了金额**
   - 如果 `stakeAmount` 为空，显示 `$0.00` 是正确的

2. **检查 APR 是否有效**
   - 如果 `apr = 0`，显示 `$0.00` 是正确的
   - 如果 `apr > 0`，应该显示实际的 ROI 值

3. **检查价格是否加载**
   - 如果 `earningTokenPrice = null` 或 `0`，会被默认设置为 `1`
   - 如果 `stakingTokenPrice = null` 或 `0`，会被默认设置为 `0`
   - 如果价格未加载，APR 可能为 `0`，显示 `$0.00` 是正确的

4. **检查计算逻辑**
   - 打开浏览器控制台，查看 `[StakeModal] ROI 计算调试` 日志
   - 验证 `interestBreakdown[3]` 是否正确计算
   - 验证 `annualRoi` 是否正确计算

## 可能的问题

### 问题 1: APR 为 0 但用户期望看到收益
**原因**: 代币价格未加载，导致 APR 被设置为 0
**解决方案**: 
- 检查价格 API 是否正常工作
- 检查 CORS 设置
- 检查代币符号映射是否正确

### 问题 2: 用户输入了金额，APR > 0，但显示 `$0.00`
**可能原因**:
1. `interestBreakdown[3]` 计算错误
2. `annualRoi` 计算错误
3. `formattedAnnualRoi` 格式化错误

**调试方法**:
- 查看浏览器控制台的 `[StakeModal] ROI 计算调试` 日志
- 检查 `validPrincipalInUSD`、`validApr`、`validEarningTokenPrice` 的值
- 检查 `interestBreakdown` 数组的值

## 结论

显示 `$0.00` 在以下情况下是**正确的**:
1. ✅ 用户未输入质押金额
2. ✅ APR 为 0（无论是因为价格未加载还是其他原因）
3. ✅ 代币价格未加载，导致无法计算收益

如果用户输入了金额，且 APR > 0，但仍然显示 `$0.00`，则需要检查:
1. 浏览器控制台的调试日志
2. APR 计算逻辑
3. 价格获取逻辑
