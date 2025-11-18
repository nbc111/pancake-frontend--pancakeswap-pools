# 快速部署脚本
$ErrorActionPreference = "Continue"

$SERVER_IP = "156.251.17.96"
$SERVER_USER = "root"
$SERVER_PASSWORD = "Tk%Cv7AgMwpIv&Z"
$DEPLOY_PATH = "/www/pancake-staking"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Pancake Staking 部署脚本" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 部署命令
$deployCommands = @"
cd $DEPLOY_PATH || mkdir -p $DEPLOY_PATH && cd $DEPLOY_PATH
if [ -d .git ]; then
    echo '[3/7] 更新代码...'
    git fetch origin
    git reset --hard origin/main
    git clean -fd
else
    echo '[3/7] 克隆代码...'
    git clone -b main https://github.com/nbc111/pancake-frontend--pancakeswap-pools.git .
fi
echo '[4/7] 安装依赖...'
export NODE_OPTIONS='--max-old-space-size=8192'
pnpm install --frozen-lockfile
echo '[5/7] 构建项目...'
cd apps/web
export NODE_ENV='production'
pnpm next build --no-lint
echo '[6/7] 启动服务...'
pm2 delete pancake-staking 2>/dev/null || true
pm2 start 'pnpm start -- -p 5000' --name pancake-staking
pm2 save
pm2 list
"@

Write-Host "正在连接到服务器..." -ForegroundColor Yellow
Write-Host "服务器: $SERVER_IP" -ForegroundColor Gray
Write-Host "路径: $DEPLOY_PATH" -ForegroundColor Gray
Write-Host ""

# 使用 plink (PuTTY) 或直接 SSH
# 由于密码包含特殊字符，我们需要使用不同的方法

# 方法：使用 expect 脚本或直接提示用户手动执行
Write-Host "由于密码包含特殊字符，建议手动执行以下步骤：" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 连接到服务器：" -ForegroundColor Cyan
Write-Host "   ssh root@$SERVER_IP" -ForegroundColor White
Write-Host "   密码: $SERVER_PASSWORD" -ForegroundColor Gray
Write-Host ""
Write-Host "2. 在服务器上执行以下命令：" -ForegroundColor Cyan
Write-Host $deployCommands -ForegroundColor White
Write-Host ""

# 或者尝试使用 PowerShell 的 SSH（如果可用）
try {
    # 检查是否有 SSH 客户端
    $sshPath = Get-Command ssh -ErrorAction SilentlyContinue
    if ($sshPath) {
        Write-Host "检测到 SSH 客户端，尝试自动部署..." -ForegroundColor Green
        
        # 创建临时脚本文件
        $tempScript = Join-Path $env:TEMP "deploy-$(Get-Date -Format 'yyyyMMddHHmmss').sh"
        $deployCommands | Out-File -FilePath $tempScript -Encoding UTF8 -NoNewline
        
        Write-Host "已将部署脚本保存到: $tempScript" -ForegroundColor Green
        Write-Host "请手动执行以下命令：" -ForegroundColor Yellow
        Write-Host "  scp $tempScript root@${SERVER_IP}:/tmp/deploy.sh" -ForegroundColor White
        Write-Host "  ssh root@${SERVER_IP} 'bash /tmp/deploy.sh'" -ForegroundColor White
    }
} catch {
    Write-Host "无法自动执行，请按照上述步骤手动部署" -ForegroundColor Yellow
}

