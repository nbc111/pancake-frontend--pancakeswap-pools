# 测试合约 pools 函数调用

## 方法 1: 使用浏览器控制台（推荐）

1. 打开应用页面（`http://localhost:5000/nbc-staking?chain=nbc`）
2. 按 F12 打开开发者工具
3. 切换到 Console 标签
4. 粘贴并运行以下代码：

```javascript
// 简化版本：直接使用 fetch 调用 RPC
async function testPools() {
  const contract = '0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789'
  const rpc = 'https://rpc.nbcex.com'
  
  // 函数选择器: pools(uint256) = 0x1526fe27 (需要验证)
  // 参数: 0 (64个0)
  const data = '0x1526fe270000000000000000000000000000000000000000000000000000000000000000'
  
  const response = await fetch(rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [{ to: contract, data: data }, 'latest'],
      id: 1,
    }),
  })
  
  const result = await response.json()
  console.log('RPC 响应:', result)
  
  if (result.error) {
    console.error('错误:', result.error)
  } else {
    console.log('成功! 返回数据:', result.result)
    console.log('数据长度:', result.result?.length)
  }
}

testPools()
```

## 方法 2: 使用 curl 命令

**注意**: 需要先计算正确的函数选择器。

### 计算函数选择器

1. **使用在线工具**:
   - 访问: https://www.4byte.directory/signatures/
   - 搜索: `pools(uint256)`
   - 或者访问: https://sig.eth.samczsun.com/

2. **使用 cast** (如果安装了 Foundry):
   ```bash
   cast sig "pools(uint256)"
   ```

3. **使用 Python** (需要安装 `pysha3`):
   ```bash
   pip install pysha3
   python3 calculate-selector.py
   ```

### 执行 curl 测试

```bash
# 替换 FUNC_SELECTOR 为实际计算出的函数选择器
FUNC_SELECTOR="0x1526fe27"  # 示例值，需要验证
PARAM="0000000000000000000000000000000000000000000000000000000000000000"
DATA="${FUNC_SELECTOR}${PARAM}"

curl -X POST https://rpc.nbcex.com \
  -H "Content-Type: application/json" \
  --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_call\",\"params\":[{\"to\":\"0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789\",\"data\":\"${DATA}\"},\"latest\"],\"id\":1}"
```

## 方法 3: 使用 4byte.directory 查找

1. 访问: https://www.4byte.directory/signatures/
2. 搜索: `pools(uint256)`
3. 获取函数选择器（前4字节）
4. 使用该选择器构建完整的调用数据

## 预期结果

如果调用成功，应该返回：
- 一个包含 8 个元素的元组
- `rewardsDuration` 在索引 4（第5个元素）
- 数据格式为十六进制编码的 ABI 数据

如果返回错误，可能的原因：
1. 函数选择器不正确
2. 合约地址不存在
3. RPC 节点问题
4. 网络连接问题

## 下一步

根据测试结果：
- **如果成功**: 说明 RPC 和合约都可访问，问题可能在 wagmi 配置
- **如果失败**: 检查错误信息，可能是函数选择器、合约地址或 RPC 问题
