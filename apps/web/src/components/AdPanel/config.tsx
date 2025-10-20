import { useMatchBreakpoints } from '@pancakeswap/uikit'
import { useTradingCompetitionAds } from 'components/AdPanel/Ads/AdTradingCompetition'
import { useMemo } from 'react'
import { AdCrossChain } from './Ads/AdCrossChain'
import { AdIfo } from './Ads/AdIfo'
import { AdPCSX } from './Ads/AdPCSX'
import { AdSolana } from './Ads/AdSolana'
import { AdSpringboard } from './Ads/AdSpringboard'
import { ExpandableAd } from './Expandable/ExpandableAd'
import { AdSlide, Priority } from './ads.types'
import { useShouldRenderAdIfo } from './useShouldRenderAdIfo'
import { useJsonAdsConfig } from './hooks/useJsonAdsConfig'

const JSON_ADS_URL = 'https://proofs.pancakeswap.com/cms-config/ads-config.json'

export const useAdConfig = () => {
  const { isDesktop } = useMatchBreakpoints()
  const MAX_ADS = isDesktop ? 6 : 4
  const shouldRenderAdIfo = useShouldRenderAdIfo()
  const tradingCompetitionAds = useTradingCompetitionAds()
  const jsonAdsList = useJsonAdsConfig(JSON_ADS_URL)

  const adList: Array<AdSlide> = useMemo(
    () => [
      {
        id: 'expandable-ad',
        component: <ExpandableAd />,
        priority: Priority.FIRST_AD,
      },
      ...jsonAdsList,
      {
        id: 'ad-cross-chain',
        component: <AdCrossChain />,
        priority: Priority.HIGH,
      },
      {
        id: 'ad-solana',
        component: <AdSolana />,
      },
      {
        id: 'ad-springboard',
        component: <AdSpringboard />,
      },
      ...tradingCompetitionAds,
      {
        id: 'ad-ifo',
        component: <AdIfo />,
        shouldRender: [shouldRenderAdIfo],
      },
      {
        id: 'pcsx',
        component: <AdPCSX />,
      },
    ],
    [shouldRenderAdIfo, tradingCompetitionAds, jsonAdsList],
  )

  return useMemo(
    () =>
      adList
        .filter((ad) => ad.shouldRender === undefined || ad.shouldRender.every(Boolean))
        .sort((a, b) => (b.priority || Priority.VERY_LOW) - (a.priority || Priority.VERY_LOW))
        .slice(0, MAX_ADS),
    [adList, MAX_ADS],
  )
}

// Array of strings or regex patterns
const commonLayoutAdIgnoredPages = [
  '/home',
  '/cake-staking',
  // Route matching: /liquidity/pool/<chainName>/<poolAddress>
  /\/liquidity\/pool\/\w+\/\w+/,
]

/**
 *  On the pages mentioned, the Mobile ads will be placed directly in page instead of in the app layout.
 *  So don't render in the app layout.
 *  Contains strings or regex patterns.
 */
export const layoutMobileAdIgnoredPages = [
  ...commonLayoutAdIgnoredPages,
  '/',
  '/swap',
  '/prediction',
  '/liquidity/pools',
  '/migration/bcake',
]

/**
 *  On the pages mentioned, the Desktop ads will be placed directly in page instead of in the app layout.
 *  So don't render in the app layout.
 *  Contains strings or regex patterns.
 */
export const layoutDesktopAdIgnoredPages = [...commonLayoutAdIgnoredPages]
