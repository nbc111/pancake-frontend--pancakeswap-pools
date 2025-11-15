import { CurrencyAmount, Currency, Percent } from '@pancakeswap/sdk'

export function computeSlippageAdjustedAmounts(
  trade: any,
  allowedSlippage: number,
): { [field in 'input' | 'output']: CurrencyAmount<Currency> } {
  const pct = new Percent(allowedSlippage, 10_000)
  return {
    input:
      trade?.inputAmount?.multiply(new Percent(1).subtract(pct)) ??
      CurrencyAmount.fromRawAmount(trade?.inputAmount?.currency ?? trade?.outputAmount?.currency, 0),
    output:
      trade?.outputAmount?.multiply(new Percent(1).subtract(pct)) ??
      CurrencyAmount.fromRawAmount(trade?.outputAmount?.currency ?? trade?.inputAmount?.currency, 0),
  }
}

export function computeTradePriceBreakdown(_trade: any): {
  priceImpactWithoutFee?: Percent
  realizedLPFee?: CurrencyAmount<Currency>
} {
  return {
    priceImpactWithoutFee: undefined,
    realizedLPFee: undefined,
  }
}

export function calculateInfiFeePercent(feeAmount: number): Percent {
  return new Percent(feeAmount, 1_000_000)
}
