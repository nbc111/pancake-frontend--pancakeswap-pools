import { useTranslation } from '@pancakeswap/localization'
import { Box, Button, Text } from '@pancakeswap/uikit'
import { ViewState } from 'components/WalletModalV2/type'

interface GiftsDashboardProps {
  setViewState: (state: ViewState) => void
}

/**
 * Placeholder component - Gifts dashboard
 */
export function GiftsDashboard({ setViewState }: GiftsDashboardProps) {
  const { t } = useTranslation()

  return (
    <Box p="24px">
      <Text mb="16px">{t('Gifts Dashboard')}</Text>
      <Button width="100%" onClick={() => setViewState(ViewState.CLAIM_GIFT)}>
        {t('Claim gift')}
      </Button>
    </Box>
  )
}
