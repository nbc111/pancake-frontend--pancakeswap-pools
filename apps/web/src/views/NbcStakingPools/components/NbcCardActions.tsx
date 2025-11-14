import BigNumber from 'bignumber.js'
import { BIG_ZERO } from '@pancakeswap/utils/bigNumber'
import { Flex, Text, Heading, Button, Balance, Skeleton } from '@pancakeswap/uikit'
import { Pool } from '@pancakeswap/widgets-internal'
import { useTranslation } from '@pancakeswap/localization'
import { Token } from '@pancakeswap/sdk'
import { useAccount } from 'wagmi'
import { getBalanceNumber } from '@pancakeswap/utils/formatBalance'
import ConnectWalletButton from 'components/ConnectWalletButton'
import NbcHarvestActions from './NbcHarvestActions'
import NbcStakeActions from './NbcStakeActions'
import { ActionContainer, ActionTitles, ActionContent } from '../../Pools/components/PoolsTable/ActionPanel/styles'

interface NbcCardActionsProps {
  pool: Pool.DeserializedPool<Token>
}

const NbcCardActions: React.FC<NbcCardActionsProps> = ({ pool }) => {
  const { sousId, stakingToken, earningToken, userData, earningTokenPrice } = pool
  const { t } = useTranslation()
  const { address: account } = useAccount()

  // NBC staking 使用原生代币，不需要 allowance
  const stakingTokenBalance = userData?.stakingTokenBalance ? new BigNumber(userData.stakingTokenBalance) : BIG_ZERO
  const earnings = userData?.pendingReward ? new BigNumber(userData.pendingReward) : BIG_ZERO
  const stakedBalance = userData?.stakedBalance ? new BigNumber(userData.stakedBalance) : BIG_ZERO
  const isStaked = stakedBalance.gt(0)
  const isLoading = !userData

  const earningTokenBalance = getBalanceNumber(earnings, earningToken.decimals)
  const earningTokenDollarBalance = getBalanceNumber(
    earnings.multipliedBy(earningTokenPrice || 0),
    earningToken.decimals,
  )
  const hasEarnings = earnings.gt(0)

  const harvestActionTitle = (
    <>
      <Text fontSize="12px" bold color="secondary" as="span">
        {earningToken.symbol}{' '}
      </Text>
      <Text fontSize="12px" bold color="textSubtle" as="span" textTransform="uppercase">
        {t('Earned')}
      </Text>
    </>
  )

  const stakeActionTitle = isStaked ? (
    <>
      <Text fontSize="12px" bold color="secondary" as="span">
        {stakingToken.symbol}{' '}
      </Text>
      <Text fontSize="12px" bold color="textSubtle" as="span" textTransform="uppercase">
        {t('Staked')}
      </Text>
    </>
  ) : (
    <>
      <Text fontSize="12px" bold color="secondary" as="span" textTransform="uppercase">
        {t('Stake')}{' '}
      </Text>
      <Text fontSize="12px" bold color="textSubtle" as="span" textTransform="uppercase">
        {stakingToken.symbol}
      </Text>
    </>
  )

  return (
    <>
      {/* Harvest Action */}
      {!account ? (
        <ActionContainer>
          <ActionTitles>{harvestActionTitle}</ActionTitles>
          <ActionContent>
            <Heading>0</Heading>
            <Button disabled>{t('Harvest')}</Button>
          </ActionContent>
        </ActionContainer>
      ) : !isLoading ? (
        <ActionContainer>
          <ActionTitles>{harvestActionTitle}</ActionTitles>
          <ActionContent>
            <Flex flex="1" flexDirection="column" alignSelf="flex-center">
              {hasEarnings ? (
                <>
                  <Balance lineHeight="1" bold fontSize="20px" decimals={5} value={earningTokenBalance} />
                  {earningTokenPrice !== undefined && earningTokenPrice > 0 && (
                    <Balance
                      display="inline"
                      fontSize="12px"
                      color="textSubtle"
                      decimals={2}
                      prefix="~"
                      value={earningTokenDollarBalance}
                      unit=" USD"
                    />
                  )}
                </>
              ) : (
                <>
                  <Heading color="textDisabled">0</Heading>
                  <Text fontSize="12px" color="textDisabled">
                    0 USD
                  </Text>
                </>
              )}
            </Flex>
            <NbcHarvestActions
              earnings={earnings}
              earningTokenSymbol={earningToken.symbol}
              earningTokenDecimals={earningToken.decimals}
              sousId={sousId}
              earningTokenPrice={earningTokenPrice || 0}
              isLoading={isLoading}
            />
          </ActionContent>
        </ActionContainer>
      ) : (
        <ActionContainer>
          <ActionTitles>{harvestActionTitle}</ActionTitles>
          <ActionContent>
            <Skeleton width={180} height="32px" marginTop={14} />
          </ActionContent>
        </ActionContainer>
      )}

      {/* Stake Action */}
      {!account ? (
        <ActionContainer>
          <ActionTitles>
            <Text fontSize="12px" bold color="textSubtle" as="span" textTransform="uppercase">
              {t('Start staking')}
            </Text>
          </ActionTitles>
          <ActionContent>
            <ConnectWalletButton width="100%" />
          </ActionContent>
        </ActionContainer>
      ) : !isLoading ? (
        <ActionContainer>
          <ActionTitles>{stakeActionTitle}</ActionTitles>
          <ActionContent>
            <NbcStakeActions
              isLoading={isLoading}
              pool={pool}
              stakingTokenBalance={stakingTokenBalance}
              stakedBalance={stakedBalance}
              isStaked={isStaked}
            />
          </ActionContent>
        </ActionContainer>
      ) : (
        <ActionContainer>
          <ActionTitles>
            <Text fontSize="12px" bold color="textSubtle" as="span" textTransform="uppercase">
              {t('Start staking')}
            </Text>
          </ActionTitles>
          <ActionContent>
            <Skeleton width={180} height="32px" marginTop={14} />
          </ActionContent>
        </ActionContainer>
      )}
    </>
  )
}

export default NbcCardActions
