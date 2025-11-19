#!/bin/bash
# 完整的 Nginx 配置脚本 - 可直接在服务器上执行
# 使用方法: 复制此脚本内容到服务器执行，或使用: bash <(curl -s URL)

set -e

DOMAIN="staking.nbblocks.cc"
APP_PORT="5000"
NGINX_CONFIG="/etc/nginx/sites-available/${DOMAIN}"

echo "=========================================="
echo "   Nginx 配置脚本"
echo "   域名: ${DOMAIN}"
echo "=========================================="
echo ""

# 检查 root 权限
if [ "$EUID" -ne 0 ]; then 
    echo "错误: 请使用 root 用户运行此脚本"
    exit 1
fi

# 1. 安装 Nginx 和 Certbot
echo "[1/5] 安装 Nginx 和 Certbot..."
apt-get update -qq
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx
    echo "   ✓ Nginx 已安装"
else
    echo "   ✓ Nginx 已安装"
fi

if ! command -v certbot &> /dev/null; then
    apt-get install -y certbot python3-certbot-nginx
    echo "   ✓ Certbot 已安装"
else
    echo "   ✓ Certbot 已安装"
fi

# 2. 创建 Nginx 配置
echo ""
echo "[2/5] 创建 Nginx 配置..."
cat > ${NGINX_CONFIG} << EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        proxy_pass http://localhost:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
echo "   ✓ 配置文件已创建: ${NGINX_CONFIG}"

# 3. 启用配置
echo ""
echo "[3/5] 启用 Nginx 配置..."
ln -sf ${NGINX_CONFIG} /etc/nginx/sites-enabled/
if nginx -t 2>/dev/null; then
    systemctl reload nginx
    echo "   ✓ Nginx 配置已启用并重载"
else
    echo "   ✗ Nginx 配置测试失败"
    exit 1
fi

# 4. 获取 SSL 证书
echo ""
echo "[4/5] 配置 SSL 证书..."
if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
    echo "   → SSL 证书已存在，更新配置..."
    certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --redirect 2>/dev/null || true
else
    echo "   → 正在获取 SSL 证书..."
    echo "   请按照提示操作："
    echo "   - 输入邮箱地址"
    echo "   - 输入 A 同意服务条款"
    echo "   - 选择 2 重定向 HTTP 到 HTTPS"
    certbot --nginx -d ${DOMAIN}
fi

# 5. 配置防火墙
echo ""
echo "[5/5] 配置防火墙..."
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp 2>/dev/null || true
    ufw allow 443/tcp 2>/dev/null || true
    echo "   ✓ 防火墙端口已开放"
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-service=http 2>/dev/null || true
    firewall-cmd --permanent --add-service=https 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true
    echo "   ✓ 防火墙端口已开放"
else
    echo "   ⚠ 未检测到防火墙，请手动开放 80 和 443 端口"
fi

echo ""
echo "=========================================="
echo "   配置完成！"
echo "=========================================="
echo "   访问地址: https://${DOMAIN}"
echo ""
echo "   验证命令:"
echo "   - systemctl status nginx"
echo "   - pm2 list"
echo "   - curl -I https://${DOMAIN}"
echo "=========================================="

