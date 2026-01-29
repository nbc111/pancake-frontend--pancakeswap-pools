# 在 Remix 中配置质押池 - 完整操作指南

## 🎯 目标

按照兑换比例表配置所有质押池，设置一年期质押时间，让用户能够开始质押。

## 📋 前置准备

### 1. 确认参数

在运行 `calculate-reward-rates.js` 脚本前，确认以下参数：

- **总质押量**：根据你的预期设置（例如：1,000,000 NBC）
- **目标 APR**：根据你的需求设置（例如：100%）
- **质押时间**：一年期（31,536,000 秒）

### 2. 运行脚本获取参数

在 Remix 中运行 `calculate-reward-rates.js`，获取所有池的配置参数。

## 🔧 配置步骤（按池索引顺序）

### 池 1：BTC 池

#### 步骤 1：添加池（addPool）

在质押合约（地址：`0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`）中：

```
函数：addPool
参数：
  - rewardToken: 0xb225C29Da2CaB86991b7e0651c63f0fD5C16613C
  - rewardRate: 3941332303819498915
  - rewardsDuration: 31536000
```

#### 步骤 2：批准代币（approve）

在 BTC 代币合约（地址：`0xb225C29Da2CaB86991b7e0651c63f0fD5C16613C`）中：

```
函数：approve
参数：
  - spender: 0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789
  - amount: 124293855533251717783440000
```

#### 步骤 3：设置奖励（notifyRewardAmount）

在质押合约中：

```
函数：notifyRewardAmount
参数：
  - poolIndex: 1
  - reward: 124293855533251717783440000
```

---

### 池 2：ETH 池

#### 步骤 1：添加池（addPool）

```
函数：addPool
参数：
  - rewardToken: 0x1Feba2E24a6b7F1D07F55Aa7ba59a4a4bAF9f908
  - rewardRate: 1155015370574946651371377710902
  - rewardsDuration: 31536000
```

#### 步骤 2：批准代币（approve）

在 ETH 代币合约（地址：`0x1Feba2E24a6b7F1D07F55Aa7ba59a4a4bAF9f908`）中：

```
函数：approve
参数：
  - spender: 0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789
  - amount: 36424564726451517597647767491005472000
```

#### 步骤 3：设置奖励（notifyRewardAmount）

```
函数：notifyRewardAmount
参数：
  - poolIndex: 2
  - reward: 36424564726451517597647767491005472000
```

---

### 池 3：SOL 池

#### 步骤 1：添加池（addPool）

```
函数：addPool
参数：
  - rewardToken: 0xd5eECCC885Ef850d90AE40E716c3dFCe5C3D4c81
  - rewardRate: 27694141470536756307694761819305
  - rewardsDuration: 31536000
```

#### 步骤 2：批准代币（approve）

在 SOL 代币合约（地址：`0xd5eECCC885Ef850d90AE40E716c3dFCe5C3D4c81`）中：

```
函数：approve
参数：
  - spender: 0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789
  - amount: 873362445414847146919462008733602480000
```

#### 步骤 3：设置奖励（notifyRewardAmount）

```
函数：notifyRewardAmount
参数：
  - poolIndex: 3
  - reward: 873362445414847146919462008733602480000
```

---

### 池 4：BNB 池

#### 步骤 1：添加池（addPool）

```
函数：addPool
参数：
  - rewardToken: 0x9C43237490272BfdD2F1d1ca0B34f20b1A3C9f5c
  - rewardRate: 4060672555226608661389607965223
  - rewardsDuration: 31536000
```

#### 步骤 2：批准代币（approve）

在 BNB 代币合约（地址：`0x9C43237490272BfdD2F1d1ca0B34f20b1A3C9f5c`）中：

```
函数：approve
参数：
  - spender: 0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789
  - amount: 128057369701626330745582676791272528000
```

#### 步骤 3：设置奖励（notifyRewardAmount）

```
函数：notifyRewardAmount
参数：
  - poolIndex: 4
  - reward: 128057369701626330745582676791272528000
```

---

### 池 5：XRP 池

#### 步骤 1：添加池（addPool）

```
函数：addPool
参数：
  - rewardToken: 0x48e1772534fabBdcaDe9ca4005E5Ee8BF4190093
  - rewardRate: 1836119975898354717562854793462942
  - rewardsDuration: 31536000
```

#### 步骤 2：批准代币（approve）

在 XRP 代币合约（地址：`0x48e1772534fabBdcaDe9ca4005E5Ee8BF4190093`）中：

```
函数：approve
参数：
  - spender: 0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789
  - amount: 57903879559930514373062188766647338912000
```

#### 步骤 3：设置奖励（notifyRewardAmount）

```
函数：notifyRewardAmount
参数：
  - poolIndex: 5
  - reward: 57903879559930514373062188766647338912000
```

