# 部署指南 - 本地构建方式

本文档详细说明如何通过**本地构建 + 上传到服务器**的方式部署项目。此方式适用于服务器资源有限（内存不足）的情况。

## 📋 目录

- [前置条件](#前置条件)
- [服务器信息](#服务器信息)
- [部署流程概览](#部署流程概览)
- [步骤 1: 本地环境准备](#步骤-1-本地环境准备)
- [步骤 2: 本地构建](#步骤-2-本地构建)
- [步骤 3: 上传构建产物](#步骤-3-上传构建产物)
- [步骤 4: 服务器端配置](#步骤-4-服务器端配置)
- [步骤 5: 启动服务](#步骤-5-启动服务)
- [步骤 6: 配置 Nginx 反向代理](#步骤-6-配置-nginx-反向代理)
- [步骤 7: 配置 SSL 证书](#步骤-7-配置-ssl-证书)
- [日常更新部署](#日常更新部署)
- [故障排查](#故障排查)

---

## 前置条件

### 本地环境要求

- **操作系统**: Windows / macOS / Linux
- **Node.js**: >= 18.20.0
- **pnpm**: >= 10.13.1
- **Git**: 已安装并配置
- **SSH 客户端**: 用于连接服务器
- **SCP/SFTP 工具**: 用于上传文件（Windows 可使用 WinSCP 或 PowerShell）

### 服务器环境要求

- **操作系统**: Linux (Ubuntu/Debian 推荐)
- **Node.js**: >= 18.20.0
- **pnpm**: >= 10.13.1
- **PM2**: 已安装（用于进程管理）
- **Nginx**: 已安装（用于反向代理）
- **Certbot**: 已安装（用于 SSL 证书）

---

## 服务器信息

- **IP 地址**: `206.238.197.207`
- **用户名**: `root`
- **密码**: `Tk%Cv7AgMwpIv&Z`
- **部署路径**: `/www/staking`
- **应用端口**: `5000`
- **域名**: `staking.nbblocks.cc`
- **Git 仓库**: `https://github.com/nbc111/pancake-frontend--pancakeswap-pools.git`
- **分支**: `main`

---

## 部署流程概览

```
本地机器                   服务器
   │                         │
   ├─ 1. 拉取最新代码         │
   ├─ 2. 安装依赖             │
   ├─ 3. 构建项目             │
   ├─ 4. 打包构建产物         │
   │                         │
   ├─ 5. 上传构建产物 ────────┼─ 6. 解压并放置文件
   │                         ├─ 7. 安装生产依赖
   │                         ├─ 8. 启动 PM2 服务
   │                         ├─ 9. 配置 Nginx
   │                         └─ 10. 配置 SSL 证书
```

---

## 步骤 1: 本地环境准备

### 1.1 检查本地环境

```bash
# 检查 Node.js 版本
node -v  # 需要 >= 18.20.0

# 检查 pnpm 版本
pnpm -v  # 需要 >= 10.13.1

# 如果未安装 pnpm
npm install -g pnpm@10.13.1
```

### 1.2 克隆/更新代码

```bash
# 如果首次部署，克隆代码
git clone -b main https://github.com/nbc111/pancake-frontend--pancakeswap-pools.git
cd pancake-frontend--pancakeswap-pools

# 如果已存在，更新代码
git fetch origin
git checkout main
git pull origin main
```

---

## 步骤 2: 本地构建

### 2.1 安装依赖

```bash
# 在项目根目录执行
pnpm install --frozen-lockfile
```

**注意**: 首次安装可能需要 10-20 分钟，请耐心等待。

### 2.2 构建项目

```bash
# 方式 1: 使用根目录的 build 命令（推荐）
pnpm build --filter=web...

# 方式 2: 直接进入 apps/web 目录构建
cd apps/web
pnpm next build --no-lint
cd ../..
```

**构建时间**: 根据机器性能，通常需要 5-15 分钟。

**构建产物位置**: `apps/web/.next/`

### 2.3 验证构建结果

```bash
# 检查 .next 目录是否存在
ls -la apps/web/.next

# 应该看到以下目录结构：
# .next/
#   ├── cache/
#   ├── server/
#   ├── static/
#   └── ...
```

---

## 步骤 3: 上传构建产物

### 3.1 准备上传文件

需要上传的文件和目录：

1. **构建产物**: `apps/web/.next/` (必需)
2. **源代码**: `apps/web/` 下的其他文件（`package.json`, `next.config.mjs`, `public/`, `src/` 等）
3. **依赖**: 可以选择在服务器上安装，或上传 `node_modules`（不推荐，文件太大）

### 3.2 方式 1: 使用 SCP 上传（推荐）

#### Windows PowerShell

```powershell
# 进入项目根目录
cd pancake-frontend--pancakeswap-pools

# 上传整个 apps/web 目录（排除 node_modules 和 .next，稍后单独上传 .next）
# 先上传源代码和配置文件
scp -r -o StrictHostKeyChecking=no apps/web/* root@206.238.197.207:/www/staking/apps/web/

# 上传构建产物 .next 目录
scp -r -o StrictHostKeyChecking=no apps/web/.next root@206.238.197.207:/www/staking/apps/web/
```

#### Linux/macOS

```bash
# 进入项目根目录
cd pancake-frontend--pancakeswap-pools

# 上传整个 apps/web 目录（排除 node_modules）
rsync -avz --exclude 'node_modules' --exclude '.git' \
  apps/web/ root@206.238.197.207:/www/staking/apps/web/

# 或者使用 scp
scp -r apps/web/.next root@206.238.197.207:/www/staking/apps/web/
scp apps/web/package.json root@206.238.197.207:/www/staking/apps/web/
scp apps/web/next.config.mjs root@206.238.197.207:/www/staking/apps/web/
```

### 3.3 方式 2: 使用压缩包上传（适合大文件）

#### 本地打包

```bash
# Windows PowerShell
cd apps/web
Compress-Archive -Path .next,package.json,next.config.mjs,public,src -DestinationPath ..\..\web-build.zip -Force

# Linux/macOS
cd apps/web
tar -czf ../../web-build.tar.gz .next package.json next.config.mjs public src
```

#### 上传压缩包

```bash
# Windows PowerShell
scp -o StrictHostKeyChecking=no web-build.zip root@206.238.197.207:/tmp/

# Linux/macOS
scp web-build.tar.gz root@206.238.197.207:/tmp/
```

#### 服务器端解压

```bash
# SSH 连接到服务器
ssh root@206.238.197.207

# 解压文件
cd /www/staking/apps/web

# 如果是 zip 文件
unzip -o /tmp/web-build.zip

# 如果是 tar.gz 文件
tar -xzf /tmp/web-build.tar.gz

# 清理临时文件
rm /tmp/web-build.*
```

### 3.4 方式 3: 使用 WinSCP（Windows 图形界面工具）

1. 下载并安装 [WinSCP](https://winscp.net/)
2. 新建连接：
   - 主机名: `206.238.197.207`
   - 用户名: `root`
   - 密码: `Tk%Cv7AgMwpIv&Z`
3. 连接后，将本地 `apps/web/.next` 目录拖拽到服务器 `/www/staking/apps/web/` 目录

---

## 步骤 4: 服务器端配置

### 4.1 连接到服务器

```bash
ssh root@206.238.197.207
# 输入密码: Tk%Cv7AgMwpIv&Z
```

### 4.2 检查服务器环境

```bash
# 检查 Node.js
node -v  # 需要 >= 18.20.0

# 检查 pnpm
pnpm -v  # 需要 >= 10.13.1
# 如果未安装: npm install -g pnpm@10.13.1

# 检查 PM2
pm2 -v
# 如果未安装: npm install -g pm2
```

### 4.3 准备部署目录

```bash
# 创建部署目录（如果不存在）
mkdir -p /www/staking/apps/web

# 进入目录
cd /www/staking/apps/web
```

### 4.4 安装生产依赖

```bash
# 确保 package.json 已上传
cd /www/staking/apps/web

# 安装生产依赖（只安装 dependencies，不安装 devDependencies）
pnpm install --prod --frozen-lockfile

# 或者如果已有完整的 node_modules，可以跳过此步骤
```

**注意**: 
- 如果上传时包含了 `node_modules`，可以跳过此步骤
- 如果只上传了源代码，必须执行此步骤安装依赖

### 4.5 验证文件完整性

```bash
cd /www/staking/apps/web

# 检查关键文件是否存在
ls -la .next/
ls -la package.json
ls -la next.config.mjs
ls -la node_modules/  # 如果已安装依赖

# 检查构建产物
ls -la .next/static/
ls -la .next/server/
```

---

## 步骤 5: 启动服务

### 5.1 停止旧服务（如果存在）

```bash
# 停止并删除旧的 PM2 进程
pm2 delete staking-web 2>/dev/null || true
pm2 delete pancake-staking 2>/dev/null || true
```

### 5.2 启动新服务

```bash
cd /www/staking/apps/web

# 设置环境变量
export NODE_ENV=production

# 启动服务（使用 PM2）
pm2 start "pnpm start -- -p 5000" --name staking-web

# 或者直接启动 Next.js
# pm2 start node_modules/.bin/next --name staking-web -- start -p 5000
```

### 5.3 保存 PM2 配置

```bash
# 保存当前 PM2 进程列表
pm2 save

# 设置开机自启（首次部署时执行）
pm2 startup
# 按照提示执行生成的命令，例如：
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
```

### 5.4 验证服务状态

```bash
# 查看 PM2 进程列表
pm2 list

# 查看服务日志
pm2 logs staking-web

# 检查端口是否监听
netstat -tlnp | grep 5000

# 测试本地访问
curl http://localhost:5000
```

**预期结果**:
- `pm2 list` 显示 `staking-web` 状态为 `online`
- `netstat` 显示端口 5000 正在监听
- `curl` 返回 HTML 内容（状态码 200）

---

## 步骤 6: 配置 Nginx 反向代理

### 6.1 安装 Nginx（如果未安装）

```bash
apt-get update
apt-get install -y nginx
```

### 6.2 创建 Nginx 配置

```bash
# 创建配置文件
cat > /etc/nginx/sites-available/staking.nbblocks.cc << 'EOF'
server {
    listen 80;
    server_name staking.nbblocks.cc;

    # 日志
    access_log /var/log/nginx/staking.nbblocks.cc.access.log;
    error_log /var/log/nginx/staking.nbblocks.cc.error.log;

    # 反向代理配置
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;

        # WebSocket 支持
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # 请求头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        # 缓存控制
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # 缓冲设置
        proxy_buffering off;
        proxy_request_buffering off;
    }
}
EOF
```

### 6.3 启用配置

```bash
# 创建符号链接
ln -sf /etc/nginx/sites-available/staking.nbblocks.cc /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 如果测试通过，重载 Nginx
systemctl reload nginx

# 检查 Nginx 状态
systemctl status nginx
```

### 6.4 配置防火墙

```bash
# Ubuntu/Debian (ufw)
ufw allow 80/tcp
ufw allow 443/tcp
ufw reload

# CentOS/RHEL (firewalld)
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

### 6.5 验证 HTTP 访问

```bash
# 测试 HTTP 访问（应该能访问，但会显示不安全）
curl -I http://staking.nbblocks.cc

# 或者在浏览器访问
# http://staking.nbblocks.cc
```

---

## 步骤 7: 配置 SSL 证书

### 7.1 前置检查

**重要**: 在申请 SSL 证书之前，确保：

1. **DNS 配置正确**: `staking.nbblocks.cc` 的 A 记录指向服务器 IP `206.238.197.207`
2. **DNS 已生效**: 等待 5-10 分钟让 DNS 传播

```bash
# 检查 DNS 解析
nslookup staking.nbblocks.cc
# 或
dig staking.nbblocks.cc +short

# 应该返回: 206.238.197.207
```

3. **HTTP 访问正常**: 确保 `http://staking.nbblocks.cc` 可以访问

### 7.2 安装 Certbot

```bash
apt-get update
apt-get install -y certbot python3-certbot-nginx
```

### 7.3 申请 SSL 证书

```bash
# 使用 Nginx 插件自动配置（推荐）
certbot --nginx -d staking.nbblocks.cc \
  --email admin@nbblocks.cc \
  --agree-tos \
  --non-interactive \
  --redirect
```

**参数说明**:
- `--nginx`: 使用 Nginx 插件自动配置
- `-d`: 指定域名
- `--email`: 证书到期通知邮箱
- `--agree-tos`: 同意服务条款
- `--non-interactive`: 非交互模式
- `--redirect`: 自动将 HTTP 重定向到 HTTPS

### 7.4 验证 SSL 配置

```bash
# 检查证书
certbot certificates

# 测试 HTTPS 访问
curl -I https://staking.nbblocks.cc

# 检查 Nginx 配置（Certbot 会自动更新）
cat /etc/nginx/sites-available/staking.nbblocks.cc
```

### 7.5 设置自动续期

Let's Encrypt 证书有效期为 90 天，Certbot 会自动设置续期任务。

```bash
# 测试自动续期（不会真正续期）
certbot renew --dry-run

# 查看续期任务
systemctl list-timers | grep certbot
```

---

## 日常更新部署

当需要更新代码时，按以下步骤操作：

### 快速更新流程

```bash
# ===== 本地操作 =====

# 1. 更新代码
git pull origin main

# 2. 重新构建
pnpm build --filter=web...

# 3. 上传新的构建产物
# Windows PowerShell
scp -r -o StrictHostKeyChecking=no apps/web/.next root@206.238.197.207:/www/staking/apps/web/

# Linux/macOS
scp -r apps/web/.next root@206.238.197.207:/www/staking/apps/web/


# ===== 服务器操作 =====

# 4. SSH 连接到服务器
ssh root@206.238.197.207

# 5. 重启服务
pm2 restart staking-web

# 6. 查看日志确认
pm2 logs staking-web --lines 50
```

### 完整更新流程（包含依赖更新）

如果 `package.json` 有变化，需要重新安装依赖：

```bash
# ===== 本地操作 =====

# 1. 更新代码
git pull origin main

# 2. 安装依赖（如果有新依赖）
pnpm install --frozen-lockfile

# 3. 重新构建
pnpm build --filter=web...

# 4. 上传文件
# 上传 package.json（如果有变化）
scp apps/web/package.json root@206.238.197.207:/www/staking/apps/web/

# 上传构建产物
scp -r apps/web/.next root@206.238.197.207:/www/staking/apps/web/


# ===== 服务器操作 =====

# 5. SSH 连接到服务器
ssh root@206.238.197.207

# 6. 进入目录
cd /www/staking/apps/web

# 7. 安装/更新依赖
pnpm install --prod --frozen-lockfile

# 8. 重启服务
pm2 restart staking-web

# 9. 查看日志
pm2 logs staking-web
```

---

## 故障排查

### 问题 1: 构建失败

**症状**: 本地构建时出现错误

**解决方法**:
```bash
# 清理缓存
cd apps/web
rm -rf .next .turbo node_modules

# 重新安装依赖
cd ../..
pnpm install --frozen-lockfile

# 重新构建
pnpm build --filter=web...
```

### 问题 2: 上传失败

**症状**: SCP 上传时连接超时或失败

**解决方法**:
- 检查网络连接
- 使用压缩包方式上传（见步骤 3.3）
- 使用 WinSCP 等图形工具
- 检查服务器磁盘空间: `df -h`

### 问题 3: 服务无法启动

**症状**: PM2 显示服务状态为 `errored` 或 `stopped`

**解决方法**:
```bash
# 查看详细错误日志
pm2 logs staking-web --err --lines 100

# 检查端口是否被占用
netstat -tlnp | grep 5000

# 检查文件权限
ls -la /www/staking/apps/web

# 手动测试启动
cd /www/staking/apps/web
NODE_ENV=production pnpm start -- -p 5000
```

### 问题 4: 502 Bad Gateway

**症状**: 通过域名访问时显示 502 错误

**解决方法**:
```bash
# 1. 检查 PM2 服务是否运行
pm2 list

# 2. 检查应用端口
netstat -tlnp | grep 5000

# 3. 检查本地访问
curl http://localhost:5000

# 4. 检查 Nginx 配置
nginx -t

# 5. 查看 Nginx 错误日志
tail -50 /var/log/nginx/staking.nbblocks.cc.error.log
```

### 问题 5: SSL 证书申请失败

**症状**: Certbot 提示无法验证域名

**解决方法**:
```bash
# 1. 检查 DNS 解析
nslookup staking.nbblocks.cc
# 确保返回正确的 IP: 206.238.197.207

# 2. 检查 HTTP 访问
curl -I http://staking.nbblocks.cc

# 3. 检查端口 80 是否开放
netstat -tlnp | grep :80

# 4. 检查防火墙
ufw status

# 5. 使用 DNS 验证方式（如果 HTTP 验证失败）
certbot certonly --manual --preferred-challenges dns -d staking.nbblocks.cc
```

### 问题 6: 内存不足

**症状**: 服务器内存不足导致服务崩溃

**解决方法**:
```bash
# 1. 检查内存使用
free -h

# 2. 检查 PM2 内存限制
pm2 describe staking-web

# 3. 设置 PM2 内存限制
pm2 restart staking-web --max-memory-restart 1G

# 4. 优化 Node.js 内存
# 编辑 PM2 启动脚本，添加:
# NODE_OPTIONS="--max-old-space-size=2048"
```

### 问题 7: 构建产物缺失

**症状**: 服务启动后页面空白或 404

**解决方法**:
```bash
# 1. 检查 .next 目录
ls -la /www/staking/apps/web/.next

# 2. 检查关键文件
ls -la /www/staking/apps/web/.next/static/
ls -la /www/staking/apps/web/.next/server/

# 3. 如果缺失，重新上传构建产物
# 从本地重新执行步骤 3
```

---

## 常用命令速查

### PM2 管理

```bash
# 查看服务状态
pm2 list

# 查看日志
pm2 logs staking-web

# 重启服务
pm2 restart staking-web

# 停止服务
pm2 stop staking-web

# 删除服务
pm2 delete staking-web
```

### Nginx 管理

```bash
# 测试配置
nginx -t

# 重载配置
systemctl reload nginx

# 重启 Nginx
systemctl restart nginx

# 查看状态
systemctl status nginx
```

### 日志查看

```bash
# PM2 日志
pm2 logs staking-web

# Nginx 访问日志
tail -f /var/log/nginx/staking.nbblocks.cc.access.log

# Nginx 错误日志
tail -f /var/log/nginx/staking.nbblocks.cc.error.log
```

---

## 访问地址

部署成功后，可以通过以下地址访问：

- **HTTPS**: https://staking.nbblocks.cc
- **HTTP**: http://staking.nbblocks.cc（自动重定向到 HTTPS）
- **直接 IP**: http://206.238.197.207:5000（如果防火墙允许）

---

## 注意事项

1. **构建产物大小**: `.next` 目录可能很大（几百 MB 到几 GB），上传需要时间
2. **DNS 传播**: 修改 DNS 后需要等待 5-10 分钟才能生效
3. **SSL 证书**: Let's Encrypt 证书有效期为 90 天，Certbot 会自动续期
4. **备份**: 部署前建议备份服务器上的旧版本
5. **测试**: 每次部署后应在浏览器中测试所有关键功能
6. **监控**: 建议设置监控来跟踪服务状态和性能

---

## 技术支持

如遇到问题，请检查：

1. 本文档的 [故障排查](#故障排查) 部分
2. PM2 日志: `pm2 logs staking-web`
3. Nginx 日志: `/var/log/nginx/staking.nbblocks.cc.*.log`
4. 系统日志: `journalctl -u nginx` 或 `dmesg | tail`

---

**最后更新**: 2024-12-16

