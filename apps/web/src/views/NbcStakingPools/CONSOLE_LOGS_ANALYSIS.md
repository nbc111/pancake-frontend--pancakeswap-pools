# 控制台日志分析报告

## 主要问题总结

### 1. 代币价格获取失败 ⚠️ 严重

**现象：**
- 多个代币（XRP, BTC, ETH, SOL, BNB, LTC, DOGE, PEPE, USDT, SUI）显示 `tokenPrice: 'null/0'`
- 导致 APR 被设置为 0
- 用户无法看到准确的收益率信息

**根本原因：**
1. **CoinGecko API 限流（429 Too Many Requests）**
   - 错误：`GET https://api.coingecko.com/api/v3/simple/price?ids=pepe&vs_currencies=usd net::ERR_FAILED 429`
   - 原因：短时间内并发请求过多，触发 API 限流
   - 影响：所有代币价格获取失败

2. **NBC Exchange API 可能也失败**
   - 日志显示尝试调用 NBC Exchange API，但未看到成功日志
   - 可能原因：网络问题、API 限流、或响应格式异常

3. **缺少重试机制**
   - 当前代码在 API 失败时直接返回 `null`
   - 没有指数退避重试逻辑
   - 没有请求延迟，导致并发请求过多

### 2. CORS 错误 ⚠️ 中等

**现象：**
- `Access to XMLHttpRequest at 'https://testnet.snapshot.org/graphql' from origin 'http://localhost:5000' has been blocked by CORS policy`
- 这不是代币价格相关的问题，是其他服务的 CORS 配置问题

**影响：**
- 不影响代币价格获取
- 可能影响其他功能（如快照投票等）

### 3. Styled-components 警告 ⚠️ 轻微

**现象：**
- `styled-components: it looks like an unknown prop "position" is being sent through to the DOM`
- 类似警告还有：`mr`, `variant`, `expanded`

**影响：**
- 不影响功能，只是开发环境警告
- 建议使用 transient props (`$` 前缀) 或 `shouldForwardProp` 过滤

### 4. 其他警告 ⚠️ 轻微

- MetaMask RPC 错误：可能是钱包连接问题
- Image 尺寸警告：图片资源问题
- WalletConnect metadata URL 不匹配：开发环境配置问题

## 解决方案

### 优先级 1：修复代币价格获取失败

1. **添加请求延迟和批处理**
   - 在并发请求之间添加延迟（如 200-500ms）
   - 避免同时发起过多请求

2. **实现重试机制**
   - 使用指数退避策略
   - 最多重试 3 次
   - 重试间隔：1s, 2s, 4s

3. **添加请求缓存**
   - 使用 localStorage 缓存价格数据
   - 缓存时间：5-10 分钟
   - 减少 API 调用次数

4. **改进错误处理**
   - 区分不同类型的错误（网络错误、限流、数据格式错误）
   - 针对不同错误采用不同策略

5. **添加备用价格源**
   - 如果所有 API 都失败，使用上次成功获取的价格
   - 或使用硬编码的默认价格（标记为过时）

### 优先级 2：优化价格获取逻辑

1. **减少请求频率**
   - 将 `refetchInterval` 从 `FAST_INTERVAL * 6` 增加到 `FAST_INTERVAL * 12`（约 2 分钟）
   - 减少不必要的 API 调用

2. **批量请求优化**
   - CoinGecko 支持批量查询，可以一次请求多个代币
   - 减少请求次数，降低限流风险

3. **请求优先级**
   - 优先获取 NBC 价格（最重要）
   - 其他代币价格可以延迟获取

### 优先级 3：改进用户体验

1. **价格加载状态**
   - 显示价格加载中的状态
   - 使用骨架屏或加载指示器

2. **错误提示**
   - 当价格获取失败时，显示友好的错误提示
   - 提供手动刷新按钮

3. **降级策略**
   - 如果价格获取失败，使用上次成功获取的价格（标记为"可能过时"）
   - 或显示"价格暂不可用"，但不阻止用户操作

## 实施建议

1. **立即实施**（优先级 1）：
   - 添加请求延迟
   - 实现重试机制
   - 添加请求缓存

2. **短期实施**（优先级 2）：
   - 优化批量请求
   - 减少请求频率
   - 改进错误处理

3. **长期优化**（优先级 3）：
   - 添加备用价格源
   - 改进 UI 反馈
   - 监控 API 使用情况

## 技术细节

### 当前价格获取流程

```
useNbcStakingPools
  └─> useQuery(['nbcStakingTokenPrices'])
      └─> getTokenPricesFromNbcApi(tokenSymbols)
          └─> Promise.allSettled(
                tokenSymbols.map(symbol => 
                  getTokenPriceFromNbcApi(symbol)
                    └─> 尝试 NBC Exchange API
                        └─> 失败则尝试 CoinGecko API
                )
              )
```

### 问题点

1. **并发请求过多**：11 个代币同时请求，可能触发限流
2. **无延迟**：请求之间没有延迟
3. **无重试**：失败后直接返回 `null`
4. **无缓存**：每次都重新请求

### 改进后的流程

```
useNbcStakingPools
  └─> useQuery(['nbcStakingTokenPrices'])
      └─> getTokenPricesFromNbcApi(tokenSymbols)
          └─> 检查缓存
              └─> 如果缓存有效，返回缓存
              └─> 否则批量请求（带延迟和重试）
                  └─> 成功则更新缓存
                  └─> 失败则使用缓存或默认值
```
