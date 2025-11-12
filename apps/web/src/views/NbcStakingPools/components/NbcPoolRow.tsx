import { useMatchBreakpoints } from '@pancakeswap/uikit'
import { getBalanceNumber } from '@pancakeswap/utils/formatBalance'
import { Pool } from '@pancakeswap/widgets-internal'
import { memo, useCallback, useMemo } from 'react'
import { Token } from '@pancakeswap/sdk'
import NbcActionPanel from './NbcActionPanel'
import AprCell from '../../Pools/components/PoolsTable/Cells/AprCell'
import EarningsCell from '../../Pools/components/PoolsTable/Cells/EarningsCell'
import NameCell from '../../Pools/components/PoolsTable/Cells/NameCell'
import TotalStakedCell from '../../Pools/components/PoolsTable/Cells/TotalStakedCell'

interface NbcPoolRowProps {
  pool: Pool.DeserializedPool<Token>
  account: string
  initialActivity?: boolean
}

const NbcPoolRow: React.FC<NbcPoolRowProps> = ({ pool, account, initialActivity }) => {
  const { isLg, isXl, isXxl, isDesktop } = useMatchBreakpoints()
  const isLargerScreen = isLg || isXl || isXxl
  const stakingToken = pool?.stakingToken
  const totalStaked = pool?.totalStaked

  const totalStakedBalance = useMemo(() => {
    return getBalanceNumber(totalStaked, stakingToken?.decimals)
  }, [stakingToken?.decimals, totalStaked])

  const getNow = useCallback(() => Date.now(), [])

  return pool ? (
    <Pool.ExpandRow initialActivity={initialActivity} panel={<NbcActionPanel account={account} pool={pool} expanded />}>
      <NameCell pool={pool} />
      <EarningsCell pool={pool} account={account} />
      {isLargerScreen && stakingToken && (
        <TotalStakedCell
          stakingToken={stakingToken}
          totalStaked={totalStaked}
          totalStakedBalance={totalStakedBalance}
        />
      )}
      <AprCell pool={pool} />
      {isDesktop && <Pool.EndsInCell pool={pool} getNow={getNow} />}
    </Pool.ExpandRow>
  ) : null
}

export default memo(NbcPoolRow)
