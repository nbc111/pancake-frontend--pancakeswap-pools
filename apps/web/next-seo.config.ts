import { ASSET_CDN } from 'config/constants/endpoints'
import { DefaultSeoProps } from 'next-seo'

export const SEO: DefaultSeoProps = {
  titleTemplate: '%s | NBC Staking',
  defaultTitle: 'NBC Staking',
  description: 'Earn and hold cryptocurrency on NBC Chain',
  twitter: {
    cardType: 'summary_large_image',
    handle: '@PancakeSwap',
    site: '@PancakeSwap',
  },
  openGraph: {
    title: "NBC Staking - Everyone's Favorite Staking",
    description: 'Earn and hold cryptocurrency on NBC Chain',
    images: [{ url: `${ASSET_CDN}/web/og/v2/hero.jpg` }],
  },
}
