import { ChainId } from '@pancakeswap/chains'

import IfoProvider from 'views/Ifos/contexts/IfoContext'
import { NextPageWithLayout } from 'utils/page.types'
import IfoLayout from 'views/IfosV2/components/IfoLayout'
import Hero from 'views/Ifos/components/Hero'
import dynamic from 'next/dynamic'
import IFO from 'views/IfosV2/ifo'

const IFO_SUPPORT_CHAINS = [ChainId.BSC, ChainId.BSC_TESTNET]

const View = () => {
  return (
    <IfoProvider>
      <Hero />
      <IFO />
    </IfoProvider>
  )
}

const CurrentIfoPage: NextPageWithLayout = dynamic(() => Promise.resolve(View), {
  ssr: false,
})

CurrentIfoPage.chains = IFO_SUPPORT_CHAINS
CurrentIfoPage.Layout = IfoLayout

export default CurrentIfoPage
