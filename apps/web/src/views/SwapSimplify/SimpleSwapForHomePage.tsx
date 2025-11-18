import { Flex, Text } from '@pancakeswap/uikit'

const SimpleSwapForHomePage: React.FC = () => {
  return (
    <Flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="200px"
      p="24px"
      border="1px dashed"
      borderColor="cardBorder"
      borderRadius="24px"
      width="100%"
    >
      <Text bold>Swap widget is unavailable</Text>
      <Text color="textSubtle" fontSize="14px">
        NBC 版本暂未开放首页 Swap 模块。
      </Text>
    </Flex>
  )
}

export default SimpleSwapForHomePage
