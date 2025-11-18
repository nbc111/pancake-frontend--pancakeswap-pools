import { Flex, Text } from '@pancakeswap/uikit'

const CompetitionPage = () => {
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
        Trading competitions are unavailable
      </Text>
      <Text color="textSubtle">NBC 版本暂不支持往期竞赛内容，敬请期待。</Text>
    </Flex>
  )
}

export default CompetitionPage
