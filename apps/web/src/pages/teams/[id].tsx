import { Flex, Text } from '@pancakeswap/uikit'

const TeamPage = () => {
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
        Team details are unavailable
      </Text>
      <Text color="textSubtle">NBC 版本暂未开放战队详情。</Text>
    </Flex>
  )
}

export default TeamPage
