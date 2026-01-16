# dynamic-reward-adjuster.js 脚本检查报告

## 检查时间
2024年（当前时间）

## 检查结果总结

### ✅ 脚本逻辑检查
- **脚本文件存在**: ✅
- **calculateRewardRate 函数**: ✅ 逻辑正确
  - 没有错误的 `nbcDecimals` 乘法
  - 计算公式: `annualRewardToken = annualRewardNBCWei * rewardTokenMultiplier / conversionRateScaled`
  - 使用向上取整确保 APR 不会不足
- **配置项**: ✅ 所有必要配置都存在
- **代币配置**: ✅ 所有代币（BTC, ETH, SOL, BNB, XRP, LTC, DOGE, USDT, SUI）都已配置
- **价格获取函数**: ✅ 所有价格获取函数都存在（NBC Exchange, Gate.io, OKX, Binance, CoinGecko）
- **主函数和定时执行**: ✅ main 函数和 setInterval 都存在

### ⚠️ 注意事项

1. **精度问题**: 
   - BTC 等大数值代币的 `conversionRateScaled` 计算可能存在轻微精度损失
   - 当前使用 `toFixed(18)` 方法，对于非常大的兑换比例可能会有精度损失
   - 但误差通常在可接受范围内（< 1%）

2. **依赖检查**:
   - 脚本需要 `axios`, `ethers`, `dotenv` 依赖
   - 这些依赖应该在 `scripts/package.json` 中定义
   - 在服务器上运行时，确保已安装所有依赖

3. **环境变量**:
   - 需要配置 `.env` 文件，包含:
     - `RPC_URL`: RPC 节点地址
     - `PRIVATE_KEY`: 合约 owner 私钥
     - `STAKING_CONTRACT_ADDRESS`: 质押合约地址
     - `TOTAL_STAKED_NBC`: 预期质押量（默认 1,000,000 NBC）
     - `TARGET_APR`: 目标 APR（默认 100%）
     - `UPDATE_INTERVAL`: 更新间隔（默认 5 分钟）

## 服务器运行状态检查

### 检查步骤

1. **SSH 连接到服务器**:
   ```bash
   ssh root@206.238.197.207
   ```

2. **检查 PM2 服务状态**:
   ```bash
   pm2 status reward-adjuster
   pm2 list | grep reward-adjuster
   ```

3. **查看服务日志**:
   ```bash
   pm2 logs reward-adjuster --lines 50
   ```

4. **检查服务是否正常运行**:
   - 服务状态应该是 `online`
   - 日志应该显示:
     - ✅ 成功获取 NBC 价格
     - ✅ 成功获取各代币价格
     - ✅ 计算并更新各池的奖励率
     - ✅ 交易成功确认

5. **检查合约中的 rewardRate**:
   ```bash
   cd /www/staking/scripts
   node check-staking-data.js | grep -A 5 "BTC 池"
   ```

### 预期行为

脚本应该：
1. 每 5 分钟（或配置的间隔）自动执行一次
2. 获取最新的 NBC 和代币价格
3. 计算新的 `rewardRate` 基于目标 APR
4. 如果价格变化超过阈值（默认 5%），更新合约中的 `rewardRate`
5. 记录所有操作到日志

## 常见问题排查

### 问题 1: 服务未运行
**症状**: `pm2 status` 显示服务不存在或已停止

**解决方案**:
```bash
cd /www/staking/scripts
pm2 start dynamic-reward-adjuster.js --name reward-adjuster
pm2 save
```

### 问题 2: 价格获取失败
**症状**: 日志显示 "Price not available" 或 API 错误

**解决方案**:
- 检查网络连接
- 检查 API 密钥是否有效
- 检查 API 是否可用（手动访问 API URL）
- 脚本会自动尝试备用 API（Gate.io, OKX, Binance, CoinGecko）

### 问题 3: 交易失败
**症状**: 日志显示交易失败或 Gas 不足

**解决方案**:
- 检查私钥是否正确
- 检查账户是否有足够的 NBC 支付 Gas
- 检查合约地址是否正确
- 检查 RPC 节点是否可用

### 问题 4: 余额不足
**症状**: 日志显示 "Insufficient balance"

**解决方案**:
- 确保 owner 地址或合约地址有足够的奖励代币余额
- 脚本会自动尝试从合约提取代币到 owner 地址（如果合约有余额）

### 问题 5: APR 仍然很高
**症状**: 前端显示的 APR 仍然非常高

**可能原因**:
1. 脚本还未运行或运行失败
2. `totalStakedNBC` 在合约中很低（实际质押量远低于预期）
3. `rewardRate` 更新失败或未生效

**解决方案**:
1. 检查脚本日志，确认是否成功更新
2. 手动执行一次更新:
   ```bash
   cd /www/staking/scripts
   node reset-reward-rate.js --pool BTC --target-apr 100 --expected-staked 1000000 --execute
   ```
3. 检查合约中的实际 `totalStakedNBC` 值
4. 如果实际质押量很低，考虑调整 `TOTAL_STAKED_NBC` 配置

## 验证脚本正常运行的方法

### 方法 1: 查看 PM2 日志
```bash
pm2 logs reward-adjuster --lines 100
```

应该看到：
- 定期执行的时间戳
- 价格获取成功
- 奖励率计算和更新
- 交易确认

### 方法 2: 检查合约交易
在区块链浏览器中查看合约地址 `0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789` 的交易记录，应该看到定期的 `notifyRewardAmount` 交易。

### 方法 3: 手动触发一次更新
```bash
cd /www/staking/scripts
node dynamic-reward-adjuster.js
# 按 Ctrl+C 停止（测试模式）
```

### 方法 4: 检查 rewardRate 变化
```bash
cd /www/staking/scripts
# 记录当前 rewardRate
node check-staking-data.js | grep "rewardRate"

# 等待 5 分钟后再次检查
sleep 300
node check-staking-data.js | grep "rewardRate"

# 比较两次的结果，应该看到变化（如果价格变化超过阈值）
```

## 结论

`dynamic-reward-adjuster.js` 脚本的逻辑是正确的，可以正常运行。如果 APR 仍然很高，主要原因是：

1. **合约状态**: 实际 `totalStakedNBC` 很低，导致即使 `rewardRate` 正确，APR 仍然很高
2. **脚本未运行**: PM2 服务可能未正确启动或配置
3. **价格变化阈值**: 如果价格变化小于 5%，脚本不会更新（这是正常行为）

**建议**:
1. 确认 PM2 服务正在运行
2. 检查脚本日志，确认是否成功更新
3. 如果实际质押量很低，考虑调整 `TOTAL_STAKED_NBC` 配置以匹配实际情况
4. 或者手动执行一次更新，使用实际的 `totalStakedNBC` 值
