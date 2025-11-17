import { EventEmitter } from 'events'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { getAddress, hexToBigInt } from 'viem'
import { useChainId, useConfig, useConnectors, useReconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { useSmartWalletsSafe } from '../useSmartWallets'
import { isPrivyEnabled } from '../config'

/**
 * Registers a smart account connector in wagmi for the Privy embedded smart wallet.
 *
 * @experimental
 * Currently, this hook only supports:
 * - using only the smart account connector if the smart wallets client has loaded. All other connectors
 *   (e.g. external wallets) will be removed while the user is using the embedded wallet.
 *
 */
const useEmbeddedSmartAccountConnectorDisabled = () => ({
  isSmartWalletReady: true,
  isSettingUp: false,
  shouldUseAAWallet: false,
  hasSetupFailed: false,
})

const useEmbeddedSmartAccountConnectorEnabled = () => {
  const connectors = useConnectors()
  const config = useConfig()
  const id = useChainId()
  const { client: isReady, getClientForChain } = useSmartWalletsSafe()
  const { reconnect } = useReconnect()
  const router = useRouter()

  const [isSmartWalletReady, setIsSmartWalletReady] = useState(false)
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [hasSetupFailed, setHasSetupFailed] = useState(false)
  const [setupStartTime, setSetupStartTime] = useState<number | null>(null)

  const shouldUseAAWallet = router.query.aawallet !== 'false'

  useEffect(() => {
    const setupSmartAccountConnector = async () => {
      try {
        const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
        const chainParam = urlParams.get('chain') || ''
        if (chainParam.toLowerCase() === 'nbc') {
          setIsSmartWalletReady(true)
          setIsSettingUp(false)
          return
        }
      } catch (error) {
        console.warn('[PrivySmartAccount] Failed to inspect URL parameters', error)
      }

      if (retryCount === 0 && !setupStartTime) {
        setSetupStartTime(Date.now())
      }

      if (setupStartTime) {
        const totalDuration = (Date.now() - setupStartTime) / 1000
        if (totalDuration > 10) {
          console.error(
            `[PrivySmartAccount] ❌ Total setup time exceeded 10 seconds (${totalDuration.toFixed(2)}s), giving up`,
          )
          setIsSmartWalletReady(true)
          setIsSettingUp(false)
          setHasSetupFailed(true)
          setSetupStartTime(null)
          return
        }
      }

      if (!shouldUseAAWallet) {
        setIsSmartWalletReady(true)
        setIsSettingUp(false)
        return
      }

      if (retryCount >= 3) {
        const totalDuration = setupStartTime ? ((Date.now() - setupStartTime) / 1000).toFixed(2) : '0'
        console.error('[PrivySmartAccount] ❌ Setup failed after 3 attempts', {
          retryCount,
          totalDuration: `${totalDuration}s`,
          timestamp: new Date().toISOString(),
        })
        setIsSmartWalletReady(true)
        setIsSettingUp(false)
        setHasSetupFailed(true)
        setSetupStartTime(null)
        return
      }

      const existingSmartAccountConnector = connectors.find((connector) => connector.id === 'io.privy.smart_wallet')
      if (existingSmartAccountConnector) {
        setIsSmartWalletReady(true)
        setIsSettingUp(false)
        setHasSetupFailed(false)
        return
      }

      if (!isReady) {
        setIsSmartWalletReady(true)
        setIsSettingUp(false)
        return
      }

      setIsSettingUp(true)

      const setupTimeout = setTimeout(() => {
        console.error(`[PrivySmartAccount] ⏱️ Setup timeout after 3 seconds (attempt ${retryCount + 1}/3)`)
        setRetryCount((prev) => prev + 1)
        setIsSmartWalletReady(false)
        setIsSettingUp(false)
      }, 3000)

      try {
        // @ts-ignore
        const client = await getClientForChain({ id })

        if (!client || !getClientForChain) {
          console.warn('[PrivySmartAccount] ⚠️ Unable to get smart wallet client, falling back to embedded wallet')
          clearTimeout(setupTimeout)
          setIsSmartWalletReady(true)
          setIsSettingUp(false)
          return
        }

        const smartAccountProvider = new SmartWalletEIP1193Provider(client, getClientForChain)

        const smartAccountConnectorConstructor = injected({
          target: {
            provider: smartAccountProvider as any,
            id: 'io.privy.smart_wallet',
            name: 'io.privy.smart_wallet',
            icon: '',
          },
        })

        // @ts-ignore
        const smartAccountConnector = config._internal.connectors.setup(smartAccountConnectorConstructor)
        // @ts-ignore
        config._internal.connectors.setState([smartAccountConnector])
        // @ts-ignore
        await config.storage?.setItem('recentConnectorId', smartAccountConnector.id)

        const totalDuration = setupStartTime ? ((Date.now() - setupStartTime) / 1000).toFixed(2) : '0'
        clearTimeout(setupTimeout)
        setIsSmartWalletReady(true)
        setIsSettingUp(false)
        setHasSetupFailed(false)
        setRetryCount(0)
        setSetupStartTime(null)
        console.info(`[PrivySmartAccount] ✅ Setup completed in ${totalDuration}s`)
        // @ts-ignore
        reconnect()
      } catch (error) {
        clearTimeout(setupTimeout)
        console.error('[PrivySmartAccount] ❌ Setup error:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          attempt: retryCount + 1,
          timestamp: new Date().toISOString(),
        })
        setRetryCount((prev) => prev + 1)
        setIsSmartWalletReady(false)
        setIsSettingUp(false)
      }
    }

    setupSmartAccountConnector()
  }, [
    config,
    connectors,
    getClientForChain,
    id,
    isReady,
    reconnect,
    router.query,
    shouldUseAAWallet,
    retryCount,
    setupStartTime,
  ])

  return {
    isSmartWalletReady,
    isSettingUp,
    shouldUseAAWallet,
    hasSetupFailed,
  }
}

