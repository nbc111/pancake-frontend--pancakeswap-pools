# 执行解决方案指南

## 概述

由于无法直接通过 SSH 自动执行（需要密码），请按照以下步骤在服务器上手动执行检查 and 修复操作。

## 步骤 1: 连接到服务器

```bash
ssh root@206.238.197.207
# 输入密码: Tk%Cv7AgMwpIv&Z
```

## 步骤 2: 上传检查脚本（如果需要）

如果脚本文件还没有在服务器上，需要先上传：

```bash
# 在本地执行（从项目根目录）
scp scripts/check-server-status.sh root@206.238.197.207:/www/staking/scripts/
scp scripts/fix-reward-adjuster.sh root@206.238.197.207:/www/staking/scripts/
```

或者，如果代码已经通过 Git 同步，可以直接在服务器上使用。

## 步骤 3: 检查当前状态

在服务器上执行：

```bash
cd /www/staking/scripts
bash check-server-status.sh
```

这个脚本会检查：
- PM2 服务状态
- 服务日志
- 脚本文件是否存在
- 环境变量配置
- 合约中的 rewardRate

## 步骤 4: 根据检查结果执行修复

### 情况 A: 服务未运行

如果检查结果显示服务未运行，执行：

```bash
cd /www/staking/scripts
bash fix-reward-adjuster.sh
```

这个脚本会自动：
1. 拉取最新代码
2. 检查并创建 .env 文件（如果需要）
3. 安装依赖
4. 停止旧服务
5. 启动新服务

### 情况 B: 服务运行但有问题

如果服务在运行但有问题，可以：

```bash
# 1. 重启服务
pm2 restart reward-adjuster

# 2. 查看日志
pm2 logs reward-adjuster --lines 50

# 3. 如果日志显示错误，停止服务并重新运行修复脚本
pm2 stop reward-adjuster
cd /www/staking/scripts
bash fix-reward-adjuster.sh
```

### 情况 C: 服务正常运行但 APR 仍然很高

如果服务正常运行，但前端显示的 APR 仍然很高，可能是：

1. **实际质押量很低** - 检查合约中的实际 `totalStakedNBC`:
   ```bash
   cd /www/staking/scripts
   node check-staking-data.js | grep "totalStaked"
   ```

2. **价格变化未超过阈值** - 脚本默认只在价格变化超过 5% 时才更新。可以手动触发一次更新：
   ```bash
   cd /www/staking/scripts
   node reset-reward-rate.js --pool BTC --target-apr 100 --expected-staked 1000000 --execute
   ```

3. **使用实际质押量重新计算** - 如果实际质押量远低于 1,000,000 NBC，应该使用实际值：
   ```bash
   # 假设实际质押量是 30 NBC
   cd /www/staking/scripts
   node reset-reward-rate.js --pool BTC --target-apr 100 --expected-staked 30 --execute
   ```

## 步骤 5: 验证修复结果

### 5.1 检查服务状态

```bash
pm2 status reward-adjuster
```

应该看到：
- 状态: `online`
- 运行时间: 显示正常运行时间
- 重启次数: 应该很少（如果服务稳定）

### 5.2 查看服务日志

```bash
pm2 logs reward-adjuster --lines 50
```

应该看到：
- ✅ 成功获取 NBC 价格
- ✅ 成功获取各代币价格
- ✅ 计算并更新各池的奖励率
- ✅ 交易成功确认

### 5.3 检查合约中的 rewardRate

```bash
cd /www/staking/scripts
node check-staking-data.js | grep -A 5 "BTC 池"
```

应该看到 `rewardRate` 已经更新为合理的值（例如，对于 BTC，应该是很小的值，如 `2-3 wei/s`）。

### 5.4 检查前端显示的 APR

访问前端页面：`https://staking.nbblocks.cc/nbc-staking?chain=nbc`

刷新页面后，BTC 的 APR 应该显示为合理的值（接近 100%，而不是数十亿%）。

## 快速执行命令（一键检查）

如果你想快速检查所有状态，可以在服务器上执行：

```bash
cd /www/staking/scripts && \
echo "=== PM2 服务状态 ===" && \
pm2 status reward-adjuster && \
echo "" && \
echo "=== 最近日志（最后 20 行）===" && \
pm2 logs reward-adjuster --lines 20 --nostream && \
echo "" && \
echo "=== 合约中的 rewardRate ===" && \
node check-staking-data.js 2>/dev/null | head -30
```

## 常见问题

### Q1: 脚本执行失败，提示 "Permission denied"

**解决方案**:
```bash
chmod +x /www/staking/scripts/check-server-status.sh
chmod +x /www/staking/scripts/fix-reward-adjuster.sh
```

### Q2: PM2 命令不存在

**解决方案**:
```bash
npm install -g pm2
```

### Q3: 依赖安装失败

**解决方案**:
```bash
cd /www/staking/scripts
# 尝试使用 pnpm
pnpm install
# 或者使用 npm
npm install
```

### Q4: .env 文件配置错误

**解决方案**:
```bash
cd /www/staking/scripts
nano .env
# 确保以下配置正确:
# RPC_URL=https://rpc.nbcex.com
# PRIVATE_KEY=0x你的私钥（不要有引号）
# STAKING_CONTRACT_ADDRESS=0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789
# TOTAL_STAKED_NBC=1000000000000000000000000
# TARGET_APR=100
```

### Q5: 服务启动后立即停止

**解决方案**:
1. 查看详细错误日志:
   ```bash
   pm2 logs reward-adjuster --err --lines 50
   ```
2. 检查 .env 文件配置是否正确
3. 检查 RPC 节点是否可用:
   ```bash
   curl https://rpc.nbcex.com
   ```
4. 手动运行脚本查看错误:
   ```bash
   cd /www/staking/scripts
   node dynamic-reward-adjuster.js
   ```

## 监控和维护

### 定期检查

建议每天检查一次服务状态：

```bash
pm2 status reward-adjuster
pm2 logs reward-adjuster --lines 20 --nostream
```

### 设置告警（可选）

可以设置 PM2 监控，当服务停止时自动重启：

```bash
pm2 startup
pm2 save
```

## 联系支持

如果以上步骤都无法解决问题，请提供：
1. `pm2 logs reward-adjuster --lines 100` 的完整输出
2. `node check-staking-data.js` 的输出
3. `.env` 文件内容（隐藏私钥）
