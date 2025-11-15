import { useTranslation } from '@pancakeswap/localization'
import { Box, Button, Text } from '@pancakeswap/uikit'

interface ClaimGiftConfirmViewProps {
  onConfirm?: () => void
  onCancel?: () => void
}

/**
 * Placeholder component - Gift claim confirmation view
 * Since Gift functionality has been removed, this component provides basic placeholder implementation
 */
export function ClaimGiftConfirmView({ onConfirm, onCancel }: ClaimGiftConfirmViewProps) {
  const { t } = useTranslation()

  return (
    <Box p="24px">
      <Text mb="16px">{t('Confirm Gift Claim')}</Text>
      <Button mb="8px" width="100%" onClick={onConfirm}>
        {t('Confirm')}
      </Button>
      <Button width="100%" variant="secondary" onClick={onCancel}>
        {t('Cancel')}
      </Button>
    </Box>
  )
}
