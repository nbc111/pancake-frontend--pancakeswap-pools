#!/bin/bash

# 更新服务器上的 reward-adjuster 脚本
# 使用方法: ./update-reward-adjuster.sh

set -e

echo "=========================================="
echo "   更新 reward-adjuster 脚本"
echo "=========================================="
echo ""

# 检查是否在正确的目录
if [ ! -f "scripts/dynamic-reward-adjuster.js" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 服务器信息
SERVER="root@206.238.197.207"
STAKING_DIR="/www/staking"
SCRIPTS_DIR="$STAKING_DIR/scripts"

echo "📋 更新步骤:"
echo "   1. 在服务器上拉取最新代码"
echo "   2. 检查 PM2 服务状态"
echo "   3. 重启 reward-adjuster 服务（如果需要）"
echo "   4. 验证更新"
echo ""

echo "🔗 连接到服务器: $SERVER"
echo ""

# 执行更新命令
ssh $SERVER << 'ENDSSH'
set -e

echo "📂 进入项目目录..."
cd /www/staking

echo ""
echo "📥 拉取最新代码..."
git pull origin main || git pull origin master

echo ""
echo "📋 检查 PM2 服务状态..."
pm2 list | grep reward-adjuster || echo "⚠️  reward-adjuster 服务未运行"

echo ""
echo "🔄 重启 reward-adjuster 服务..."
pm2 restart reward-adjuster || echo "⚠️  服务不存在，可能需要手动启动"

echo ""
echo "📊 查看服务状态..."
pm2 status reward-adjuster

echo ""
echo "📝 查看最近日志（最后 20 行）..."
pm2 logs reward-adjuster --lines 20 --nostream || echo "⚠️  无法获取日志"

echo ""
echo "✅ 更新完成！"
echo ""
echo "💡 提示:"
echo "   - 查看完整日志: pm2 logs reward-adjuster"
echo "   - 查看服务状态: pm2 status reward-adjuster"
echo "   - 手动触发更新: cd /www/staking/scripts && node reset-reward-rate.js --pool BTC --target-apr 100 --expected-staked 1000000 --execute"

ENDSSH

echo ""
echo "=========================================="
echo "   更新完成"
echo "=========================================="
