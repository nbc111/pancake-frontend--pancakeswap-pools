# poolDetails 获取失败诊断报告

## 问题描述

所有池的 `poolDetails` 查询返回 `undefined`，导致无法获取 `rewardsDuration`，系统使用默认值 1 年。

## ✅ 最新状态更新（2024-12-XX）

**重大进展：**
- ✅ `poolDetails` 查询现在**成功返回数据**！
- ✅ 诊断日志显示所有池（0-10）的查询都成功，并返回了实际的 `rewardsDuration` 值
- ✅ Pool 0: `rewardsDuration = 604800` (7天)
- ✅ Pool 1: `rewardsDuration = 31536000` (1年)

**剩余问题：**
- ⚠️ 在 `useMemo` 中，部分池（2-10）仍然显示 "未读取到，将使用默认值 (1年)"
- ⚠️ 这可能是时序问题：诊断 `useEffect` 在数据到达后运行，但 `useMemo` 可能在数据完全处理前运行
- ⚠️ `tokenPrices` 在 `useMemo` 中仍为 `undefined`，尽管单个价格正在被获取

## 已确认的信息

### ✅ 合约 ABI 正确
- `pools` 函数存在于 ABI 中（`abis/nbcMultiRewardStaking.json`）
- 函数签名：`pools(uint256) returns (tuple)`
- 返回结构包含 8 个字段，`rewardsDuration` 在索引 4

### ✅ 合约地址和链 ID
- 合约地址：`0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`
- 链 ID：`1281` (NBC Chain)
- RPC 端点：`https://rpc.nbcex.com`

### ✅ 代码调用方式
- 使用 `useReadContract` hook
- 函数名：`'pools'`
- 参数：池索引（0-10）
- 已配置重试：3 次
- `enabled: true`

## 可能的原因分析

### 1. RPC 节点问题 ⚠️ 高概率

**症状：**
- 查询返回 `undefined` 但无错误信息
- 可能是静默失败（超时、网络问题）

**检查方法：**
1. 打开浏览器开发者工具 → Network 标签
2. 筛选 `rpc.nbcex.com` 请求
3. 查看是否有失败的请求或超时

**解决方案：**
- 检查 RPC 端点是否可访问
- 尝试使用备用 RPC 端点
- 检查网络连接

### 2. 合约地址不存在或错误 ⚠️ 中等概率

**症状：**
- 查询返回 `undefined`
- 可能没有错误（某些 RPC 节点对不存在的合约返回空值）

**检查方法：**
1. 在区块浏览器验证合约地址：https://www.nbblocks.cc
2. 确认合约已部署且可访问
3. 尝试调用其他函数（如 `poolLength`）验证合约可访问性

**解决方案：**
- 确认合约地址正确
- 如果地址错误，更新 `STAKING_CONTRACT_ADDRESS`

### 3. 链 ID 配置问题 ⚠️ 低概率

**症状：**
- wagmi 可能未正确识别链 ID 1281
- RPC 请求可能发送到错误的链

**检查方法：**
1. 检查 `apps/web/src/config/chains.ts` 中链配置
2. 确认 wagmi 配置包含 NBC Chain
3. 检查钱包是否连接到正确的链

**解决方案：**
- 确认链配置正确
- 确保 wagmi 配置包含链 1281

### 4. wagmi 配置问题 ⚠️ 中等概率

**症状：**
- `useReadContract` 可能未正确初始化
- publicClient 可能未配置

**检查方法：**
1. 检查 `utils/wagmi.ts` 或相关配置文件
2. 确认 publicClient 已正确配置链 1281
3. 检查是否有其他链的合约调用成功（对比测试）

**解决方案：**
- 检查 wagmi 配置
- 确保 publicClient 支持链 1281

### 5. 合约函数不存在 ⚠️ 低概率（已确认 ABI 存在）

**症状：**
- 虽然 ABI 中有定义，但实际合约可能不同版本

**检查方法：**
1. 在区块浏览器查看合约源码
2. 确认合约确实有 `pools` 函数
3. 对比 ABI 与实际合约

**解决方案：**
- 如果合约版本不同，更新 ABI
- 或使用正确的函数名

### 6. 网络连接问题 ⚠️ 中等概率

**症状：**
- 本地网络无法访问 RPC 端点
- 防火墙或代理阻止请求

**检查方法：**
1. 在浏览器中直接访问 `https://rpc.nbcex.com`
2. 检查网络连接
3. 尝试使用 VPN 或不同网络

**解决方案：**
- 解决网络连接问题
- 使用备用 RPC 端点

## 诊断步骤

