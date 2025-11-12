import { useState } from 'react'
import { styled } from 'styled-components'
import { useTranslation } from '@pancakeswap/localization'
import { Flex, CardFooter, ExpandableLabel, HelpIcon } from '@pancakeswap/uikit'
import { Pool } from '@pancakeswap/widgets-internal'
import { Token } from '@pancakeswap/sdk'
import PoolStatsInfo from '../../Pools/components/PoolStatsInfo'
import PoolTypeTag from '../../Pools/components/PoolTypeTag'

interface FooterProps {
  pool: Pool.DeserializedPool<Token>
  account: string
  defaultExpanded?: boolean
}

const ExpandableButtonWrapper = styled(Flex)`
  align-items: center;
  justify-content: space-between;
  button {
    padding: 0;
  }
`
const ExpandedWrapper = styled(Flex)`
  svg {
    height: 14px;
    width: 14px;
  }
`

const NbcCardFooter: React.FC<React.PropsWithChildren<FooterProps>> = ({
  pool,
  account,
  defaultExpanded,
  children,
}) => {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || false)

  return (
    <CardFooter>
      <ExpandableButtonWrapper>
        <Flex alignItems="center">
          <PoolTypeTag isLocked={false} account={account}>
            {(targetRef) => (
              <Flex ref={targetRef}>
                <HelpIcon ml="4px" width="20px" height="20px" color="textSubtle" />
              </Flex>
            )}
          </PoolTypeTag>
        </Flex>
        <ExpandableLabel expanded={isExpanded} onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? t('Hide') : t('Details')}
        </ExpandableLabel>
      </ExpandableButtonWrapper>
      {isExpanded && (
        <ExpandedWrapper flexDirection="column">
          {children || <PoolStatsInfo pool={pool} account={account} />}
        </ExpandedWrapper>
      )}
    </CardFooter>
  )
}

export default NbcCardFooter
