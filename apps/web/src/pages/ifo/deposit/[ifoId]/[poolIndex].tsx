import { ChainId } from '@pancakeswap/chains'
import { useRouter } from 'next/router'
import { NextPageWithLayout } from 'utils/page.types'
import IfoLayout from 'views/IfosV2/components/IfoLayout'
import { IfoV2Provider } from 'views/IfosV2/contexts/IfoV2Provider'
import Hero from 'views/Ifos/components/Hero'
import IfoContainer from 'views/IfosV2/components/IfoContainer'
import useIfo from 'views/IfosV2/hooks/useIfo'
import { IfoDeposit } from 'views/IfosV2/components/IfoDeposit'

const IfoDepositPageContent: React.FC<{ pid: number }> = ({ pid }) => {
  const { config } = useIfo()

  const steps = <></>
  return (
    <>
      <Hero />
      <IfoContainer ifoSteps={steps} ifoSection={<IfoDeposit pid={pid} />} ifoFaqs={config?.faqs} />
    </>
  )
}

const IfoDepositPage: NextPageWithLayout = () => {
  const { query } = useRouter()
  const { ifoId, poolIndex } = query

  if (typeof ifoId !== 'string' || typeof poolIndex !== 'string') {
    return null
  }

  return (
    <IfoV2Provider id={ifoId}>
      <IfoDepositPageContent pid={Number(poolIndex)} />
    </IfoV2Provider>
  )
}

IfoDepositPage.chains = [ChainId.BSC, ChainId.BSC_TESTNET]
IfoDepositPage.Layout = IfoLayout

export default IfoDepositPage
