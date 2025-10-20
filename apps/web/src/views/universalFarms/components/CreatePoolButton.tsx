import { isSolana } from '@pancakeswap/chains'
import { useTranslation } from '@pancakeswap/localization'
import { Box, BoxProps, Button, ButtonProps } from '@pancakeswap/uikit'
import useAccountActiveChain from 'hooks/useAccountActiveChain'
import { useRouter } from 'next/router'
import { useCallback } from 'react'

export const CreatePoolButton: React.FC<ButtonProps & { wrapperProps?: BoxProps; to?: string }> = ({
  wrapperProps,
  to = '/liquidity/create',
  ...props
}) => {
  const { t } = useTranslation()
  const router = useRouter()
  const { chainId } = useAccountActiveChain()

  const handleClick = useCallback(() => {
    if (isSolana(chainId)) {
      window.open('https://solana.pancakeswap.finance/clmm/create-pool/', '_blank')
    } else {
      router.push(to)
    }
  }, [router, to, chainId])

  return (
    <Box width="100%" minWidth="max-content" {...wrapperProps}>
      <Button variant="primary60Outline" onClick={handleClick} {...props}>
        {t('Create Pool')}
      </Button>
    </Box>
  )
}
