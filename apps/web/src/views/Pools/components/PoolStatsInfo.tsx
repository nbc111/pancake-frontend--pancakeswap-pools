import { Flex, ScanLink, Skeleton, Text, TimerIcon } from '@pancakeswap/uikit'
import { Pool } from '@pancakeswap/widgets-internal'

import { useTranslation } from '@pancakeswap/localization'
import { Token } from '@pancakeswap/sdk'
import { BIG_ZERO } from '@pancakeswap/utils/bigNumber'
import getTimePeriods from '@pancakeswap/utils/getTimePeriods'
import AddToWalletButton, { AddToWalletTextOptions } from 'components/AddToWallet/AddToWalletButton'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { memo, useMemo } from 'react'
import { useCurrentBlock, useCurrentBlockTimestamp } from 'state/block/hooks'
import { getBlockExploreLink } from 'utils'
import { getPoolBlockInfo } from 'views/Pools/helpers'
import MaxStakeRow from './MaxStakeRow'
import { AprInfo } from './Stat'

interface ExpandedFooterProps {
  pool: Pool.DeserializedPool<Token>
  account: string
  showTotalStaked?: boolean
  alignLinksToRight?: boolean
}

const PoolStatsInfo: React.FC<React.PropsWithChildren<ExpandedFooterProps>> = ({
  pool,
  account,
  showTotalStaked = true,
  alignLinksToRight = true,
}) => {
  const { t } = useTranslation()
  const currentBlock = useCurrentBlock()
  const chainTimestamp = useCurrentBlockTimestamp()
  const { chainId } = useActiveChainId()

  const {
    stakingToken,
    earningToken,
    totalStaked,
    startTimestamp,
    endTimestamp,
    stakingLimit,
    stakingLimitEndTimestamp,
    contractAddress,
    profileRequirement,
    isFinished,
    userData: poolUserData,
  } = pool

  const stakedBalance = poolUserData?.stakedBalance ? poolUserData.stakedBalance : BIG_ZERO

  const tokenAddress = earningToken.address || ''
  const poolContractAddress = contractAddress

  const { shouldShowBlockCountdown, timeUntilStart, timeRemaining, hasPoolStarted } = getPoolBlockInfo(
    pool,
    currentBlock,
  )

  // 如果 shouldShowBlockCountdown 为 false，但池未结束且有 endTimestamp，仍然显示倒计时
  // 这样可以支持 startTimestamp 为 0 的情况（如 NBC Staking）
  const shouldShowEndCountdown = shouldShowBlockCountdown || (!isFinished && endTimestamp && endTimestamp > 0)

  // 计算当前已质押时长（仅在连接钱包且用户已质押时显示）
  const hasStaked = account && stakedBalance && stakedBalance.gt(0)
  const stakedAt = poolUserData && 'stakedAt' in poolUserData ? (poolUserData as { stakedAt?: number }).stakedAt : undefined
  const stakingDuration = useMemo(() => {
    if (!hasStaked) return null

    // 使用链上当前时间与 stakedAt（链上时间戳）一致，避免本地时钟与链时间偏差导致显示错误（如刚质押却显示 22 小时）
    const currentTimestamp =
      chainTimestamp != null ? Number(chainTimestamp) : Math.floor(Date.now() / 1000)
    // 优先使用合约返回的用户首次质押时间；否则用池的开始时间估算
    const startTime =
      stakedAt != null && stakedAt > 0 ? stakedAt : startTimestamp && startTimestamp > 0 ? startTimestamp : currentTimestamp
    const durationSeconds = currentTimestamp - startTime

    if (durationSeconds <= 0) return null

    return getTimePeriods(durationSeconds)
  }, [hasStaked, stakedAt, startTimestamp, chainTimestamp])

  return (
    <>
      {profileRequirement && (profileRequirement.required || profileRequirement.thresholdPoints.gt(0)) && (
        <Flex mb="8px" justifyContent="space-between">
          <Text small>{t('Requirement')}:</Text>
          <Text small textAlign="right">
            {profileRequirement.required && t('Pancake Profile')}{' '}
            {profileRequirement.thresholdPoints.gt(0) && (
              <Text small>
                {profileRequirement.thresholdPoints.toNumber()} {t('Profile Points')}
              </Text>
            )}
          </Text>
        </Flex>
      )}
      <AprInfo pool={pool} stakedBalance={stakedBalance} />
      {showTotalStaked && (
        <Pool.TotalStaked
          totalStaked={totalStaked || BIG_ZERO}
          tokenDecimals={stakingToken.decimals}
          symbol={stakingToken.symbol}
          decimalsToShow={0}
        />
      )}
      {!isFinished && stakingLimit && stakingLimit.gt(0) && (
        <MaxStakeRow
          small
          currentBlock={currentBlock}
          hasPoolStarted={hasPoolStarted}
          stakingLimit={stakingLimit}
          stakingLimitEndTimestamp={stakingLimitEndTimestamp || 0}
          stakingToken={stakingToken}
          endTimestamp={endTimestamp || 0}
        />
      )}
      {shouldShowEndCountdown && (
        <Flex mb="2px" justifyContent="space-between" alignItems="center">
          <Text small>{hasPoolStarted || !shouldShowBlockCountdown ? t('Ends in') : t('Starts in')}:</Text>
          {shouldShowBlockCountdown ? (
            timeRemaining || timeUntilStart ? (
              <Pool.TimeCountdownDisplay timestamp={(hasPoolStarted ? endTimestamp : startTimestamp) || 0} />
            ) : (
              <Skeleton width="54px" height="21px" />
            )
          ) : (
            // 如果 shouldShowBlockCountdown 为 false，直接使用 endTimestamp
            <Pool.TimeCountdownDisplay timestamp={endTimestamp || 0} />
          )}
        </Flex>
      )}
      {hasStaked && stakingDuration && (
        <Flex mb="2px" justifyContent="space-between" alignItems="center">
          <Text small>{t('Staked for')}:</Text>
          <Flex alignItems="center">
            <Text color="textSubtle" small>
              {stakingDuration.totalDays
                ? stakingDuration.totalDays === 1
                  ? t('1 day')
                  : t('%days% days', { days: stakingDuration.totalDays })
                : stakingDuration.hours
                ? stakingDuration.hours === 1
                  ? t('1 hour')
                  : t('%hours% hours', { hours: stakingDuration.hours })
                : stakingDuration.minutes
                ? stakingDuration.minutes === 1
                  ? t('1 minute')
                  : t('%minutes% minutes', { minutes: stakingDuration.minutes })
                : t('< 1 minute')}
            </Text>
            <TimerIcon ml="4px" color="primary" width="20px" />
          </Flex>
        </Flex>
      )}
      {poolContractAddress && (
        <Flex mb="2px" justifyContent={alignLinksToRight ? 'flex-end' : 'flex-start'}>
          <ScanLink href={getBlockExploreLink(poolContractAddress ?? '', 'address', chainId)} bold={false} small>
            {t('View Contract')}
          </ScanLink>
        </Flex>
      )}
      {account && tokenAddress && (
        <Flex justifyContent={alignLinksToRight ? 'flex-end' : 'flex-start'}>
          <AddToWalletButton
            variant="text"
            p="0"
            height="auto"
            style={{ fontSize: '14px', fontWeight: '400', lineHeight: 'normal' }}
            marginTextBetweenLogo="4px"
            textOptions={AddToWalletTextOptions.TEXT}
            tokenAddress={tokenAddress}
            tokenSymbol={earningToken.symbol}
            tokenDecimals={earningToken.decimals}
            tokenLogo={`https://tokens.pancakeswap.finance/images/${tokenAddress}.png`}
          />
        </Flex>
      )}
    </>
  )
}

export default memo(PoolStatsInfo)
