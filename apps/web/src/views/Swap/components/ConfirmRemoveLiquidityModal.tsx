import React, { useCallback } from 'react'
import { Currency, CurrencyAmount, Percent, Token } from '@pancakeswap/sdk'
import { AutoColumn, Button, InjectedModalProps, RowBetween, RowFixed, Text } from '@pancakeswap/uikit'
import { ConfirmationModalContent, TransactionErrorContent } from '@pancakeswap/widgets-internal'
import { useTranslation } from '@pancakeswap/localization'
import TransactionConfirmationModal from 'components/TransactionConfirmationModal'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { useUserSlippage } from '@pancakeswap/utils/user'
import { formatAmount } from 'utils/formatInfoNumbers'

enum Field {
  LIQUIDITY_PERCENT = 'LIQUIDITY_PERCENT',
  LIQUIDITY = 'LIQUIDITY',
  CURRENCY_A = 'CURRENCY_A',
  CURRENCY_B = 'CURRENCY_B',
}

interface ConfirmRemoveLiquidityModalProps {
  title: string
  customOnDismiss: () => void
  attemptingTxn: boolean
  hash: string
  parsedAmounts: {
    [Field.LIQUIDITY_PERCENT]: Percent
    [Field.LIQUIDITY]?: CurrencyAmount<Token>
    [Field.CURRENCY_A]?: CurrencyAmount<Currency>
    [Field.CURRENCY_B]?: CurrencyAmount<Currency>
  }
  onRemove: () => void
  liquidityErrorMessage: string
  tokenA: Token
  tokenB: Token
  currencyA: Currency | undefined
  currencyB: Currency | undefined
  allowedSlippage?: number
  pair?: any
  pendingText?: string
}

const ConfirmRemoveLiquidityModal: React.FC<
  React.PropsWithChildren<InjectedModalProps & ConfirmRemoveLiquidityModalProps>
> = ({
  title,
  onDismiss,
  customOnDismiss,
  attemptingTxn,
  hash,
  parsedAmounts,
  onRemove,
  liquidityErrorMessage,
  tokenA,
  tokenB,
  currencyA,
  currencyB,
  allowedSlippage,
  pendingText,
}) => {
  const { t } = useTranslation()
  const [userAllowedSlippage] = useUserSlippage()
  const slippage = allowedSlippage ?? userAllowedSlippage

  const amountA = parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) ?? '0'
  const amountB = parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) ?? '0'

  const defaultPendingText = t('Removing %amountA% %symbolA% and %amountB% %symbolB%', {
    amountA,
    symbolA: currencyA?.symbol ?? '',
    amountB,
    symbolB: currencyB?.symbol ?? '',
  })
  const finalPendingText = pendingText || defaultPendingText

  const modalHeader = useCallback(() => {
    return (
      <AutoColumn gap="md">
        {parsedAmounts[Field.CURRENCY_A] && (
          <RowBetween justifyContent="space-between">
            <Text fontSize="24px">{amountA}</Text>
            <RowFixed gap="4px">
              <CurrencyLogo currency={currencyA} size="24px" />
              <Text fontSize="24px" ml="10px">
                {currencyA?.symbol}
              </Text>
            </RowFixed>
          </RowBetween>
        )}
        {parsedAmounts[Field.CURRENCY_B] && (
          <RowBetween justifyContent="space-between" mt="16px">
            <Text fontSize="24px">{amountB}</Text>
            <RowFixed gap="4px">
              <CurrencyLogo currency={currencyB} size="24px" />
              <Text fontSize="24px" ml="10px">
                {currencyB?.symbol}
              </Text>
            </RowFixed>
          </RowBetween>
        )}

        <Text small textAlign="left" pt="12px">
          {t(
            'Output is estimated. You will receive at least %amountA% %symbolA% and %amountB% %symbolB% or the transaction will revert.',
            {
              amountA: formatAmount(parseFloat(amountA) * (1 - slippage / 10000)),
              symbolA: currencyA?.symbol ?? '',
              amountB: formatAmount(parseFloat(amountB) * (1 - slippage / 10000)),
              symbolB: currencyB?.symbol ?? '',
            },
          )}
        </Text>
      </AutoColumn>
    )
  }, [parsedAmounts, amountA, amountB, currencyA, currencyB, slippage, t])

  const modalBottom = useCallback(() => {
    return (
      <>
        <RowBetween>
          <Text>{t('%symbolA%/%symbolB% Burned', { symbolA: tokenA.symbol, symbolB: tokenB.symbol })}</Text>
          <RowFixed>
            <CurrencyLogo currency={tokenA} size="24px" style={{ marginRight: '-8px' }} />
            <CurrencyLogo currency={tokenB} size="24px" />
            <Text>
              {parsedAmounts[Field.LIQUIDITY]?.toSignificant(6) ?? '0'} {tokenA.symbol}/{tokenB.symbol}
            </Text>
          </RowFixed>
        </RowBetween>
        <Button onClick={onRemove} mt="20px" width="100%">
          {t('Confirm')}
        </Button>
      </>
    )
  }, [tokenA, tokenB, parsedAmounts, onRemove, t])

  const confirmationContent = useCallback(
    () =>
      liquidityErrorMessage ? (
        <TransactionErrorContent onDismiss={onDismiss} message={liquidityErrorMessage} />
      ) : (
        <ConfirmationModalContent topContent={modalHeader} bottomContent={modalBottom} />
      ),
    [onDismiss, modalHeader, modalBottom, liquidityErrorMessage],
  )

  return (
    <TransactionConfirmationModal
      title={title}
      onDismiss={onDismiss}
      customOnDismiss={customOnDismiss}
      attemptingTxn={attemptingTxn}
      hash={hash}
      content={confirmationContent}
      pendingText={finalPendingText}
      currencyToAdd={undefined}
    />
  )
}

export default ConfirmRemoveLiquidityModal
