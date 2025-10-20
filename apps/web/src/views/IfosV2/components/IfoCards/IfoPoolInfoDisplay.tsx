import { Trans, useTranslation } from '@pancakeswap/localization'
import { FlexGap, InfoIcon, Text, useTooltip } from '@pancakeswap/uikit'
import { ReactNode } from 'react'
import { styled } from 'styled-components'
import type { IFOStatus } from '../../hooks/ifo/useIFOStatus'
import type { IFOUserStatus } from '../../ifov2.types'
import useIfo from '../../hooks/useIfo'
import { useIfoDisplay } from '../../hooks/useIfoDisplay'

const StyledText = styled(Text)`
  font-size: 14px;
  font-family: Kanit;
  line-height: 150%;
`

type InfoRowData = { left: ReactNode; right: ReactNode; display: boolean }

const InfoRow: React.FC<InfoRowData & { mt?: string }> = ({ left, right, display, mt }) =>
  display ? (
    <FlexGap justifyContent="space-between" mt={mt}>
      {left}
      {right}
    </FlexGap>
  ) : null

interface IfoPoolInfoDisplayProps {
  pid: number
  ifoStatus?: IFOStatus
  userStatus?: IFOUserStatus
  variant: 'live' | 'finished' | 'presale' | 'history'
}

