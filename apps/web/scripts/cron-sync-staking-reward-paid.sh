#!/usr/bin/env bash
# 远程服务器 crontab：每日北京时间 12:00 增量同步 RewardPaid 并自动生成返佣行。
#
# 用法（在 crontab 里设置环境变量，或先 export）：
#   export BASE_URL="https://你的域名"
#   export REFERRAL_ADMIN_SECRET="与 Next 环境变量一致"
#
# 服务器时区为 Asia/Shanghai 时（推荐）：
#   0 12 * * * /path/to/apps/web/scripts/cron-sync-staking-reward-paid.sh >>/var/log/staking-reward-sync.log 2>&1
#
# 服务器为 UTC 时，北京时间 12:00 = UTC 04:00：
#   0 4 * * * TZ=UTC /path/to/apps/web/scripts/cron-sync-staking-reward-paid.sh >>/var/log/staking-reward-sync.log 2>&1
#
# 亦可在同一台机跑 Node 应用时用：cd apps/web && BASE_URL=http://127.0.0.1:5000 REFERRAL_ADMIN_SECRET=xxx pnpm staking:index-rewards
# （会多打一次 GET 状态；本脚本仅 POST 同步，更适合 cron。）

set -euo pipefail

: "${BASE_URL:?set BASE_URL to your deployed origin, e.g. https://example.com}"
: "${REFERRAL_ADMIN_SECRET:?set REFERRAL_ADMIN_SECRET to match server env}"

ORIGIN="${BASE_URL%/}"
URL="${ORIGIN}/api/referral/admin/sync-staking-reward-paid"

curl -sS -f -X POST \
  -H "Authorization: Bearer ${REFERRAL_ADMIN_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{}' \
  "$URL"

echo ""
