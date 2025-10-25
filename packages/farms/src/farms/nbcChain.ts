import { ChainId } from '@pancakeswap/chains'
import { nbcChainTokens } from '@pancakeswap/tokens'
import { FeeAmount, Pool } from '@pancakeswap/v3-sdk'
import { defineFarmV3ConfigsFromUniversalFarm } from '../defineFarmV3Configs'
import { Protocol, UniversalFarmConfig } from '../types'

const pinnedFarmConfig: UniversalFarmConfig[] = []

export const nbcChainFarmConfig: UniversalFarmConfig[] = [
  ...pinnedFarmConfig,
  // NBC单币质押池
  {
    pid: 1,
    chainId: ChainId.NBC_CHAIN,
    protocol: Protocol.V2,
    token0: nbcChainTokens.nbc,
    token1: nbcChainTokens.wnbc,
    lpAddress: '0x0000000000000000000000000000000000000000', // NBC单币质押池地址 (需要部署后更新)
  },
]

export default nbcChainFarmConfig
