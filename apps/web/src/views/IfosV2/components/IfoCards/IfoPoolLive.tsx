import { useTranslation } from '@pancakeswap/localization'
import { AddIcon, Button, FlexGap, Text } from '@pancakeswap/uikit'
import { CurrencyLogo } from '@pancakeswap/widgets-internal'
import { useRouter } from 'next/router'
import { useAccount } from 'wagmi'
import ConnectWalletButton from 'components/ConnectWalletButton'
import { useStablecoinPriceAmount } from 'hooks/useStablecoinPrice'
import { logGTMIfoConnectWalletEvent } from 'utils/customGTMEventTracking'
import type { IFOStatus } from '../../hooks/ifo/useIFOStatus'
import type { IFOUserStatus } from '../../ifov2.types'
import useIfo from '../../hooks/useIfo'
import IfoPoolInfoDisplay from './IfoPoolInfoDisplay'
import { formatDollarAmount } from './IfoDepositForm'

export const IfoPoolLive: React.FC<{
  pid: number
  ifoStatus: IFOStatus
  userStatus?: IFOUserStatus
}> = ({ ifoStatus, pid, userStatus }) => {
  const router = useRouter()
  const { config, info, pools } = useIfo()
  const status = info?.status
  const isComingSoon = status === 'coming_soon'
  const poolInfo = pools?.[pid]
  const ifoId = config?.id
  if (isComingSoon) {
    return null
  }

  return (
    <FlexGap flexDirection="column" gap="8px">
      <PoolAction pid={pid} userStatus={userStatus} />
      <IfoPoolInfoDisplay pid={pid} ifoStatus={ifoStatus} userStatus={userStatus} variant="live" />
    </FlexGap>
  )
}

const PoolAction: React.FC<{
  pid: number
  userStatus?: IFOUserStatus
}> = ({ pid, userStatus }) => {
  const { t } = useTranslation()
  const router = useRouter()
  const { config, info, pools } = useIfo()
  const status = info?.status
  const isComingSoon = status === 'coming_soon'
  const poolInfo = pools?.[pid]
  const stakedAmount = userStatus?.stakedAmount
  const stakeCurrency = stakedAmount?.currency ?? poolInfo?.stakeCurrency
  const ifoId = config?.id
  const userHasStaked = stakedAmount?.greaterThan(0)
  const { address: account } = useAccount()
  const amountInDollar = useStablecoinPriceAmount(
    stakeCurrency ?? undefined,
    stakedAmount !== undefined && Number.isFinite(+stakedAmount.toSignificant(6))
      ? +stakedAmount.toSignificant(6)
      : undefined,
    {
      enabled: Boolean(stakedAmount !== undefined && Number.isFinite(+stakedAmount.toSignificant(6))),
    },
  )
  if (isComingSoon) {
    return null
  }

  const handleDepositClick = () => {
    if (ifoId) {
      const { ifo, ...restQuery } = router.query
      router.push({
        pathname: '/ifo/deposit/[ifoId]/[poolIndex]',
        query: { ifoId, poolIndex: pid, ...restQuery },
      })
    }
  }

  const handleConnectWallet = () => {
    logGTMIfoConnectWalletEvent(isComingSoon)
  }

  if (userHasStaked) {
    return (
      <FlexGap gap="8px" justifyContent="space-between" alignItems="center">
        <FlexGap flexDirection="column">
          <FlexGap gap="8px" alignItems="center">
            {stakeCurrency && <CurrencyLogo currency={stakeCurrency} size="24px" />}
            <Text fontSize="12px" bold color="secondary" lineHeight="18px" textTransform="uppercase">
              {stakeCurrency?.symbol} {t('Pool')} {t('Deposited')}
            </Text>
          </FlexGap>
          <Text fontSize="20px" bold lineHeight="30px">
            {stakedAmount?.toSignificant(6)}
          </Text>
          {Number.isFinite(amountInDollar) && (
            <Text fontSize="14px" color="textSubtle">
              {`~${amountInDollar && formatDollarAmount(amountInDollar)} USD`}
            </Text>
          )}
        </FlexGap>
        <Button
          variant="secondary"
          scale="sm"
          onClick={handleDepositClick}
          disabled={status !== 'live'}
          style={{ height: '40px' }}
          padding="11px 12px 13px 12px"
        >
          <AddIcon color="primary" />
        </Button>
      </FlexGap>
    )
  }

  return (
    <>
      <Text fontSize="12px" bold color="secondary" lineHeight="18px" textTransform="uppercase">
        {stakeCurrency?.symbol} {t('Pool')}
      </Text>
      <FlexGap alignItems="center" width="100%" gap="8px">
        <CurrencyLogo currency={stakeCurrency} size="40px" />
        {!account ? (
          <ConnectWalletButton scale="sm" onClickCapture={handleConnectWallet} style={{ marginLeft: 'auto' }} />
        ) : (
          <Button
            scale="sm"
            onClick={handleDepositClick}
            style={{
              height: '40px',
              flex: 1,
            }}
            disabled={status !== 'live'}
          >
            {t('Deposit %symbol%', { symbol: stakeCurrency?.symbol })}
          </Button>
        )}
      </FlexGap>
    </>
  )
}

export default IfoPoolLive
