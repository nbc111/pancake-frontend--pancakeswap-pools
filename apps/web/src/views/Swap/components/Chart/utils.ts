import { Address } from 'viem'

export function getTokenAddress(token: any): Address | undefined {
  if (!token) return undefined
  if (typeof token === 'string') return token as Address
  if (token.address) return token.address as Address
  return undefined
}
