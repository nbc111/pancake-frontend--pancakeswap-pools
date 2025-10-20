import { Card, CardBody, FlexGap, useMatchBreakpoints } from '@pancakeswap/uikit'
import { PoolInfo, IFOUserStatus } from 'views/IfosV2/ifov2.types'
import useTheme from 'hooks/useTheme'
import { IfoAllocationCard } from '../IfoAllocationCard'
import useIfo from '../../hooks/useIfo'
import { IfoSaleInfoCard } from './IfoSaleInfoCard'
import { IfoPoolFinished } from './IfoPoolFinished'
import { IfoVestingCard } from './IfoVestingCard'
import type { IFOStatus } from '../../hooks/ifo/useIFOStatus'

interface IfoCardProps {
  pool0Info?: PoolInfo
  pool1Info?: PoolInfo
  userStatus0?: IFOUserStatus
  userStatus1?: IFOUserStatus
  ifoStatus0: IFOStatus
  ifoStatus1: IFOStatus
}

export const IfoCardFinished: React.FC<IfoCardProps> = ({
  pool0Info,
  pool1Info,
  userStatus0,
  userStatus1,
  ifoStatus0,
  ifoStatus1,
}) => {
  const { isDesktop } = useMatchBreakpoints()
  const { info } = useIfo()

  const offeringCurrency = info?.offeringCurrency
  const symbol = offeringCurrency?.symbol ?? ''
  const tokenAddress = offeringCurrency?.wrapped.address ?? ''
  const tokenDecimals = offeringCurrency?.decimals ?? 18

  const allocationCurrencyAmount = (() => {
    if (userStatus0?.claimableAmount && userStatus1?.claimableAmount) {
      return userStatus0.claimableAmount.add(userStatus1.claimableAmount)
    }
    return userStatus0?.claimableAmount ?? userStatus1?.claimableAmount
  })()

  const allocatedAmount = allocationCurrencyAmount?.toSignificant(6)

  const userHasStaked0 = userStatus0?.stakedAmount?.greaterThan(0)
  const userHasStaked1 = userStatus1?.stakedAmount?.greaterThan(0)
  const userClaimed0 = userStatus0?.claimed
  const userClaimed1 = userStatus1?.claimed

  const showAllocationCard = !!(userClaimed0 || userClaimed1 || (!userHasStaked0 && !userHasStaked1))

  const saleInfo = <IfoSaleInfoCard />

  const allocationCard = showAllocationCard ? (
    <IfoAllocationCard
      symbol={symbol}
      tokenAddress={tokenAddress}
      tokenDecimals={tokenDecimals}
      allocatedAmount={allocatedAmount}
    />
  ) : null

  const pool0Card = pool0Info ? (
    <PoolCardWrapper>
      <IfoPoolFinished pid={pool0Info.pid} userStatus={userStatus0} ifoStatus={ifoStatus0} />
    </PoolCardWrapper>
  ) : null

  const pool1Card = pool1Info ? (
    <PoolCardWrapper>
      <IfoPoolFinished pid={pool1Info.pid} userStatus={userStatus1} ifoStatus={ifoStatus1} />
    </PoolCardWrapper>
  ) : null

  const isSinglePool = Boolean((pool0Card && !pool1Card) || (pool1Card && !pool0Card))

  return (
    <>
      {isDesktop ? (
        isSinglePool ? (
          <FlexGap flexDirection="column" gap="16px" maxWidth="420px" width="100%" mx="auto">
            {saleInfo}
            {allocationCard}
            {pool0Card || pool1Card}
          </FlexGap>
        ) : (
          <>
            <FlexGap gap="16px" mb="16px" alignItems="flex-start">
              <FlexGap flex="1" flexDirection="column" gap="16px">
                {saleInfo}
              </FlexGap>
              <FlexGap flex="1" flexDirection="column" gap="16px">
                {allocationCard}
              </FlexGap>
            </FlexGap>

            <FlexGap gap="16px" alignItems="flex-start">
              <FlexGap flex="1" flexDirection="column" gap="16px">
                {pool0Card}
              </FlexGap>
              <FlexGap flex="1" flexDirection="column" gap="16px">
                {pool1Card}
              </FlexGap>
            </FlexGap>
          </>
        )
      ) : (
        <>
          {saleInfo}
          {allocationCard}
          {pool0Card}
          {pool1Card}
        </>
      )}
      <IfoVestingCard />
    </>
  )
}

const PoolCardWrapper = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useTheme()
  return (
    <FlexGap flex="1" flexDirection="column" gap="16px">
      <Card
        style={{
          flex: '1',
        }}
        background={theme.colors.card}
        mb="16px"
      >
        <CardBody>{children}</CardBody>
      </Card>
    </FlexGap>
  )
}
