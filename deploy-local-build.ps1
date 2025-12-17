# 本地构建部署脚本 (Windows PowerShell)
# 使用方法: .\deploy-local-build.ps1

param(
    [string]$ServerIP = "206.238.197.207",
    [string]$ServerUser = "root",
    [string]$ServerPath = "/www/staking/apps/web",
    [switch]$SkipBuild = $false,
    [switch]$SkipUpload = $false
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  本地构建部署脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查环境
Write-Host "[1/7] 检查环境..." -ForegroundColor Yellow
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "错误: 未找到 Node.js，请先安装 Node.js >= 18.20.0" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "错误: 未找到 pnpm，请先安装: npm install -g pnpm@10.13.1" -ForegroundColor Red
    exit 1
}

$nodeVersion = node -v
$pnpmVersion = pnpm -v
Write-Host "  Node.js: $nodeVersion" -ForegroundColor Green
Write-Host "  pnpm: $pnpmVersion" -ForegroundColor Green
Write-Host ""

# 更新代码
Write-Host "[2/7] 更新代码..." -ForegroundColor Yellow
if (Test-Path .git) {
    Write-Host "  拉取最新代码..." -ForegroundColor Gray
    git fetch origin
    git checkout main
    git pull origin main
    Write-Host "  代码已更新" -ForegroundColor Green
} else {
    Write-Host "  警告: 未检测到 .git 目录，跳过代码更新" -ForegroundColor Yellow
}
Write-Host ""

# 安装依赖
Write-Host "[3/7] 安装依赖..." -ForegroundColor Yellow
if (-not $SkipBuild) {
    Write-Host "  执行 pnpm install..." -ForegroundColor Gray
    pnpm install --frozen-lockfile
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  错误: 依赖安装失败" -ForegroundColor Red
        exit 1
    }
    Write-Host "  依赖安装完成" -ForegroundColor Green
} else {
    Write-Host "  跳过依赖安装" -ForegroundColor Gray
}
Write-Host ""

# 构建项目
Write-Host "[4/7] 构建项目..." -ForegroundColor Yellow
if (-not $SkipBuild) {
    Write-Host "  执行构建（这可能需要几分钟）..." -ForegroundColor Gray
    pnpm build --filter=web...
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  错误: 构建失败" -ForegroundColor Red
        exit 1
    }
    
    # 检查构建产物
    if (-not (Test-Path "apps/web/.next")) {
        Write-Host "  错误: 构建产物不存在" -ForegroundColor Red
        exit 1
    }
    Write-Host "  构建完成" -ForegroundColor Green
} else {
    Write-Host "  跳过构建" -ForegroundColor Gray
}
Write-Host ""

# 上传文件
Write-Host "[5/7] 上传构建产物到服务器..." -ForegroundColor Yellow
if (-not $SkipUpload) {
    Write-Host "  服务器: $ServerUser@$ServerIP" -ForegroundColor Gray
    Write-Host "  目标路径: $ServerPath" -ForegroundColor Gray
    Write-Host ""
    
    # 检查 SSH 连接
    Write-Host "  测试 SSH 连接..." -ForegroundColor Gray
    $sshTest = ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 "$ServerUser@$ServerIP" "echo '连接成功'" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  错误: 无法连接到服务器" -ForegroundColor Red
        Write-Host "  请检查:" -ForegroundColor Yellow
        Write-Host "    1. 服务器 IP 是否正确: $ServerIP" -ForegroundColor Yellow
        Write-Host "    2. 网络连接是否正常" -ForegroundColor Yellow
        Write-Host "    3. SSH 服务是否运行" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "  SSH 连接成功" -ForegroundColor Green
    Write-Host ""
    
    # 上传 package.json 和配置文件
    Write-Host "  上传配置文件..." -ForegroundColor Gray
    scp -o StrictHostKeyChecking=no "apps/web/package.json" "${ServerUser}@${ServerIP}:${ServerPath}/" 2>&1 | Out-Null
    if (Test-Path "apps/web/next.config.mjs") {
        scp -o StrictHostKeyChecking=no "apps/web/next.config.mjs" "${ServerUser}@${ServerIP}:${ServerPath}/" 2>&1 | Out-Null
    }
    Write-Host "  配置文件上传完成" -ForegroundColor Green
    
    # 上传构建产物
    Write-Host "  上传构建产物 .next 目录（这可能需要几分钟）..." -ForegroundColor Gray
    scp -r -o StrictHostKeyChecking=no "apps/web/.next" "${ServerUser}@${ServerIP}:${ServerPath}/" 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  错误: 上传失败" -ForegroundColor Red
        exit 1
    }
    Write-Host "  构建产物上传完成" -ForegroundColor Green
} else {
    Write-Host "  跳过上传" -ForegroundColor Gray
}
Write-Host ""

# 服务器端操作提示
Write-Host "[6/7] 服务器端操作..." -ForegroundColor Yellow
Write-Host "  请 SSH 连接到服务器并执行以下命令:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ssh $ServerUser@$ServerIP" -ForegroundColor White
Write-Host ""
Write-Host "  # 进入目录" -ForegroundColor Gray
Write-Host "  cd $ServerPath" -ForegroundColor White
Write-Host ""
Write-Host "  # 安装生产依赖（如果需要）" -ForegroundColor Gray
Write-Host "  pnpm install --prod --frozen-lockfile" -ForegroundColor White
Write-Host ""
Write-Host "  # 重启服务" -ForegroundColor Gray
Write-Host "  pm2 restart staking-web" -ForegroundColor White
Write-Host ""
Write-Host "  # 查看日志" -ForegroundColor Gray
Write-Host "  pm2 logs staking-web --lines 50" -ForegroundColor White
Write-Host ""

# 完成
Write-Host "[7/7] 部署完成！" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  访问地址:" -ForegroundColor Cyan
Write-Host "  - HTTPS: https://staking.nbblocks.cc" -ForegroundColor White
Write-Host "  - HTTP:  http://staking.nbblocks.cc" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

