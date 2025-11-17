'use client'

import { PrivyProvider as Provider } from '@privy-io/react-auth'
import { SmartWalletsProvider } from '@privy-io/react-auth/smart-wallets'
import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { CHAINS } from 'config/chains'
import { useFirebaseAuth } from './firebase'
import { isPrivyEnabled, PRIVY_APP_ID, PRIVY_CLIENT_ID } from './config'

export function PrivyProvider({ children }: PropsWithChildren) {
  const { isLoading, getToken } = useFirebaseAuth()
  const router = useRouter()

  if (!isPrivyEnabled) {
    console.warn('Privy environment variables are missing - PrivyProvider disabled')
    return <>{children}</>
  }

  // Show wallet UIs only on bridge pages
  const showWalletUIs = router.pathname.includes('/bridge')

  // Only enable embedded wallets over HTTPS or localhost (for development)
  // Privy embedded wallets require HTTPS for security reasons
  // Allow HTTP in development environment for development servers
  const isHTTPS =
    typeof window !== 'undefined' &&
    (window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      // Allow HTTP for any IP address in development (matches xxx.xxx.xxx.xxx format)
      (window.location.protocol === 'http:' && /^\d+\.\d+\.\d+\.\d+$/.test(window.location.hostname)) ||
      // Allow HTTP in development environment
      (process.env.NODE_ENV === 'development' && window.location.protocol === 'http:'))

  // Check if current chain is supported by Privy SmartWallets
  // NBC Chain (1281) may not be supported, so we conditionally enable SmartWalletsProvider
  // Privy SmartWallets requires chain configuration in Privy dashboard
  const isSmartWalletsSupported = false // Disable SmartWallets for NBC Chain as it's not configured in Privy dashboard

  const providerContent = (
    <Provider
      appId={PRIVY_APP_ID}
      clientId={PRIVY_CLIENT_ID}
      config={{
        defaultChain: CHAINS[0],
        customAuth: {
          isLoading,
          getCustomAccessToken: getToken,
        },
        supportedChains: CHAINS,
        appearance: {
          accentColor: '#6A6FF5',
          theme: '#222224',
          showWalletLoginFirst: false,
          logo: 'https://auth.privy.io/logos/privy-logo-dark.png',
          walletChainType: 'ethereum-only',
          walletList: ['detected_wallets', 'metamask'],
        },
        fundingMethodConfig: {
          moonpay: {
            useSandbox: process.env.NODE_ENV !== 'production',
          },
        },
        embeddedWallets: isHTTPS
          ? {
              requireUserPasswordOnCreate: false, // we will trigger it by ourself when create wallet
              showWalletUIs,
              ethereum: {
                createOnLogin: 'users-without-wallets',
              },
              solana: {
                createOnLogin: 'off',
              },
            }
          : undefined,
        mfa: {
          noPromptOnMfaRequired: false,
        },
        externalWallets: {
          walletConnect: {
            enabled: false,
          },
        },
      }}
    >
      {isSmartWalletsSupported ? <SmartWalletsProvider>{children}</SmartWalletsProvider> : children}
    </Provider>
  )

  return providerContent
}