export const useEmbeddedSmartAccountConnectorV2 = isPrivyEnabled
  ? useEmbeddedSmartAccountConnectorEnabled
  : useEmbeddedSmartAccountConnectorDisabled

class SmartWalletEIP1193Provider extends EventEmitter {
  private smartWalletClient: any

  private readonly getClientForChain: (params: { id: number }) => Promise<any>

  constructor(client: any, getClientForChain: (params: { id: number }) => Promise<any>) {
    super()
    this.smartWalletClient = client
    this.getClientForChain = getClientForChain
  }

  async request(args: any): Promise<any> {
    const { method, params = [] } = args
    switch (method) {
      case 'eth_requestAccounts':
      case 'eth_accounts':
        return this.handleEthRequestAccounts()
      case 'eth_sendTransaction':
        return this.handleEthSendTransaction(params)
      case 'personal_sign':
        return this.handlePersonalSign(params as any)
      case 'eth_signTypedData':
      case 'eth_signTypedData_v4':
        return this.handleEthSignTypedDataV4(params as any)
      case 'eth_signTransaction':
        throw new Error('eth_signTransaction is not supported. Use eth_sendTransaction instead.')
      case 'wallet_switchEthereumChain': {
        const [{ chainId }] = params as [{ chainId: string }]
        if (!this.smartWalletClient?.account) {
          throw new Error('account not connected!')
        }
        const newClient = await this.getClientForChain({
          id: parseInt(chainId, 16),
        })
        if (!newClient) {
          throw new Error(`No smart wallet client found for chain ID ${chainId}`)
        }
        this.smartWalletClient = newClient
        this.emit('chainChanged', chainId)
        return null
      }
      default:
        return this.smartWalletClient?.transport.request({ method, params } as any)
    }
  }

  private async handleEthRequestAccounts(): Promise<string[]> {
    if (!this.smartWalletClient?.account) {
      return []
    }
    return [this.smartWalletClient.account.address]
  }

  private async handleEthSendTransaction(params: any): Promise<string> {
    const [tx] = params
    if (!this.smartWalletClient?.account) {
      throw new Error('account not connected!')
    }
    return this.smartWalletClient.sendTransaction({
      ...tx,
      value: tx.value ? hexToBigInt(tx.value) : undefined,
    })
  }

  private async handlePersonalSign(params: [string, string]): Promise<string> {
    if (!this.smartWalletClient?.account) {
      throw new Error('account not connected!')
    }

    const [message, address] = params
    if (getAddress(address) !== getAddress(this.smartWalletClient.account.address)) {
      throw new Error('cannot sign for address that is not the current account')
    }

    return this.smartWalletClient.signMessage({
      message,
    })
  }

  private async handleEthSignTypedDataV4(params: [string, any]): Promise<string> {
    if (!this.smartWalletClient?.account) {
      throw new Error('account not connected!')
    }

    const address = params[0]
    if (getAddress(address) !== getAddress(this.smartWalletClient.account.address)) {
      throw new Error('cannot sign for address that is not the current account')
    }

    const typedData = typeof params[1] === 'string' ? JSON.parse(params[1]) : params[1]

    return this.smartWalletClient.signTypedData(typedData as any)
  }
}
