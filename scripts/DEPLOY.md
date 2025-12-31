# 动态奖励率调整服务部署指南

## 部署方式

由于 `.env` 文件包含敏感信息（私钥），不能提交到 Git。以下是几种安全的部署方式：

## 方式 1：服务器上手动创建 .env 文件（推荐）

### 步骤：

1. **在服务器上克隆/拉取代码**
```bash
cd /www/staking
git pull origin main
```

2. **进入 scripts 目录并安装依赖**
```bash
cd scripts
pnpm install
```

3. **创建 .env 文件**
```bash
# 复制示例文件
cp env.example .env

# 使用编辑器创建（推荐使用 nano 或 vim）
nano .env
```

4. **填入配置信息**
```bash
# 在编辑器中填入以下内容（替换为实际值）
RPC_URL=https://rpc.nbcchain.com
PRIVATE_KEY=0x你的私钥
STAKING_CONTRACT_ADDRESS=0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789
TOTAL_STAKED_NBC=1000000000000000000000000
TARGET_APR=100
REWARDS_DURATION=31536000
PRICE_MULTIPLIER=1.0
MIN_PRICE_CHANGE=0.05
UPDATE_INTERVAL=300000
```

5. **保存并设置权限**
```bash
# 保存文件（nano: Ctrl+O, Enter, Ctrl+X）
# 设置文件权限（仅所有者可读写）
chmod 600 .env
```

6. **测试运行**
```bash
node dynamic-reward-adjuster.js
```

7. **使用 PM2 后台运行**
```bash
pm2 start dynamic-reward-adjuster.js --name reward-adjuster
pm2 save
```

## 方式 2：使用环境变量（不创建 .env 文件）

### 步骤：

1. **在服务器上设置环境变量**
```bash
# 临时设置（当前会话有效）
export RPC_URL="https://rpc.nbcchain.com"
export PRIVATE_KEY="0x你的私钥"
export STAKING_CONTRACT_ADDRESS="0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789"
export TOTAL_STAKED_NBC="1000000000000000000000000"
export TARGET_APR="100"
export REWARDS_DURATION="31536000"
export PRICE_MULTIPLIER="1.0"
export MIN_PRICE_CHANGE="0.05"
export UPDATE_INTERVAL="300000"
```

2. **永久设置（添加到 ~/.bashrc 或 ~/.profile）**
```bash
# 编辑配置文件
nano ~/.bashrc

# 在文件末尾添加环境变量（不要包含 export，直接添加）
RPC_URL="https://rpc.nbcchain.com"
PRIVATE_KEY="0x你的私钥"
# ... 其他变量

# 保存后重新加载
source ~/.bashrc
```

3. **使用 PM2 时设置环境变量**
```bash
# 方式 A：在命令行中设置
RPC_URL="..." PRIVATE_KEY="..." pm2 start dynamic-reward-adjuster.js --name reward-adjuster

# 方式 B：创建 PM2 配置文件
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'reward-adjuster',
    script: 'dynamic-reward-adjuster.js',
    cwd: '/www/staking/scripts',
    env: {
      RPC_URL: 'https://rpc.nbcchain.com',
      PRIVATE_KEY: '0x你的私钥',
      STAKING_CONTRACT_ADDRESS: '0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789',
      TOTAL_STAKED_NBC: '1000000000000000000000000',
      TARGET_APR: '100',
      REWARDS_DURATION: '31536000',
      PRICE_MULTIPLIER: '1.0',
      MIN_PRICE_CHANGE: '0.05',
      UPDATE_INTERVAL: '300000'
    }
  }]
}
EOF

pm2 start ecosystem.config.js
pm2 save
```

## 方式 3：使用部署脚本（自动化）

### 创建部署脚本

在服务器上创建部署脚本：

