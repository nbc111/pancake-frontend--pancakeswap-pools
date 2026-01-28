# Remix 中 notifyRewardAmount 参数设置

## 📋 函数说明

**函数名**: `notifyRewardAmount`

**参数**:
1. `poolIndex` (uint256) - 池的索引（1-10）
2. `reward` (uint256) - 一年期总奖励（wei 单位）

⚠️ **注意**：池索引从 1 开始，不是从 0 开始！

## 🎯 各池的参数值

根据你提供的数据，以下是每个池的具体参数：

### 池 1 - BTC

```
poolIndex: 1
reward: 7300000000000000
```

**说明**:
- 奖励率: 231481481 wei/秒
- 一年期总奖励: 7300000000000000 wei
- 可读数量: 0.073 BTC（精度 8）

---

### 池 2 - ETH

```
poolIndex: 2
reward: 9120000000000000000
```

**说明**:
- 奖励率: 289351851 wei/秒
- 一年期总奖励: 9120000000000000000 wei
- 可读数量: 9.12 ETH（精度 18）

---

### 池 3 - SOL

```
poolIndex: 3
reward: 121800000000000000000
```

**说明**:
- 奖励率: 3861003861 wei/秒
- 一年期总奖励: 121800000000000000000 wei
- 可读数量: 121.8 SOL（精度 18）

---

### 池 4 - BNB

```
poolIndex: 4
reward: 5476800000000000000000
```

**说明**:
- 奖励率: 173611111318647 wei/秒
- 一年期总奖励: 5476800000000000000000 wei
- 可读数量: 5476.8 BNB（精度 18）

---

### 池 5 - XRP

```
poolIndex: 5
reward: 18252000000000000000000
```

**说明**:
- 奖励率: 578703703703703703 wei/秒
- 一年期总奖励: 18252000000000000000000 wei
- 可读数量: 18252 XRP（精度 18）

---

### 池 6 - LTC

```
poolIndex: 6
reward: 36504000000000000000000
```

**说明**:
- 奖励率: 1157407407407407407 wei/秒
- 一年期总奖励: 36504000000000000000000 wei
- 可读数量: 36504 LTC（精度 18）

---

### 池 7 - DOGE

```
poolIndex: 7
reward: 18252000000000000000000
```

**说明**:
- 奖励率: 578703703703703703 wei/秒
- 一年期总奖励: 18252000000000000000000 wei
- 可读数量: 18252 DOGE（精度 18）

---

### 池 8 - PEPE

```
poolIndex: 8
reward: 12168000000000000000000
```

**说明**:
- 奖励率: 385802469135802469 wei/秒
- 一年期总奖励: 12168000000000000000000 wei
- 可读数量: 12168 PEPE（精度 18）

---

### 池 9 - USDT

```
poolIndex: 9
reward: 1825200000
```

**说明**:
- 奖励率: 57870 wei/秒
- 一年期总奖励: 1825200000 wei
- 可读数量: 1825.2 USDT（精度 6）

---

### 池 10 - SUI

```
poolIndex: 10
reward: 52128000000000000000000
```

**说明**:
- 奖励率: 1653439153439153439 wei/秒
- 一年期总奖励: 52128000000000000000000 wei
- 可读数量: 52128 SUI（精度 18）

---

## ⚠️ 重要：先批准代币

在调用 `notifyRewardAmount` 之前，**必须先批准代币给质押合约**！

### 批准代币步骤

1. **加载代币合约**（例如 BTC）:
   - 在 Remix 中，点击 "At Address" 输入框
   - 输入代币地址（例如 BTC: `0xb225C29Da2CaB86991b7e0651c63f0fD5C16613C`）
   - 点击 "At Address" 按钮

2. **调用 approve 函数**:
   - 找到 `approve` 函数
   - 参数：
     - `spender`: `0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789` (质押合约地址)
     - `amount`: 与 `notifyRewardAmount` 中的 `reward` 值相同
   - 点击 "transact" 并确认交易

3. **等待交易确认**

### 批准代币参数表

