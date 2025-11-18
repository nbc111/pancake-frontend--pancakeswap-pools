import { Flex, Text } from '@pancakeswap/uikit'

const SwapPage = () => {
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
        Swap is unavailable
      </Text>
      <Text color="textSubtle">NBC 版本暂未开放 Swap 功能。</Text>
    </Flex>
  )
}

export default SwapPage
