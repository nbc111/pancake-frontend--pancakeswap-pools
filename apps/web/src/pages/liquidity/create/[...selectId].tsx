import PageLoader from 'components/Loader/PageLoader'
import { SelectIdRoute } from 'dynamicRoute'
import { useDefaultSelectIdRoute, useSelectIdRoute } from 'hooks/dynamicRoute/useSelectIdRoute'
import dynamic from 'next/dynamic'
import { NextPageWithLayout } from 'utils/page.types'
import { CHAIN_IDS } from 'utils/wagmi'
import { BreadcrumbNav } from 'views/CreateLiquidityPool/components/BreadcrumbNav'
import { CreateLiquidityInfinityForm } from 'views/CreateLiquidityPool/Infinity/CreateLiquidityInfinityForm'
import { CreateLiquidityV3Form } from 'views/CreateLiquidityPool/V3/CreateLiquidityV3Form'
import PageLayout from 'components/Layout/Page'
import { Box } from '@pancakeswap/uikit'
import { CreateLiquidityV2Form } from 'views/CreateLiquidityPool/V2/CreateLiquidityV2Form'
import styled from 'styled-components'

const StyledBox = styled(Box)`
  background: ${({ theme }) => theme.colors.backgroundPage};
`

export type RouteType = typeof SelectIdRoute

const CreateLiquidityPage = () => {
  const { routeParams, protocolName } = useSelectIdRoute()
  useDefaultSelectIdRoute()

  if (!routeParams) {
    return <PageLoader />
  }

  return (
    <StyledBox>
      <PageLayout>
        <BreadcrumbNav />
        <Box mt="24px">
          {protocolName === 'infinity' ? (
            <CreateLiquidityInfinityForm />
          ) : protocolName === 'v3' ? (
            <CreateLiquidityV3Form />
          ) : protocolName === 'v2' ? (
            <CreateLiquidityV2Form />
          ) : null}
        </Box>
      </PageLayout>
    </StyledBox>
  )
}

const Page = dynamic(() => Promise.resolve(CreateLiquidityPage), {
  ssr: false,
}) as NextPageWithLayout
Page.chains = CHAIN_IDS
Page.screen = true

export default Page
