# 已部署合约地址

本文档记录所有已部署的智能合约地址。

## 质押合约

- **合约名称**: NbcMultiRewardStaking
- **合约地址**: `0x107B4E8F1b849b69033FbF4AAcb10B72d29A16E1`
- **链 ID**: 1281 (NBC Chain)
- **状态**: ✅ 已部署

## 奖励代币合约

### BTC (Bitcoin)
- **合约地址**: `0xb225C29Da2CaB86991b7e0651c63f0fD5C16613C`
- **精度**: 8
- **状态**: ✅ 已部署

### ETH (Ether)
- **合约地址**: `0x1Feba2E24a6b7F1D07F55Aa7ba59a4a4bAF9f908`
- **精度**: 18
- **状态**: ✅ 已部署

### SOL (Solana)
- **合约地址**: `0xd5eECCC885Ef850d90AE40E716c3dFCe5C3D4c81`
- **精度**: 18
- **状态**: ✅ 已部署

### BNB (Binance Coin)
- **合约地址**: `0x9C43237490272BfdD2F1d1ca0B34f20b1A3C9f5c`
- **精度**: 18
- **状态**: ✅ 已部署

### XRP (Ripple)
- **合约地址**: `0x48e1772534fabBdcaDe9ca4005E5Ee8BF4190093`
- **精度**: 18
- **状态**: ✅ 已部署

### LTC (Litecoin)
- **合约地址**: `0x8d22041C22d696fdfF0703852a706a40Ff65a7de`
- **精度**: 18
- **状态**: ✅ 已部署

### DOGE (Dogecoin)
- **合约地址**: `0x8cEb9a93405CDdf3D76f72327F868Bd3E8755D89`
- **精度**: 18
- **状态**: ✅ 已部署

### PEPE (Pepe)
- **合约地址**: `0xd365877026A43107Efd9825bc3ABFe1d7A450F82`
- **精度**: 18
- **状态**: ✅ 已部署

### USDT (Tether USD)
- **合约地址**: `0xfd1508502696d0E1910eD850c6236d965cc4db11`
- **精度**: 6
- **状态**: ✅ 已部署

### SUI (Sui)
- **合约地址**: `0x9011191E84Ad832100Ddc891E360f8402457F55E`
- **精度**: 18
- **状态**: ✅ 已部署

## NBC 原生代币

- **合约地址**: `0xfE473265296e058fd1999cFf7E4536F51f5a1Fe6`
- **精度**: 18
- **状态**: ✅ 已部署

## 合约验证

所有合约地址已在前端配置中验证：
- 质押合约地址: `apps/web/src/views/NbcStakingPools/hooks/useNbcStakingPools.ts`
- 代币地址配置: `apps/web/src/config/staking/poolConfig.ts`

## 注意事项

1. **合约已部署**：所有合约已在 NBC Chain (1281) 上部署
2. **无需重新部署**：除非需要升级或修复，否则不需要重新部署
3. **地址一致性**：确保前端配置中的地址与此文档一致
4. **合约交互**：使用这些地址与合约进行交互

## 相关文档

- [部署说明](./DEPLOY.md)
- [质押合约说明](./staking/README.md)
- [代币合约说明](./tokens/README.md)

