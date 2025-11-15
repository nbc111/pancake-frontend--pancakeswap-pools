import { CurrencyAmount, Currency, Price } from '@pancakeswap/sdk'

export default function getPriceForOneToken(
  currencyA: Currency | undefined,
  currencyB: Currency | undefined,
  amountA: CurrencyAmount<Currency> | undefined,
  amountB: CurrencyAmount<Currency> | undefined,
): Price<Currency, Currency> | undefined {
  if (!currencyA || !currencyB || !amountA || !amountB) return undefined
  try {
    return new Price(currencyA, currencyB, amountA.quotient, amountB.quotient)
  } catch {
    return undefined
  }
}
