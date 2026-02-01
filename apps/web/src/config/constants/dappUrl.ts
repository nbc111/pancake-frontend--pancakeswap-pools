const DEFAULT_DAPP_URL = 'https://staking.nbblocks.cc/nbc-staking?chain=nbc'

const getNormalizedDappUrl = (raw: string) => {
  try {
    const parsed = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
    const normalizedPath =
      parsed.pathname.endsWith('/') && parsed.pathname !== '/' ? parsed.pathname.slice(0, -1) : parsed.pathname
    return `${parsed.protocol}//${parsed.host}${normalizedPath === '/' ? '' : normalizedPath}${parsed.search ?? ''}`
  } catch (error) {
    console.error('Invalid NEXT_PUBLIC_DAPP_URL, falling back to default', error)
    return DEFAULT_DAPP_URL
  }
}

// 客户端开发时使用当前页面 URL，避免 WalletConnect metadata.url 与实际地址不一致
const normalizedDappUrl =
  typeof window !== 'undefined' && window.location?.origin
    ? `${window.location.origin}${window.location.pathname}${window.location.search || ''}`
    : getNormalizedDappUrl(process.env.NEXT_PUBLIC_DAPP_URL || DEFAULT_DAPP_URL)

const dappHostForDeepLink = (() => {
  try {
    const parsed = new URL(normalizedDappUrl)
    const path = parsed.pathname === '/' ? '' : parsed.pathname
    return `${parsed.host}${path}`
  } catch {
    try {
      const parsedDefault = new URL(DEFAULT_DAPP_URL)
      const path = parsedDefault.pathname === '/' ? '' : parsedDefault.pathname
      return `${parsedDefault.host}${path}`
    } catch {
      return 'staking.nbblocks.cc'
    }
  }
})()

const dappOrigin = (() => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  try {
    const parsed = new URL(normalizedDappUrl)
    return `${parsed.protocol}//${parsed.host}`
  } catch {
    return 'https://staking.nbblocks.cc'
  }
})()

export { DEFAULT_DAPP_URL, getNormalizedDappUrl, normalizedDappUrl, dappHostForDeepLink, dappOrigin }
