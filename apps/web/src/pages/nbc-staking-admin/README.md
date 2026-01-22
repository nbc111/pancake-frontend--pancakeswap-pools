# NBC Staking Admin Panel

## 概述

这是一个独立的管理员页面，用于管理 NBC 质押池的配置。该页面与用户前端完全分离，只有合约 Owner 可以访问。

## 访问地址

- **URL**: `/nbc-staking-admin`
- **权限**: 仅合约 Owner 可访问

## 功能

### 1. 管理现有池 (Manage Pools)

#### 设置奖励率 (notifyRewardAmount)
- **功能**: 通知合约新的奖励数量，自动计算新的 rewardRate
- **参数**:
  - Pool Index: 池索引（0-10）
  - Reward Amount: 奖励数量（DOGE，18 位精度）
- **注意**: 
  - 如果周期未结束，剩余奖励会被包含在计算中
  - 新 rewardRate = (新奖励 + 剩余奖励) / rewardsDuration

#### 设置奖励周期 (setRewardsDuration)
- **功能**: 修改池的奖励周期
- **参数**:
  - Pool Index: 池索引
  - Rewards Duration: 奖励周期（秒，31536000 = 1 年）
- **限制**: 只能在周期结束后调用（`block.timestamp > periodFinish`）

#### 激活/停用池 (setPoolActive)
- **功能**: 启用或禁用池
- **参数**:
  - Pool Index: 池索引
  - Active: 是否激活

#### 紧急提取奖励 (emergencyWithdrawReward)
- **功能**: 从合约中提取奖励代币
- **参数**:
  - Pool Index: 池索引
  - Amount: 提取数量（DOGE，18 位精度）
- **警告**: 这会从合约中提取代币，请谨慎使用

### 2. 添加新池 (Add New Pool)

- **功能**: 添加新的奖励代币池
- **参数**:
  - Reward Token Address: 奖励代币合约地址
  - Initial Reward Rate: 初始奖励率（代币/秒，考虑代币精度）
  - Rewards Duration: 奖励周期（秒，31536000 = 1 年）

### 3. 设置 (Settings)

- **合约信息**: 显示合约地址、Owner 地址、总池数等
- **常用值**: 提供常用的时间周期值（1 年、6 个月、3 个月、1 个月）
- **重要提示**: 操作注意事项和限制

## 权限验证

页面会自动检查：
1. 钱包是否已连接
2. 当前地址是否为合约 Owner

如果不是 Owner，会显示拒绝访问的消息。

## 使用示例

### 设置 DOGE 池的奖励率（目标 APR 50%）

1. 切换到 "Manage Pools" 标签
2. 在 "Set Reward Rate" 部分：
   - Pool Index: `7` (DOGE 池)
   - Reward Amount: `267425.28` (1 年奖励，基于 50% APR 和 100 万 NBC 预期质押量)
3. 点击 "Notify Reward Amount"
4. 确认交易

### 修复 rewardsDuration（从 56 年改为 1 年）

1. 等待周期结束（或使用其他方法）
2. 切换到 "Manage Pools" 标签
3. 在 "Set Rewards Duration" 部分：
   - Pool Index: `7`
   - Rewards Duration: `31536000` (1 年)
4. 点击 "Set Rewards Duration"
5. 确认交易

### 提取多余的 DOGE

1. 切换到 "Manage Pools" 标签
2. 在 "Emergency Withdraw Reward" 部分：
   - Pool Index: `7`
   - Amount: `1286586.582001987730947601` (多余的 DOGE)
3. 点击 "Emergency Withdraw"
4. 确认交易

## 安全注意事项

1. **权限控制**: 只有合约 Owner 可以访问此页面
2. **交易确认**: 所有操作都需要钱包确认
3. **参数验证**: 请仔细检查所有参数，特别是金额和地址
4. **测试**: 建议先在测试网测试所有操作

## 常见问题

### Q: 为什么无法设置 rewardsDuration？
A: `setRewardsDuration` 只能在周期结束后调用。如果周期未结束，需要等待或使用其他方法。

### Q: 为什么 rewardRate 没有降低？
A: 如果周期未结束，剩余奖励会被包含在计算中。需要等待周期结束，或者先提取多余的代币。

### Q: 如何计算正确的奖励数量？
A: 使用公式：`奖励数量 = 目标 rewardRate × rewardsDuration`
- 目标 rewardRate = 基于目标 APR 和预期质押量计算
- rewardsDuration = 奖励周期（秒）

## 技术细节

- **框架**: Next.js + React
- **Web3**: wagmi + viem
- **UI**: PancakeSwap UI Kit
- **合约地址**: `0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`
- **链 ID**: 1281 (NBC Chain)
