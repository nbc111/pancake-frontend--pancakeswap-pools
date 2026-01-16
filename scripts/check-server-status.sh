#!/bin/bash

# 检查服务器上 dynamic-reward-adjuster.js 的运行状态
# 使用方法: 在服务器上执行: bash check-server-status.sh

set -e

echo "=========================================="
echo "   检查 dynamic-reward-adjuster.js 状态"
echo "=========================================="
echo ""

# 1. 检查 PM2 服务状态
echo "📋 [1/6] 检查 PM2 服务状态..."
echo "----------------------------------------"
pm2 list | grep reward-adjuster || echo "⚠️  reward-adjuster 服务未运行"
echo ""

# 2. 查看服务详细信息
echo "📊 [2/6] 查看服务详细信息..."
echo "----------------------------------------"
pm2 status reward-adjuster 2>/dev/null || echo "⚠️  服务不存在"
echo ""

# 3. 查看最近日志
echo "📝 [3/6] 查看最近日志（最后 30 行）..."
echo "----------------------------------------"
pm2 logs reward-adjuster --lines 30 --nostream 2>/dev/null || echo "⚠️  无法获取日志"
echo ""

# 4. 检查脚本文件是否存在
echo "📂 [4/6] 检查脚本文件..."
echo "----------------------------------------"
if [ -f "/www/staking/scripts/dynamic-reward-adjuster.js" ]; then
    echo "✅ 脚本文件存在: /www/staking/scripts/dynamic-reward-adjuster.js"
    echo "   文件大小: $(du -h /www/staking/scripts/dynamic-reward-adjuster.js | cut -f1)"
    echo "   最后修改: $(stat -c %y /www/staking/scripts/dynamic-reward-adjuster.js 2>/dev/null || stat -f %Sm /www/staking/scripts/dynamic-reward-adjuster.js)"
else
    echo "❌ 脚本文件不存在: /www/staking/scripts/dynamic-reward-adjuster.js"
fi
echo ""

# 5. 检查 .env 文件
echo "🔐 [5/6] 检查环境变量配置..."
echo "----------------------------------------"
if [ -f "/www/staking/scripts/.env" ]; then
    echo "✅ .env 文件存在"
    echo "   配置项:"
    grep -E "^(RPC_URL|STAKING_CONTRACT_ADDRESS|TOTAL_STAKED_NBC|TARGET_APR|UPDATE_INTERVAL)=" /www/staking/scripts/.env 2>/dev/null | sed 's/=.*/=***/' || echo "   ⚠️  无法读取配置"
else
    echo "❌ .env 文件不存在"
fi
echo ""

# 6. 检查合约中的 rewardRate（如果 check-staking-data.js 存在）
echo "📊 [6/6] 检查合约中的 rewardRate..."
echo "----------------------------------------"
if [ -f "/www/staking/scripts/check-staking-data.js" ]; then
    echo "执行 check-staking-data.js..."
    cd /www/staking/scripts
    node check-staking-data.js 2>/dev/null | head -50 || echo "⚠️  无法执行检查脚本"
else
    echo "⚠️  check-staking-data.js 不存在"
fi
echo ""

# 总结
echo "=========================================="
echo "   检查完成"
echo "=========================================="
echo ""
echo "💡 下一步操作建议:"
echo ""
echo "1. 如果服务未运行，启动服务:"
echo "   cd /www/staking/scripts"
echo "   pm2 start dynamic-reward-adjuster.js --name reward-adjuster"
echo "   pm2 save"
echo ""
echo "2. 如果服务运行但有问题，重启服务:"
echo "   pm2 restart reward-adjuster"
echo ""
echo "3. 查看完整日志:"
echo "   pm2 logs reward-adjuster"
echo ""
echo "4. 手动触发一次更新（如果需要）:"
echo "   cd /www/staking/scripts"
echo "   node reset-reward-rate.js --pool BTC --target-apr 100 --expected-staked 1000000 --execute"
echo ""
echo "5. 实时监控日志:"
echo "   pm2 logs reward-adjuster --lines 0"
echo ""
