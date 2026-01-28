# Remix 配置质押池 - 详细操作步骤

## 📋 准备工作

### 1. 确认质押合约地址
```
质押合约地址：0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789
```

### 2. 确认你的账户
- 确保账户有足够的 NBC 作为 gas 费
- 确保账户有足够的奖励代币用于设置奖励

### 3. 运行脚本获取参数
在 Remix 中运行 `calculate-reward-rates.js` 脚本，获取所有池的配置参数。

### 4. ⚠️ 重要：检查池子是否已存在

在开始配置前，先检查池子是否已经存在：

#### 方法 1：检查 poolLength

1. 在质押合约中调用 `poolLength` 函数（只读，不需要 gas）
2. 查看返回值，例如返回 `11` 表示已有 11 个池（索引 0-10）

#### 方法 2：检查具体池的信息

1. 在质押合约中调用 `getPoolInfo(poolIndex)`，例如 `getPoolInfo(1)`
2. 检查返回结果：
   - 如果 `rewardToken` 不是 `0x0000...`，说明池子已存在
   - 如果 `rewardToken` 是 `0x0000...`，说明池子不存在

#### 判断结果

- ✅ **池子已存在**：只需要执行 `approve` 和 `notifyRewardAmount`
- ❌ **池子不存在**：需要执行 `addPool`、`approve` 和 `notifyRewardAmount`

---

## 🔧 详细操作步骤

### 第一步：在 Remix 中加载合约

#### 1.1 加载质押合约

1. 打开 Remix IDE：https://remix.ethereum.org
2. 在左侧文件浏览器中，点击 **"At Address"** 输入框
3. 输入质押合约地址：`0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`
4. 点击 **"At Address"** 按钮
5. 合约加载后，你会看到所有可用的函数

#### 1.2 加载奖励代币合约（以 BTC 为例）

1. 点击 **"At Address"** 输入框
2. 输入 BTC 代币地址：`0xb225C29Da2CaB86991b7e0651c63f0fD5C16613C`
3. 点击 **"At Address"** 按钮
4. 合约加载后，你会看到 ERC20 标准函数（如 `approve`、`balanceOf` 等）

---

### 第二步：配置池 1 - BTC 池

#### ⚠️ 步骤 2.0：检查池子是否已存在

1. **在质押合约中调用 `getPoolInfo(1)`**（只读调用，不需要 gas）

2. **检查返回结果**：
   ```
   如果 rewardToken = 0xb225C29Da2CaB86991b7e0651c63f0fD5C16613C
   → 池子已存在，跳过步骤 2.1，直接执行步骤 2.2
   
   如果 rewardToken = 0x0000000000000000000000000000000000000000
   → 池子不存在，需要执行步骤 2.1
   ```

#### 步骤 2.1：添加池（addPool）⚠️ 仅当池子不存在时执行

**如果池子已存在，跳过此步骤！**

1. **切换到质押合约**（地址：`0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`）

2. **找到 `addPool` 函数**

3. **填写参数**：
   ```
   rewardToken: 0xb225C29Da2CaB86991b7e0651c63f0fD5C16613C
   rewardRate: 3941332303819498915
   rewardsDuration: 31536000
   ```

4. **点击 "transact" 按钮**

5. **确认交易**：
   - 选择你的账户
   - 确认 gas 费
   - 点击 "Confirm" 或 "Send Transaction"

6. **等待交易确认**

#### 步骤 2.2：批准代币（approve）

1. **切换到 BTC 代币合约**（地址：`0xb225C29Da2CaB86991b7e0651c63f0fD5C16613C`）

2. **找到 `approve` 函数**

3. **填写参数**：
   ```
   spender: 0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789
   amount: 124293855533251717783440000
   ```

4. **点击 "transact" 按钮**

5. **确认交易并等待确认**

#### 步骤 2.3：设置奖励（notifyRewardAmount）

1. **切换回质押合约**（地址：`0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`）

2. **找到 `notifyRewardAmount` 函数**

3. **填写参数**：
   ```
   poolIndex: 1
   reward: 124293855533251717783440000
   ```

4. **点击 "transact" 按钮**

5. **确认交易并等待确认**

#### 步骤 2.4：验证配置

1. **在质押合约中找到 `getPoolInfo` 函数**

2. **填写参数**：
   ```
   poolIndex: 1
   ```

3. **点击 "call" 按钮**（注意：这是只读调用，不需要 gas）

