/**
 * 部署 NbcMultiRewardStaking 合约到 NBC Chain
 * 用法: node contracts/deploy.js
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')

// ── 配置 ──────────────────────────────────────────────
const RPC_URL = 'https://rpc.nbcex.com'
const CHAIN_ID = 1281
const PRIVATE_KEY = process.env.DEPLOY_PRIVATE_KEY
// ──────────────────────────────────────────────────────

if (!PRIVATE_KEY) {
  console.error('❌ 缺少环境变量 DEPLOY_PRIVATE_KEY')
  process.exit(1)
}

// ── 读取合约源码 ──────────────────────────────────────
const solPath = path.join(__dirname, 'staking', 'NbcMultiRewardStaking.sol')
const source = fs.readFileSync(solPath, 'utf8')

// ── solc 编译 ─────────────────────────────────────────
console.log('🔨 编译合约...')

// 检查 solc 是否可用
let solcCmd = 'solc'
try {
  execSync('solc --version', { stdio: 'pipe' })
} catch {
  // 尝试 npx solc
  try {
    execSync('npx solc --version', { stdio: 'pipe' })
    solcCmd = 'npx solc'
  } catch {
    console.error('❌ 找不到 solc，请先安装: npm install -g solc  或  brew install solidity')
    process.exit(1)
  }
}

const tmpDir = path.join(__dirname, '.build')
fs.mkdirSync(tmpDir, { recursive: true })

// 使用 --base-path 和 --include-path 让 solc 找到 @openzeppelin
const repoRoot = path.join(__dirname, '..')
const nodeModules = path.join(repoRoot, 'node_modules')

let compileOutput
try {
  compileOutput = execSync(
    `${solcCmd} --optimize --combined-json abi,bin` +
    ` --base-path "${repoRoot}"` +
    ` --include-path "${nodeModules}"` +
    ` "${solPath}"`,
    { stdio: 'pipe', maxBuffer: 10 * 1024 * 1024 }
  ).toString()
} catch (e) {
  console.error('❌ 编译失败:')
  console.error(e.stderr?.toString() || e.message)
  process.exit(1)
}

const compiled = JSON.parse(compileOutput)
const contractKey = Object.keys(compiled.contracts).find(k => k.includes('NbcMultiRewardStaking'))
if (!contractKey) {
  console.error('❌ 编译输出中找不到 NbcMultiRewardStaking')
  process.exit(1)
}

const { abi, bin } = compiled.contracts[contractKey]
const abiObj = JSON.parse(abi)
const bytecode = '0x' + bin

console.log('✅ 编译成功，bytecode 长度:', bytecode.length)

// ── 保存新 ABI ────────────────────────────────────────
const abiOutPath = path.join(repoRoot, 'apps/web/src/abis/nbcMultiRewardStaking.json')
fs.writeFileSync(abiOutPath, JSON.stringify(abiObj, null, 2))
console.log('✅ ABI 已更新:', abiOutPath)

// ── 工具函数 ──────────────────────────────────────────
function rpcCall(method, params) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
    const url = new URL(RPC_URL)
    const isHttps = url.protocol === 'https:'
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }
    const req = (isHttps ? https : http).request(options, res => {
      let data = ''
      res.on('data', d => (data += d))
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if (json.error) reject(new Error(JSON.stringify(json.error)))
          else resolve(json.result)
        } catch (e) {
          reject(e)
        }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// 简单的 keccak256 用于签名（借助 ethers / viem 如果已安装，否则用系统 node）
async function deployContract() {
  // 尝试用 ethers.js（项目里应该有）
  let ethers
  try {
    ethers = require(path.join(repoRoot, 'node_modules/ethers'))
  } catch {
    try {
      ethers = require('ethers')
    } catch {
      console.error('❌ 找不到 ethers.js，请确保项目依赖已安装 (pnpm install)')
      process.exit(1)
    }
  }

  console.log('\n🔗 连接 NBC Chain RPC:', RPC_URL)

  const provider = new ethers.JsonRpcProvider(RPC_URL, {
    chainId: CHAIN_ID,
    name: 'nbc',
  })

  const wallet = new ethers.Wallet(PRIVATE_KEY, provider)
  console.log('👛 部署钱包地址:', wallet.address)

  const balance = await provider.getBalance(wallet.address)
  console.log('💰 钱包余额:', ethers.formatEther(balance), 'NBC')

  if (balance === 0n) {
    console.error('❌ 钱包余额为 0，无法支付 gas')
    process.exit(1)
  }

  console.log('\n🚀 开始部署合约...')
  const factory = new ethers.ContractFactory(abiObj, bytecode, wallet)
  const contract = await factory.deploy()
  console.log('⏳ 交易已发送，hash:', contract.deploymentTransaction().hash)
  console.log('⏳ 等待确认...')

  await contract.waitForDeployment()
  const address = await contract.getAddress()

  console.log('\n✅ 合约部署成功！')
  console.log('📍 合约地址:', address)
  console.log('🔗 浏览器:', `https://www.nbblocks.cc/address/${address}`)

  // 更新 DEPLOYED_CONTRACTS.md
  const deployedPath = path.join(__dirname, 'DEPLOYED_CONTRACTS.md')
  let deployedMd = fs.readFileSync(deployedPath, 'utf8')
  deployedMd = deployedMd.replace(
    /(\*\*合约地址\*\*: `)[^`]+(`)(\s*\n\*\*链 ID\*\*: 1281)/,
    `$1${address}$2$3`
  )
  fs.writeFileSync(deployedPath, deployedMd)
  console.log('✅ DEPLOYED_CONTRACTS.md 已更新')

  // 同步更新前端 constants.ts 中的合约地址
  const constantsPath = path.join(repoRoot, 'apps/web/src/config/staking/constants.ts')
  if (fs.existsSync(constantsPath)) {
    let constants = fs.readFileSync(constantsPath, 'utf8')
    const updated = constants.replace(
      /(STAKING_CONTRACT_ADDRESS\s*=\s*['"])[^'"]+(['"]) /,
      `$1${address}$2 `
    ).replace(
      /(STAKING_CONTRACT_ADDRESS\s*=\s*['"])[^'"]+(['"]\s*(?:as\s+`0x[^`]+`)?\s*(?:\/\/.*)?\n)/,
      `$1${address}$2`
    )
    if (updated !== constants) {
      fs.writeFileSync(constantsPath, updated)
      console.log('✅ constants.ts 合约地址已更新')
    } else {
      console.log('⚠️  constants.ts 地址未能自动替换，请手动将合约地址改为:', address)
    }
  }

  return address
}

deployContract().catch(e => {
  console.error('❌ 部署失败:', e.message || e)
  process.exit(1)
})
