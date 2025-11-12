import BigNumber from 'bignumber.js'
import { styled } from 'styled-components'
import { BIG_ZERO } from '@pancakeswap/utils/bigNumber'
import { Flex, Text, Box } from '@pancakeswap/uikit'
import { Pool } from '@pancakeswap/widgets-internal'
import { useTranslation } from '@pancakeswap/localization'
import { Token } from '@pancakeswap/sdk'
import NbcHarvestActions from './NbcHarvestActions'
import NbcStakeActions from './NbcStakeActions'

const InlineText = styled(Text)`
  display: inline;
`

interface NbcCardActionsProps {
  pool: Pool.DeserializedPool<Token>
}

const NbcCardActions: React.FC<NbcCardActionsProps> = ({ pool }) => {
  const { sousId, stakingToken, earningToken, userData, earningTokenPrice } = pool
  const { t } = useTranslation()

  // NBC staking 使用原生代币，不需要 allowance
  const stakingTokenBalance = userData?.stakingTokenBalance ? new BigNumber(userData.stakingTokenBalance) : BIG_ZERO
  const earnings = userData?.pendingReward ? new BigNumber(userData.pendingReward) : BIG_ZERO
  const stakedBalance = userData?.stakedBalance ? new BigNumber(userData.stakedBalance) : BIG_ZERO
  const isStaked = stakedBalance.gt(0)
  const isLoading = !userData

  return (
    <Flex flexDirection="column">
      <Flex flexDirection="column">
        <>
          <Box display="inline">
            <InlineText color="secondary" bold fontSize="12px">
              {`${earningToken.symbol} `}
            </InlineText>
            <InlineText color="textSubtle" textTransform="uppercase" bold fontSize="12px">
              {t('Earned')}
            </InlineText>
          </Box>
          <NbcHarvestActions
            earnings={earnings}
            earningTokenSymbol={earningToken.symbol}
            earningTokenDecimals={earningToken.decimals}
            sousId={sousId}
            earningTokenPrice={earningTokenPrice || 0}
            isLoading={isLoading}
          />
        </>
        <Box display="inline">
          <InlineText color={isStaked ? 'secondary' : 'textSubtle'} textTransform="uppercase" bold fontSize="12px">
            {isStaked ? stakingToken.symbol : t('Stake')}{' '}
          </InlineText>
          <InlineText color={isStaked ? 'textSubtle' : 'secondary'} textTransform="uppercase" bold fontSize="12px">
            {isStaked ? t('Staked') : `${stakingToken.symbol}`}
          </InlineText>
        </Box>
        <NbcStakeActions
          isLoading={isLoading}
          pool={pool}
          stakingTokenBalance={stakingTokenBalance}
          stakedBalance={stakedBalance}
          isStaked={isStaked}
        />
      </Flex>
    </Flex>
  )
}

export default NbcCardActions
