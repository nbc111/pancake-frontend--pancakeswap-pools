import { Box, BoxProps } from '@pancakeswap/uikit'
import { FieldDepositAmount } from 'components/Liquidity/Form/FieldDepositAmount'
import { useSelectIdRouteParams } from 'hooks/dynamicRoute/useSelectIdRoute'
import { useCreateDepositAmounts, useCreateDepositAmountsEnabled } from '../hooks/useCreateDepositAmounts'
import { useCurrencies } from '../hooks/useCurrencies'

type FieldDepositAmountProps = BoxProps

export const FieldCreateDepositAmount: React.FC<FieldDepositAmountProps> = ({ ...boxProps }) => {
  const { chainId } = useSelectIdRouteParams()
  const { baseCurrency, quoteCurrency } = useCurrencies()
  const { handleDepositAmountChange, inputValue0, inputValue1 } = useCreateDepositAmounts()

  const { isDeposit0Enabled, isDepositEnabled, isDeposit1Enabled } = useCreateDepositAmountsEnabled()

  return (
    <Box>
      <FieldDepositAmount
        {...boxProps}
        chainId={chainId}
        baseCurrency={baseCurrency}
        quoteCurrency={quoteCurrency}
        handleDepositAmountChange={handleDepositAmountChange}
        inputValue0={inputValue0}
        inputValue1={inputValue1}
        isDepositEnabled={isDepositEnabled}
        isDeposit0Enabled={isDeposit0Enabled}
        isDeposit1Enabled={isDeposit1Enabled}
      />
    </Box>
  )
}
