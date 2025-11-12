import dynamic from 'next/dynamic'

const NbcStakingPools = dynamic(() => import('views/NbcStakingPools'))

const NbcStakingHistoryPage = () => <NbcStakingPools />

NbcStakingHistoryPage.chains = [1281]

export default NbcStakingHistoryPage
