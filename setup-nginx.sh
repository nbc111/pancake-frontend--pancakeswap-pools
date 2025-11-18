#!/bin/bash

# Nginx 配置脚本 - 为 staking.nbblocks.cc 设置反向代理和 SSL
# 使用方法: bash setup-nginx.sh

set -e

DOMAIN="staking.nbblocks.cc"
APP_PORT="5000"
NGINX_CONFIG="/etc/nginx/sites-available/${DOMAIN}"

echo "=========================================="
echo "   Nginx 配置脚本"
echo "   域名: ${DOMAIN}"
echo "=========================================="
echo ""

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo "错误: 请使用 root 用户运行此脚本"
    echo "使用: sudo bash setup-nginx.sh"
    exit 1
fi

# 1. 检查并安装 Nginx
echo "[1/6] 检查 Nginx..."
if ! command -v nginx &> /dev/null; then
    echo "   → Nginx 未安装，正在安装..."
    apt-get update
    apt-get install -y nginx
    echo "   ✓ Nginx 已安装"
else
    NGINX_VERSION=$(nginx -v 2>&1 | cut -d/ -f2)
    echo "   ✓ Nginx 已安装: ${NGINX_VERSION}"
fi

# 2. 创建初始 Nginx 配置（HTTP only，用于 Certbot）
echo ""
echo "[2/6] 创建 Nginx 配置..."
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
echo "[3/6] 启用 Nginx 配置..."
if [ -L "/etc/nginx/sites-enabled/${DOMAIN}" ]; then
    echo "   → 配置已存在，跳过"
else
    ln -s ${NGINX_CONFIG} /etc/nginx/sites-enabled/
    echo "   ✓ 配置已启用"
fi

# 4. 测试 Nginx 配置
echo ""
echo "[4/6] 测试 Nginx 配置..."
if nginx -t; then
    echo "   ✓ Nginx 配置测试通过"
    systemctl reload nginx
    echo "   ✓ Nginx 已重载"
else
    echo "   ✗ Nginx 配置测试失败"
    exit 1
fi

# 5. 检查并安装 Certbot
echo ""
echo "[5/6] 检查 Certbot..."
if ! command -v certbot &> /dev/null; then
    echo "   → Certbot 未安装，正在安装..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
    echo "   ✓ Certbot 已安装"
else
    CERTBOT_VERSION=$(certbot --version 2>&1 | head -n1)
    echo "   ✓ Certbot 已安装: ${CERTBOT_VERSION}"
fi

# 6. 获取 SSL 证书
echo ""
echo "[6/6] 配置 SSL 证书..."
echo "   注意: 这将需要交互式输入"
echo "   - 输入邮箱地址"
echo "   - 同意服务条款 (A)"
echo "   - 选择是否重定向 HTTP 到 HTTPS (建议选择 2)"
echo ""

# 检查是否已有证书
if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
    echo "   → SSL 证书已存在，跳过获取"
    echo "   → 更新证书配置..."
    certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --redirect
else
    echo "   → 正在获取 SSL 证书..."
    echo "   请按照提示操作："
    certbot --nginx -d ${DOMAIN}
fi

# 7. 配置防火墙
echo ""
echo "[7/7] 配置防火墙..."
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp
    ufw allow 443/tcp
    echo "   ✓ 防火墙端口已开放"
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
    echo "   ✓ 防火墙端口已开放"
else
    echo "   ⚠ 未检测到防火墙，请手动开放 80 和 443 端口"
fi

# 8. 最终测试
echo ""
echo "=========================================="
echo "   配置完成！"
echo "=========================================="
echo "   域名: https://${DOMAIN}"
echo ""
echo "   验证步骤:"
echo "   1. 检查 Nginx 状态: systemctl status nginx"
echo "   2. 检查 PM2 服务: pm2 list"
echo "   3. 测试访问: curl -I https://${DOMAIN}"
echo "   4. 查看日志: tail -f /var/log/nginx/${DOMAIN}.error.log"
echo "=========================================="

