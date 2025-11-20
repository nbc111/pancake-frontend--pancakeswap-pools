import { DefaultSeoProps } from 'next-seo'

export const SEO: DefaultSeoProps = {
  titleTemplate: '%s | NBC Staking',
  defaultTitle: 'Blog | NBC Staking',
  description: 'Earn and hold cryptocurrency on NBC Chain',
  twitter: {
    cardType: 'summary_large_image',
    handle: '@PancakeSwap',
    site: '@PancakeSwap',
  },
  openGraph: {
    title: "🥞 NBC Staking - Everyone's Favorite Staking",
    description: 'Earn and hold cryptocurrency on NBC Chain',
    images: [{ url: 'https://assets.pancakeswap.finance/web/og/v2/hero.jpg' }],
  },
}
