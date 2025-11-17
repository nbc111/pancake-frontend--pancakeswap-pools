import type { ChainId } from '@pancakeswap/chains'

export type TokenTransaction = {
  hash: string
  timestamp: number
  amountUSD: number
  type: string
}

export async function fetchTokenTransactions({
  chainId: _chainId,
  address: _address,
  type: _type,
  numberOfTransactions: _numberOfTransactions = 0,
}: {
  chainId?: ChainId
  address?: string
  type?: string
  numberOfTransactions?: number
}): Promise<TokenTransaction[]> {
  // Token transactions API is not available on NBC, so return an empty list
  return []
}
