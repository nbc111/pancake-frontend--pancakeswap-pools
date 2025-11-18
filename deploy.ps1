# 部署脚本 - 将项目部署到远程服务器 (PowerShell版本)
# 使用方法: .\deploy.ps1

$ErrorActionPreference = "Stop"

# 配置信息
$SERVER_IP = "156.251.17.96"
$SERVER_USER = "root"
$SERVER_PASSWORD = "Tk%Cv7AgMwpIv&Z"
$DEPLOY_PATH = "/www/pancake-staking"
$GIT_REPO = "https://github.com/nbc111/pancake-frontend--pancakeswap-pools.git"
$GIT_BRANCH = "main"
$APP_PORT = "5000"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Pancake Staking 部署脚本" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Posh-SSH 模块
if (-not (Get-Module -ListAvailable -Name Posh-SSH)) {
    Write-Host "[提示] 需要安装 Posh-SSH 模块" -ForegroundColor Yellow
    Write-Host "安装命令: Install-Module -Name Posh-SSH -Scope CurrentUser" -ForegroundColor Yellow
    Write-Host ""
    $install = Read-Host "是否现在安装? (Y/N)"
    if ($install -eq "Y" -or $install -eq "y") {
        Install-Module -Name Posh-SSH -Scope CurrentUser -Force
    } else {
        Write-Host "请先安装 Posh-SSH 模块" -ForegroundColor Red
        exit 1
    }
}

Import-Module Posh-SSH

# 创建安全密码对象
$SecurePassword = ConvertTo-SecureString $SERVER_PASSWORD -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($SERVER_USER, $SecurePassword)

Write-Host "[1/8] 检查服务器连接..." -ForegroundColor Yellow
try {
    $Session = New-SSHSession -ComputerName $SERVER_IP -Credential $Credential -AcceptKey
    if ($Session) {
        Write-Host "   ✓ 服务器连接成功" -ForegroundColor Green
    }
} catch {
    Write-Host "   ✗ 无法连接到服务器: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/8] 检查服务器环境..." -ForegroundColor Yellow
$envCheck = Invoke-SSHCommand -SessionId $Session.SessionId -Command @"
    # 检查 Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=\$(node -v)
        echo "   ✓ Node.js: \$NODE_VERSION"
    else
        echo "   ✗ Node.js 未安装"
        exit 1
    fi
    
    # 检查 pnpm
    if command -v pnpm &> /dev/null; then
        PNPM_VERSION=\$(pnpm -v)
        echo "   ✓ pnpm: \$PNPM_VERSION"
    else
        echo "   → pnpm 未安装，正在安装..."
        npm install -g pnpm@10.13.1
    fi
    
    # 检查 PM2
    if command -v pm2 &> /dev/null; then
        PM2_VERSION=\$(pm2 -v)
        echo "   ✓ PM2: \$PM2_VERSION"
    else
        echo "   → PM2 未安装，正在安装..."
        npm install -g pm2
    fi
    
    # 检查 Git
    if command -v git &> /dev/null; then
        GIT_VERSION=\$(git --version)
        echo "   ✓ Git: \$GIT_VERSION"
    else
        echo "   ✗ Git 未安装"
        exit 1
    fi
"@

Write-Host $envCheck.Output

Write-Host ""
Write-Host "[3/8] 创建部署目录..." -ForegroundColor Yellow
$mkdirResult = Invoke-SSHCommand -SessionId $Session.SessionId -Command "mkdir -p $DEPLOY_PATH && echo '   ✓ 目录已创建'"
Write-Host $mkdirResult.Output

Write-Host ""
Write-Host "[4/8] 克隆/更新代码..." -ForegroundColor Yellow
$gitResult = Invoke-SSHCommand -SessionId $Session.SessionId -Command @"
    cd $DEPLOY_PATH
    if [ -d ".git" ]; then
        echo "   → 更新代码..."
        git fetch origin
        git reset --hard origin/$GIT_BRANCH
        git clean -fd
        echo "   ✓ 代码已更新"
    else
        echo "   → 克隆代码..."
        git clone -b $GIT_BRANCH $GIT_REPO .
        echo "   ✓ 代码已克隆"
    fi
"@
Write-Host $gitResult.Output

Write-Host ""
Write-Host "[5/8] 安装依赖..." -ForegroundColor Yellow
Write-Host "   → 正在安装依赖（这可能需要几分钟）..." -ForegroundColor Gray
$installResult = Invoke-SSHCommand -SessionId $Session.SessionId -Command @"
    cd $DEPLOY_PATH
    export NODE_OPTIONS='--max-old-space-size=8192'
    pnpm install --frozen-lockfile
    echo '   ✓ 依赖安装完成'
"@
Write-Host $installResult.Output

Write-Host ""
Write-Host "[6/8] 构建项目..." -ForegroundColor Yellow
Write-Host "   → 正在构建项目（这可能需要几分钟）..." -ForegroundColor Gray
$buildResult = Invoke-SSHCommand -SessionId $Session.SessionId -Command @"
    cd $DEPLOY_PATH
    export NODE_OPTIONS='--max-old-space-size=8192'
    export NODE_ENV='production'
    cd apps/web
    pnpm next build --no-lint
    echo '   ✓ 构建完成'
"@
Write-Host $buildResult.Output

Write-Host ""
Write-Host "[7/8] 配置 PM2..." -ForegroundColor Yellow
$pm2Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command @"
    cd $DEPLOY_PATH/apps/web
    pm2 delete pancake-staking 2>/dev/null || true
    export NODE_ENV='production'
    pm2 start 'pnpm start -- -p $APP_PORT' --name pancake-staking
    pm2 save
    echo '   ✓ PM2 服务已启动'
"@
Write-Host $pm2Result.Output

Write-Host ""
Write-Host "[8/8] 检查服务状态..." -ForegroundColor Yellow
$statusResult = Invoke-SSHCommand -SessionId $Session.SessionId -Command "pm2 list | grep pancake-staking || echo '   ⚠ 服务未找到'"
Write-Host $statusResult.Output

# 清理 SSH 会话
Remove-SSHSession -SessionId $Session.SessionId | Out-Null

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   部署完成！" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   访问地址: http://$SERVER_IP`:$APP_PORT" -ForegroundColor Yellow
Write-Host "   查看日志: ssh $SERVER_USER@$SERVER_IP 'pm2 logs pancake-staking'" -ForegroundColor Gray
Write-Host "   重启服务: ssh $SERVER_USER@$SERVER_IP 'pm2 restart pancake-staking'" -ForegroundColor Gray
Write-Host "==========================================" -ForegroundColor Cyan