| 池索引 | 代币 | 代币地址 | approve 参数 |
|--------|------|----------|-------------|
| 1 | BTC | `0xb225C29Da2CaB86991b7e0651c63f0fD5C16613C` | spender: `0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`<br>amount: `7300000000000000` |
| 2 | ETH | `0x934EbeB6D7D3821B604A5D10F80619d5bcBe49C3` | spender: `0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`<br>amount: `9120000000000000000` |
| 3 | SOL | `0xd5eECCC885Ef850d90AE40E716c3dFCe5C3D4c81` | spender: `0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`<br>amount: `121800000000000000000` |
| 4 | BNB | `0x9C43237490272BfdD2F1d1ca0B34f20b1A3C9f5c` | spender: `0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`<br>amount: `5476800000000000000000` |
| 5 | XRP | `0x48e1772534fabBdcaDe9ca4005E5Ee8BF4190093` | spender: `0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`<br>amount: `18252000000000000000000` |
| 6 | LTC | `0x8d22041C22d696fdfF0703852a706a40Ff65a7de` | spender: `0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`<br>amount: `36504000000000000000000` |
| 7 | DOGE | `0x8cEb9a93405CDdf3D76f72327F868Bd3E8755D89` | spender: `0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`<br>amount: `18252000000000000000000` |
| 8 | PEPE | `0xd365877026A43107Efd9825bc3ABFe1d7A450F82` | spender: `0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`<br>amount: `12168000000000000000000` |
| 9 | USDT | `0xfd1508502696d0E1910eD850c6236d965cc4db11` | spender: `0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`<br>amount: `1825200000` |
| 10 | SUI | `0x9011191E84Ad832100Ddc891E360f8402457F55E` | spender: `0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`<br>amount: `52128000000000000000000` |

## 📝 完整操作流程（以 BTC 池为例）

### 步骤 1: 批准 BTC 代币

1. 在 Remix 中加载 BTC 代币合约：
   - 地址: `0xb225C29Da2CaB86991b7e0651c63f0fD5C16613C`
2. 找到 `approve` 函数
3. 填写参数：
   ```
   spender: 0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789
   amount: 7300000000000000
   ```
4. 点击 "transact" 并确认交易
5. 等待交易确认

### 步骤 2: 设置奖励

1. 加载质押合约：
   - 地址: `0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`
2. 找到 `notifyRewardAmount` 函数
3. 填写参数：
   ```
   poolIndex: 1
   reward: 7300000000000000
   ```
4. 点击 "transact" 并确认交易
5. 等待交易确认

### 步骤 3: 验证结果

1. 找到 `getPoolInfo` 函数（view 函数）
2. 输入 `poolIndex: 1`
3. 点击 "call" 按钮
4. 检查返回结果：
   - `periodFinish` 应该大于当前时间戳（大约是一年后）
   - `active` 应该是 `true`

## ✅ 快速参考表

| 池索引 | 代币 | notifyRewardAmount 参数 |
|--------|------|------------------------|
| 1 | BTC | poolIndex: `1`<br>reward: `7300000000000000` |
| 2 | ETH | poolIndex: `2`<br>reward: `9120000000000000000` |
| 3 | SOL | poolIndex: `3`<br>reward: `121800000000000000000` |
| 4 | BNB | poolIndex: `4`<br>reward: `5476800000000000000000` |
| 5 | XRP | poolIndex: `5`<br>reward: `18252000000000000000000` |
| 6 | LTC | poolIndex: `6`<br>reward: `36504000000000000000000` |
| 7 | DOGE | poolIndex: `7`<br>reward: `18252000000000000000000` |
| 8 | PEPE | poolIndex: `8`<br>reward: `12168000000000000000000` |
| 9 | USDT | poolIndex: `9`<br>reward: `1825200000` |
| 10 | SUI | poolIndex: `10`<br>reward: `52128000000000000000000` |

## ⚠️ 注意事项

1. **顺序很重要**：必须先 `approve`，再 `notifyRewardAmount`
2. **代币余额**：确保账户有足够的奖励代币
3. **Gas 费**：确保账户有足够的 NBC 作为 gas 费
4. **参数格式**：在 Remix 中直接输入数字，不需要引号
5. **验证**：每次操作后，使用 `getPoolInfo` 验证结果

## 📚 相关文档

- [在 Remix 中修复池状态](./REMMIX_FIX_POOLS.md) - 详细的修复步骤
- [Remix 快速配置指南](./REMMIX_QUICK_GUIDE.md) - Remix 使用说明

