import { Flex, Text } from '@pancakeswap/uikit'

const NftProfileActivityPage = () => {
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
        Profile activity is unavailable
      </Text>
      <Text color="textSubtle">NBC 版本暂未开放活动记录。</Text>
    </Flex>
  )
}

export default NftProfileActivityPage
