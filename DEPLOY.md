# 部署指南

本文档说明如何将项目部署到远程服务器。

## 服务器信息

- **IP地址**: 156.251.17.96
- **用户名**: root
- **部署路径**: /www/pancake-staking
- **应用端口**: 5000
- **Git仓库**: https://github.com/nbc111/pancake-frontend--pancakeswap-pools.git
- **分支**: main

## 部署方法

### 方法 1: 使用自动化部署脚本（推荐）

#### Linux/macOS 用户

```bash
# 1. 安装 sshpass（如果未安装）
# Ubuntu/Debian:
sudo apt-get install sshpass

# macOS:
brew install hudochenkov/sshpass/sshpass

# 2. 运行部署脚本
chmod +x deploy.sh
./deploy.sh
```

#### Windows 用户

```powershell
# 1. 安装 Posh-SSH 模块（如果未安装）
Install-Module -Name Posh-SSH -Scope CurrentUser

# 2. 运行部署脚本
.\deploy.ps1
```

### 方法 2: 手动部署

#### 步骤 1: 连接到服务器

```bash
ssh root@156.251.17.96
# 密码: Tk%Cv7AgMwpIv&Z
```

#### 步骤 2: 检查环境

```bash
# 检查 Node.js (需要 >= 18.20.0)
node -v

# 检查 pnpm
pnpm -v
# 如果未安装: npm install -g pnpm@10.13.1

# 检查 PM2
pm2 -v
# 如果未安装: npm install -g pm2

# 检查 Git
git --version
```

#### 步骤 3: 克隆/更新代码

```bash
# 创建目录
mkdir -p /www/pancake-staking
cd /www/pancake-staking

# 如果是首次部署，克隆代码
git clone -b main https://github.com/nbc111/pancake-frontend--pancakeswap-pools.git .

# 如果是更新，拉取最新代码
git fetch origin
git reset --hard origin/main
git clean -fd
```

#### 步骤 4: 安装依赖

```bash
cd /www/pancake-staking
export NODE_OPTIONS="--max-old-space-size=8192"
pnpm install --frozen-lockfile
```

#### 步骤 5: 构建项目

```bash
cd /www/pancake-staking/apps/web
export NODE_OPTIONS="--max-old-space-size=8192"
export NODE_ENV="production"
pnpm next build --no-lint
```

#### 步骤 6: 启动服务（使用 PM2）

```bash
cd /www/pancake-staking/apps/web

# 停止现有服务（如果存在）
pm2 delete pancake-staking 2>/dev/null || true

# 启动服务
export NODE_ENV="production"
pm2 start "pnpm start -- -p 5000" --name pancake-staking

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
# 按照提示执行生成的命令
```

#### 步骤 7: 验证部署

```bash
# 检查服务状态
pm2 list

# 查看日志
pm2 logs pancake-staking

# 检查端口
netstat -tlnp | grep 5000
```

## 常用命令

### 查看服务状态

```bash
pm2 list
pm2 status pancake-staking
```

### 查看日志

```bash
# 实时日志
pm2 logs pancake-staking

# 最近 100 行日志
pm2 logs pancake-staking --lines 100

# 错误日志
pm2 logs pancake-staking --err
```

### 重启服务

```bash
pm2 restart pancake-staking
```

### 停止服务

```bash
pm2 stop pancake-staking
```

### 更新代码

```bash
cd /www/pancake-staking
git pull origin main
cd apps/web
pnpm next build --no-lint
pm2 restart pancake-staking
```

## 配置 Nginx 反向代理（可选）

如果需要通过域名访问，可以配置 Nginx：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 故障排查

### 服务无法启动

1. 检查端口是否被占用：
   ```bash
   netstat -tlnp | grep 5000
   ```

2. 检查 Node.js 版本：
   ```bash
   node -v  # 需要 >= 18.20.0
   ```

3. 查看详细错误日志：
   ```bash
   pm2 logs pancake-staking --err --lines 50
   ```

### 构建失败

1. 检查内存：
   ```bash
   free -h
   ```

2. 清理缓存后重新构建：
   ```bash
   cd /www/pancake-staking/apps/web
   rm -rf .next .turbo
   pnpm next build --no-lint
   ```

### 访问超时

1. 检查防火墙：
   ```bash
   # 开放端口 5000
   firewall-cmd --permanent --add-port=5000/tcp
   firewall-cmd --reload
   ```

2. 检查服务是否运行：
   ```bash
   pm2 list
   ```

## 访问地址

部署成功后，可以通过以下地址访问：

- **直接访问**: http://156.251.17.96:5000
- **如果配置了域名**: http://your-domain.com

