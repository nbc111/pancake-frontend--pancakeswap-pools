import { FlexGap } from '@pancakeswap/uikit'
import { ClaimedCard } from './ClaimedCard'
import { IfoSaleInfoCard } from './IfoSaleInfoCard'
import { IfoPoolLive } from './IfoPoolLive'
import { IfoVestingCard } from './IfoVestingCard'
import type { PoolInfo, IFOUserStatus } from '../../ifov2.types'
import type { IFOStatus } from '../../hooks/ifo/useIFOStatus'

interface IfoCardProps {
  pool0Info?: PoolInfo
  pool1Info?: PoolInfo
  userStatus0?: IFOUserStatus
  userStatus1?: IFOUserStatus
  ifoStatus0: IFOStatus
  ifoStatus1: IFOStatus
}

const IfoCardIdle: React.FC<IfoCardProps> = ({
  pool0Info,
  pool1Info,
  userStatus0,
  userStatus1,
  ifoStatus0,
  ifoStatus1,
}) => (
  <>
    {pool0Info && <ClaimedCard userStatus={userStatus0} pid={pool0Info.pid} />}
    {pool1Info && <ClaimedCard userStatus={userStatus1} pid={pool1Info.pid} />}
    <IfoSaleInfoCard />
    <FlexGap flexDirection="column" gap="16px">
      {pool0Info && <IfoPoolLive pid={pool0Info.pid} ifoStatus={ifoStatus0} userStatus={userStatus0} />}
      {pool1Info && <IfoPoolLive pid={pool1Info.pid} ifoStatus={ifoStatus1} userStatus={userStatus1} />}
    </FlexGap>
    <IfoVestingCard />
  </>
)

export { IfoCardIdle }
