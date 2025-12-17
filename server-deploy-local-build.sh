#!/bin/bash
# 服务器端部署脚本 - 用于接收本地构建产物后的服务器配置
# 使用方法: bash server-deploy-local-build.sh

set -e

echo "========================================"
echo "  服务器端部署脚本"
echo "========================================"
echo ""

# 配置
DEPLOY_PATH="/www/staking/apps/web"
SERVICE_NAME="staking-web"
APP_PORT="5000"

# 检查环境
echo "[1/6] 检查环境..."
if ! command -v node &> /dev/null; then
    echo "错误: 未找到 Node.js"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "错误: 未找到 pnpm，正在安装..."
    npm install -g pnpm@10.13.1
fi

if ! command -v pm2 &> /dev/null; then
    echo "错误: 未找到 PM2，正在安装..."
    npm install -g pm2
fi

NODE_VERSION=$(node -v)
PNPM_VERSION=$(pnpm -v)
PM2_VERSION=$(pm2 -v)
echo "  Node.js: $NODE_VERSION"
echo "  pnpm: $PNPM_VERSION"
echo "  PM2: $PM2_VERSION"
echo ""

# 检查部署目录
echo "[2/6] 检查部署目录..."
if [ ! -d "$DEPLOY_PATH" ]; then
    echo "  创建部署目录: $DEPLOY_PATH"
    mkdir -p "$DEPLOY_PATH"
fi

cd "$DEPLOY_PATH"
echo "  当前目录: $(pwd)"
echo ""

# 检查关键文件
echo "[3/6] 检查关键文件..."
if [ ! -f "package.json" ]; then
    echo "  错误: package.json 不存在"
    echo "  请先上传 package.json 文件"
    exit 1
fi

if [ ! -d ".next" ]; then
    echo "  错误: .next 目录不存在"
    echo "  请先上传构建产物 .next 目录"
    exit 1
fi

echo "  ✓ package.json 存在"
echo "  ✓ .next 目录存在"
echo ""

# 安装依赖
echo "[4/6] 安装生产依赖..."
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo "  执行 pnpm install --prod..."
    pnpm install --prod --frozen-lockfile
    echo "  依赖安装完成"
else
    echo "  依赖已是最新，跳过安装"
fi
echo ""

# 停止旧服务
echo "[5/6] 管理 PM2 服务..."
if pm2 list | grep -q "$SERVICE_NAME"; then
    echo "  停止旧服务..."
    pm2 stop "$SERVICE_NAME" 2>/dev/null || true
    pm2 delete "$SERVICE_NAME" 2>/dev/null || true
fi

# 启动服务
echo "  启动新服务..."
export NODE_ENV=production
pm2 start "pnpm start -- -p $APP_PORT" --name "$SERVICE_NAME"

# 保存配置
pm2 save

echo "  服务已启动"
echo ""

# 验证服务
echo "[6/6] 验证服务..."
sleep 2

# 检查 PM2 状态
if pm2 list | grep -q "$SERVICE_NAME.*online"; then
    echo "  ✓ PM2 服务运行正常"
else
    echo "  ✗ PM2 服务状态异常"
    echo "  查看日志: pm2 logs $SERVICE_NAME"
fi

# 检查端口
if netstat -tlnp 2>/dev/null | grep -q ":$APP_PORT " || ss -tlnp 2>/dev/null | grep -q ":$APP_PORT "; then
    echo "  ✓ 端口 $APP_PORT 正在监听"
else
    echo "  ✗ 端口 $APP_PORT 未监听"
fi

# 测试本地访问
if curl -s -o /dev/null -w "%{http_code}" http://localhost:$APP_PORT | grep -q "200\|301\|302"; then
    echo "  ✓ 本地访问正常"
else
    echo "  ✗ 本地访问异常"
    echo "  查看日志: pm2 logs $SERVICE_NAME"
fi

echo ""

# 显示服务信息
echo "========================================"
echo "  部署完成！"
echo "========================================"
echo ""
echo "服务信息:"
echo "  名称: $SERVICE_NAME"
echo "  端口: $APP_PORT"
echo "  路径: $DEPLOY_PATH"
echo ""
echo "常用命令:"
echo "  查看状态: pm2 list"
echo "  查看日志: pm2 logs $SERVICE_NAME"
echo "  重启服务: pm2 restart $SERVICE_NAME"
echo "  停止服务: pm2 stop $SERVICE_NAME"
echo ""
echo "访问地址:"
echo "  本地: http://localhost:$APP_PORT"
echo "  域名: https://staking.nbblocks.cc"
echo ""

