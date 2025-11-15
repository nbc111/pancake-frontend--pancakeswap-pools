import { styled } from 'styled-components'
import { Box, Flex } from '@pancakeswap/uikit'

export const TableWrapper = styled(Box)`
  width: 100%;
  overflow-x: auto;
`

export const PageButtons = styled(Flex)`
  width: 100%;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
`

export const Arrow = styled(Box)<{ disabled?: boolean }>`
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  display: flex;
  align-items: center;
  justify-content: center;
`

export const Break = styled.div`
  height: 1px;
  background-color: ${({ theme }) => theme.colors.cardBorder};
  width: 100%;
`
