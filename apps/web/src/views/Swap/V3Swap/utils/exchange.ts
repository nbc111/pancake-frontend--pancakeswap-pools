import { CurrencyAmount, Percent } from '@pancakeswap/swap-sdk-core'

export const calculateInfiFeePercent = (fee: number, protocolFee = 0) => {
  return {
    totalFee: fee + protocolFee,
    lpFee: fee,
    protocolFee,
  }
}

export const computeSlippageAdjustedAmounts = (_trade: any, _allowedSlippage: Percent) => {
  return {
    INPUT: CurrencyAmount.fromRawAmount(_trade?.trade?.inputAmount?.currency ?? _trade?.inputAmount?.currency, 0),
    OUTPUT: CurrencyAmount.fromRawAmount(_trade?.trade?.outputAmount?.currency ?? _trade?.outputAmount?.currency, 0),
  }
}

export const computeTradePriceBreakdown = () => {
  return {
    priceImpactWithoutFee: new Percent(0),
    realizedLPFee: new Percent(0),
    route: [],
  }
}
