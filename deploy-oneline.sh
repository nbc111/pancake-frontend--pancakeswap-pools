#!/bin/bash
# 单行部署命令 - 可以直接通过 SSH 执行
# 使用方法: ssh root@156.251.17.96 'bash -s' < deploy-oneline.sh

set -e
DEPLOY_PATH="/www/pancake-staking"
GIT_REPO="https://github.com/nbc111/pancake-frontend--pancakeswap-pools.git"
GIT_BRANCH="main"
APP_PORT="5000"

echo "=========================================="
echo "   Pancake Staking 部署脚本"
echo "=========================================="
echo ""

echo "[1/7] 检查环境..."
if ! command -v node &> /dev/null; then echo "   ✗ Node.js 未安装"; exit 1; fi
echo "   ✓ Node.js: $(node -v)"

if ! command -v pnpm &> /dev/null; then
    echo "   → pnpm 未安装，正在安装..."
    npm install -g pnpm@10.13.1
fi
echo "   ✓ pnpm: $(pnpm -v)"

if ! command -v pm2 &> /dev/null; then
    echo "   → PM2 未安装，正在安装..."
    npm install -g pm2
fi
echo "   ✓ PM2: $(pm2 -v)"

if ! command -v git &> /dev/null; then echo "   ✗ Git 未安装"; exit 1; fi
echo "   ✓ Git: $(git --version)"

echo ""
echo "[2/7] 创建部署目录..."
mkdir -p $DEPLOY_PATH && cd $DEPLOY_PATH
echo "   ✓ 目录: $DEPLOY_PATH"

echo ""
echo "[3/7] 克隆/更新代码..."
if [ -d ".git" ]; then
    echo "   → 更新代码..."
    git fetch origin && git reset --hard origin/$GIT_BRANCH && git clean -fd
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
pm2 delete pancake-staking 2>/dev/null || true
export NODE_ENV="production"
pm2 start "pnpm start -- -p $APP_PORT" --name pancake-staking
pm2 save
echo "   ✓ PM2 服务已启动"

echo ""
echo "[7/7] 检查服务状态..."
pm2 list | grep pancake-staking || echo "   ⚠ 服务未找到"
pm2 logs pancake-staking --lines 10 --nostream

echo ""
echo "=========================================="
echo "   部署完成！"
echo "=========================================="
echo "   访问地址: http://156.251.17.96:$APP_PORT"
echo "=========================================="

