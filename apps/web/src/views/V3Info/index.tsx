import { Flex, Text } from '@pancakeswap/uikit'

const V3InfoOverview: React.FC = () => {
  return (
    <Flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="360px"
      p="24px"
      textAlign="center"
    >
      <Text fontSize="24px" bold mb="8px">
        V3 analytics are unavailable
      </Text>
      <Text color="textSubtle">NBC 版本暂未开放 V3 Info 页面。</Text>
    </Flex>
  )
}

export default V3InfoOverview
