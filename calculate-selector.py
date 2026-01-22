#!/usr/bin/env python3
# 计算 Solidity 函数选择器
import hashlib

def keccak256(data):
    """计算 keccak256 哈希"""
    # Python 的 hashlib 没有 keccak256，需要使用 pysha3 或 eth_hash
    # 这里使用一个简化的方法，实际应该使用 eth_hash
    try:
        from Crypto.Hash import keccak
        k = keccak.new(digest_bits=256)
        k.update(data.encode('utf-8'))
        return k.hexdigest()
    except ImportError:
        # 如果没有 Crypto，使用在线工具或提供说明
        print("需要安装: pip install pysha3 或使用在线工具")
        print("函数签名: pools(uint256)")
        print("访问: https://www.4byte.directory/signatures/?bytes4_signature= 来查找")
        return None

def get_function_selector(function_signature):
    """获取函数选择器（前4字节）"""
    hash_hex = keccak256(function_signature)
    if hash_hex:
        selector = '0x' + hash_hex[:8]
        return selector
    return None

if __name__ == '__main__':
    sig = 'pools(uint256)'
    selector = get_function_selector(sig)
    if selector:
        print(f"函数签名: {sig}")
        print(f"函数选择器: {selector}")
        print(f"\n完整的调用数据 (pools(0)): {selector}0000000000000000000000000000000000000000000000000000000000000000")
    else:
        print("\n使用在线工具计算:")
        print("1. 访问 https://www.4byte.directory/signatures/")
        print("2. 搜索 'pools(uint256)'")
        print("3. 或者使用: cast sig 'pools(uint256)' (如果安装了 foundry)")