4. **检查返回结果**：
   ```
   0: rewardToken: 0xb225C29Da2CaB86991b7e0651c63f0fD5C16613C ✅
   1: totalStakedAmount: 0 (初始为 0，正常) ✅
   2: rewardRate: 3941332303819498915 ✅
   3: periodFinish: 1763759893 (应该大于当前时间戳) ✅
   4: active: true ✅
   ```

---

### 第三步：配置池 2 - ETH 池

#### ⚠️ 步骤 3.0：检查池子是否已存在

调用 `getPoolInfo(2)` 检查，如果 `rewardToken` 已设置，跳过 `addPool`。

#### 步骤 3.1：加载 ETH 代币合约

1. 点击 **"At Address"** 输入框
2. 输入 ETH 代币地址：`0x934EbeB6D7D3821B604A5D10F80619d5bcBe49C3`
3. 点击 **"At Address"** 按钮

#### 步骤 3.2：添加池（addPool）⚠️ 仅当池子不存在时执行

在质押合约中调用 `addPool`：
```
rewardToken: 0x934EbeB6D7D3821B604A5D10F80619d5bcBe49C3
rewardRate: 1155015370574946651371377710902
rewardsDuration: 31536000
```

#### 步骤 3.3：批准代币（approve）

在 ETH 代币合约中调用 `approve`：
```
spender: 0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789
amount: 36424564726451517597647767491005472000
```

#### 步骤 3.4：设置奖励（notifyRewardAmount）

在质押合约中调用 `notifyRewardAmount`：
```
poolIndex: 2
reward: 36424564726451517597647767491005472000
```

#### 步骤 3.5：验证配置

调用 `getPoolInfo(2)` 验证配置。

---

### 第四步：配置池 3 - SOL 池

#### 步骤 4.1：加载 SOL 代币合约

```
代币地址：0xd5eECCC885Ef850d90AE40E716c3dFCe5C3D4c81
```

#### 步骤 4.2：添加池（addPool）

```
rewardToken: 0xd5eECCC885Ef850d90AE40E716c3dFCe5C3D4c81
rewardRate: 27694141470536756307694761819305
rewardsDuration: 31536000
```

#### 步骤 4.3：批准代币（approve）

```
spender: 0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789
amount: 873362445414847146919462008733602480000
```

#### 步骤 4.4：设置奖励（notifyRewardAmount）

```
poolIndex: 3
reward: 873362445414847146919462008733602480000
```

#### 步骤 4.5：验证配置

调用 `getPoolInfo(3)` 验证配置。

---

### 第五步：配置池 4 - BNB 池

#### 步骤 5.1：加载 BNB 代币合约

```
代币地址：0x9C43237490272BfdD2F1d1ca0B34f20b1A3C9f5c
```

#### 步骤 5.2：添加池（addPool）

```
rewardToken: 0x9C43237490272BfdD2F1d1ca0B34f20b1A3C9f5c
rewardRate: 4060672555226608661389607965223
rewardsDuration: 31536000
```

#### 步骤 5.3：批准代币（approve）

```
spender: 0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789
amount: 128057369701626330745582676791272528000
```

#### 步骤 5.4：设置奖励（notifyRewardAmount）

```
poolIndex: 4
reward: 128057369701626330745582676791272528000
```

#### 步骤 5.5：验证配置

调用 `getPoolInfo(4)` 验证配置。

---

### 第六步：配置池 5 - XRP 池

#### 步骤 6.1：加载 XRP 代币合约

```
代币地址：0x48e1772534fabBdcaDe9ca4005E5Ee8BF4190093
```

#### 步骤 6.2：添加池（addPool）

```
rewardToken: 0x48e1772534fabBdcaDe9ca4005E5Ee8BF4190093
rewardRate: 1836119975898354717562854793462942
rewardsDuration: 31536000
```

#### 步骤 6.3：批准代币（approve）

```
spender: 0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789
amount: 57903879559930514373062188766647338912000
```

#### 步骤 6.4：设置奖励（notifyRewardAmount）

```
poolIndex: 5
reward: 57903879559930514373062188766647338912000
```

#### 步骤 6.5：验证配置

调用 `getPoolInfo(5)` 验证配置。

---

### 第七步：配置池 6 - LTC 池

#### 步骤 7.1：加载 LTC 代币合约

```
代币地址：0x8d22041C22d696fdfF0703852a706a40Ff65a7de
```

#### 步骤 7.2：添加池（addPool）

```
rewardToken: 0x8d22041C22d696fdfF0703852a706a40Ff65a7de
rewardRate: 45299702833949408531872146118721
rewardsDuration: 31536000
```

#### 步骤 7.3：批准代币（approve）

```
spender: 0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789
amount: 1428571428571428547461119999999985456000
```

#### 步骤 7.4：设置奖励（notifyRewardAmount）

