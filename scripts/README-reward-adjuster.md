# 动态奖励率调整服务

这个服务用于根据 NBC 实时价格动态调整质押池的奖励率。

## 功能说明

1. **自动获取价格**：从交易所 API 获取 NBC 实时价格，从 CoinGecko 获取主流币价格
2. **动态计算兑换比例**：根据实时价格重新计算各代币与 NBC 的兑换比例
3. **重新计算奖励率**：根据新的兑换比例计算新的 rewardRate
4. **智能更新**：只有变化超过阈值（默认 5%）才更新，节省 Gas
5. **多池管理**：同时管理所有 9 个质押池（BTC, ETH, SOL, BNB, XRP, LTC, DOGE, USDT, SUI）

## 安装依赖

```bash
cd scripts
pnpm install
```

## 配置

1. 复制环境变量示例文件：
```bash
cp env.example .env
```

2. 编辑 `.env` 文件，填入你的配置：
```bash
# 区块链配置
RPC_URL=https://rpc.nbcchain.com
PRIVATE_KEY=0x你的私钥

# 合约地址
STAKING_CONTRACT_ADDRESS=0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789

# 质押配置
TOTAL_STAKED_NBC=1000000000000000000000000  # 1,000,000 NBC
TARGET_APR=100                              # 100%
REWARDS_DURATION=31536000                   # 1年（秒）

# 价格调整配置
PRICE_MULTIPLIER=1.0                        # 价格影响系数（1.0 = 100%）
MIN_PRICE_CHANGE=0.05                       # 最小价格变化才更新（5%）

# 更新配置
UPDATE_INTERVAL=300000                      # 5分钟（毫秒）
```

## 使用方法

### 方式 1：直接运行

```bash
cd scripts
node dynamic-reward-adjuster.js
```

### 方式 2：使用 npm 脚本

```bash
cd scripts
pnpm run reward-adjuster
```

### 方式 3：使用 PM2 后台运行（推荐）

```bash
cd scripts
pm2 start dynamic-reward-adjuster.js --name reward-adjuster
pm2 save
pm2 logs reward-adjuster
```

## 工作原理

### 1. 价格获取
- **NBC 价格**：从 `https://www.nbcex.com/v1/rest/api/market/ticker?symbol=nbcusdt` 获取
- **主流币价格**：从 CoinGecko API 获取

### 2. 兑换比例计算
```
兑换比例 = 主流币价格(USD) / NBC价格(USD)
```

例如：
- BTC 价格：$88,500
- NBC 价格：$0.11
- 兑换比例：88,500 / 0.11 = 804,545 NBC

### 3. 奖励率计算
基于兑换比例和以下公式：
```
年总奖励(NBC) = 总质押量 × APR
年总奖励(代币) = 年总奖励(NBC) × 代币精度 / 兑换比例
每秒奖励率 = 年总奖励(代币) / 31536000
```

### 4. 更新逻辑
- 如果奖励率变化 < 5%，跳过更新（节省 Gas）
- 如果奖励率变化 ≥ 5%，调用合约的 `notifyRewardAmount` 更新

## 配置说明

### TOTAL_STAKED_NBC
预期总质押量，用于计算奖励率。这个值应该与 `calculate-reward-rates.js` 中的值保持一致。

### TARGET_APR
目标年化收益率（百分比）。例如：100 表示 100% APR。

### MIN_PRICE_CHANGE
最小价格变化阈值（百分比）。只有当奖励率变化超过这个阈值时才会更新合约。默认 5% 可以避免频繁的小幅更新，节省 Gas。

### UPDATE_INTERVAL
更新间隔（毫秒）。默认 5 分钟（300000 毫秒）。建议不要设置得太频繁，避免：
1. API 限流
2. Gas 费用过高
3. 价格波动过大

## 注意事项

1. **私钥安全**：`.env` 文件包含私钥，请妥善保管，不要提交到 Git
2. **余额检查**：服务会自动检查奖励代币余额，确保有足够的代币用于奖励
3. **错误处理**：如果某个池更新失败，会记录错误但继续处理其他池
4. **Gas 费用**：每次更新需要消耗 Gas，建议设置合理的 `MIN_PRICE_CHANGE` 和 `UPDATE_INTERVAL`

## 日志示例

```
========================================
   Dynamic Reward Rate Adjustment
   2025-12-29T12:00:00.000Z
========================================

📊 Fetching prices...

[2025-12-29T12:00:00.000Z] 📊 Fetching NBC price from exchange...
[2025-12-29T12:00:00.000Z] ✅ NBC Price: $0.1200
[2025-12-29T12:00:00.000Z] 📊 Fetching token prices from CoinGecko...
   ✅ BTC: $88500.0000
   ✅ ETH: $3020.0000
   ...

[2025-12-29T12:00:00.000Z] 🔄 Updating BTC Pool (Index: 1):
   💰 Token Price: $88500.0000
   💰 NBC Price: $0.1200
   📊 Conversion Rate: 1 BTC = 737500.00 NBC
   📊 Base Rate: 1 BTC = 804545.00 NBC
   📈 Rate Change: -8.33%
   📈 Current Rate: 3 wei/s
   📈 New Rate: 2 wei/s
   📈 Change: -33.33%
   💎 Annual Reward: 63072000 wei
   📤 Sending transaction...
   🔗 Transaction hash: 0x...
   ⏳ Waiting for confirmation...
   ✅ Reward updated successfully!
   📦 Block: 12345678
   ⛽ Gas used: 0.001 NBC

========================================
   Summary
========================================
✅ Success: 9
⏭️  Skipped: 0
❌ Failed: 0
========================================
```

## 故障排查

### 1. API 请求失败
- 检查网络连接
- 检查 API URL 是否正确
- 检查 API 是否有限流

### 2. 交易失败
- 检查私钥是否正确
- 检查账户余额是否足够支付 Gas
- 检查奖励代币余额是否足够

### 3. 价格获取失败
- 检查 CoinGecko API 是否可用
- 检查代币 ID 是否正确

## 支持

如有问题，请检查：
1. 日志输出
2. `.env` 配置是否正确
3. 合约地址是否正确
4. 网络连接是否正常

