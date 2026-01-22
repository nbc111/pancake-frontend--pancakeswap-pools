// 测试直接调用合约的 pools 函数
// 使用 viem 编码函数调用数据

// 使用项目中的 viem
const path = require('path')
const viemPath = path.join(__dirname, 'node_modules/viem')
const { encodeFunctionData } = require(viemPath)

const abi = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'pools',
    outputs: [
      {
        internalType: 'contract IERC20',
        name: 'rewardToken',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'totalStaked',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'rewardRate',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'periodFinish',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'rewardsDuration',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'lastUpdateTime',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'rewardPerTokenStored',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: 'active',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

const contractAddress = '0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789'

// 编码 pools(0) 调用
const functionData = encodeFunctionData({
  abi,
  functionName: 'pools',
  args: [0],
})

console.log('合约地址:', contractAddress)
console.log('函数调用数据 (pools(0)):', functionData)
console.log('\n使用以下 curl 命令测试:')
console.log(`curl -X POST https://rpc.nbcex.com \\`)
console.log(`  -H "Content-Type: application/json" \\`)
console.log(`  --data '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"${contractAddress}","data":"${functionData}"},"latest"],"id":1}'`)
