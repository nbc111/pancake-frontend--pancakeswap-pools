import { Flex, Text } from '@pancakeswap/uikit'

const PredictionsLeaderboardPage = () => {
  return (
    <Flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="400px"
      p="24px"
      textAlign="center"
    >
      <Text fontSize="24px" bold mb="8px">
        Predictions leaderboard is unavailable
      </Text>
      <Text color="textSubtle">NBC 版本暂未开放预测排行榜。</Text>
    </Flex>
  )
}

export default PredictionsLeaderboardPage
