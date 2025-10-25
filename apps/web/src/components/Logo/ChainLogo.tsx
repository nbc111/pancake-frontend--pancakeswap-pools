import { HelpIcon } from '@pancakeswap/uikit'
import { ASSET_CDN } from 'config/constants/endpoints'
import Image from 'next/image'
import { memo } from 'react'
import { isChainSupported } from 'utils/wagmi'

export const ChainLogo = memo(
  ({ chainId, width = 24, height = 24 }: { chainId?: number; width?: number; height?: number }) => {
    if (chainId && isChainSupported(chainId)) {
      // Try local image first, fallback to CDN
      const localImagePath = `/images/chains/${chainId}.png`
      const cdnImagePath = `${ASSET_CDN}/web/chains/${chainId}.png`
      
      return (
        <Image
          alt={`chain-${chainId}`}
          style={{ maxHeight: `${height}px` }}
          src={localImagePath}
          width={width}
          height={height}
          unoptimized
          onError={(e) => {
            // Fallback to CDN if local image fails
            const target = e.target as HTMLImageElement
            if (target.src !== cdnImagePath) {
              target.src = cdnImagePath
            }
          }}
        />
      )
    }

    return <HelpIcon width={width} height={height} />
  },
)
