import { Flex, Text } from '@pancakeswap/uikit'

const PancakeCollectiblesPage = () => {
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
        Collectibles are unavailable
      </Text>
      <Text color="textSubtle">NBC 版本暂未开放 Pancake Collectibles 页面。</Text>
    </Flex>
  )
}

export default PancakeCollectiblesPage
