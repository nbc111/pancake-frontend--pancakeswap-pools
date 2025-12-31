#!/bin/bash

# 动态奖励率调整服务部署脚本
# 在服务器上运行此脚本来部署服务

set -e

echo "=========================================="
echo "   部署动态奖励率调整服务"
echo "=========================================="

# 检查是否在正确的目录
if [ ! -f "dynamic-reward-adjuster.js" ]; then
    echo "❌ 错误：请在 scripts 目录下运行此脚本"
    exit 1
fi

# 1. 安装依赖
echo ""
echo "[1/4] 检查并安装依赖..."
if [ ! -d "node_modules" ]; then
    echo "   安装依赖中..."
    pnpm install
else
    echo "   ✅ 依赖已安装"
fi

# 2. 检查 .env 文件
echo ""
echo "[2/4] 检查配置文件..."
if [ ! -f ".env" ]; then
    echo "   ⚠️  .env 文件不存在"
    if [ -f "env.example" ]; then
        echo "   从 env.example 创建 .env 文件..."
        cp env.example .env
        echo "   ✅ .env 文件已创建"
        echo ""
        echo "   ⚠️  重要：请编辑 .env 文件，填入以下配置："
        echo "      - PRIVATE_KEY: 合约 owner 的私钥"
        echo "      - STAKING_CONTRACT_ADDRESS: 质押合约地址"
        echo "      - 其他配置项（如需要）"
        echo ""
        echo "   编辑命令："
        echo "      nano .env"
        echo ""
        echo "   编辑完成后，设置文件权限："
        echo "      chmod 600 .env"
        echo ""
        echo "   然后重新运行此脚本，或直接启动服务："
        echo "      pm2 start dynamic-reward-adjuster.js --name reward-adjuster"
        exit 0
    else
        echo "   ❌ env.example 文件不存在，无法创建 .env"
        exit 1
    fi
else
    echo "   ✅ .env 文件已存在"
    # 检查文件权限
    PERM=$(stat -c "%a" .env 2>/dev/null || stat -f "%OLp" .env 2>/dev/null)
    if [ "$PERM" != "600" ]; then
        echo "   ⚠️  建议设置 .env 文件权限为 600（仅所有者可读写）"
        echo "   运行: chmod 600 .env"
    fi
fi

# 3. 检查 PM2
echo ""
echo "[3/4] 检查 PM2..."
if ! command -v pm2 &> /dev/null; then
    echo "   ⚠️  PM2 未安装"
    echo "   安装 PM2: npm install -g pm2"
    echo "   或直接运行: node dynamic-reward-adjuster.js"
else
    echo "   ✅ PM2 已安装"
fi

# 4. 检查服务是否已运行
echo ""
echo "[4/4] 检查服务状态..."
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "reward-adjuster"; then
        echo "   ⚠️  服务已在运行"
        echo "   查看状态: pm2 status"
        echo "   查看日志: pm2 logs reward-adjuster"
        echo "   重启服务: pm2 restart reward-adjuster"
    else
        echo "   ✅ 服务未运行，可以启动"
    fi
fi

echo ""
echo "=========================================="
echo "   部署检查完成"
echo "=========================================="
echo ""
echo "启动服务："
echo "  方式 1: pm2 start dynamic-reward-adjuster.js --name reward-adjuster"
echo "  方式 2: node dynamic-reward-adjuster.js"
echo ""
echo "管理服务："
echo "  查看日志: pm2 logs reward-adjuster"
echo "  查看状态: pm2 status"
echo "  重启服务: pm2 restart reward-adjuster"
echo "  停止服务: pm2 stop reward-adjuster"
echo "=========================================="

