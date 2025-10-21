import { ChainId } from '@pancakeswap/chains'
import FixedStaking from 'views/FixedStaking'

const FixedStakingPage = () => {
  return <FixedStaking />
}

FixedStakingPage.chains = [ChainId.BSC, ChainId.NBC_CHAIN]

export default FixedStakingPage
