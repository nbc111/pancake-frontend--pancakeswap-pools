import { NonEVMChainId, UnifiedChainId } from '@pancakeswap/chains'
import { initializeApp } from 'firebase/app'
import { isFirebaseEnabled } from './config'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: 'pancakeswap-prod-firebase.firebaseapp.com',
  projectId: 'pancakeswap-prod-firebase',
  storageBucket: 'pancakeswap-prod-firebase.firebasestorage.app',
  messagingSenderId: '901250967709',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
}

// Initialize Firebase only when config is available
export const firebaseApp = isFirebaseEnabled ? initializeApp(firebaseConfig) : undefined

export const UNSUPPORTED_SOCIAL_LOGIC_CHAINS: UnifiedChainId[] = [NonEVMChainId.SOLANA, NonEVMChainId.APTOS]
