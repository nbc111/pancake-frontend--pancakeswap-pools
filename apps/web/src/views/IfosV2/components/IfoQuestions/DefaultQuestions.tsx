import { Trans } from '@pancakeswap/localization'
import { Card, CardBody, CardHeader, Heading, Container, Link, Text, Box } from '@pancakeswap/uikit'
import { styled } from 'styled-components'
import FoldableText from 'components/FoldableSection/FoldableText'
import useIfo from '../../hooks/useIfo'

const StyledCardHeader = styled(CardHeader)`
  background: ${({ theme }) =>
    theme.isDark
      ? 'linear-gradient(112deg, #1a1a2e 0%, #16213e 100%)'
      : 'linear-gradient(112deg, #F2ECF2 0%, #E8F2F6 100%)'};
  padding: 24px;
`

const StyledHeading = styled(Heading)`
  color: ${({ theme }) => theme.colors.secondary};
  font-size: 24px;
  font-weight: 600;
`

const StyledLink = styled(Link)`
  display: inline-block;
`
const DefaultQuestions: React.FC = () => {
  const { pools } = useIfo()

  const stakeSymbols = pools?.map((pool) => pool.stakeCurrency?.symbol).filter(Boolean) as string[]
  const symbol =
    stakeSymbols.length === 1
      ? stakeSymbols[0]
      : stakeSymbols.length >= 2
      ? `${stakeSymbols[0]} or ${stakeSymbols[1]}`
      : 'CAKE'

  const faqs = [
    {
      title: <Trans>What is an IFO?</Trans>,
      description: (
        <>
          <p>
            <Trans
              components={[<strong key="strong" />]}
              i18nTemplate="PancakeSwap’s <0>Initial Farm Offering (IFO)</0> is a platform to launch new tokens."
            />

            <Trans>Pcs&apos;s</Trans>
          </p>
          <Trans values={{ symbol }} i18nKey="ifo-what-is-ifo-description-1">
            <p>
              Users can buy project tokens using %symbol%, while projects gain liquidity, visibility, and direct access
              to our community.
            </p>
          </Trans>
          <br />
          <Trans
            components={[
              <StyledLink
                key="user"
                external
                href="https://docs.pancakeswap.finance/~/revisions/ptnCgCMnEEgu5A8YulQ0/earn/ifo-initial-farm-offering/faq-users"
              />,
              <StyledLink
                key="partner"
                external
                href="https://docs.pancakeswap.finance/~/revisions/ptnCgCMnEEgu5A8YulQ0/earn/ifo-initial-farm-offering/faq-partners"
              />,
            ]}
            i18nTemplate="More details: <br /><0>User FAQ</0> | <1>Partner FAQ</1>"
          />
        </>
      ),
    },
    {
      title: <Trans>What’s new in this IFO?</Trans>,
      description: (
        <>
          <Trans values={{ symbol }}>
            <p>1. Participation only requires %symbol% – no staking or NFT profile needed.</p>
          </Trans>
          <Trans>
            <p>2. Tiered fee structure replaces flat fees – fees only apply if oversubscribed.</p>
          </Trans>
          <Trans>
            <p>3. iCAKE / veCAKE not used.</p>
          </Trans>
          <br />
          <Trans
            components={[
              <StyledLink
                external
                href="https://pancakeswap.finance/voting/proposal/0x79ef496c9737e48d9677a6e291ff2a549dee6729c9996398e453af8ecbf0ceb3"
              />,
              <StyledLink
                external
                href="https://www.notion.so/FAQ-IFO-on-page-267b1792f90280dcb787fec4d84935c6?pvs=21"
              />,
            ]}
            i18nTemplate="More details: <br /><0>User FAQ</0> | <1>Partner FAQ</1>"
          />
        </>
      ),
    },
    {
      title: <Trans>How can I participate?</Trans>,
      description: (
        <>
          <Trans values={{ symbol }}>
            <p>1. Get %symbol%</p>
          </Trans>
          <Trans values={{ symbol }}>
            <p>2. Commit %symbol% during the IFO via the IFO page.</p>
          </Trans>
          <Trans>
            <p>3. Claim your tokens after the IFO ends.</p>
          </Trans>
          <Box mt="1rem">
            <Trans
              components={[
                <Link
                  external
                  href="https://docs.pancakeswap.finance/~/revisions/ptnCgCMnEEgu5A8YulQ0/earn/ifo-initial-farm-offering/ifo-guide"
                />,
              ]}
              i18nTemplate="More info: <0>User Guide</0>"
            />
          </Box>
        </>
      ),
    },
    {
      title: <Trans>Are there participation fees?</Trans>,
      description: (
        <>
          <Trans>
            <p>1. Only if the IFO is oversubscribed.</p>
          </Trans>
          <Trans values={{ symbol }}>
            <p>2. Fee is applied to excess %symbol% that didn’t contribute to your allocation.</p>
          </Trans>
          <Trans>
            <p>3. Tiered from 1% down to 0.05% depending on oversubscription.</p>
          </Trans>
          <Box mt="1rem">
            <Trans
              components={[
                <Link
                  external
                  href="https://docs.pancakeswap.finance/~/revisions/ptnCgCMnEEgu5A8YulQ0/earn/ifo-initial-farm-offering/how-ifo-taxes-work-in-overflow-sales-with-example"
                />,
              ]}
              i18nTemplate="More info: <0>Fee Table</0>"
            />
          </Box>
        </>
      ),
    },
    {
      title: <Trans>Where does the participation fee go?</Trans>,
      description: (
        <>
          <Trans values={{ symbol }}>
            <p>100% of fees are burned as %symbol%.</p>
          </Trans>
          <Trans>
            <p>The IFO project receives 100% of the target raise.</p>
          </Trans>
        </>
      ),
    },
    {
      title: <Trans>How many tokens will I get?</Trans>,
      description: (
        <>
          <Trans>
            <p>
              <strong>Allocation Rules:</strong>
            </p>
          </Trans>
          <Trans values={{ symbol }}>
            <p>Based on an allocation % based on your committed %symbol% vs total %symbol% committed by all users.</p>
          </Trans>
          <Box mt="1rem">
            <Trans>
              <p>
                <strong>Overflow Sale:</strong>
              </p>
            </Trans>
          </Box>
          <Trans>
            <p>Users get proportional allocation.</p>
          </Trans>
          <Trans values={{ symbol }}>
            <p>Any excess %symbol% is refunded (minus participation tax if oversubscribed).</p>
          </Trans>
          <Box mt="1rem">
            <Trans
              components={[
                <Link
                  external
                  href="https://docs.pancakeswap.finance/~/revisions/ptnCgCMnEEgu5A8YulQ0/earn/ifo-initial-farm-offering/how-ifo-taxes-work-in-overflow-sales-with-example"
                />,
              ]}
              i18nTemplate="More info: <0>Overflow & Allocation Example</0>"
            />
          </Box>
        </>
      ),
    },
    {
      title: <Trans>Are there token vesting schedules?</Trans>,
      description: (
        <>
          <Trans>
            <p>Supported but current IFOs run without lockup.</p>
          </Trans>
          <Trans>
            <p>If vesting applies, it will be shown on the IFO page with a schedule.</p>
          </Trans>
        </>
      ),
    },
    {
      title: <Trans>[Partners] How do I apply for an IFO?</Trans>,
      description: (
        <>
          <Trans
            components={[
              <Link
                external
                href="https://docs.google.com/forms/d/e/1FAIpQLScmZu87SG41J_eGfzlbyJ_olFohlGOXfOJer04Dr1yCEJy2NA/viewform"
              />,
            ]}
            i18nTemplate="Fill out the <0>Application Form</0>"
          />
          <br />
          <Trans>
            <p>Steps after application:</p>
          </Trans>
          <Trans>
            <p>1. PancakeSwap team reviews and may conduct further due diligence.</p>
          </Trans>
          <Trans>
            <p>2. Align on tokenomics, marketing, and launch timeline.</p>
          </Trans>
          <Trans>
            <p>3. Marketing and community onboarding begins.</p>
          </Trans>
          <Trans>
            <p>4. Launch IFO.</p>
          </Trans>
          <Box mt="1rem">
            <Trans
              components={[
                <StyledLink external href="https://pancakeswap.notion.site/ifo-terms" />,
                <StyledLink
                  external
                  href="https://docs.pancakeswap.finance/~/revisions/ptnCgCMnEEgu5A8YulQ0/earn/ifo-initial-farm-offering/faq-partners"
                />,
              ]}
              i18nTemplate="For more info: <br /><0>IFO Partner Terms</0> | <1>Partner FAQ</1>"
            />
          </Box>
        </>
      ),
    },
  ]

  return (
    <Container>
      <Card mt="24px" style={{ maxWidth: '800px' }} mx="auto">
        <StyledCardHeader>
          <StyledHeading>
            <Trans>FAQ</Trans>
          </StyledHeading>
        </StyledCardHeader>
        <CardBody>
          {faqs.map(({ title, description }, i, { length }) => (
            <FoldableText key={i} mb={i + 1 === length ? '' : '24px'} title={title}>
              <Text color="textSubtle" as="div">
                {description}
              </Text>
            </FoldableText>
          ))}
        </CardBody>
      </Card>
    </Container>
  )
}

export default DefaultQuestions
