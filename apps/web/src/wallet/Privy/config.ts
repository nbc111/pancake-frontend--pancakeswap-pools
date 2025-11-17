'use client'

export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? ''
export const PRIVY_CLIENT_ID = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID ?? ''

export const isPrivyEnabled = Boolean(PRIVY_APP_ID && PRIVY_CLIENT_ID)

export const isFirebaseEnabled =
  Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) && Boolean(process.env.NEXT_PUBLIC_FIREBASE_APP_ID)
