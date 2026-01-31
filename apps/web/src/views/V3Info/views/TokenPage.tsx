// @ts-nocheck
import { Flex, Text } from '@pancakeswap/uikit'

interface TokenPageProps {
  address?: string
}

const TokenPage: React.FC<TokenPageProps> = ({ address }) => {
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
      <Text color="textSubtle">{address ? `Token ${address} 暂无统计数据。` : 'NBC 版本暂未提供 Token 详情。'}</Text>
    </Flex>
  )
}

export default TokenPage