---

### 池 6：LTC 池

#### 步骤 1：添加池（addPool）

```
函数：addPool
参数：
  - rewardToken: 0x8d22041C22d696fdfF0703852a706a40Ff65a7de
  - rewardRate: 45299702833949408531872146118721
  - rewardsDuration: 31536000
```

#### 步骤 2：批准代币（approve）

在 LTC 代币合约（地址：`0x8d22041C22d696fdfF0703852a706a40Ff65a7de`）中：

```
函数：approve
参数：
  - spender: 0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789
  - amount: 1428571428571428547461119999999985456000
```

#### 步骤 3：设置奖励（notifyRewardAmount）

```
函数：notifyRewardAmount
参数：
  - poolIndex: 6
  - reward: 1428571428571428547461119999999985456000
```

---

### 池 7：DOGE 池

#### 步骤 1：添加池（addPool）

```
函数：addPool
参数：
  - rewardToken: 0x8cEb9a93405CDdf3D76f72327F868Bd3E8755D89
  - rewardRate: 26206439656003790059760745688516547
  - rewardsDuration: 31536000
```

#### 步骤 2：批准代币（approve）

在 DOGE 代币合约（地址：`0x8cEb9a93405CDdf3D76f72327F868Bd3E8755D89`）中：

```
函数：approve
参数：
  - spender: 0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789
  - amount: 826446280991735523324614876033057826192000
```

#### 步骤 3：设置奖励（notifyRewardAmount）

```
函数：notifyRewardAmount
参数：
  - poolIndex: 7
  - reward: 826446280991735523324614876033057826192000
```

---

### 池 9：USDT 池

#### 步骤 1：添加池（addPool）

```
函数：addPool
参数：
  - rewardToken: 0x4E4D07268eFFB4d3507a69F64b5780Eb16551f85
  - rewardRate: 3488425960810185475501
  - rewardsDuration: 31536000
```

#### 步骤 2：批准代币（approve）

在 USDT 代币合约（地址：`0x4E4D07268eFFB4d3507a69F64b5780Eb16551f85`）中：

```
函数：approve
参数：
  - spender: 0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789
  - amount: 110011001100110009155399536000
```

#### 步骤 3：设置奖励（notifyRewardAmount）

```
函数：notifyRewardAmount
参数：
  - poolIndex: 9
  - reward: 110011001100110009155399536000
```

---

### 池 10：SUI 池

#### 步骤 1：添加池（addPool）

```
函数：addPool
参数：
  - rewardToken: 0x9011191E84Ad832100Ddc891E360f8402457F55E
  - rewardRate: 2389584927186479726624755258711757
  - rewardsDuration: 31536000
```

#### 步骤 2：批准代币（approve）

在 SUI 代币合约（地址：`0x9011191E84Ad832100Ddc891E360f8402457F55E`）中：

```
函数：approve
参数：
  - spender: 0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789
  - amount: 75357950263752824658838281838733968752000
```

#### 步骤 3：设置奖励（notifyRewardAmount）

```
函数：notifyRewardAmount
参数：
  - poolIndex: 10
  - reward: 75357950263752824658838281838733968752000
```

---

## ✅ 验证配置

配置完成后，对每个池调用 `getPoolInfo` 验证：

```
函数：getPoolInfo
参数：
  - poolIndex: 1 (或其他池索引)
```

检查返回结果：
- ✅ `active` 应该是 `true`
- ✅ `periodFinish` 应该大于当前时间戳（大约是一年后）
- ✅ `rewardRate` 应该与脚本计算的值一致
- ✅ `totalStakedAmount` 初始为 0（用户还未质押）

## 🎉 配置完成

配置完成后，用户可以：

1. **质押 NBC**：调用 `stake(poolIndex)` 函数，发送 NBC
2. **查看余额**：调用 `balanceOf(poolIndex, userAddress)` 查看质押量
3. **查看奖励**：调用 `earned(poolIndex, userAddress)` 查看已获得奖励
4. **提取奖励**：调用 `getReward(poolIndex)` 提取奖励
5. **提取本金**：调用 `withdraw(poolIndex, amount)` 提取质押的 NBC

## ⚠️ 重要提示

1. **代币余额**：确保你的账户有足够的奖励代币用于设置奖励
2. **Gas 费**：确保账户有足够的 NBC 作为 gas 费
3. **按顺序操作**：建议按池索引顺序逐个配置，避免遗漏
4. **验证后再开放**：配置完成后验证所有池的状态，确认无误后再让用户开始质押

## 📝 快速参考

**质押合约地址**：`0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`

**一年期秒数**：`31536000`

**所有参数**：运行 `calculate-reward-rates.js` 脚本获取最新参数

