# 当前状态报告

## ✅ 已解决的问题

### 1. poolDetails 查询成功
- **状态**: ✅ **已解决**
- **详情**: 所有池（0-10）的 `poolDetails` 查询现在成功返回数据
- **证据**: 诊断日志显示 "poolDetails 查询成功"，并返回实际的 `rewardsDuration` 值
  - Pool 0: `rewardsDuration = 604800` (7天)
  - Pool 1: `rewardsDuration = 31536000` (1年)
  - 其他池也有相应的值

### 2. RPC 端点验证
- **状态**: ✅ **已验证**
- **详情**: `curl` 测试确认 RPC 端点 `https://rpc.nbcex.com` 可访问
- **证据**: 返回正确的链 ID (1281): `{"jsonrpc":"2.0","id":1,"result":"0x501"}`

## ⚠️ 待解决的问题

### 1. useMemo 中部分池的 rewardsDuration 提取问题

**症状：**
- 诊断日志显示查询成功，`rewardsDuration` 有值
- 但 `useMemo` 中部分池（2-10）仍显示 "未读取到，将使用默认值 (1年)"

**可能原因：**
1. **时序问题**: `useMemo` 可能在数据完全处理前运行
2. **数据格式问题**: 数据提取逻辑可能无法正确处理某些数据格式
3. **React 批处理**: 多个状态更新可能被批处理，导致 `useMemo` 在数据更新前运行

**已实施的改进：**
- ✅ 添加了更详细的数据提取日志
- ✅ 改进了数据提取逻辑，添加了更多的错误处理
- ✅ 移除了对 `rewardsDuration` 最大值的限制（之前限制为 10 年）

**下一步：**
1. 观察新的日志输出，确认数据提取过程
2. 如果问题持续，考虑使用 `useEffect` 来确保数据提取在数据到达后执行
3. 检查是否有 React 批处理导致的问题

### 2. tokenPrices 在 useMemo 中为 undefined

**症状：**
- `useMemo` 日志显示 `tokenPrices存在: false, tokenPrices类型: 'undefined'`
- 但单个价格正在被获取（如 `[NBC Price] ✅ Fetched successfully`）

**可能原因：**
1. **加载时序**: `useQuery` 仍在加载中，`tokenPrices` 尚未返回
2. **查询失败**: `getTokenPricesFromNbcApi` 可能返回了 `undefined` 或空对象
3. **数据格式**: 返回的数据格式可能不符合预期

**当前处理：**
- ✅ 代码已使用可选链 (`tokenPrices?.[config.rewardTokenSymbol]`)，可以安全处理 `undefined`
- ✅ 当价格为 `undefined` 时，使用默认值 `1`，不会导致崩溃

**下一步：**
1. 检查 `useQuery` 的 `isLoading` 和 `isError` 状态
2. 确认 `getTokenPricesFromNbcApi` 的返回值格式
3. 如果查询失败，检查错误日志

## 📊 诊断日志增强

### 新增的日志功能

1. **数据提取过程日志**
   - 记录 `poolDetails` 的存在、类型、长度
   - 记录 `poolDetails[4]` 的值和类型
   - 记录提取成功或失败的原因

2. **rewardsDuration 提取确认**
   - 成功提取时记录原始值、转换后的值、年数
   - 失败时记录详细原因（值为 0、null/undefined、格式不正确等）

3. **tokenPrices 状态监控**
   - 记录 `tokenPrices` 的存在、类型、键、值
   - 记录查询状态（loading、error、status）

## 🔍 建议的下一步操作

1. **观察新的日志输出**
   - 刷新页面，查看新的诊断日志
   - 特别关注 `useMemo` 中的数据提取过程日志
   - 确认 `rewardsDuration` 提取成功或失败的具体原因

2. **检查浏览器 Network 标签**
   - 确认 RPC 请求是否成功
   - 检查 `tokenPrices` API 请求的状态
   - 查看是否有失败的请求

3. **验证数据流**
   - 确认 `poolDetails` 数据从查询到 `useMemo` 的完整流程
   - 确认 `tokenPrices` 数据从查询到 `useMemo` 的完整流程

## 📝 相关文件

- `apps/web/src/views/NbcStakingPools/hooks/useNbcStakingPools.ts` - 主要逻辑
- `apps/web/src/config/staking/tokenPrices.ts` - 价格获取逻辑
- `apps/web/src/views/NbcStakingPools/POOLDETAILS_DIAGNOSIS.md` - 详细诊断报告
