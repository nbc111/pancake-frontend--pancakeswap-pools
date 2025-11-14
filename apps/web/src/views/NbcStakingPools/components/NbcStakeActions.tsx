import BigNumber from 'bignumber.js'
import { useTranslation } from '@pancakeswap/localization'
import { Button, useModal } from '@pancakeswap/uikit'
import { Token } from '@pancakeswap/sdk'
import { Pool } from '@pancakeswap/widgets-internal'
import NbcStakeModal from './NbcStakeModal'
import NbcWithdrawModal from './NbcWithdrawModal'

interface NbcStakeActionsProps {
  isLoading: boolean
  pool: Pool.DeserializedPool<Token>
  stakingTokenBalance: BigNumber
  stakedBalance: BigNumber
  isStaked: boolean
}

const NbcStakeActions: React.FC<NbcStakeActionsProps> = ({
  isLoading,
  pool,
  stakingTokenBalance,
  stakedBalance,
  isStaked,
}) => {
  const { t } = useTranslation()
  const { sousId, stakingToken } = pool

  const [onPresentStake] = useModal(
    <NbcStakeModal pool={pool} stakingTokenBalance={stakingTokenBalance} poolIndex={sousId} />,
  )

  const [onPresentUnstake] = useModal(
    <NbcWithdrawModal
      pool={pool}
      stakingTokenBalance={stakingTokenBalance}
      stakedBalance={stakedBalance}
      poolIndex={sousId}
    />,
  )

  if (isStaked) {
    return (
      <Button onClick={onPresentUnstake} disabled={isLoading} width="100%" variant="secondary">
        {t('Unstake %symbol%', { symbol: stakingToken.symbol })}
      </Button>
    )
  }

  return (
    <Button onClick={onPresentStake} disabled={isLoading} width="100%">
      {t('Stake %symbol%', { symbol: stakingToken.symbol })}
    </Button>
  )
}

export default NbcStakeActions
