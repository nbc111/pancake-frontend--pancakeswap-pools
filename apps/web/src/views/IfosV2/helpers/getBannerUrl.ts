import { ASSET_CDN } from 'config/constants/endpoints'
import bgImage from '../images/ifo-banner.png'

export function getBannerUrl(ifoId: string) {
  return `${ASSET_CDN}/web/ifo/${ifoId}-banner.png`
}

export function getTempBannerUrl() {
  return bgImage.src
}
