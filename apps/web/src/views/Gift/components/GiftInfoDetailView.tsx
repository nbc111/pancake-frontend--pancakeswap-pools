import { useTranslation } from '@pancakeswap/localization'
import { Box, Text } from '@pancakeswap/uikit'

/**
 * Placeholder component - Gift information detail
 */
export function GiftInfoDetailView() {
  const { t } = useTranslation()

  return (
    <Box p="24px">
      <Text>{t('Gift details')}</Text>
    </Box>
  )
}
