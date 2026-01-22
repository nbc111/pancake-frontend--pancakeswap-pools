# 日志过滤指南

## 📋 概述

所有诊断日志都已添加统一的关键字前缀，方便在浏览器控制台中快速过滤和查找。

## 🔍 关键字列表

### 1. `NBC_STAKING_DIAG` - 通用诊断日志
**用途**: 组件挂载、配置信息、通用诊断

**包含内容**:
- 组件挂载时的初始诊断
- 配置信息（合约地址、链ID、RPC端点等）
- 其他合约调用状态
- useMemo 执行状态

**过滤方法**: 在浏览器控制台的过滤框中输入 `NBC_STAKING_DIAG`

**示例日志**:
```
🔍 [NBC_STAKING_DIAG] [诊断] 组件挂载 - 立即诊断
📋 [NBC_STAKING_DIAG] 配置信息: {...}
🔗 [NBC_STAKING_DIAG] 其他合约调用状态: {...}
🔧 [NBC_STAKING_DIAG] [useNbcStakingPools] useMemo 执行
```

---

### 2. `NBC_STAKING_PRICES` - 价格相关日志
**用途**: 代币价格查询状态、价格获取过程

**包含内容**:
- tokenPrices 初始状态
- tokenPrices 查询状态
- tokenPrices 在 useMemo 中的状态

**过滤方法**: 在浏览器控制台的过滤框中输入 `NBC_STAKING_PRICES`

**示例日志**:
```
💰 [NBC_STAKING_PRICES] tokenPrices 初始状态: {...}
💰 [NBC_STAKING_PRICES] tokenPrices 查询状态: {...}
💰 [NBC_STAKING_PRICES] tokenPrices 状态: {...}
```

---

### 3. `NBC_STAKING_POOLS` - 池相关日志
**用途**: poolDetails 查询状态、rewardsDuration 提取过程

**包含内容**:
- poolDetails 初始状态
- poolDetails 查询状态变化
- poolDetails 查询成功/失败
- rewardsDuration 提取过程
- useMemo 中的数据状态

**过滤方法**: 在浏览器控制台的过滤框中输入 `NBC_STAKING_POOLS`

**示例日志**:
```
📊 [NBC_STAKING_POOLS] poolDetails 初始状态 (Pool 0): {...}
📊 [NBC_STAKING_POOLS] [诊断] poolDetails 查询状态变化
[NBC_STAKING_POOLS] [Pool 0] poolDetails 查询成功
[NBC_STAKING_POOLS] [NBC] useMemo 中提取 rewardsDuration: {...}
[NBC_STAKING_POOLS] [NBC] rewardsDuration: {...}
```

---

### 4. `NBC_STAKING_APR` - APR 计算相关日志
**用途**: APR 计算过程、计算结果、异常警告

**包含内容**:
- APR 计算详细步骤
- APR 计算结果
- APR 异常高警告

**过滤方法**: 在浏览器控制台的过滤框中输入 `NBC_STAKING_APR`

**示例日志**:
```
[NBC_STAKING_APR] [APR计算] 详细步骤
[NBC_STAKING_APR] 📥 输入参数: {...}
[NBC_STAKING_APR] 🔢 计算过程: {...}
[NBC_STAKING_APR] 💰 APR结果: 100.00%
[NBC_STAKING_APR] [NBC] 📊 APR计算结果
```

---

## 🎯 使用场景

### 场景 1: 查看所有诊断日志
**过滤关键字**: `NBC_STAKING`
**说明**: 显示所有 NBC Staking 相关的诊断日志

---

### 场景 2: 只查看价格相关日志
**过滤关键字**: `NBC_STAKING_PRICES`
**说明**: 只显示价格查询和获取相关的日志

---

### 场景 3: 只查看池查询状态
**过滤关键字**: `NBC_STAKING_POOLS`
**说明**: 只显示 poolDetails 查询和 rewardsDuration 提取相关的日志

---

### 场景 4: 只查看 APR 计算
**过滤关键字**: `NBC_STAKING_APR`
**说明**: 只显示 APR 计算相关的日志

---

### 场景 5: 查看特定池的日志
**过滤关键字**: `[Pool 0]` 或 `[NBC]` 或 `[BTC]`
**说明**: 显示特定池的所有相关日志（需要结合其他关键字使用）

**示例**:
- `NBC_STAKING_POOLS [Pool 0]` - 只显示 Pool 0 的池相关日志
- `NBC_STAKING_APR [NBC]` - 只显示 NBC 池的 APR 计算日志

---

### 场景 6: 查看错误和警告
**过滤关键字**: `NBC_STAKING` + 浏览器控制台的 "Warnings" 或 "Errors" 过滤器
**说明**: 显示所有 NBC Staking 相关的错误和警告

**步骤**:
1. 在过滤框中输入 `NBC_STAKING`
2. 点击控制台的 "Warnings" 或 "Errors" 过滤器按钮

---

## 📝 快速参考表

| 关键字 | 用途 | 示例 |
|--------|------|------|
| `NBC_STAKING_DIAG` | 通用诊断 | 组件挂载、配置信息 |
| `NBC_STAKING_PRICES` | 价格相关 | tokenPrices 查询状态 |
| `NBC_STAKING_POOLS` | 池相关 | poolDetails 查询、rewardsDuration |
| `NBC_STAKING_APR` | APR 计算 | APR 计算过程、结果 |
| `NBC_STAKING` | 所有日志 | 显示所有相关日志 |

---

## 🔧 浏览器控制台使用技巧

### Chrome/Edge 浏览器

1. **打开控制台**: 按 `F12` 或 `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
2. **切换到 Console 标签**
3. **使用过滤框**: 在控制台顶部的过滤框中输入关键字
4. **清除过滤器**: 清空过滤框或点击 "Clear filter" 按钮

### Firefox 浏览器

1. **打开控制台**: 按 `F12` 或 `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
2. **切换到 Console 标签**
3. **使用过滤框**: 在控制台顶部的过滤框中输入关键字
4. **清除过滤器**: 清空过滤框或点击 "Clear filter" 按钮

### Safari 浏览器

1. **启用开发者工具**: Safari → 偏好设置 → 高级 → 勾选 "在菜单栏中显示开发菜单"
2. **打开控制台**: 开发 → 显示 Web 检查器
3. **切换到 Console 标签**
4. **使用过滤框**: 在控制台顶部的过滤框中输入关键字

---

## 💡 提示

1. **组合使用**: 可以组合多个关键字，例如 `NBC_STAKING_POOLS [Pool 0]` 来只显示 Pool 0 的池相关日志
2. **区分大小写**: 关键字区分大小写，请确保输入正确
3. **实时过滤**: 过滤是实时的，输入关键字后立即生效
4. **保存过滤**: 某些浏览器支持保存过滤条件，可以在控制台设置中查看

---

## 📚 相关文档

- `POOLDETAILS_DIAGNOSIS.md` - poolDetails 获取失败诊断报告
- `CONSOLE_LOGS_LATEST_ANALYSIS.md` - 最新控制台日志分析报告
- `CURRENT_STATUS.md` - 当前状态报告
