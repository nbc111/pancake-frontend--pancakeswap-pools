import { Flex, Text } from '@pancakeswap/uikit'

interface OverrideMetadata {
  txHash?: string
  originChainId?: number
  destinationChainId?: number
  order?: unknown
  metadata?: Record<string, unknown>
}

interface OrderResultModalContentProps {
  overrideActiveOrderMetadata?: OverrideMetadata
}

export const OrderResultModalContent: React.FC<OrderResultModalContentProps> = ({ overrideActiveOrderMetadata }) => {
  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="center" minHeight="200px" textAlign="center">
      <Text bold mb="8px">
        Bridge status unavailable
      </Text>
      <Text color="textSubtle">NBC 版本暂未提供跨链详情。</Text>
      {overrideActiveOrderMetadata?.txHash && (
        <Text mt="8px" fontSize="12px" color="textSubtle">
          Tx: {overrideActiveOrderMetadata.txHash}
        </Text>
      )}
    </Flex>
  )
}

export default OrderResultModalContent
