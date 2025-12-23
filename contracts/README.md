# 智能合约目录

此目录用于存放项目的 Solidity 智能合约源代码和 Remix 操作指南。

## 📁 目录结构

```
contracts/
├── staking/                    # 质押相关合约
│   └── NbcMultiRewardStaking.sol    # 主质押合约源代码
├── tokens/                     # 代币合约
│   └── ERC20Token.sol         # 标准 ERC20 代币合约源代码
├── README.md                  # 本文件
├── DEPLOYED_CONTRACTS.md      # 已部署合约地址 ⭐
├── REMMIX_QUICK_GUIDE.md      # Remix 快速指南 ⭐
├── REMMIX_FIX_POOLS.md        # Remix 修复池指南 ⭐
├── REMMIX_NOTIFY_REWARD_PARAMS.md  # Remix 参数设置 ⭐
└── NOTIFY_REWARD_PARAMS_TABLE.md   # 参数快速参考表 ⭐
```

## 🚀 快速开始（使用 Remix）

**所有合约已部署！** 如果池显示在 "Old" 标签下，请使用 Remix 修复：

### 推荐阅读顺序

1. **[已部署合约地址](./DEPLOYED_CONTRACTS.md)** - 查看所有合约地址
2. **[Remix 快速配置指南](./REMMIX_QUICK_GUIDE.md)** - Remix 使用说明
3. **[Remix 修复池指南](./REMMIX_FIX_POOLS.md)** - 如何修复过期池
4. **[参数快速参考表](./NOTIFY_REWARD_PARAMS_TABLE.md)** - 所有参数值

## 📋 核心文档

### Remix 操作指南
- **[REMMIX_QUICK_GUIDE.md](./REMMIX_QUICK_GUIDE.md)** - Remix 完整使用指南
- **[REMMIX_FIX_POOLS.md](./REMMIX_FIX_POOLS.md)** - 在 Remix 中修复池状态
- **[REMMIX_NOTIFY_REWARD_PARAMS.md](./REMMIX_NOTIFY_REWARD_PARAMS.md)** - notifyRewardAmount 参数详细说明
- **[NOTIFY_REWARD_PARAMS_TABLE.md](./NOTIFY_REWARD_PARAMS_TABLE.md)** - 参数快速参考表

### 合约信息
- **[DEPLOYED_CONTRACTS.md](./DEPLOYED_CONTRACTS.md)** - 所有已部署合约地址

### 合约源代码
- **[staking/NbcMultiRewardStaking.sol](./staking/NbcMultiRewardStaking.sol)** - 质押合约源代码
- **[tokens/ERC20Token.sol](./tokens/ERC20Token.sol)** - 代币合约源代码

## ⚠️ 注意事项

1. **安全**：不要将包含私钥的 `.env` 文件提交到 Git
2. **合约地址**：部署后需要更新前端代码中的合约地址
3. **Solidity 版本**：当前配置使用 Solidity 0.8.20

