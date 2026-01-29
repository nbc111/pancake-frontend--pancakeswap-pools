/**
 * 质押池配置
 * 包含代币地址、精度、Logo 等信息
 */

export type PoolConfig = {
  sousId: number
  rewardTokenAddress: `0x${string}`
  rewardTokenSymbol: string
  rewardTokenName: string
  rewardTokenDecimals: number
  rewardTokenLogoURI: string
}

/**
 * 质押池配置列表
 * 对应合约中的各个奖励代币池
 */
export const STAKING_POOL_CONFIGS: PoolConfig[] = [
  {
    sousId: 0,
    rewardTokenAddress: '0xb225C29Da2CaB86991b7e0651c63f0fD5C16613C' as `0x${string}`,
    rewardTokenSymbol: 'BTC',
    rewardTokenName: 'Bitcoin',
    rewardTokenDecimals: 8,
    rewardTokenLogoURI: '/images/custom-tokens/btc.png',
  },
  {
    sousId: 1,
    rewardTokenAddress: '0x1Feba2E24a6b7F1D07F55Aa7ba59a4a4bAF9f908' as `0x${string}`,
    rewardTokenSymbol: 'ETH',
    rewardTokenName: 'Ether',
    rewardTokenDecimals: 18,
    rewardTokenLogoURI: '/images/custom-tokens/eth.png',
  },
  {
    sousId: 2,
    rewardTokenAddress: '0x4E4D07268eFFB4d3507a69F64b5780Eb16551f85' as `0x${string}`,
    rewardTokenSymbol: 'USDT',
    rewardTokenName: 'Tether USD',
    rewardTokenDecimals: 6,
    rewardTokenLogoURI: '/images/custom-tokens/usdt.png',
  },
]

/**
 * 根据 sousId 获取池配置
 */
export function getPoolConfigBySousId(sousId: number): PoolConfig | undefined {
  return STAKING_POOL_CONFIGS.find((config) => config.sousId === sousId)
}

/**
 * 根据代币符号获取池配置
 */
export function getPoolConfigBySymbol(symbol: string): PoolConfig | undefined {
  return STAKING_POOL_CONFIGS.find((config) => config.rewardTokenSymbol === symbol)
}
