import { Box, Text } from '@pancakeswap/uikit'
import { useTranslation } from '@pancakeswap/localization'

/**
 * 占位符组件 - 创建礼品视图
 * 由于 Gift 功能已移除，此组件提供基本的占位符实现
 */
export function CreateGiftView() {
  const { t } = useTranslation()

  return (
    <Box p="24px">
      <Text>{t('Create Gift')}</Text>
      {/* 占位符内容 - 可以后续扩展 */}
    </Box>
  )
}
