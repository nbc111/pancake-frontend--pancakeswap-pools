import dynamic from 'next/dynamic'

const NbcStakingPools = dynamic(() => import('views/NbcStakingPools'), {
  ssr: false,
})

const NbcStakingPage = () => <NbcStakingPools />

NbcStakingPage.chains = [1281]

export default NbcStakingPage