```
poolIndex: 6
reward: 1428571428571428547461119999999985456000
```

#### 步骤 7.5：验证配置

调用 `getPoolInfo(6)` 验证配置。

---

### 第八步：配置池 7 - DOGE 池

#### 步骤 8.1：加载 DOGE 代币合约

```
代币地址：0x8cEb9a93405CDdf3D76f72327F868Bd3E8755D89
```

#### 步骤 8.2：添加池（addPool）

```
rewardToken: 0x8cEb9a93405CDdf3D76f72327F868Bd3E8755D89
rewardRate: 26206439656003790059760745688516547
rewardsDuration: 31536000
```

#### 步骤 8.3：批准代币（approve）

```
spender: 0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789
amount: 826446280991735523324614876033057826192000
```

#### 步骤 8.4：设置奖励（notifyRewardAmount）

```
poolIndex: 7
reward: 826446280991735523324614876033057826192000
```

#### 步骤 8.5：验证配置

调用 `getPoolInfo(7)` 验证配置。

---

### 第九步：配置池 9 - USDT 池

⚠️ **注意**：池索引是 9，不是 8（PEPE 是 8，但跳过配置）

#### 步骤 9.1：加载 USDT 代币合约

```
代币地址：0xfd1508502696d0E1910eD850c6236d965cc4db11
```

#### 步骤 9.2：添加池（addPool）

```
rewardToken: 0xfd1508502696d0E1910eD850c6236d965cc4db11
rewardRate: 3488425960810185475501
rewardsDuration: 31536000
```

#### 步骤 9.3：批准代币（approve）

```
spender: 0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789
amount: 110011001100110009155399536000
```

#### 步骤 9.4：设置奖励（notifyRewardAmount）

```
poolIndex: 9
reward: 110011001100110009155399536000
```

#### 步骤 9.5：验证配置

调用 `getPoolInfo(9)` 验证配置。

---

### 第十步：配置池 10 - SUI 池

#### 步骤 10.1：加载 SUI 代币合约

```
代币地址：0x9011191E84Ad832100Ddc891E360f8402457F55E
```

#### 步骤 10.2：添加池（addPool）

```
rewardToken: 0x9011191E84Ad832100Ddc891E360f8402457F55E
rewardRate: 2389584927186479726624755258711757
rewardsDuration: 31536000
```

#### 步骤 10.3：批准代币（approve）

```
spender: 0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789
amount: 75357950263752824658838281838733968752000
```

#### 步骤 10.4：设置奖励（notifyRewardAmount）

```
poolIndex: 10
reward: 75357950263752824658838281838733968752000
```

#### 步骤 10.5：验证配置

调用 `getPoolInfo(10)` 验证配置。

---

## ✅ 最终验证

配置完所有池后，进行最终验证：

### 验证所有池的状态

对每个池调用 `getPoolInfo`，检查：

1. **池 1 (BTC)**：`getPoolInfo(1)`
2. **池 2 (ETH)**：`getPoolInfo(2)`
3. **池 3 (SOL)**：`getPoolInfo(3)`
4. **池 4 (BNB)**：`getPoolInfo(4)`
5. **池 5 (XRP)**：`getPoolInfo(5)`
6. **池 6 (LTC)**：`getPoolInfo(6)`
7. **池 7 (DOGE)**：`getPoolInfo(7)`
8. **池 9 (USDT)**：`getPoolInfo(9)`
9. **池 10 (SUI)**：`getPoolInfo(10)`

### 检查项

每个池应该满足：
- ✅ `active = true`
- ✅ `periodFinish > 当前时间戳`（大约是一年后）
- ✅ `rewardRate` 与脚本计算的值一致
- ✅ `totalStakedAmount = 0`（初始状态，用户还未质押）

---

## 🎉 配置完成

配置完成后，用户可以开始质押：

### 用户质押操作

1. **质押 NBC**：
   - 调用 `stake(poolIndex)` 函数
   - 发送 NBC（通过 `msg.value`）

2. **查看质押量**：
   - 调用 `balanceOf(poolIndex, userAddress)` 查看质押的 NBC 数量

3. **查看奖励**：
   - 调用 `earned(poolIndex, userAddress)` 查看已获得的奖励

4. **提取奖励**：
   - 调用 `getReward(poolIndex)` 提取奖励代币

5. **提取本金**：
   - 调用 `withdraw(poolIndex, amount)` 提取质押的 NBC

---

## ⚠️ 重要提示

### 1. 代币余额检查

在设置奖励前，确保你的账户有足够的奖励代币：

