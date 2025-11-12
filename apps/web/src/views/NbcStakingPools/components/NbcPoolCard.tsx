import BigNumber from 'bignumber.js'
import { Pool } from '@pancakeswap/widgets-internal'
import { Token } from '@pancakeswap/sdk'
import { Text } from '@pancakeswap/uikit'
import { TokenPairImage } from 'components/TokenImage'
import ConnectWalletButton from 'components/ConnectWalletButton'
import NbcCardActions from './NbcCardActions'
import NbcCardFooter from './NbcCardFooter'
import NbcAprRow from './NbcAprRow'

interface NbcPoolCardProps {
  pool: Pool.DeserializedPool<Token>
  account: string
}

const NbcPoolCard: React.FC<NbcPoolCardProps> = ({ pool, account }) => {
  const stakedBalance = pool?.userData?.stakedBalance || new BigNumber(0)

  return (
    <Pool.PoolCard<Token>
      key={pool.sousId}
      pool={pool}
      isStaked={Boolean(pool?.userData?.stakedBalance?.gt(0))}
      cardContent={
        account ? (
          <NbcCardActions pool={pool} />
        ) : (
          <>
            <Text mb="10px" textTransform="uppercase" fontSize="12px" color="textSubtle" bold>
              Start earning
            </Text>
            <ConnectWalletButton />
          </>
        )
      }
      tokenPairImage={
        <TokenPairImage primaryToken={pool.earningToken} secondaryToken={pool.stakingToken} width={64} height={64} />
      }
      cardFooter={<NbcCardFooter pool={pool} account={account} />}
      aprRow={<NbcAprRow pool={pool} stakedBalance={stakedBalance} />}
    />
  )
}

export default NbcPoolCard
