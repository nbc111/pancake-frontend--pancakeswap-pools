# 奖励代币合约

本目录包含 NBC 质押池中所有奖励代币的 Solidity 合约代码。

## 代币列表

| 代币符号 | 合约文件 | 合约地址 | 精度 | 说明 |
|---------|---------|---------|------|------|
| NBC | `NBCToken.sol` | `0xfE473265296e058fd1999cFf7E4536F51f5a1Fe6` | 18 | NBC Chain 原生代币 |
| BTC | `BTCToken.sol` | `0xb225C29Da2CaB86991b7e0651c63f0fD5C16613C` | 8 | 比特币代币（8 位精度，匹配 Bitcoin 原生精度） |
| ETH | `ETHToken.sol` | `0x1Feba2E24a6b7F1D07F55Aa7ba59a4a4bAF9f908` | 18 | 以太坊代币 |
| SOL | `SOLToken.sol` | `0xd5eECCC885Ef850d90AE40E716c3dFCe5C3D4c81` | 18 | Solana 代币 |
| BNB | `BNBToken.sol` | `0x9C43237490272BfdD2F1d1ca0B34f20b1A3C9f5c` | 18 | 币安币代币 |
| XRP | `XRPToken.sol` | `0x48e1772534fabBdcaDe9ca4005E5Ee8BF4190093` | 18 | Ripple 代币 |
| LTC | `LTCToken.sol` | `0x8d22041C22d696fdfF0703852a706a40Ff65a7de` | 18 | 莱特币代币 |
| DOGE | `DOGEToken.sol` | `0x8cEb9a93405CDdf3D76f72327F868Bd3E8755D89` | 18 | 狗狗币代币 |
| PEPE | `PEPEToken.sol` | `0xd365877026A43107Efd9825bc3ABFe1d7A450F82` | 18 | Pepe 代币 |
| USDT | `USDTToken.sol` | `0xfd1508502696d0E1910eD850c6236d965cc4db11` | 6 | Tether USD 稳定币（6 位精度，匹配 USDT 原生精度） |
| SUI | `SUIToken.sol` | `0x9011191E84Ad832100Ddc891E360f8402457F55E` | 18 | Sui 代币 |

## 通用模板

所有代币合约都基于 `ERC20Token.sol` 模板，包含以下功能：

- **ERC20 标准**：符合 ERC20 代币标准
- **Ownable**：所有者权限管理
- **Mint**：所有者可以铸造新代币
- **Burn**：所有者可以销毁代币
- **可配置精度**：支持不同的代币精度（8、6、18）

## 部署说明

### 构造函数参数

所有代币合约的构造函数接受两个参数：

1. `initialSupply`: 初始供应量（使用代币的最小单位）
   - 18 位精度代币：使用 wei 单位（例如：1e18 = 1 个代币）
   - 8 位精度代币（BTC）：使用 satoshi 单位（例如：1e8 = 1 个代币）
   - 6 位精度代币（USDT）：使用 micro 单位（例如：1e6 = 1 个代币）

2. `owner`: 合约所有者地址

### 部署示例

#### 18 位精度代币（NBC、ETH、SOL 等）

```solidity
// 部署 NBC 代币，初始供应量 1,000,000 NBC
NBCToken nbc = new NBCToken(
    1000000 * 10**18,  // 1,000,000 NBC (wei 单位)
    0xYourOwnerAddress // 所有者地址
);
```

#### 8 位精度代币（BTC）

```solidity
// 部署 BTC 代币，初始供应量 500 BTC
BTCToken btc = new BTCToken(
    500 * 10**8,        // 500 BTC (satoshi 单位)
    0xYourOwnerAddress  // 所有者地址
);
```

#### 6 位精度代币（USDT）

```solidity
// 部署 USDT 代币，初始供应量 7,000 USDT
USDTToken usdt = new USDTToken(
    7000 * 10**6,       // 7,000 USDT (micro 单位)
    0xYourOwnerAddress  // 所有者地址
);
```

## Mint 参数计算

### 18 位精度代币

要 mint `N` 个代币，参数为：`N * 10^18`

示例：
- 10,000 NBC = `10000 * 10^18` = `10000000000000000000000`
- 8,000 SUI = `8000 * 10^18` = `8000000000000000000000`
- 10,000 DOGE = `10000 * 10^18` = `10000000000000000000000`

### 8 位精度代币（BTC）

要 mint `N` 个代币，参数为：`N * 10^8`

示例：
- 500 BTC = `500 * 10^8` = `50000000000`

### 6 位精度代币（USDT）

要 mint `N` 个代币，参数为：`N * 10^6`

示例：
- 7,000 USDT = `7000 * 10^6` = `7000000000`

## 合约功能

### Mint（铸造）

```solidity
// 铸造代币给指定地址
token.mint(toAddress, amount);
```

### Burn（销毁）

```solidity
// 从指定地址销毁代币
token.burn(fromAddress, amount);
```

## 注意事项

1. **精度匹配**：BTC 使用 8 位精度，USDT 使用 6 位精度，其他代币使用 18 位精度
2. **所有者权限**：只有合约所有者可以调用 `mint` 和 `burn` 函数
3. **初始供应量**：如果 `initialSupply` 为 0，则不会铸造任何初始代币
4. **OpenZeppelin**：所有合约使用 OpenZeppelin 的安全实现

## 相关文件

- 质押合约：`../staking/NbcMultiRewardStaking.sol`
- 池配置：`apps/web/src/config/staking/poolConfig.ts`
- 奖励率配置：`apps/web/src/config/staking/rewardRates.ts`