```javascript
// 在代币合约中调用 balanceOf
balanceOf(yourAddress)  // 检查余额是否 >= approve 的 amount
```

### 2. Gas 费准备

确保账户有足够的 NBC 作为 gas 费：
- 每个 `addPool` 调用需要 gas
- 每个 `approve` 调用需要 gas
- 每个 `notifyRewardAmount` 调用需要 gas

### 3. 操作顺序

**必须按顺序操作**：
1. 先 `addPool`（创建池）
2. 再 `approve`（批准代币）
3. 最后 `notifyRewardAmount`（设置奖励）

### 4. 池索引对应关系

| 代币 | 池索引 | 状态 |
|------|--------|------|
| BTC  | 1      | ✅ 配置 |
| ETH  | 2      | ✅ 配置 |
| SOL  | 3      | ✅ 配置 |
| BNB  | 4      | ✅ 配置 |
| XRP  | 5      | ✅ 配置 |
| LTC  | 6      | ✅ 配置 |
| DOGE | 7      | ✅ 配置 |
| PEPE | 8      | ⏭️ 跳过 |
| USDT | 9      | ✅ 配置 |
| SUI  | 10     | ✅ 配置 |

### 5. 参数来源

所有参数都来自 `calculate-reward-rates.js` 脚本的输出：
- 如果修改了脚本中的 `totalStakedNBC` 或 `targetAPR`，需要重新运行脚本获取新参数
- 确保使用最新的参数值

---

## 📝 快速参考表

### 所有池的配置参数

| 池索引 | 代币 | 代币地址 | rewardRate | 一年期总奖励 |
|--------|------|----------|------------|-------------|
| 1 | BTC | `0xb225C29Da2CaB86991b7e0651c63f0fD5C16613C` | `3941332303819498915` | `124293855533251717783440000` |
| 2 | ETH | `0x934EbeB6D7D3821B604A5D10F80619d5bcBe49C3` | `1155015370574946651371377710902` | `36424564726451517597647767491005472000` |
| 3 | SOL | `0xd5eECCC885Ef850d90AE40E716c3dFCe5C3D4c81` | `27694141470536756307694761819305` | `873362445414847146919462008733602480000` |
| 4 | BNB | `0x9C43237490272BfdD2F1d1ca0B34f20b1A3C9f5c` | `4060672555226608661389607965223` | `128057369701626330745582676791272528000` |
| 5 | XRP | `0x48e1772534fabBdcaDe9ca4005E5Ee8BF4190093` | `1836119975898354717562854793462942` | `57903879559930514373062188766647338912000` |
| 6 | LTC | `0x8d22041C22d696fdfF0703852a706a40Ff65a7de` | `45299702833949408531872146118721` | `1428571428571428547461119999999985456000` |
| 7 | DOGE | `0x8cEb9a93405CDdf3D76f72327F868Bd3E8755D89` | `26206439656003790059760745688516547` | `826446280991735523324614876033057826192000` |
| 9 | USDT | `0xfd1508502696d0E1910eD850c6236d965cc4db11` | `3488425960810185475501` | `110011001100110009155399536000` |
| 10 | SUI | `0x9011191E84Ad832100Ddc891E360f8402457F55E` | `2389584927186479726624755258711757` | `75357950263752824658838281838733968752000` |

**质押合约地址**：`0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789`

**一年期秒数**：`31536000`

---

## 🆘 常见问题

### Q1: 如果 approve 失败怎么办？

**A**: 检查：
1. 代币余额是否足够
2. 地址是否正确
3. 是否已经 approve 过（可能需要先 reset 为 0，再重新 approve）

### Q2: 如果 notifyRewardAmount 失败怎么办？

**A**: 检查：
1. 是否已经调用 `approve` 并确认成功
2. approve 的 amount 是否足够
3. 池是否已经通过 `addPool` 创建

### Q3: 如何检查当前时间戳？

**A**: 在 Remix 中：
- 可以使用 JavaScript 控制台：`Math.floor(Date.now() / 1000)`
- 或者查看最新区块的时间戳

### Q4: 配置完成后，如何让用户知道可以质押？

**A**: 
1. 在前端页面显示池的状态
2. 确保 `active = true` 且 `periodFinish > 当前时间`
3. 用户可以通过前端界面或直接调用合约进行质押

---

## 📚 相关文档

- [Remix 快速配置指南](./REMMIX_QUICK_GUIDE.md) - Remix 基础使用
- [兑换比例配置说明](./REMMIX_STAKING_CONVERSION_CONFIG.md) - 兑换比例详解
- [修复池状态指南](./REMMIX_FIX_POOLS.md) - 如何修复过期池

