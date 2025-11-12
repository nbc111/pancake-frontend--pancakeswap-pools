import { styled } from 'styled-components'

import { useTranslation } from '@pancakeswap/localization'
import { Token } from '@pancakeswap/sdk'
import { Flex, FlexLayout, Heading, Loading, PageHeader, Text, ViewMode, useMatchBreakpoints } from '@pancakeswap/uikit'
import { Pool } from '@pancakeswap/widgets-internal'
import Page from 'components/Layout/Page'
import { useAccount } from 'wagmi'
import { useUserPoolStakedOnly, useUserPoolsViewMode } from 'state/user/hooks'
import { useInitialBlockTimestamp } from 'state/block/hooks'
import { useNbcStakingPools } from './hooks/useNbcStakingPools'
import NbcPoolCard from './components/NbcPoolCard'
import NbcPoolRow from './components/NbcPoolRow'

const StyledPageHeader = styled(PageHeader)`
  padding-top: 8px;
  margin-left: -8px;
  margin-right: -8px;

  ${({ theme }) => theme.mediaQueries.lg} {
    padding-top: 56px;
  }

  ${({ theme }) => theme.mediaQueries.sm} {
    padding-top: 32px;
  }
`

const CardLayout = styled(FlexLayout)`
  justify-content: center;
`

const POOL_START_THRESHOLD = 60 * 4

const NbcStakingPools: React.FC<React.PropsWithChildren> = () => {
  const { t } = useTranslation()
  const { address: account } = useAccount()
  const { pools, userDataLoaded } = useNbcStakingPools()
  const { isMobile } = useMatchBreakpoints()

  // 使用本地的状态管理，不依赖 state/pools
  const [stakedOnly, setStakedOnly] = useUserPoolStakedOnly()
  const [viewMode, setViewMode] = useUserPoolsViewMode()
  const initialBlockTimestamp = useInitialBlockTimestamp()
  const threshHold = Number(initialBlockTimestamp) > 0 ? Number(initialBlockTimestamp) + POOL_START_THRESHOLD : 0

  const poolContent = (
    <Pool.PoolControls<Token>
      pools={pools}
      stakedOnly={stakedOnly}
      setStakedOnly={setStakedOnly}
      viewMode={viewMode}
      setViewMode={setViewMode}
      account={account ?? ''}
      threshHold={threshHold}
    >
      {({ chosenPools, viewMode, stakedOnly, normalizedUrlSearch }) => {
        return (
          <>
            {account && !userDataLoaded && stakedOnly && (
              <Flex justifyContent="center" mb="4px">
                <Loading />
              </Flex>
            )}
            {chosenPools.length === 0 ? (
              <Flex justifyContent="center" alignItems="center" minHeight="200px">
                <Text color="textSubtle">{t('No pools found')}</Text>
              </Flex>
            ) : viewMode === ViewMode.CARD ? (
              <CardLayout>
                {chosenPools.map((pool) => (
                  <NbcPoolCard key={pool.sousId} pool={pool} account={account ?? ''} />
                ))}
              </CardLayout>
            ) : (
              <Pool.PoolsTable>
                {chosenPools.map((pool) => (
                  <NbcPoolRow
                    initialActivity={normalizedUrlSearch.toLowerCase() === pool.earningToken.symbol?.toLowerCase()}
                    key={pool.sousId}
                    pool={pool}
                    account={account ?? ''}
                  />
                ))}
              </Pool.PoolsTable>
            )}
          </>
        )
      }}
    </Pool.PoolControls>
  )

  return (
    <>
      {isMobile ? (
        <StyledPageHeader>
          <Flex alignItems="baseline" width="100%" justifyContent="space-between" mt="16px" mb="16px">
            <Text lineHeight="110%" bold color="secondary" fontSize="32px">
              {t('NBC Staking Pools')}
            </Text>
          </Flex>
          {isMobile ? poolContent : null}
        </StyledPageHeader>
      ) : (
        <PageHeader>
          <Flex justifyContent="space-between" flexDirection={['column', null, null, 'row']}>
            <Flex flex="1" flexDirection="column" mr={['8px', 0]}>
              <Heading as="h1" scale="xxl" color="secondary" mb="24px">
                {t('NBC Staking Pools')}
              </Heading>
              <Heading scale="md" color="text">
                {t('Stake NBC and earn multiple reward tokens.')}
              </Heading>
              <Heading scale="md" color="text">
                {t('High APR, low risk.')}
              </Heading>
            </Flex>
          </Flex>
        </PageHeader>
      )}
      {isMobile ? null : <Page>{poolContent}</Page>}
    </>
  )
}

export default NbcStakingPools
