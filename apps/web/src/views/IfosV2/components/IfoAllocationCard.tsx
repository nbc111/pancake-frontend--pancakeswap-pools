import { useTranslation } from '@pancakeswap/localization'
import { Card, CardBody, Button, Text, FlexGap } from '@pancakeswap/uikit'
import AddToWalletButton from 'components/AddToWallet/AddToWalletButton'

interface IfoAllocationCardProps {
  symbol: string
  tokenAddress: string
  tokenDecimals: number
  allocatedAmount?: string
}

export const IfoAllocationDisplay: React.FC<IfoAllocationCardProps> = ({
  symbol,
  tokenAddress,
  tokenDecimals,
  allocatedAmount,
}) => {
  const { t } = useTranslation()
  const amount = allocatedAmount ?? '0'
  const swapUrl = `https://pancakeswap.finance/swap?chain=bsc&inputCurrency=${tokenAddress}&outputCurrency=BNB`

  return (
    <FlexGap flexDirection="column" alignItems="center" gap="16px">
      <Text textTransform="uppercase" color="secondary" bold fontSize="12px">
        {symbol} {t('allocated')}
      </Text>
      <Text fontSize="20px" bold>
        {amount}
      </Text>
      <FlexGap width="100%" gap="8px">
        <AddToWalletButton
          variant="secondary"
          wrapperProps={{ flex: 1 }}
          tokenAddress={tokenAddress}
          showTooltip={false}
          tokenSymbol={symbol}
          tokenDecimals={tokenDecimals}
          endIcon={null}
          buttonText={t('View in Wallet')}
          showWalletIcon={false}
        />
        <Button
          rel="noopener noreferrer"
          width="100%"
          onClick={() => {
            window.open(swapUrl, '_blank', 'noopener,noreferrer')
          }}
          style={{
            flex: 1,
            padding: 0,
          }}
        >
          {t('Swap')} {symbol}
        </Button>
      </FlexGap>
    </FlexGap>
  )
}

export const IfoAllocationCard: React.FC<IfoAllocationCardProps> = (props) => {
  if (!Number(props.allocatedAmount)) {
    return null
  }

  return (
    <Card>
      <CardBody p="24px">
        <IfoAllocationDisplay {...props} />
      </CardBody>
    </Card>
  )
}
