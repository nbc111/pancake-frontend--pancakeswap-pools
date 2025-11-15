import { useTranslation } from '@pancakeswap/localization'
import { Box, Text } from '@pancakeswap/uikit'

export interface OrderResultModalContentProps {
  overrideActiveOrderMetadata?: {
    txHash?: string
    originChainId?: number
    destinationChainId?: number
    order?: any
    metadata?: any
  }
}

/**
 * 占位符组件 - 显示跨链订单结果
 * 由于 Swap/Bridge 功能已移除，此组件提供基本的占位符实现
 */
export function OrderResultModalContent({ overrideActiveOrderMetadata }: OrderResultModalContentProps) {
  const { t } = useTranslation()

  return (
    <Box p="24px">
      <Text>{t('Order details')}</Text>
      {overrideActiveOrderMetadata?.txHash && (
        <Text mt="16px" fontSize="14px" color="textSubtle">
          {t('Transaction Hash')}: {overrideActiveOrderMetadata.txHash}
        </Text>
      )}
      {/* 占位符内容 - 可以后续扩展 */}
    </Box>
  )
}
