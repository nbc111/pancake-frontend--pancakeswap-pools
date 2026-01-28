# notifyRewardAmount 参数表

## 📋 快速参考

以下是每个奖励代币调用 `notifyRewardAmount` 时需要传递的参数：

| 代币 | poolIndex | reward (wei) | 可读数量 |
|------|-----------|--------------|----------|
| **BTC** | `1` | `7300000000000000` | 0.073 BTC |
| **ETH** | `2` | `9120000000000000000` | 9.12 ETH |
| **SOL** | `3` | `121800000000000000000` | 121.8 SOL |
| **BNB** | `4` | `5476800000000000000000` | 5476.8 BNB |
| **XRP** | `5` | `18252000000000000000000` | 18252 XRP |
| **LTC** | `6` | `36504000000000000000000` | 36504 LTC |
| **DOGE** | `7` | `18252000000000000000000` | 18252 DOGE |
| **PEPE** | `8` | `12168000000000000000000` | 12168 PEPE |
| **USDT** | `9` | `1825200000` | 1825.2 USDT |
| **SUI** | `10` | `52128000000000000000000` | 52128 SUI |

## 🎯 在 Remix 中使用

### BTC 池示例

1. **加载质押合约**：`0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`
2. **找到 `notifyRewardAmount` 函数**
3. **填写参数**：
   ```
   poolIndex: 1
   reward: 7300000000000000
   ```
4. **点击 "transact" 并确认交易**

## ⚠️ 重要提醒

在调用 `notifyRewardAmount` 之前，**必须先批准代币给质押合约**！

### 批准代币参数

| 代币 | 代币地址 | approve 参数 |
|------|----------|-------------|
| BTC | `0xb225C29Da2CaB86991b7e0651c63f0fD5C16613C` | spender: `0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`<br>amount: `7300000000000000` |
| ETH | `0x934EbeB6D7D3821B604A5D10F80619d5bcBe49C3` | spender: `0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`<br>amount: `9120000000000000000` |
| SOL | `0xd5eECCC885Ef850d90AE40E716c3dFCe5C3D4c81` | spender: `0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`<br>amount: `121800000000000000000` |
| BNB | `0x9C43237490272BfdD2F1d1ca0B34f20b1A3C9f5c` | spender: `0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`<br>amount: `5476800000000000000000` |
| XRP | `0x48e1772534fabBdcaDe9ca4005E5Ee8BF4190093` | spender: `0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`<br>amount: `18252000000000000000000` |
| LTC | `0x8d22041C22d696fdfF0703852a706a40Ff65a7de` | spender: `0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`<br>amount: `36504000000000000000000` |
| DOGE | `0x8cEb9a93405CDdf3D76f72327F868Bd3E8755D89` | spender: `0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`<br>amount: `18252000000000000000000` |
| PEPE | `0xd365877026A43107Efd9825bc3ABFe1d7A450F82` | spender: `0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`<br>amount: `12168000000000000000000` |
| USDT | `0xfd1508502696d0E1910eD850c6236d965cc4db11` | spender: `0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`<br>amount: `1825200000` |
| SUI | `0x9011191E84Ad832100Ddc891E360f8402457F55E` | spender: `0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`<br>amount: `52128000000000000000000` |

## 📝 操作顺序

对每个代币池，按以下顺序操作：

1. **批准代币**（在代币合约中调用 `approve`）
2. **设置奖励**（在质押合约中调用 `notifyRewardAmount`）

## 📚 相关文档

- [Remix 中 notifyRewardAmount 参数设置](./REMMIX_NOTIFY_REWARD_PARAMS.md) - 详细说明
- [在 Remix 中修复池状态](./REMMIX_FIX_POOLS.md) - 修复步骤