```bash
# 在服务器上创建部署脚本
cat > /www/staking/scripts/deploy-reward-adjuster.sh << 'SCRIPT_EOF'
#!/bin/bash

set -e

echo "=========================================="
echo "   部署动态奖励率调整服务"
echo "=========================================="

# 1. 进入项目目录
cd /www/staking
echo "[1/5] 进入项目目录..."

# 2. 拉取最新代码
echo "[2/5] 拉取最新代码..."
git pull origin main

# 3. 进入 scripts 目录
cd scripts
echo "[3/5] 进入 scripts 目录..."

# 4. 安装依赖
echo "[4/5] 安装依赖..."
pnpm install

# 5. 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "[5/5] 创建 .env 文件..."
    cp env.example .env
    echo "⚠️  请手动编辑 .env 文件，填入配置信息："
    echo "   nano .env"
    echo ""
    echo "然后运行："
    echo "   pm2 start dynamic-reward-adjuster.js --name reward-adjuster"
    echo "   pm2 save"
else
    echo "[5/5] .env 文件已存在，跳过创建"
    echo ""
    echo "✅ 部署完成！"
    echo ""
    echo "启动服务："
    echo "   pm2 start dynamic-reward-adjuster.js --name reward-adjuster"
    echo "   pm2 save"
fi

echo "=========================================="
SCRIPT_EOF

chmod +x /www/staking/scripts/deploy-reward-adjuster.sh
```

### 使用部署脚本

```bash
/www/staking/scripts/deploy-reward-adjuster.sh
```

## 方式 4：使用密钥管理服务（高级）

### 使用 HashiCorp Vault 或其他密钥管理服务

```javascript
// 修改 dynamic-reward-adjuster.js，从密钥管理服务读取
const vault = require('node-vault')({ endpoint: 'http://vault:8200' });

async function getSecrets() {
    const result = await vault.read('secret/data/reward-adjuster');
    return result.data.data;
}
```

## 推荐方案

**对于你的情况，推荐使用方式 1（手动创建 .env 文件）**，因为：
1. ✅ 简单直接
2. ✅ 安全性好（文件权限设置为 600）
3. ✅ 易于维护
4. ✅ 不需要额外的服务

## 安全建议

1. **文件权限**：确保 `.env` 文件权限为 600（仅所有者可读写）
   ```bash
   chmod 600 .env
   ```

2. **不要提交到 Git**：确保 `.gitignore` 包含 `.env`
   ```bash
   echo ".env" >> .gitignore
   ```

3. **备份私钥**：将私钥安全备份（使用密码管理器或硬件钱包）

4. **使用专用账户**：建议使用专门的账户运行服务，而不是 root

5. **定期轮换**：定期更换私钥（如果可能）

## 完整部署流程示例

```bash
# 1. SSH 连接到服务器
ssh root@206.238.197.207

# 2. 进入项目目录
cd /www/staking

# 3. 拉取最新代码
git pull origin main

# 4. 进入 scripts 目录
cd scripts

# 5. 安装依赖
pnpm install

# 6. 创建 .env 文件
nano .env
# 在编辑器中填入配置，保存退出

# 7. 设置文件权限
chmod 600 .env

# 8. 测试运行（可选）
node dynamic-reward-adjuster.js
# 按 Ctrl+C 停止

# 9. 使用 PM2 启动
pm2 start dynamic-reward-adjuster.js --name reward-adjuster
pm2 save

# 10. 查看日志
pm2 logs reward-adjuster

# 11. 查看状态
pm2 status
```

## 更新服务

当代码更新后：

```bash
# 1. 拉取最新代码
cd /www/staking
git pull origin main

# 2. 重启服务
cd scripts
pm2 restart reward-adjuster
```

## 监控和维护

```bash
# 查看日志
pm2 logs reward-adjuster

# 查看最近 100 行日志
pm2 logs reward-adjuster --lines 100

# 查看服务状态
pm2 status

# 重启服务
pm2 restart reward-adjuster

# 停止服务
pm2 stop reward-adjuster

# 删除服务
pm2 delete reward-adjuster
```

