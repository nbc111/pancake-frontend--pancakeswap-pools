# build.ps1 - 生产环境快速构建脚本
# 
# 这是生产环境的构建流程，会执行：
# 1. 停止现有服务
# 2. 清理缓存
# 3. 生产构建（next build）
# 4. 启动生产服务器（next start）
#
# 使用方法: 
#   .\build.ps1              # 使用默认端口 5001
#   .\build.ps1 -Port 5002   # 使用自定义端口
#   .\build.ps1 -SkipClean   # 跳过缓存清理（快速重建）
#   .\build.ps1 -SkipStart   # 只构建，不启动服务
#
# 开发环境请使用: pnpm dev

param(
    [int]$Port = 5001,
    [switch]$SkipClean = $false,
    [switch]$SkipStart = $false
)

$ErrorActionPreference = "Stop"

# 获取脚本所在目录
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$WebDir = Join-Path $ScriptDir "apps\web"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   NBC Staking 构建脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 停止现有服务
Write-Host "[1/4] 停止现有服务..." -ForegroundColor Yellow
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*node.exe*" }
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "   ✓ 已停止 $($nodeProcesses.Count) 个 Node.js 进程" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "   ✓ 没有运行中的 Node.js 进程" -ForegroundColor Green
}

# 2. 清理缓存
if (-not $SkipClean) {
    Write-Host "[2/4] 清理缓存..." -ForegroundColor Yellow
    Set-Location $WebDir
    
    $cacheDirs = @(".next", ".turbo", ".cache")
    foreach ($dir in $cacheDirs) {
        if (Test-Path $dir) {
            Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
            Write-Host "   ✓ 已删除 $dir" -ForegroundColor Green
        }
    }
    
    if (Test-Path "node_modules\.cache") {
        Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue
        Write-Host "   ✓ 已删除 node_modules\.cache" -ForegroundColor Green
    }
    
    Write-Host "   ✓ 缓存清理完成" -ForegroundColor Green
} else {
    Write-Host "[2/4] 跳过缓存清理..." -ForegroundColor Yellow
}

# 3. 构建
Write-Host "[3/4] 开始构建..." -ForegroundColor Yellow
Set-Location $WebDir

$env:NODE_OPTIONS = "--max-old-space-size=8192"
$env:NODE_ENV = "production"

$buildStartTime = Get-Date
pnpm next build --no-lint
$buildEndTime = Get-Date
$buildDuration = ($buildEndTime - $buildStartTime).TotalSeconds

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ 构建成功！耗时: $([math]::Round($buildDuration, 2)) 秒" -ForegroundColor Green
} else {
    Write-Host "   ✗ 构建失败！退出码: $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

# 4. 启动服务
if (-not $SkipStart) {
    Write-Host "[4/4] 启动生产服务器（端口 $Port）..." -ForegroundColor Yellow
    
    # 检查端口是否被占用
    $portInUse = netstat -ano | Select-String ":$Port\s" | Select-String "LISTENING"
    if ($portInUse) {
        Write-Host "   ⚠ 端口 $Port 已被占用" -ForegroundColor Yellow
        $pid = ($portInUse -split '\s+')[-1]
        Write-Host "   占用进程 PID: $pid" -ForegroundColor Yellow
        $response = Read-Host "   是否停止该进程并继续？(Y/N)"
        if ($response -eq 'Y' -or $response -eq 'y') {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        } else {
            Write-Host "   已取消启动服务" -ForegroundColor Yellow
            exit 0
        }
    }
    
    $env:NODE_ENV = "production"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host 'NBC Staking 生产服务器 (端口 $Port)' -ForegroundColor Green; pnpm next start -p $Port" -WindowStyle Minimized
    
    Start-Sleep -Seconds 3
    
    # 验证服务是否启动
    $serviceRunning = netstat -ano | Select-String ":$Port\s" | Select-String "LISTENING"
    if ($serviceRunning) {
        Write-Host "   ✓ 服务已启动" -ForegroundColor Green
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "   访问地址: http://localhost:$Port" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Cyan
    } else {
        Write-Host "   ⚠ 服务可能未成功启动，请检查日志" -ForegroundColor Yellow
    }
} else {
    Write-Host "[4/4] 跳过启动服务..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "构建流程完成！" -ForegroundColor Green

