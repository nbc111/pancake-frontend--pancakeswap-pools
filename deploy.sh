#!/bin/bash

# 部署脚本 - 将项目部署到远程服务器
# 使用方法: ./deploy.sh

set -e

# 配置信息
SERVER_IP="156.251.17.96"
SERVER_USER="root"
SERVER_PASSWORD="Tk%Cv7AgMwpIv&Z"
DEPLOY_PATH="/www/pancake-staking"
GIT_REPO="https://github.com/nbc111/pancake-frontend--pancakeswap-pools.git"
GIT_BRANCH="main"
APP_PORT="5000"

echo "=========================================="
echo "   Pancake Staking 部署脚本"
echo "=========================================="
echo ""

# 检查 sshpass 是否安装
if ! command -v sshpass &> /dev/null; then
    echo "错误: 需要安装 sshpass"
    echo "Ubuntu/Debian: sudo apt-get install sshpass"
    echo "macOS: brew install hudochenkov/sshpass/sshpass"
    exit 1
fi

# SSH 连接函数
ssh_exec() {
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "$@"
}

# SCP 传输函数
scp_exec() {
    sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no "$@"
}

echo "[1/8] 检查服务器连接..."
if ssh_exec "echo 'Connection successful'"; then
    echo "   ✓ 服务器连接成功"
else
    echo "   ✗ 无法连接到服务器"
    exit 1
fi

echo ""
echo "[2/8] 检查服务器环境..."
ssh_exec << 'ENDSSH'
    # 检查 Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        echo "   ✓ Node.js: $NODE_VERSION"
    else
        echo "   ✗ Node.js 未安装"
        exit 1
    fi
    
    # 检查 pnpm
    if command -v pnpm &> /dev/null; then
        PNPM_VERSION=$(pnpm -v)
        echo "   ✓ pnpm: $PNPM_VERSION"
    else
        echo "   ✗ pnpm 未安装，正在安装..."
        npm install -g pnpm@10.13.1
    fi
    
    # 检查 PM2
    if command -v pm2 &> /dev/null; then
        PM2_VERSION=$(pm2 -v)
        echo "   ✓ PM2: $PM2_VERSION"
    else
        echo "   ✗ PM2 未安装，正在安装..."
        npm install -g pm2
    fi
    
    # 检查 Git
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version)
        echo "   ✓ Git: $GIT_VERSION"
    else
        echo "   ✗ Git 未安装"
        exit 1
    fi
ENDSSH

echo ""
echo "[3/8] 创建部署目录..."
ssh_exec "mkdir -p $DEPLOY_PATH && echo '   ✓ 目录已创建'"

echo ""
echo "[4/8] 克隆/更新代码..."
ssh_exec << ENDSSH
    cd $DEPLOY_PATH
    if [ -d ".git" ]; then
        echo "   → 更新代码..."
        git fetch origin
        git reset --hard origin/$GIT_BRANCH
        git clean -fd
        echo "   ✓ 代码已更新"
    else
        echo "   → 克隆代码..."
        git clone -b $GIT_BRANCH $GIT_REPO .
        echo "   ✓ 代码已克隆"
    fi
ENDSSH

echo ""
echo "[5/8] 安装依赖..."
ssh_exec << ENDSSH
    cd $DEPLOY_PATH
    export NODE_OPTIONS="--max-old-space-size=8192"
    echo "   → 正在安装依赖（这可能需要几分钟）..."
    pnpm install --frozen-lockfile
    echo "   ✓ 依赖安装完成"
ENDSSH

echo ""
echo "[6/8] 构建项目..."
ssh_exec << ENDSSH
    cd $DEPLOY_PATH
    export NODE_OPTIONS="--max-old-space-size=8192"
    export NODE_ENV="production"
    echo "   → 正在构建项目（这可能需要几分钟）..."
    cd apps/web
    pnpm next build --no-lint
    echo "   ✓ 构建完成"
ENDSSH

echo ""
echo "[7/8] 配置 PM2..."
ssh_exec << ENDSSH
    cd $DEPLOY_PATH/apps/web
    
    # 停止现有服务
    pm2 delete pancake-staking 2>/dev/null || true
    
    # 启动新服务
    export NODE_ENV="production"
    pm2 start "pnpm start -- -p $APP_PORT" --name pancake-staking
    pm2 save
    echo "   ✓ PM2 服务已启动"
ENDSSH

echo ""
echo "[8/8] 检查服务状态..."
ssh_exec "pm2 list | grep pancake-staking || echo '   ⚠ 服务未找到'"
ssh_exec "pm2 logs pancake-staking --lines 10 --nostream"

echo ""
echo "=========================================="
echo "   部署完成！"
echo "=========================================="
echo "   访问地址: http://$SERVER_IP:$APP_PORT"
echo "   查看日志: ssh $SERVER_USER@$SERVER_IP 'pm2 logs pancake-staking'"
echo "   重启服务: ssh $SERVER_USER@$SERVER_IP 'pm2 restart pancake-staking'"
echo "=========================================="

