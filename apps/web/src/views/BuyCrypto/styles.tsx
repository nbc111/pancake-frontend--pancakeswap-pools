import { styled } from 'styled-components'
import { Box, Flex } from '@pancakeswap/uikit'

export const IFrameWrapper = styled(Flex)`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 500px;
`

export const StyledIframe = styled.iframe<{ isDark?: boolean }>`
  width: 100%;
  height: 100%;
  border: none;
  background: ${({ theme }) => theme.colors.background};
`

export const StyledBackArrowContainer = styled(Box)`
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
`
