# 快速修复指南

## 在服务器上执行以下命令

### 1. 连接到服务器
```bash
ssh root@206.238.197.207
# 密码: Tk%Cv7AgMwpIv&Z
```

### 2. 检查当前状态
```bash
cd /www/staking/scripts
bash check-server-status.sh
```

### 3. 修复和启动服务
```bash
cd /www/staking/scripts
bash fix-reward-adjuster.sh
```

### 4. 验证结果
```bash
# 查看服务状态
pm2 status reward-adjuster

# 查看日志
pm2 logs reward-adjuster --lines 30

# 检查合约中的 rewardRate
node check-staking-data.js | grep -A 5 "BTC 池"
```

## 如果服务正常运行但 APR 仍然很高

手动触发一次更新（使用实际质押量）:

```bash
cd /www/staking/scripts
# 先检查实际质押量
node check-staking-data.js | grep "totalStaked"

# 使用实际质押量更新（假设是 30 NBC）
node reset-reward-rate.js --pool BTC --target-apr 100 --expected-staked 30 --execute
```

## 详细说明

请查看: `scripts/EXECUTE_SOLUTION.md`