### 步骤 1：检查浏览器网络请求
1. 打开开发者工具（F12）
2. 切换到 Network 标签
3. 筛选 `rpc.nbcex.com` 或 `nbcex.com`
4. 刷新页面
5. 查看是否有 RPC 请求
6. 检查请求状态码和响应

### 步骤 2：验证合约可访问性
在浏览器控制台运行以下代码（需要连接钱包）：

```javascript
// 使用 ethers.js 或 viem 直接调用合约
// 示例：检查 poolLength 函数是否可调用
```

### 步骤 3：检查其他合约调用
查看其他使用相同合约地址的函数（如 `balanceOf`, `totalStaked`, `getPoolInfo`）是否成功：
- 如果这些函数成功，说明合约可访问，问题可能在 `pools` 函数
- 如果这些函数也失败，说明是合约地址或网络问题

**代码已添加自动诊断：**
- 开发环境会自动检查 `totalStaked0` 和 `poolInfo0` 是否成功
- 如果这些调用成功但 `pools` 失败，说明问题特定于 `pools` 函数
- 如果这些调用也失败，说明是更广泛的合约访问问题
- **新增**：组件挂载时输出初始配置诊断信息（合约地址、链ID、RPC端点、ABI状态等）
- **新增**：Pool 0 的详细状态监控（`isError`, `status`），帮助确定查询的实际状态

### 步骤 4：验证 RPC 端点
在终端运行：

```bash
curl -X POST https://rpc.nbcex.com \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_call",
    "params": [{
      "to": "0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789",
      "data": "0x..." // pools(0) 的编码数据
    }, "latest"],
    "id": 1
  }'
```

## 已实施的改进

### 1. 增强错误日志
- 记录详细的错误信息（消息、堆栈、类型）
- 记录查询状态（加载中、错误、undefined、isError、status）
- 提供诊断建议
- **新增**：初始诊断日志（组件挂载时记录配置信息）

### 2. 数据验证
- 检查返回数据是否为数组
- 验证数组长度是否足够
- 确认 `rewardsDuration` 索引是否存在

### 3. 增强状态监控
- **新增**：Pool 0 的详细状态监控（`isError`, `status`）
- 对比其他合约调用（`totalStaked0`, `poolInfo0`）以确定问题范围
- 更详细的诊断建议和可能原因列表

## 临时解决方案

当前代码已有降级方案：
- 如果 `poolDetails` 未获取成功，使用默认值 1 年作为 `rewardsDuration`
- APR 计算仍然可以正常工作
- 如果合约中的实际 `rewardsDuration` 与默认值不同，APR 可能不准确，但不影响基本功能

## 下一步行动

### 已完成的步骤 ✅
1. ✅ **RPC 端点验证**：`curl` 测试确认 RPC 端点可访问，返回正确的链 ID (1281)
2. ✅ **合约调用成功**：`poolDetails` 查询现在成功返回数据
3. ✅ **诊断日志增强**：已添加详细的诊断信息

### 待解决的问题 ⚠️

#### 问题 1：时序问题 - `useMemo` 中部分池的 `rewardsDuration` 未读取到

**症状：**
- 诊断日志显示查询成功，`rewardsDuration` 有值
- 但 `useMemo` 中部分池（2-10）仍显示 "未读取到"

**可能原因：**
- `useMemo` 的依赖项可能不完整，导致在数据更新时未重新计算
- 数据提取逻辑可能有问题（虽然诊断日志显示数据存在）

**解决方案：**
1. 检查 `useMemo` 的依赖项是否包含所有 `poolDetails` 相关的状态
2. 改进数据提取逻辑，确保即使数据稍后到达也能正确提取
3. 添加更详细的日志，记录 `useMemo` 执行时的实际数据状态

#### 问题 2：`tokenPrices` 在 `useMemo` 中为 `undefined`

**症状：**
- `useMemo` 日志显示 `tokenPrices存在: false, tokenPrices类型: 'undefined'`
- 但单个价格正在被获取（如 `[NBC Price] ✅ Fetched successfully`）

**可能原因：**
- `useQuery` 的 `tokenPrices` 查询可能仍在加载中
- 数据返回格式可能不符合预期
- `getTokenPricesFromNbcApi` 可能返回了 `undefined` 或空对象

**解决方案：**
1. 检查 `getTokenPricesFromNbcApi` 的返回值格式
2. 确保 `useQuery` 正确等待数据加载完成
3. 添加默认值处理，避免 `undefined` 导致的问题

## 相关文件

- `apps/web/src/views/NbcStakingPools/hooks/useNbcStakingPools.ts` - 主要逻辑
- `apps/web/src/abis/nbcMultiRewardStaking.json` - 合约 ABI
- `apps/web/src/config/chains.ts` - 链配置
- `apps/web/src/utils/wagmi.ts` - wagmi 配置（如果存在）
