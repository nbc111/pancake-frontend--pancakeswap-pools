# 更新 reward-adjuster 脚本部署指南

## 概述

当前工程的所有修改已经提交到 Git 仓库。现在需要在服务器上更新 `dynamic-reward-adjuster.js` 脚本，确保使用最新的代码。

## 更新步骤

### 方式 1: 使用自动化脚本（推荐）

```bash
# 在项目根目录执行
./update-reward-adjuster.sh
```

这个脚本会自动：
1. 连接到服务器
2. 拉取最新代码
3. 重启 PM2 服务
4. 显示服务状态和日志

### 方式 2: 手动更新

#### 步骤 1: 连接到服务器

```bash
ssh root@206.238.197.207
```

#### 步骤 2: 进入项目目录并拉取代码

```bash
cd /www/staking
git pull origin main
# 或者
git pull origin master
```

#### 步骤 3: 检查 PM2 服务状态

```bash
pm2 list | grep reward-adjuster
pm2 status reward-adjuster
```

#### 步骤 4: 重启服务

```bash
pm2 restart reward-adjuster
```

#### 步骤 5: 查看日志确认

```bash
pm2 logs reward-adjuster --lines 50
```

## 验证更新

### 1. 检查脚本版本

```bash
cd /www/staking/scripts
head -50 dynamic-reward-adjuster.js | grep -A 5 "calculateRewardRate"
```

确认计算公式是正确的（不应该有多余的 `nbcDecimals` 乘法）。

### 2. 检查服务运行状态

```bash
pm2 status reward-adjuster
pm2 logs reward-adjuster --lines 20
```

应该看到：
- 服务状态为 `online`
- 日志显示正常的价格获取和更新过程

### 3. 检查合约中的 rewardRate

```bash
cd /www/staking/scripts
node check-staking-data.js | grep -A 5 "BTC 池"
```

### 4. 手动触发一次更新（可选）

如果需要立即更新 rewardRate，可以手动执行：

```bash
cd /www/staking/scripts
RPC_URL=https://rpc.nbcex.com node reset-reward-rate.js --pool BTC --target-apr 100 --expected-staked 1000000 --execute
```

## 重要检查项

### 1. 确认 .env 配置正确

```bash
cd /www/staking/scripts
cat .env | grep -E "TOTAL_STAKED_NBC|TARGET_APR|RPC_URL"
```

应该看到：
- `TOTAL_STAKED_NBC=1000000000000000000000000` (1,000,000 NBC)
- `TARGET_APR=100` (100%)
- `RPC_URL=https://rpc.nbcex.com` (或正确的 RPC URL)

### 2. 确认 PM2 服务配置

```bash
pm2 describe reward-adjuster
```

检查：
- `script path` 应该指向 `/www/staking/scripts/dynamic-reward-adjuster.js`
- `exec cwd` 应该是 `/www/staking/scripts`

### 3. 检查服务是否自动重启

```bash
pm2 list
```

`restarts` 列应该显示重启次数。如果频繁重启，说明可能有错误。

## 常见问题

### Q: 服务启动失败

**检查：**
1. 查看错误日志：`pm2 logs reward-adjuster --err`
2. 检查 .env 文件配置
3. 检查 Node.js 版本和依赖

**解决：**
```bash
cd /www/staking/scripts
pnpm install  # 重新安装依赖
pm2 restart reward-adjuster
```

### Q: 服务运行但 rewardRate 没有更新

**检查：**
1. 查看日志确认是否在正常执行
2. 检查价格变化是否超过阈值（默认 5%）
3. 检查是否有足够的奖励代币余额

**解决：**
- 手动触发一次更新（见上面的步骤 4）
- 或者等待价格变化超过阈值

### Q: 如何修改更新频率？

编辑 `.env` 文件：
```bash
UPDATE_INTERVAL=300000  # 5分钟（毫秒）
```

然后重启服务：
```bash
pm2 restart reward-adjuster
```

### Q: 如何修改价格变化阈值？

编辑 `.env` 文件：
```bash
MIN_PRICE_CHANGE=0.05  # 5%
```

然后重启服务。

## 监控建议

### 1. 定期检查服务状态

```bash
# 每天检查一次
pm2 status reward-adjuster
pm2 logs reward-adjuster --lines 50
```

### 2. 监控 rewardRate 变化

```bash
# 每周检查一次
cd /www/staking/scripts
node check-staking-data.js
```

### 3. 设置日志轮转

PM2 默认会管理日志，但可以配置日志大小限制：

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## 回滚方案

如果更新后出现问题，可以回滚到之前的版本：

```bash
cd /www/staking
git log --oneline -10  # 查看提交历史
git checkout <之前的commit-hash>
pm2 restart reward-adjuster
```

## 总结

1. ✅ 代码已提交到 Git
2. 📥 在服务器上拉取最新代码
3. 🔄 重启 PM2 服务
4. ✅ 验证更新成功
5. 📊 监控服务运行状态

完成这些步骤后，`dynamic-reward-adjuster.js` 将使用最新的代码，并会在下次运行时自动修正错误的 rewardRate。
