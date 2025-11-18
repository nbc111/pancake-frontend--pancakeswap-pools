# 快速部署指南

## 一键部署命令

由于 Windows 环境限制，请按以下步骤操作：

### 步骤 1: 连接到服务器

打开 PowerShell 或 CMD，执行：

```bash
ssh root@156.251.17.96
```

**密码**: `Tk%Cv7AgMwpIv&Z`

### 步骤 2: 执行部署命令

连接成功后，复制并执行以下**完整命令**（一行）：

```bash
mkdir -p /www/pancake-staking && cd /www/pancake-staking && if [ -d .git ]; then git fetch origin && git reset --hard origin/main && git clean -fd; else git clone -b main https://github.com/nbc111/pancake-frontend--pancakeswap-pools.git .; fi && export NODE_OPTIONS='--max-old-space-size=8192' && pnpm install --frozen-lockfile && cd apps/web && export NODE_ENV='production' && pnpm next build --no-lint && pm2 delete pancake-staking 2>/dev/null || true && pm2 start 'pnpm start -- -p 5000' --name pancake-staking && pm2 save && pm2 list
```

### 或者使用部署脚本

如果服务器上已有 `server-deploy.sh` 文件，可以执行：

```bash
bash /www/pancake-staking/server-deploy.sh
```

或者从 GitHub 直接执行：

```bash
bash <(curl -s https://raw.githubusercontent.com/nbc111/pancake-frontend--pancakeswap-pools/main/server-deploy.sh)
```

## 部署时间

- 安装依赖: ~5-10 分钟
- 构建项目: ~5-10 分钟
- 总计: ~10-20 分钟

## 部署后访问

部署成功后，访问地址：
- **http://156.251.17.96:5000**

## 常用管理命令

```bash
# 查看服务状态
pm2 list

# 查看日志
pm2 logs pancake-staking

# 重启服务
pm2 restart pancake-staking

# 停止服务
pm2 stop pancake-staking

# 更新代码后重新部署
cd /www/pancake-staking
git pull origin main
cd apps/web
pnpm next build --no-lint
pm2 restart pancake-staking
```

