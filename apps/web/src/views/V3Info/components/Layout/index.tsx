import { Box } from '@pancakeswap/uikit'
import { PropsWithChildren } from 'react'

export const InfoPageLayout: React.FC<PropsWithChildren<unknown>> = ({ children }) => {
  return (
    <Box width="100%" maxWidth="960px" mx="auto" px="24px" py="32px">
      {children}
    </Box>
  )
}

export default InfoPageLayout
