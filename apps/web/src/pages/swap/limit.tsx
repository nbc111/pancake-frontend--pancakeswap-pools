import { Flex, Text } from '@pancakeswap/uikit'

const LimitPage = () => {
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
        Limit orders are unavailable
      </Text>
      <Text color="textSubtle">NBC 版本暂未开放 Limit / TWAP 功能。</Text>
    </Flex>
  )
}

export default LimitPage
