import { Address } from 'viem'

export interface Route {
  fromChain: number
  toChain: number
  bridge: string
}

export async function getBridgeAvailableRoutes(): Promise<Route[]> {
  return []
}

export async function getTokenAddress(_token: any): Promise<Address | undefined> {
  return undefined
}

export async function postMetadata(_params: any): Promise<any> {
  return {}
}

export async function getUnifiedTokenAddress(_token: any): Promise<Address | undefined> {
  return undefined
}

export async function postSolanaEVMBridgeMetadata(_params: any): Promise<any> {
  return {}
}

export async function generateSwapCommands(_params: any): Promise<any> {
  return []
}
