# NBC Chain 质押功能实现

## 概述

本项目已成功集成了NBC Chain的质押功能，用户可以在PancakeSwap前端质押NBC代币获得收益。

## 已实现的功能

### 1. 链配置
- ✅ NBC Chain ID: 1281
- ✅ RPC地址: https://rpc.nbcex.com
- ✅ WebSocket地址: wss://rpc.nbcex.com
- ✅ 区块浏览器: https://explorer.nbcex.com

### 2. 代币配置
- ✅ NBC原生代币 (18位精度)
- ✅ WNBC包装代币
- ✅ 代币符号和名称配置

### 3. 质押功能
- ✅ 固定质押合约支持
- ✅ 农场质押池配置
- ✅ 液体质押支持
- ✅ CAKE质押支持

### 4. 用户界面
- ✅ NBC质押示例组件
- ✅ 质押金额输入
- ✅ 余额显示
- ✅ 授权和质押操作

## 使用方法

### 1. 切换到NBC Chain
用户需要将钱包切换到NBC Chain (Chain ID: 1281) 才能使用质押功能。

### 2. 质押NBC代币
```typescript
// 导入必要的组件
import NBCStakingExample from 'components/NBCStakingExample'

// 在页面中使用
<NBCStakingExample />
```

### 3. 质押流程
1. 连接钱包并切换到NBC Chain
2. 输入要质押的NBC数量
3. 授权NBC代币给质押合约
4. 确认质押交易
5. 等待交易确认

## 配置说明

### 合约地址配置
需要在以下文件中更新实际的合约地址：

1. **WNBC合约地址** (`packages/swap-sdk-evm/src/constants.ts`)
   ```typescript
   [ChainId.NBC_CHAIN]: new ERC20Token(
     ChainId.NBC_CHAIN,
     '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83', // 需要更新为实际地址
     18,
     'WNBC',
     'Wrapped NBC',
     'https://nbcex.com',
   ),
   ```

2. **固定质押合约地址** (`apps/web/src/config/constants/contracts.ts`)
   ```typescript
   fixedStaking: {
     [ChainId.NBC_CHAIN]: '0x1234567890123456789012345678901234567890', // 需要更新为实际地址
   },
   ```

3. **农场质押池地址** (`packages/farms/src/farms/nbcChain.ts`)
   ```typescript
   lpAddress: '0x0000000000000000000000000000000000000000', // 需要更新为实际地址
   ```

## 部署步骤

### 1. 部署智能合约
- 部署WNBC包装代币合约
- 部署固定质押合约
- 部署农场质押池合约

### 2. 更新合约地址
将上述配置文件中的占位符地址替换为实际部署的合约地址。

### 3. 配置质押池
在固定质押合约中创建NBC质押池，设置：
- 质押代币: NBC
- 锁定期: 30天、60天、90天等
- 年化收益率
- 最小/最大质押金额

### 4. 测试功能
- 测试代币授权
- 测试质押功能
- 测试提取功能
- 测试收益计算

## 注意事项

1. **合约地址**: 所有占位符地址都需要替换为实际部署的合约地址
2. **测试网络**: 建议先在测试网络上测试所有功能
3. **安全性**: 确保智能合约经过充分的安全审计
4. **用户体验**: 提供清晰的错误提示和操作指引

## 支持的功能

- ✅ 单币质押 (NBC)
- ✅ 固定期限质押
- ✅ 流动性挖矿
- ✅ 液体质押
- ✅ 收益计算
- ✅ 质押历史查询

## 技术栈

- React + TypeScript
- Wagmi (Web3连接)
- PancakeSwap UI Kit
- Viem (区块链交互)
- BigNumber.js (数值计算)

## 联系支持

如有问题或需要技术支持，请联系开发团队。
