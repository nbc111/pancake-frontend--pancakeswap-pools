import { styled } from 'styled-components'
import { Text } from '@pancakeswap/uikit'

export const ErrorText = styled(Text)`
  color: ${({ theme }) => theme.colors.failure};
  font-size: 14px;
`
