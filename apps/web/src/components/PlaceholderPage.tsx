import React from 'react'
import { Box, Button, Flex, Text } from '@pancakeswap/uikit'
import { useRouter } from 'next/router'
import { useTranslation } from '@pancakeswap/localization'

/**
 * 占位页：仅保留质押相关功能时，其他路由显示此页并引导至 NBC 质押
 */
export const PlaceholderPage: React.FC = () => {
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <Box minHeight="calc(100vh - 64px)" padding="24px">
      <Flex
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="400px"
        style={{ textAlign: 'center' }}
      >
        <Text mb="16px" fontSize="18px" color="textSubtle">
          {t('This feature is not available. Go to NBC Staking.')}
        </Text>
        <Button onClick={() => router.push('/nbc-staking')}>{t('Go to NBC Staking')}</Button>
      </Flex>
    </Box>
  )
}
