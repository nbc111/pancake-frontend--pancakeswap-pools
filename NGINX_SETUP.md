# Nginx 配置指南 - staking.nbblocks.cc

本文档说明如何配置 Nginx 反向代理和 SSL 证书，使 `https://staking.nbblocks.cc/` 可以访问应用。

## 前置条件

1. **DNS 配置**: 确保 `staking.nbblocks.cc` 的 A 记录指向服务器 IP `156.251.17.96`
2. **应用运行**: 确保 PM2 服务在端口 5000 正常运行
3. **Root 权限**: 需要 root 权限来配置 Nginx

## 快速配置（推荐）

### 方法 1: 使用自动化脚本

1. 将 `setup-nginx.sh` 上传到服务器，或直接在服务器上创建：

```bash
# 在服务器上执行
cd /tmp
# 复制脚本内容或使用 curl 下载
```

2. 执行脚本：

```bash
chmod +x setup-nginx.sh
sudo bash setup-nginx.sh
```

### 方法 2: 手动配置

#### 步骤 1: 安装 Nginx 和 Certbot

```bash
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx
```

#### 步骤 2: 创建初始 Nginx 配置

```bash
cat > /etc/nginx/sites-available/staking.nbblocks.cc << 'EOF'
server {
    listen 80;
    server_name staking.nbblocks.cc;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
```

#### 步骤 3: 启用配置

```bash
ln -s /etc/nginx/sites-available/staking.nbblocks.cc /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

#### 步骤 4: 获取 SSL 证书

```bash
certbot --nginx -d staking.nbblocks.cc
```

按照提示操作：
- 输入邮箱地址
- 同意服务条款 (输入 `A`)
- 选择是否重定向 HTTP 到 HTTPS (建议选择 `2`)

#### 步骤 5: 配置防火墙

```bash
# Ubuntu/Debian
ufw allow 80/tcp
ufw allow 443/tcp

# CentOS/RHEL
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

## 验证配置

### 1. 检查服务状态

```bash
# 检查 Nginx
systemctl status nginx

# 检查 PM2
pm2 list

# 检查端口
netstat -tlnp | grep -E ':(80|443|5000)'
```

### 2. 测试访问

```bash
# 测试 HTTP（应该重定向到 HTTPS）
curl -I http://staking.nbblocks.cc

# 测试 HTTPS
curl -I https://staking.nbblocks.cc

# 测试本地服务
curl http://localhost:5000
```

### 3. 查看日志

```bash
# Nginx 错误日志
tail -f /var/log/nginx/staking.nbblocks.cc.error.log

# Nginx 访问日志
tail -f /var/log/nginx/staking.nbblocks.cc.access.log

# PM2 日志
pm2 logs pancake-staking
```

## SSL 证书管理

### 查看证书信息

```bash
certbot certificates
```

### 手动续期证书

```bash
certbot renew
```

### 测试自动续期

```bash
certbot renew --dry-run
```

Let's Encrypt 证书会自动续期（通过 systemd timer 或 cron），通常不需要手动操作。

## 故障排查

### 问题 1: 无法访问域名

**检查 DNS 配置**:
```bash
nslookup staking.nbblocks.cc
dig staking.nbblocks.cc
```

确保 A 记录指向 `156.251.17.96`

### 问题 2: SSL 证书获取失败

**可能原因**:
- DNS 未正确配置
- 端口 80 被防火墙阻止
- 域名解析未生效

**解决方法**:
```bash
# 检查 DNS
nslookup staking.nbblocks.cc

# 检查端口
netstat -tlnp | grep :80

# 临时关闭防火墙测试
ufw disable  # 测试后记得重新启用
```

### 问题 3: 502 Bad Gateway

**可能原因**:
- PM2 服务未运行
- 应用端口不是 5000

**解决方法**:
```bash
# 检查 PM2 服务
pm2 list

# 检查应用端口
netstat -tlnp | grep 5000

# 重启 PM2 服务
pm2 restart pancake-staking
```

### 问题 4: Nginx 配置错误

**检查配置**:
```bash
nginx -t
```

**查看详细错误**:
```bash
tail -50 /var/log/nginx/error.log
```

## 更新配置

如果需要更新 Nginx 配置：

```bash
# 编辑配置
nano /etc/nginx/sites-available/staking.nbblocks.cc

# 测试配置
nginx -t

# 重载配置
systemctl reload nginx
```

## 完整配置示例

完整的 Nginx 配置（包含 SSL 优化）已保存在 `nginx-staking.conf` 文件中。

如果需要手动应用完整配置：

```bash
# 备份现有配置
cp /etc/nginx/sites-available/staking.nbblocks.cc /etc/nginx/sites-available/staking.nbblocks.cc.backup

# 应用新配置（需要根据实际情况调整 SSL 证书路径）
cp nginx-staking.conf /etc/nginx/sites-available/staking.nbblocks.cc

# 测试并重载
nginx -t && systemctl reload nginx
```

## 访问地址

配置完成后，可以通过以下地址访问：

- **HTTPS**: https://staking.nbblocks.cc
- **HTTP**: http://staking.nbblocks.cc（自动重定向到 HTTPS）
- **直接 IP**: http://156.251.17.96:5000（仍然可用）

