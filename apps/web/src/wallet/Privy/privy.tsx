'use client'

import { PrivyProvider as Provider } from '@privy-io/react-auth'
import { SmartWalletsProvider } from '@privy-io/react-auth/smart-wallets'
import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { CHAINS } from 'config/chains'
import { useFirebaseAuth } from './firebase'

export function PrivyProvider({ children }: PropsWithChildren) {
  const { isLoading, getToken } = useFirebaseAuth()
  const router = useRouter()

  // Validate required environment variables
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID
  const clientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID

  if (!appId || !clientId) {
    console.error('Missing required Privy environment variables')
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
      // Allow HTTP for development server IP addresses
      window.location.hostname === '156.251.17.96' ||
      // Allow HTTP in development environment
      (process.env.NODE_ENV === 'development' && window.location.protocol === 'http:'))

  return (
    <Provider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? ''}
      clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID ?? ''}
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
      <SmartWalletsProvider>{children}</SmartWalletsProvider>
    </Provider>
  )
}
