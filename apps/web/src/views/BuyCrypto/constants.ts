export enum OnRampChainId {
  ETH = 1,
  BSC = 56,
}

export enum ONRAMP_PROVIDERS {
  Mercuryo = 'Mercuryo',
  MoonPay = 'MoonPay',
  Transak = 'Transak',
  Topper = 'Topper',
}

export interface OnRampCurrency {
  symbol: string
  name: string
  address?: string
  decimals: number
}

export const onRampCurrenciesMap: Record<number, OnRampCurrency[]> = {}
