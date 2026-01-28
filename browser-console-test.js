// 在浏览器控制台中运行此代码来测试合约调用
// 打开页面后，按 F12 打开开发者工具，在 Console 标签中粘贴并运行

// 方法 1: 使用 wagmi 的 publicClient（如果已配置）
// 注意：需要确保页面已加载且 wagmi 已初始化

async function testPoolsCall() {
  try {
    // 获取 wagmi 的 publicClient
    // 这需要根据你的项目结构调整
    const { publicClient } = await import('/src/utils/wagmi.ts')
    // 或者使用全局的 wagmi 实例
    
    const contractAddress = '0x107B4E8F1b849b69033FbF4AAcb10B72d29A16E1'
    const chainId = 1281
    
    // 使用 viem 编码函数调用
    const { encodeFunctionData, decodeFunctionResult } = await import('viem')
    
    const abi = [
      {
        inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        name: 'pools',
        outputs: [
          { internalType: 'contract IERC20', name: 'rewardToken', type: 'address' },
          { internalType: 'uint256', name: 'totalStaked', type: 'uint256' },
          { internalType: 'uint256', name: 'rewardRate', type: 'uint256' },
          { internalType: 'uint256', name: 'periodFinish', type: 'uint256' },
          { internalType: 'uint256', name: 'rewardsDuration', type: 'uint256' },
          { internalType: 'uint256', name: 'lastUpdateTime', type: 'uint256' },
          { internalType: 'uint256', name: 'rewardPerTokenStored', type: 'uint256' },
          { internalType: 'bool', name: 'active', type: 'bool' },
        ],
        stateMutability: 'view',
        type: 'function',
      },
    ]
    
    const data = encodeFunctionData({
      abi,
      functionName: 'pools',
      args: [0],
    })
    
    console.log('函数调用数据:', data)
    
    // 调用合约
    const result = await publicClient({ chainId }).call({
      to: contractAddress,
      data,
    })
    
    console.log('原始返回数据:', result.data)
    
    // 解码结果
    const decoded = decodeFunctionResult({
      abi,
      functionName: 'pools',
      data: result.data,
    })
    
    console.log('解码后的结果:', decoded)
    console.log('rewardsDuration:', decoded[4]?.toString())
    
    return decoded
  } catch (error) {
    console.error('测试失败:', error)
    throw error
  }
}

// 运行测试
testPoolsCall()
