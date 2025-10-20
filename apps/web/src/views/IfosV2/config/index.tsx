/* eslint-disable react/no-unescaped-entities */
import { ChainId } from '@pancakeswap/chains'
import { Trans } from '@pancakeswap/localization'
import { ASSET_CDN } from 'config/constants/endpoints'
import { IFOConfig } from '../ifov2.types'

export const ifoConfigs: IFOConfig[] = [
  // TODO: IFO v10 testing configuration on Tenderly Virtual Network
  {
    id: 'ifo-presale',
    icon: 'https://proofs.pancakeswap.com/cms/uploads/27729a23a3b3e0e5ab75da585f04217c4b036b0f92b54bf6a7393afe1f157be6.png', // TODO: Replace with actual icon
    projectUrl: 'https://pancakeswap.finance/',
    chainId: ChainId.BSC,
    bannerUrl: `https://proofs.pancakeswap.com/cms/uploads/495262706d9d431db12f564544d807e4b8d1e7f39e8b26b170d16f6a26212987.png`, // TODO: Replace with actual banner
    contractAddress: '0x097200FE8B754Fca013Ee21a3310F03Bc4C670fC', // IFO v10 contract address
    tgeTitle: <Trans>IFO v10 Test - USDT Offering</Trans>,
    tgeSubtitle: <Trans>Testing on Tenderly Virtual Network</Trans>,
    description: (
      <div>
        <Trans>This is a test IFO v10 configuration for development and testing purposes.</Trans>
      </div>
    ),
    howTo: [
      {
        title: 'Connect Wallet',
        content: <Trans>Link your wallet on BNB Chain to get started.</Trans>,
      },
      {
        title: 'Commit Funds',
        content: <Trans>During the sale period, commit BNB to buy the offering tokens.</Trans>,
      },
      {
        title: 'Claim Tokens',
        content: <Trans>After the IFO ends, return to claim your purchased USDT.</Trans>,
      },
    ],
  },
]
