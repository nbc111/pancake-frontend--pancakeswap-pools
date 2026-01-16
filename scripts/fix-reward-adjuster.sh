#!/bin/bash

# 修复和启动 dynamic-reward-adjuster.js 服务
# 使用方法: 在服务器上执行: bash fix-reward-adjuster.sh

set -e

echo "=========================================="
echo "   修复和启动 reward-adjuster 服务"
echo "=========================================="
echo ""

# 1. 进入项目目录
echo "📂 [1/7] 进入项目目录..."
cd /www/staking || { echo "❌ 错误: /www/staking 目录不存在"; exit 1; }
echo "✅ 当前目录: $(pwd)"
echo ""

# 2. 拉取最新代码
echo "📥 [2/7] 拉取最新代码..."
git pull origin main || git pull origin master || echo "⚠️  Git 拉取失败，继续使用当前代码"
echo ""

# 3. 进入 scripts 目录
echo "📂 [3/7] 进入 scripts 目录..."
cd scripts || { echo "❌ 错误: scripts 目录不存在"; exit 1; }
echo "✅ 当前目录: $(pwd)"
echo ""

# 4. 检查 .env 文件
echo "🔐 [4/7] 检查环境变量配置..."
if [ ! -f ".env" ]; then
    echo "⚠️  .env 文件不存在，创建示例文件..."
    if [ -f "env.example" ]; then
        cp env.example .env
        echo "✅ 已创建 .env 文件，请手动编辑配置:"
        echo "   nano .env"
        echo ""
        echo "   必需的配置项:"
        echo "   - RPC_URL=https://rpc.nbcex.com"
        echo "   - PRIVATE_KEY=0x你的私钥"
        echo "   - STAKING_CONTRACT_ADDRESS=0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789"
        echo "   - TOTAL_STAKED_NBC=1000000000000000000000000"
        echo "   - TARGET_APR=100"
        echo ""
        read -p "按 Enter 继续（请确保已配置 .env 文件）..."
    else
        echo "❌ env.example 文件不存在，无法创建 .env"
        exit 1
    fi
else
    echo "✅ .env 文件存在"
    # 检查必要的配置项
    if grep -q "RPC_URL=" .env && grep -q "PRIVATE_KEY=" .env && grep -q "STAKING_CONTRACT_ADDRESS=" .env; then
        echo "✅ 必要的配置项已设置"
    else
        echo "⚠️  警告: .env 文件中可能缺少必要的配置项"
    fi
fi
echo ""

# 5. 安装依赖（如果需要）
echo "📦 [5/7] 检查依赖..."
if [ -f "package.json" ]; then
    if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
        echo "安装依赖..."
        pnpm install || npm install || echo "⚠️  依赖安装失败，继续..."
    else
        echo "✅ 依赖已安装"
    fi
else
    echo "⚠️  package.json 不存在，跳过依赖安装"
fi
echo ""

# 6. 停止旧服务（如果存在）
echo "🛑 [6/7] 停止旧服务（如果存在）..."
pm2 delete reward-adjuster 2>/dev/null && echo "✅ 已停止旧服务" || echo "ℹ️  服务不存在，跳过"
echo ""

# 7. 启动服务
echo "🚀 [7/7] 启动 reward-adjuster 服务..."
cd /www/staking/scripts
pm2 start dynamic-reward-adjuster.js --name reward-adjuster || {
    echo "❌ 服务启动失败"
    echo ""
    echo "💡 尝试手动启动:"
    echo "   cd /www/staking/scripts"
    echo "   node dynamic-reward-adjuster.js"
    echo ""
    exit 1
}

# 保存 PM2 配置
pm2 save

echo ""
echo "✅ 服务已启动！"
echo ""

# 显示服务状态
echo "📊 服务状态:"
pm2 status reward-adjuster

echo ""
echo "📝 查看日志（最后 20 行）:"
pm2 logs reward-adjuster --lines 20 --nostream

echo ""
echo "=========================================="
echo "   修复完成"
echo "=========================================="
echo ""
echo "💡 后续操作:"
echo "   - 查看实时日志: pm2 logs reward-adjuster"
echo "   - 查看服务状态: pm2 status reward-adjuster"
echo "   - 重启服务: pm2 restart reward-adjuster"
echo "   - 停止服务: pm2 stop reward-adjuster"
echo ""
