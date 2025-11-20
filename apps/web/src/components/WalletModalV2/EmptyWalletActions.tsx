import { useTranslation } from '@pancakeswap/localization'
import { Box, Text } from '@pancakeswap/uikit'
import React from 'react'

interface EmptyWalletActionsProps {
  onDismiss: () => void
  description?: string
}

const EmptyWalletActions: React.FC<EmptyWalletActionsProps> = ({ description }) => {
  const { t } = useTranslation()

  return (
    <Box padding="8px 16px">
      <Text color="textSubtle" textAlign="center" mb="16px">
        {description || t('This wallet looks new — choose an option below to add crypto and start trading')}
      </Text>
    </Box>
  )
}

export default EmptyWalletActions
