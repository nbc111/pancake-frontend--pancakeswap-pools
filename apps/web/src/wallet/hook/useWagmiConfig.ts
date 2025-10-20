import { isInBinance } from '@binance/w3w-utils'
import { useEffect } from 'react'
import { createW3WWagmiConfig, createWagmiConfig } from 'utils/wagmi'
import { eip6963Providers } from 'wallet/WalletProvider'
import { atom, useAtom } from 'jotai'

export const wagmiConfigAtom = atom<any>(undefined)
export const useWagmiConfig = () => {
  const [wagmiConfig, setWagmiConfig] = useAtom(wagmiConfigAtom)

  useEffect(() => {
    window.addEventListener('eip6963:announceProvider', (event: any) => {
      const { provider, info } = event.detail
      const exists = eip6963Providers.some((p) => p.info.uuid === info.uuid)
      if (exists) {
        return
      }
      eip6963Providers.push({
        provider,
        info,
      })
    })
    window.dispatchEvent(new Event('eip6963:requestProvider'))
    setTimeout(() => {
      console.log(`[wallet] init wagmi config`)
      setWagmiConfig(typeof window !== 'undefined' && isInBinance() ? createW3WWagmiConfig() : createWagmiConfig())
    })
  }, [setWagmiConfig])

  return wagmiConfig
}
