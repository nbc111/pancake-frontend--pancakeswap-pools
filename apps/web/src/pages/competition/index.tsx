import { Flex, Text } from '@pancakeswap/uikit'

const TradingCompetitionPage = () => {
  return (
    <Flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="400px"
      p="24px"
      style={{ textAlign: 'center' }}
    >
      <Text fontSize="24px" bold mb="8px">
        Trading competitions are unavailable
      </Text>
      <Text color="textSubtle">NBC 版本暂未开放竞赛活动。</Text>
    </Flex>
  )
}

export default TradingCompetitionPage
