import { Flex, Text } from '@pancakeswap/uikit'

const NftProfileAchievementsPage = () => {
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
        Profile achievements are unavailable
      </Text>
      <Text color="textSubtle">NBC 版本暂未开放成就系统。</Text>
    </Flex>
  )
}

export default NftProfileAchievementsPage