const IfoPoolInfoDisplay: React.FC<IfoPoolInfoDisplayProps> = ({ pid, ifoStatus, userStatus, variant }) => {
  const { t } = useTranslation()
  const { pools } = useIfo()
  const poolInfo = pools?.[pid]
  const stakeCurrency = poolInfo?.stakeCurrency
  const { pools: displayPools } = useIfoDisplay()
  const raiseAmountText = displayPools?.[pid]?.raiseAmountText
  const pricePerToken = poolInfo?.price
  const userHasStaked = userStatus?.stakedAmount?.greaterThan(0)
  const showExtraInfo = variant === 'live' && userHasStaked
  const feeTier = poolInfo?.feeTier !== undefined ? `${(poolInfo.feeTier * 100).toFixed(2)}%` : undefined
  const cakeToBurn =
    poolInfo?.isCakePool && userStatus?.tax
      ? `${userStatus.tax.toSignificant(6)} ${userStatus.tax.currency.symbol}`
      : undefined

  const {
    targetRef: statusTargetRef,
    tooltip: statusTooltip,
    tooltipVisible: statusTooltipVisible,
  } = useTooltip(t('This sale has been oversubscribed. You will get partial refund of the deposit.'), {
    placement: 'top',
  })

  const feeTierTooltipContent = (
    <Text as="div" fontSize="12px">
      <Trans>
        Tiered Tax based on subscription % : Fees decrease as oversubscription increases.
        <ul>
          <li>≤100% Sub → 0% Fee</li>
          <li>&gt;100% Sub → 1% Fee</li>
          <li>≥5,000% Sub → 0.8% Fee</li>
          <li>≥10,000% Sub → 0.6% Fee</li>
          <li>≥15,000% Sub → 0.5% Fee</li>
          <li>≥20,000% Sub → 0.4% Fee</li>
          <li>≥25,000% Sub → 0.3% Fee</li>
          <li>≥30,000% Sub → 0.25% Fee</li>
          <li>≥40,000% Sub → 0.20% Fee</li>
          <li>≥50,000% Sub → 0.15% Fee</li>
          <li>≥65,000% Sub → 0.12% Fee</li>
          <li>≥80,000% Sub → 0.10% Fee</li>
          <li>&gt;150,000% Sub → 0.05% Fee</li>
        </ul>
        (All IFO fees collected will be used in CAKE burn)
      </Trans>
    </Text>
  )

  const {
    targetRef: feeTierTargetRef,
    tooltip: feeTierTooltip,
    tooltipVisible: feeTierTooltipVisible,
  } = useTooltip(feeTierTooltipContent, {
    placement: 'top-start',
  })

  const feeTierRight = (
    <FlexGap ref={feeTierTargetRef} alignItems="center">
      <StyledText color="text">{feeTier}</StyledText>
      <InfoIcon width="14px" color="textSubtle" />
      {feeTierTooltipVisible && feeTierTooltip}
    </FlexGap>
  )

  const statusRight = (
    <FlexGap flexDirection="column" alignItems="flex-end">
      <FlexGap gap="3px" alignItems="center">
        <StyledText color="text">
          {ifoStatus?.progress.toFixed(2)} % {ifoStatus?.progress?.greaterThan(1) && '🎉'}
        </StyledText>
        {ifoStatus?.progress?.greaterThan(1) && variant === 'finished' && (
          <FlexGap ref={statusTargetRef}>
            <InfoIcon width="14px" color="textSubtle" />
            {statusTooltipVisible && statusTooltip}
          </FlexGap>
        )}
      </FlexGap>
      {ifoStatus?.progress?.greaterThan(1) && variant !== 'finished' && (
        <FlexGap gap="3px">
          <StyledText color="text">{t('Oversubscribed')}</StyledText>
          <FlexGap ref={statusTargetRef}>
            <InfoIcon width="14px" color="textSubtle" />
            {statusTooltipVisible && statusTooltip}
          </FlexGap>
        </FlexGap>
      )}
    </FlexGap>
  )

  const list: InfoRowData[] = [
    {
      left: <StyledText color="textSubtle">{t('Sale Price per token')}</StyledText>,
      right: (
        <StyledText color="text">
          {pricePerToken?.toSignificant(6)} {stakeCurrency?.symbol ?? ''}
        </StyledText>
      ),
      display: true,
    },
    {
      left: <StyledText color="textSubtle">{t('Raise Goal')}</StyledText>,
      right: <StyledText color="text">{raiseAmountText}</StyledText>,
      display: true,
    },
    {
      left: <StyledText color="textSubtle">{t('Total committed')}</StyledText>,
      right: (
        <StyledText color="text">
          {ifoStatus?.currentStakedAmount?.toSignificant(6) ?? 0} {stakeCurrency?.symbol ?? ''}
        </StyledText>
      ),
      display:
        variant !== 'presale' &&
        ((variant === 'live' && userHasStaked) || variant === 'finished' || variant === 'history'),
    },
    {
      left: <StyledText color="textSubtle">{t('Deposit Amount')}</StyledText>,
      right: (
        <StyledText color="text">
          {userStatus?.stakedAmount?.toSignificant(6) ?? 0} {stakeCurrency?.symbol ?? ''}
        </StyledText>
      ),
      display: Boolean(variant !== 'presale' && showExtraInfo),
    },
    {
      left: <StyledText color="textSubtle">{t('Fee Tier')}</StyledText>,
      right: feeTierRight,
      display: variant !== 'presale' && variant !== 'finished' && !showExtraInfo && !!feeTier,
    },
    {
      left: <StyledText color="textSubtle">{t('Est. CAKE to burn:')}</StyledText>,
      right: <StyledText color="text">{cakeToBurn}</StyledText>,
      display: variant !== 'presale' && variant !== 'finished' && !showExtraInfo && !!cakeToBurn,
    },
    {
      left: <StyledText color="textSubtle">{t('Status')}</StyledText>,
      right: statusRight,
      display: variant !== 'presale' && variant !== 'history',
    },
    {
      left: <StyledText color="textSubtle">{t('Fee Tier')}</StyledText>,
      right: feeTierRight,
      display: Boolean(variant !== 'presale' && showExtraInfo && !!feeTier),
    },
    {
      left: <StyledText color="textSubtle">{t('Est. CAKE to burn:')}</StyledText>,
      right: <StyledText color="text">{cakeToBurn}</StyledText>,
      display: Boolean(variant !== 'presale' && showExtraInfo && !!cakeToBurn),
    },
  ]

  return (
    <>
      {list.map((row, idx) => (
        <InfoRow key={idx} {...row} mt={idx === 0 ? '8px' : undefined} />
      ))}
    </>
  )
}

export default IfoPoolInfoDisplay
