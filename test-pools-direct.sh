#!/bin/bash
# 直接测试合约 pools 函数调用
# 使用已知的函数选择器（通过在线工具或 cast 计算）

CONTRACT="0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789"
RPC="https://rpc.nbcex.com"

# 对于 pools(uint256)，函数选择器需要正确计算
# 这里使用一个占位符，实际需要从 ABI 计算
# 方法1: 使用 cast (如果安装了 foundry)
# cast sig "pools(uint256)" 
# 方法2: 使用在线工具计算 keccak256("pools(uint256)") 的前4字节

# 临时使用：pools(uint256) 的函数选择器（需要验证）
# 注意：这个值需要从实际的 keccak256 计算得出
FUNC_SELECTOR="0x1526fe27"  # 这只是一个示例，需要实际计算
PARAM="0000000000000000000000000000000000000000000000000000000000000000"  # uint256(0)
DATA="${FUNC_SELECTOR}${PARAM}"

echo "测试合约 pools(0) 函数调用"
echo "合约地址: $CONTRACT"
echo "函数数据: $DATA"
echo ""
echo "执行 curl 命令..."

curl -X POST "$RPC" \
  -H "Content-Type: application/json" \
  --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_call\",\"params\":[{\"to\":\"$CONTRACT\",\"data\":\"$DATA\"},\"latest\"],\"id\":1}"

echo ""
echo ""
echo "如果返回错误，可能需要："
echo "1. 使用 cast 计算正确的函数选择器: cast sig 'pools(uint256)'"
echo "2. 或者使用在线工具计算 keccak256('pools(uint256)') 的前4字节"
