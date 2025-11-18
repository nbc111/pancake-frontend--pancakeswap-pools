# 构建流程文档

> **注意**: 本文档主要描述**生产环境**的构建流程。开发环境构建流程见下方"开发环境构建"部分。

## 📋 生产环境构建流程（Production Build）

### 1. 清理缓存（必须步骤）

```powershell
# 进入项目目录
cd E:\GitHub\remote\pancake-frontend--pancakeswap-pools\apps\web

# 清理所有缓存
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .turbo -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .cache -ErrorAction SilentlyContinue
if (Test-Path node_modules\.cache) { 
    Remove-Item -Recurse -Force node_modules\.cache 
}
```

### 2. 停止现有服务

```powershell
# 停止所有 Node.js 进程
Get-Process node -ErrorAction SilentlyContinue | 
    Where-Object { $_.Path -like "*node.exe*" } | 
    Stop-Process -Force -ErrorAction SilentlyContinue

# 等待进程完全停止
Start-Sleep -Seconds 2
```

### 3. 生产构建

```powershell
# 设置环境变量并构建
$env:NODE_OPTIONS="--max-old-space-size=8192"
$env:NODE_ENV="production"
pnpm next build --no-lint
```

### 4. 启动生产服务

```powershell
# 启动生产服务器（端口 5001）
$env:NODE_ENV="production"
pnpm next start -p 5001
```

## 🛠️ 开发环境构建流程（Development Build）

### 开发环境 vs 生产环境对比

| 特性 | 开发环境 | 生产环境 |
|------|---------|---------|
| **构建命令** | `pnpm dev` | `pnpm next build` |
| **启动命令** | `pnpm dev` | `pnpm next start` |
| **端口** | 5000（默认） | 5001（自定义） |
| **构建速度** | 快速（增量构建） | 较慢（完整优化） |
| **代码优化** | 无优化 | 完整优化和压缩 |
| **Source Maps** | 完整 | 可选 |
| **热重载** | ✅ 支持 | ❌ 不支持 |
| **错误提示** | 详细 | 精简 |

### 开发环境启动步骤

```powershell
# 1. 进入项目目录
cd E:\GitHub\remote\pancake-frontend--pancakeswap-pools\apps\web

# 2. 启动开发服务器（端口 5000）
pnpm dev

# 或者使用 package.json 中的脚本
pnpm run dev
```

### 开发环境特点

- ✅ **热模块替换 (HMR)**: 代码修改后自动刷新
- ✅ **快速启动**: 无需完整构建
- ✅ **详细错误信息**: 便于调试
- ✅ **Source Maps**: 完整的调试信息
- ⚠️ **性能**: 未优化，不适合生产使用

### 何时使用开发环境

- 日常开发和调试
- 功能开发和测试
- 本地预览和调试

### 何时使用生产环境

- 部署到服务器
- 性能测试
- 最终发布
- CI/CD 流程

## 🔧 常见构建问题及解决方案

### 问题 1: Module not found 错误

**症状**: 构建时出现 `Module not found: Can't resolve 'xxx'`

**解决方案**:
1. 检查文件是否存在
2. 如果文件被删除，创建占位实现或更新导入路径
3. 常见需要创建的占位文件位置：
   - `apps/web/src/views/V3Info/` - V3Info 相关组件
   - `apps/web/src/views/Swap/` - Swap 相关组件
   - `apps/web/src/views/Profile/` - Profile 相关组件
   - `apps/web/src/shims/solana-core-sdk.ts` - Solana SDK 占位

### 问题 2: React Hooks 规则违反

**症状**: `React Hook "xxx" is called conditionally`

**解决方案**:
1. 确保所有 Hooks 在组件顶层无条件调用
2. 使用条件逻辑在 Hook 内部处理，而不是条件调用 Hook
3. 示例修复：
   ```typescript
   // ❌ 错误：条件调用 Hook
   if (isEnabled) {
     const value = useSomeHook()
   }
   
   // ✅ 正确：无条件调用 Hook
   const value = useSomeHook()
   if (!isEnabled) {
     return defaultValue
   }
   ```

### 问题 3: kill EPERM 错误（Windows）

**症状**: `uncaughtException [Error: kill EPERM]`

**解决方案**:
在 `apps/web/next.config.mjs` 中禁用 `webpackBuildWorker`:
```javascript
experimental: {
  webpackBuildWorker: false, // Windows 上禁用
}
```

### 问题 4: 端口被占用

**症状**: `Port 5001 is already in use`

**解决方案**:
```powershell
# 查找占用端口的进程
netstat -ano | findstr 5001

# 停止进程（替换 PID 为实际进程 ID）
Stop-Process -Id <PID> -Force

# 或使用其他端口
pnpm next start -p 5002
```

### 问题 5: 内存不足

**症状**: `JavaScript heap out of memory`

**解决方案**:
```powershell
# 增加 Node.js 内存限制
$env:NODE_OPTIONS="--max-old-space-size=8192"
pnpm next build --no-lint
```

### 问题 6: ESLint 错误阻止构建

**症状**: 构建时 ESLint 错误导致失败

**解决方案**:
```powershell
# 使用 --no-lint 跳过 lint 检查
pnpm next build --no-lint
```

## 🚀 完整构建脚本

创建 `build.ps1` 文件：

