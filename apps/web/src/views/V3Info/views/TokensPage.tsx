// @ts-nocheck
import { Flex, Text } from '@pancakeswap/uikit'

const TokensPage: React.FC = () => {
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
        Token analytics are unavailable
      </Text>
      <Text color="textSubtle">NBC 版本暂未提供 Token 数据。</Text>
    </Flex>
  )
}

export default TokensPage
