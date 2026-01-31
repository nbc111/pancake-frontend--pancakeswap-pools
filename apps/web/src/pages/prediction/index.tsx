import { Flex, Text } from '@pancakeswap/uikit'

const PredictionPage = () => {
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
        Predictions are unavailable
      </Text>
      <Text color="textSubtle">NBC 版本暂未开放预测市场。</Text>
    </Flex>
  )
}

export default PredictionPage
