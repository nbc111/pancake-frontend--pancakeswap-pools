import { Button, Text } from '@pancakeswap/uikit'
import { useUserSlippage } from '@pancakeswap/utils/user'
import { useTranslation } from '@pancakeswap/localization'

export function LiquiditySlippageButton() {
  const { t } = useTranslation()
  const [allowedSlippage] = useUserSlippage()

  return (
    <Button variant="text" scale="sm">
      <Text fontSize="14px" color="textSubtle">
        {t('Slippage: %slippage%%', { slippage: allowedSlippage / 100 })}
      </Text>
    </Button>
  )
}

export function SlippageButton() {
  return <LiquiditySlippageButton />
}

export function SolanaLiquiditySlippageButton() {
  return <LiquiditySlippageButton />
}
