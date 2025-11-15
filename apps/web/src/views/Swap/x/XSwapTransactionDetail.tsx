import { useTranslation } from '@pancakeswap/localization'
import { Box, Modal, ModalBody, Text } from '@pancakeswap/uikit'
import { GetXOrderReceiptResponseOrder } from './api'

interface XSwapTransactionDetailModalProps {
  order: GetXOrderReceiptResponseOrder
  onDismiss?: () => void
}

/**
 * 占位符组件 - 显示 X 交换交易详情
 * 由于 Swap/X 功能已移除，此组件提供基本的占位符实现
 */
export function XSwapTransactionDetailModal({ order, onDismiss }: XSwapTransactionDetailModalProps) {
  const { t } = useTranslation()

  return (
    <Modal title={t('Transaction Details')} onDismiss={onDismiss}>
      <ModalBody>
        <Box p="24px">
          <Text mb="16px" bold>
            {t('X Swap Order')}
          </Text>
          <Text fontSize="14px" color="textSubtle">
            {t('Hash')}: {order.hash}
          </Text>
          {order.transactionHash && (
            <Text mt="8px" fontSize="14px" color="textSubtle">
              {t('Transaction Hash')}: {order.transactionHash}
            </Text>
          )}
          <Text mt="8px" fontSize="14px" color="textSubtle">
            {t('Status')}: {order.status}
          </Text>
          {/* 占位符内容 - 可以后续扩展 */}
        </Box>
      </ModalBody>
    </Modal>
  )
}
