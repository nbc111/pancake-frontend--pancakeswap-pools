#!/bin/bash
# 本地构建部署脚本 (Linux/macOS)
# 使用方法: ./deploy-local-build.sh

set -e

# 配置
SERVER_IP="206.238.197.207"
SERVER_USER="root"
SERVER_PATH="/www/staking/apps/web"
SKIP_BUILD=false
SKIP_UPLOAD=false

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-upload)
            SKIP_UPLOAD=true
            shift
            ;;
        *)
            echo "未知参数: $1"
            exit 1
            ;;
    esac
done

echo "========================================"
echo "  本地构建部署脚本"
echo "========================================"
echo ""

# 检查环境
echo "[1/7] 检查环境..."
if ! command -v node &> /dev/null; then
    echo "错误: 未找到 Node.js，请先安装 Node.js >= 18.20.0"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "错误: 未找到 pnpm，请先安装: npm install -g pnpm@10.13.1"
    exit 1
fi

NODE_VERSION=$(node -v)
PNPM_VERSION=$(pnpm -v)
echo "  Node.js: $NODE_VERSION"
echo "  pnpm: $PNPM_VERSION"
echo ""

# 更新代码
echo "[2/7] 更新代码..."
if [ -d .git ]; then
    echo "  拉取最新代码..."
    git fetch origin
    git checkout main
    git pull origin main
    echo "  代码已更新"
else
    echo "  警告: 未检测到 .git 目录，跳过代码更新"
fi
echo ""

# 安装依赖
echo "[3/7] 安装依赖..."
if [ "$SKIP_BUILD" = false ]; then
    echo "  执行 pnpm install..."
    pnpm install --frozen-lockfile
    echo "  依赖安装完成"
else
    echo "  跳过依赖安装"
fi
echo ""

# 构建项目
echo "[4/7] 构建项目..."
if [ "$SKIP_BUILD" = false ]; then
    echo "  执行构建（这可能需要几分钟）..."
    pnpm build --filter=web...
    
    # 检查构建产物
    if [ ! -d "apps/web/.next" ]; then
        echo "  错误: 构建产物不存在"
        exit 1
    fi
    echo "  构建完成"
else
    echo "  跳过构建"
fi
echo ""

# 上传文件
echo "[5/7] 上传构建产物到服务器..."
if [ "$SKIP_UPLOAD" = false ]; then
    echo "  服务器: ${SERVER_USER}@${SERVER_IP}"
    echo "  目标路径: ${SERVER_PATH}"
    echo ""
    
    # 检查 SSH 连接
    echo "  测试 SSH 连接..."
    if ! ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 "${SERVER_USER}@${SERVER_IP}" "echo '连接成功'" &> /dev/null; then
        echo "  错误: 无法连接到服务器"
        echo "  请检查:"
        echo "    1. 服务器 IP 是否正确: $SERVER_IP"
        echo "    2. 网络连接是否正常"
        echo "    3. SSH 服务是否运行"
        exit 1
    fi
    echo "  SSH 连接成功"
    echo ""
    
    # 上传 package.json 和配置文件
    echo "  上传配置文件..."
    scp -o StrictHostKeyChecking=no "apps/web/package.json" "${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/" || true
    if [ -f "apps/web/next.config.mjs" ]; then
        scp -o StrictHostKeyChecking=no "apps/web/next.config.mjs" "${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/" || true
    fi
    echo "  配置文件上传完成"
    
    # 上传构建产物
    echo "  上传构建产物 .next 目录（这可能需要几分钟）..."
    scp -r -o StrictHostKeyChecking=no "apps/web/.next" "${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/" || {
        echo "  错误: 上传失败"
        exit 1
    }
    echo "  构建产物上传完成"
else
    echo "  跳过上传"
fi
echo ""

# 服务器端操作提示
echo "[6/7] 服务器端操作..."
echo "  请 SSH 连接到服务器并执行以下命令:"
echo ""
echo "  ssh ${SERVER_USER}@${SERVER_IP}"
echo ""
echo "  # 进入目录"
echo "  cd ${SERVER_PATH}"
echo ""
echo "  # 安装生产依赖（如果需要）"
echo "  pnpm install --prod --frozen-lockfile"
echo ""
echo "  # 重启服务"
echo "  pm2 restart staking-web"
echo ""
echo "  # 查看日志"
echo "  pm2 logs staking-web --lines 50"
echo ""

# 完成
echo "[7/7] 部署完成！"
echo ""
echo "========================================"
echo "  访问地址:"
echo "  - HTTPS: https://staking.nbblocks.cc"
echo "  - HTTP:  http://staking.nbblocks.cc"
echo "========================================"
echo ""

