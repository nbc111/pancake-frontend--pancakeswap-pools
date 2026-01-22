/**
 * 质押合约常量配置
 */
import STAKING_ABI from 'abis/nbcMultiRewardStaking.json'

export const STAKING_CONTRACT_ADDRESS = '0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789' as `0x${string}`
export const CHAIN_ID = 1281
export const STAKING_ABI_CONFIG = STAKING_ABI

// 为了兼容性，也导出为 STAKING_ABI
export { STAKING_ABI_CONFIG as STAKING_ABI }
