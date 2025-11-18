#!/bin/bash

# 服务器端部署脚本
# 在服务器上直接运行此脚本进行部署

set -e

DEPLOY_PATH="/www/pancake-staking"
GIT_REPO="https://github.com/nbc111/pancake-frontend--pancakeswap-pools.git"
GIT_BRANCH="main"
APP_PORT="5000"

echo "=========================================="
echo "   Pancake Staking 部署脚本"
echo "=========================================="
echo ""

# 检查环境
echo "[1/7] 检查环境..."
if ! command -v node &> /dev/null; then
    echo "   ✗ Node.js 未安装"
    exit 1
fi
NODE_VERSION=$(node -v)
echo "   ✓ Node.js: $NODE_VERSION"

if ! command -v pnpm &> /dev/null; then
    echo "   → pnpm 未安装，正在安装..."
    npm install -g pnpm@10.13.1
fi
PNPM_VERSION=$(pnpm -v)
echo "   ✓ pnpm: $PNPM_VERSION"

if ! command -v pm2 &> /dev/null; then
    echo "   → PM2 未安装，正在安装..."
    npm install -g pm2
fi
PM2_VERSION=$(pm2 -v)
echo "   ✓ PM2: $PM2_VERSION"

if ! command -v git &> /dev/null; then
    echo "   ✗ Git 未安装"
    exit 1
fi
GIT_VERSION=$(git --version)
echo "   ✓ Git: $GIT_VERSION"

echo ""
echo "[2/7] 创建部署目录..."
mkdir -p $DEPLOY_PATH
cd $DEPLOY_PATH
echo "   ✓ 目录: $DEPLOY_PATH"

echo ""
echo "[3/7] 克隆/更新代码..."
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

echo ""
echo "[4/7] 安装依赖..."
export NODE_OPTIONS="--max-old-space-size=8192"
echo "   → 正在安装依赖（这可能需要几分钟）..."
pnpm install --frozen-lockfile
echo "   ✓ 依赖安装完成"

echo ""
echo "[5/7] 构建项目..."
export NODE_OPTIONS="--max-old-space-size=8192"
export NODE_ENV="production"
cd apps/web
echo "   → 正在构建项目（这可能需要几分钟）..."
pnpm next build --no-lint
echo "   ✓ 构建完成"

echo ""
echo "[6/7] 配置 PM2..."
# 停止现有服务
pm2 delete pancake-staking 2>/dev/null || true

# 启动新服务
export NODE_ENV="production"
pm2 start "pnpm start -- -p $APP_PORT" --name pancake-staking
pm2 save
echo "   ✓ PM2 服务已启动"

echo ""
echo "[7/7] 检查服务状态..."
pm2 list | grep pancake-staking || echo "   ⚠ 服务未找到"
echo ""
pm2 logs pancake-staking --lines 10 --nostream

echo ""
echo "=========================================="
echo "   部署完成！"
echo "=========================================="
echo "   访问地址: http://$(hostname -I | awk '{print $1}'):$APP_PORT"
echo "   查看日志: pm2 logs pancake-staking"
echo "   重启服务: pm2 restart pancake-staking"
echo "=========================================="

