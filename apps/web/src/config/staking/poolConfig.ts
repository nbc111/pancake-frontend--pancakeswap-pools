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
    sousId: 2,
    rewardTokenAddress: '0x934EbeB6D7D3821B604A5D10F80619d5bcBe49C3' as `0x${string}`,
    rewardTokenSymbol: 'ETH',
    rewardTokenName: 'Ether',
    rewardTokenDecimals: 18,
    rewardTokenLogoURI: '/images/custom-tokens/eth.png',
  },
  {
    sousId: 3,
    rewardTokenAddress: '0xd5eECCC885Ef850d90AE40E716c3dFCe5C3D4c81' as `0x${string}`,
    rewardTokenSymbol: 'SOL',
    rewardTokenName: 'Solana',
    rewardTokenDecimals: 18,
    rewardTokenLogoURI: '/images/custom-tokens/sol.png',
  },
  {
    sousId: 4,
    rewardTokenAddress: '0x9C43237490272BfdD2F1d1ca0B34f20b1A3C9f5c' as `0x${string}`,
    rewardTokenSymbol: 'BNB',
    rewardTokenName: 'Binance Coin',
    rewardTokenDecimals: 18,
    rewardTokenLogoURI: '/images/custom-tokens/bnb.png',
  },
  {
    sousId: 5,
    rewardTokenAddress: '0x48e1772534fabBdcaDe9ca4005E5Ee8BF4190093' as `0x${string}`,
    rewardTokenSymbol: 'XRP',
    rewardTokenName: 'Ripple',
    rewardTokenDecimals: 18,
    rewardTokenLogoURI: '/images/custom-tokens/xrp.png',
  },
  {
    sousId: 6,
    rewardTokenAddress: '0x8d22041C22d696fdfF0703852a706a40Ff65a7de' as `0x${string}`,
    rewardTokenSymbol: 'LTC',
    rewardTokenName: 'Litecoin',
    rewardTokenDecimals: 18,
    rewardTokenLogoURI: '/images/custom-tokens/ltc.png',
  },
  {
    sousId: 7,
    rewardTokenAddress: '0x8cEb9a93405CDdf3D76f72327F868Bd3E8755D89' as `0x${string}`,
    rewardTokenSymbol: 'DOGE',
    rewardTokenName: 'Dogecoin',
    rewardTokenDecimals: 18,
    rewardTokenLogoURI: '/images/custom-tokens/doge.png',
  },
  {
    sousId: 8,
    rewardTokenAddress: '0xd365877026A43107Efd9825bc3ABFe1d7A450F82' as `0x${string}`,
    rewardTokenSymbol: 'PEPE',
    rewardTokenName: 'Pepe',
    rewardTokenDecimals: 18,
    rewardTokenLogoURI: '/images/custom-tokens/pepe.png',
  },
  {
    sousId: 9,
    rewardTokenAddress: '0xfd1508502696d0E1910eD850c6236d965cc4db11' as `0x${string}`,
    rewardTokenSymbol: 'USDT',
    rewardTokenName: 'Tether USD',
    rewardTokenDecimals: 6,
    rewardTokenLogoURI: '/images/custom-tokens/usdt.png',
  },
  {
    sousId: 10,
    rewardTokenAddress: '0x9011191E84Ad832100Ddc891E360f8402457F55E' as `0x${string}`,
    rewardTokenSymbol: 'SUI',
    rewardTokenName: 'Sui',
    rewardTokenDecimals: 18,
    rewardTokenLogoURI: '/images/custom-tokens/sui.png',
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
