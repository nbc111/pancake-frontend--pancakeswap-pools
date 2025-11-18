import { Flex, Text } from '@pancakeswap/uikit'

interface PoolPageProps {
  address?: string
}

const PoolPage: React.FC<PoolPageProps> = ({ address }) => {
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
      <Text color="textSubtle">{address ? `Pool ${address} 暂无统计数据。` : 'NBC 版本暂未提供池子详情。'}</Text>
    </Flex>
  )
}

export default PoolPage
