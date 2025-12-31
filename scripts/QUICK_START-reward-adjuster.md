# 快速启动指南

## 1. 安装依赖

```bash
cd scripts
pnpm install
```

## 2. 配置环境变量

```bash
# 复制示例文件
cp env.example .env

# 编辑 .env 文件，填入你的配置
# 特别注意：
# - PRIVATE_KEY: 合约 owner 的私钥
# - STAKING_CONTRACT_ADDRESS: 质押合约地址
# - TOTAL_STAKED_NBC: 应该与 calculate-reward-rates.js 中的值一致
```

## 3. 运行服务

### 方式 1：直接运行（测试）
```bash
node dynamic-reward-adjuster.js
```

### 方式 2：使用 PM2 后台运行（生产环境推荐）
```bash
# 安装 PM2（如果还没有）
npm install -g pm2

# 启动服务
pm2 start dynamic-reward-adjuster.js --name reward-adjuster

# 查看日志
pm2 logs reward-adjuster

# 查看状态
pm2 status

# 保存配置（开机自启）
pm2 save
```

## 4. 验证

服务启动后，你应该看到：
- ✅ 成功获取 NBC 价格
- ✅ 成功获取各代币价格
- ✅ 计算并更新各池的奖励率

## 5. 监控

定期检查：
- PM2 日志：`pm2 logs reward-adjuster`
- 服务状态：`pm2 status`
- 合约交易：在区块链浏览器查看合约地址的交易记录

## 常见问题

### Q: 提示 "Insufficient balance"
A: 确保你的账户有足够的奖励代币余额。需要为每个池准备足够的奖励代币。

### Q: 提示 "Price not available"
A: 检查网络连接和 CoinGecko API 是否可用。可以手动访问 API URL 测试。

### Q: 交易失败
A: 检查：
1. 私钥是否正确
2. 账户是否有足够的 NBC 支付 Gas
3. 合约地址是否正确
4. 网络连接是否正常

### Q: 如何修改更新频率？
A: 编辑 `.env` 文件中的 `UPDATE_INTERVAL`（单位：毫秒）

### Q: 如何修改价格变化阈值？
A: 编辑 `.env` 文件中的 `MIN_PRICE_CHANGE`（单位：百分比，例如 0.05 表示 5%）

