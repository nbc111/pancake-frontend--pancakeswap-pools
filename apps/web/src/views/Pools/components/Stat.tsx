import { Flex, Text } from '@pancakeswap/uikit'
import { Pool } from '@pancakeswap/widgets-internal'

import { useTranslation } from '@pancakeswap/localization'
import { Token } from '@pancakeswap/sdk'
import BigNumber from 'bignumber.js'
import Apr from './Apr'

const NBC_STAKING_CONTRACT_ADDRESS = '0x107B4E8F1b849b69033FbF4AAcb10B72d29A16E1' as `0x${string}`

export const AprInfo: React.FC<
  React.PropsWithChildren<{ pool: Pool.DeserializedPool<Token>; stakedBalance: BigNumber }>
> = ({ pool, stakedBalance }) => {
  const { t } = useTranslation()
  // NBC staking pools 使用 4 位小数精度
  const isNbcStakingPool = pool.contractAddress?.toLowerCase() === NBC_STAKING_CONTRACT_ADDRESS.toLowerCase()
  const decimals = isNbcStakingPool ? 4 : undefined

  return (
    <Flex justifyContent="space-between" alignItems="center">
      <Text small>{t('APR')}:</Text>
      <Apr pool={pool} showIcon stakedBalance={stakedBalance} performanceFee={0} fontSize="14px" decimals={decimals} />
    </Flex>
  )
}