```powershell
# build.ps1 - 完整构建脚本

param(
    [int]$Port = 5001
)

Write-Host "开始构建流程..." -ForegroundColor Green

# 1. 停止现有服务
Write-Host "停止现有服务..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | 
    Where-Object { $_.Path -like "*node.exe*" } | 
    Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. 清理缓存
Write-Host "清理缓存..." -ForegroundColor Yellow
$webDir = "apps\web"
Set-Location $webDir

Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .turbo -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .cache -ErrorAction SilentlyContinue
if (Test-Path node_modules\.cache) { 
    Remove-Item -Recurse -Force node_modules\.cache 
}
Write-Host "缓存清理完成" -ForegroundColor Green

# 3. 构建
Write-Host "开始构建..." -ForegroundColor Yellow
$env:NODE_OPTIONS="--max-old-space-size=8192"
$env:NODE_ENV="production"
pnpm next build --no-lint

if ($LASTEXITCODE -eq 0) {
    Write-Host "构建成功！" -ForegroundColor Green
    
    # 4. 启动服务
    Write-Host "启动生产服务器（端口 $Port）..." -ForegroundColor Yellow
    $env:NODE_ENV="production"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; pnpm next start -p $Port"
    Write-Host "服务已启动，访问 http://localhost:$Port" -ForegroundColor Green
} else {
    Write-Host "构建失败！请检查错误信息。" -ForegroundColor Red
    exit 1
}
```

使用方法：
```powershell
.\build.ps1          # 使用默认端口 5001
.\build.ps1 -Port 5002  # 使用自定义端口
```

## 📦 部署到远程服务器

### 方法 1: 使用 SCP 传输

```powershell
# 打包构建产物
cd apps\web
tar -czf deploy.tar.gz .next package.json next.config.mjs tsconfig.json .env.production

# 传输到服务器
scp deploy.tar.gz root@156.251.17.96:/var/www/pancake-frontend/

# SSH 到服务器并解压
ssh root@156.251.17.96 "cd /var/www/pancake-frontend && tar -xzf deploy.tar.gz && pnpm install --prod && pm2 restart pancake-frontend"
```

### 方法 2: 使用 WinSCP 图形界面

1. 连接服务器：`root@156.251.17.96`
2. 传输以下文件/目录到 `/var/www/pancake-frontend`:
   - `.next/` 目录（整个目录）
   - `package.json`
   - `next.config.mjs`
   - `tsconfig.json`
   - `.env.production`（如果有）

### 服务器端设置

```bash
# 1. 安装依赖
cd /var/www/pancake-frontend
export NODE_ENV=production
pnpm install --prod --frozen-lockfile

# 2. 使用 PM2 启动服务
pm2 start "next start -p 5001" --name pancake-frontend
pm2 save
pm2 startup  # 设置开机自启
```

## 🔍 验证构建结果

### 检查构建产物

```powershell
# 检查 .next 目录是否存在
Test-Path apps\web\.next

# 检查生成的 HTML 标题
Select-String -Path "apps\web\.next\server\pages\index.html" -Pattern "<title"
```

### 检查服务状态

```powershell
# 检查端口是否监听
netstat -ano | findstr 5001

# 测试 HTTP 响应
Invoke-WebRequest -Uri "http://localhost:5001" -UseBasicParsing | Select-Object StatusCode
```

## 📝 重要配置文件

### 1. `apps/web/next.config.mjs`
- 禁用 `webpackBuildWorker`（Windows）
- 配置端口和其他设置

### 2. `apps/web/src/config/constants/meta.ts`
- 设置默认页面标题
- 配置页面元数据

### 3. `apps/web/next-seo.config.ts`
- SEO 配置
- OpenGraph 和 Twitter 卡片设置

### 4. `apps/web/package.json`
- 构建脚本配置
- 依赖管理

## ⚠️ 注意事项

1. **Windows 系统**: 必须禁用 `webpackBuildWorker` 以避免 `kill EPERM` 错误
2. **内存限制**: 大型项目需要增加 Node.js 内存限制（`--max-old-space-size=8192`）
3. **缓存清理**: 每次构建前必须清理缓存，避免使用旧的构建产物
4. **端口冲突**: 确保端口未被占用，或使用其他端口
5. **环境变量**: 确保 `.env.production` 文件存在且配置正确

## 🆘 紧急恢复步骤

如果构建完全失败，按以下步骤恢复：

1. **完全清理**:
   ```powershell
   cd apps\web
   Remove-Item -Recurse -Force .next, .turbo, .cache, node_modules\.cache -ErrorAction SilentlyContinue
   ```

2. **重新安装依赖**（如果需要）:
   ```powershell
   pnpm install
   ```

3. **检查 Git 状态**:
   ```powershell
   git status
   git diff  # 查看未提交的更改
   ```

4. **回退到上次成功的构建**（如果需要）:
   ```powershell
   git stash  # 暂存当前更改
   git checkout <last-successful-commit>
   ```

5. **重新构建**:
   ```powershell
   $env:NODE_OPTIONS="--max-old-space-size=8192"
   $env:NODE_ENV="production"
   pnpm next build --no-lint
   ```

## 📞 联系支持

如果遇到无法解决的问题：
1. 检查构建日志中的具体错误信息
2. 查看本文档的"常见问题"部分
3. 检查相关配置文件是否正确
4. 确认所有依赖已正确安装

