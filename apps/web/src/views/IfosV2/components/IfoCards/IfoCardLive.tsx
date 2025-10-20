import { Card, CardBody, FlexGap, useMatchBreakpoints } from '@pancakeswap/uikit'
import useTheme from 'hooks/useTheme'
import { PoolInfo, IFOUserStatus } from 'views/IfosV2/ifov2.types'
import { IfoSaleInfoCard } from './IfoSaleInfoCard'
import { IfoPoolLive } from './IfoPoolLive'
import { VestingScheduleCard } from './VestingScheduleCard'
import type { IFOStatus } from '../../hooks/ifo/useIFOStatus'

interface IfoCardProps {
  pool0Info?: PoolInfo
  pool1Info?: PoolInfo
  userStatus0?: IFOUserStatus
  userStatus1?: IFOUserStatus
  ifoStatus0: IFOStatus
  ifoStatus1: IFOStatus
}

export const IfoCardLive: React.FC<IfoCardProps> = ({
  pool0Info,
  pool1Info,
  userStatus0,
  userStatus1,
  ifoStatus0,
  ifoStatus1,
}) => {
  const { isDark, theme } = useTheme()
  const { isDesktop } = useMatchBreakpoints()

  const stakeActionCards = (
    <Card
      style={{
        flex: '1',
      }}
      background={isDark ? '#18171A' : theme.colors.background}
      mb="16px"
    >
      <CardBody>
        <FlexGap flexDirection="column" gap="16px">
          {pool0Info && <IfoPoolLive pid={pool0Info.pid} ifoStatus={ifoStatus0} userStatus={userStatus0} />}
          {pool1Info && <IfoPoolLive pid={pool1Info.pid} ifoStatus={ifoStatus1} userStatus={userStatus1} />}
        </FlexGap>
      </CardBody>
    </Card>
  )

  return (
    <>
      {isDesktop ? (
        <FlexGap gap="16px" alignItems="flex-start">
          <FlexGap flexDirection="column" flex="1" gap="16px">
            <IfoSaleInfoCard />
            <VestingScheduleCard />
          </FlexGap>
          {stakeActionCards}
        </FlexGap>
      ) : (
        <>
          <IfoSaleInfoCard />
          {stakeActionCards}
        </>
      )}
    </>
  )
}
