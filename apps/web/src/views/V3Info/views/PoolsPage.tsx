// @ts-nocheck
import { Flex, Text } from '@pancakeswap/uikit'

const PoolsPage: React.FC = () => {
  return (
    <Flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="320px"
      p="24px"
      textAlign="center"
    >
      <Text fontSize="24px" bold mb="8px">
        Pool analytics are unavailable
      </Text>
      <Text color="textSubtle">NBC 版本暂未提供池子数据。</Text>
    </Flex>
  )
}

export default PoolsPage
