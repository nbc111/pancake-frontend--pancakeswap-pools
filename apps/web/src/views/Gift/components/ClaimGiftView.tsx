import { useTranslation } from '@pancakeswap/localization'
import { Box, Button, Input, Text } from '@pancakeswap/uikit'
import { useClaimGiftContext } from '../providers/ClaimGiftProvider'

/**
 * Placeholder component - Gift claim view
 */
export function ClaimGiftView() {
  const { t } = useTranslation()
  const { code, setCode } = useClaimGiftContext()

  return (
    <Box p="24px">
      <Text mb="16px">{t('Enter your gift code')}</Text>
      <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('Gift code')} mb="16px" />
      <Button width="100%">{t('Next')}</Button>
    </Box>
  )
}
