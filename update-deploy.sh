#!/bin/bash

# 服务器端更新部署脚本
# 用于更新已部署在 /www/staking 的项目

set -e

DEPLOY_PATH="/www/staking"
GIT_BRANCH="main"
APP_PORT="5000"
PM2_NAME="pancake-staking"

echo "=========================================="
echo "   Pancake Staking 更新部署脚本"
echo "=========================================="
echo ""

# 检查部署目录是否存在
if [ ! -d "$DEPLOY_PATH" ]; then
    echo "   ✗ 部署目录不存在: $DEPLOY_PATH"
    exit 1
fi

echo "[1/6] 检查环境..."
if ! command -v node &> /dev/null; then
    echo "   ✗ Node.js 未安装"
    exit 1
fi
echo "   ✓ Node.js: $(node -v)"

if ! command -v pnpm &> /dev/null; then
    echo "   ✗ pnpm 未安装"
    exit 1
fi
echo "   ✓ pnpm: $(pnpm -v)"

if ! command -v pm2 &> /dev/null; then
    echo "   ✗ PM2 未安装"
    exit 1
fi
echo "   ✓ PM2: $(pm2 -v)"

echo ""
echo "[2/6] 进入部署目录并更新代码..."
cd $DEPLOY_PATH

# 检查是否是 git 仓库
if [ ! -d ".git" ]; then
    echo "   ✗ 不是 Git 仓库，无法更新"
    exit 1
fi

echo "   → 拉取最新代码..."
git fetch origin
git reset --hard origin/$GIT_BRANCH
git clean -fd
echo "   ✓ 代码已更新到最新版本"

# 显示最新提交
echo ""
echo "   最新提交:"
git log -1 --oneline

echo ""
echo "[3/6] 清理缓存..."
# 清理 .next 目录
find apps/web -type d -name ".next" -exec rm -rf {} + 2>/dev/null || true
# 清理 .turbo 目录
rm -rf .turbo 2>/dev/null || true
# 清理 node_modules/.cache
find . -type d -name ".cache" -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null || true
echo "   ✓ 缓存已清理"

echo ""
echo "[4/6] 重新安装依赖..."
export NODE_OPTIONS="--max-old-space-size=8192"
echo "   → 正在安装依赖（这可能需要几分钟）..."
pnpm install --frozen-lockfile
echo "   ✓ 依赖安装完成"

echo ""
echo "[5/6] 重新构建项目..."
export NODE_OPTIONS="--max-old-space-size=8192"
export NODE_ENV="production"
cd apps/web
echo "   → 正在构建项目（这可能需要几分钟）..."
pnpm next build --no-lint
echo "   ✓ 构建完成"

echo ""
echo "[6/6] 重启 PM2 服务..."
cd $DEPLOY_PATH/apps/web
pm2 restart $PM2_NAME || pm2 start "pnpm start" --name $PM2_NAME --cwd $DEPLOY_PATH/apps/web
pm2 save
echo "   ✓ PM2 服务已重启"

echo ""
echo "[完成] 检查服务状态..."
pm2 list | grep $PM2_NAME || echo "   ⚠ 服务未找到"
echo ""
pm2 logs $PM2_NAME --lines 10 --nostream

echo ""
echo "=========================================="
echo "   更新部署完成！"
echo "=========================================="
echo "   部署路径: $DEPLOY_PATH"
echo "   应用目录: $DEPLOY_PATH/apps/web"
echo "   服务端口: $APP_PORT"
echo "   PM2 名称: $PM2_NAME"
echo ""
echo "   查看日志: pm2 logs $PM2_NAME"
echo "   重启服务: pm2 restart $PM2_NAME"
echo "   服务状态: pm2 status"
echo "=========================================="

