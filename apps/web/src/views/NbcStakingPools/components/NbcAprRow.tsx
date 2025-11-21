import { Token } from '@pancakeswap/sdk'
import { Pool } from '@pancakeswap/widgets-internal'
import BigNumber from 'bignumber.js'
import Apr from '../../Pools/components/Apr'

interface NbcAprRowProps {
  pool: Pool.DeserializedPool<Token>
  stakedBalance: BigNumber
  performanceFee?: number
  showIcon?: boolean
}

const NbcAprRow: React.FC<React.PropsWithChildren<NbcAprRowProps>> = ({
  pool,
  stakedBalance,
  performanceFee = 0,
  showIcon = true,
}) => {
  return (
    <Pool.AprRowWithToolTip>
      <Apr pool={pool} stakedBalance={stakedBalance} performanceFee={performanceFee} showIcon={showIcon} decimals={4} />
    </Pool.AprRowWithToolTip>
  )
}

export default NbcAprRow
