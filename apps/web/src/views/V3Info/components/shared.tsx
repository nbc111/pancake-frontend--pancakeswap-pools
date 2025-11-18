import styled from 'styled-components'
import { Text } from '@pancakeswap/uikit'

export const MonoSpace = styled(Text)`
  font-family: 'Roboto Mono', monospace;
`

export const StyledCMCLink = styled.a`
  color: ${({ theme }) => theme.colors.primary};
  font-size: 12px;
`
