import { TokenLogo } from '@pancakeswap/uikit'
import { chainName as CHAIN_PATH } from '@pancakeswap/widgets-internal'
import React, { useMemo } from 'react'
import { styled } from 'styled-components'
import { MultiChainName, multiChainId } from 'state/info/constant'
import { safeGetAddress } from 'utils'
import getTokenLogoURL from 'utils/getTokenLogoURL'
import { Address, zeroAddress } from 'viem'
import { Token } from '@pancakeswap/sdk'
import { ASSET_CDN } from 'config/constants/endpoints'

const StyledLogo = styled(TokenLogo)<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  border-radius: 50%;
`

const chainNameToPath = (chainName: MultiChainName) => {
  if (chainName === 'BSC') return ''
  if (CHAIN_PATH[multiChainId[chainName]]) return `${CHAIN_PATH[multiChainId[chainName]]}/`
  return `${chainName.toLowerCase()}/`
}

interface CurrencyLogoProps {
  address: string
  chainName: MultiChainName
  size?: string
  style?: React.CSSProperties
}

export const CurrencyLogo: React.FC<CurrencyLogoProps> = ({ address, chainName, size = '24px', style }) => {
  const srcs = useMemo(() => {
    const src = getTokenLogoURL(new Token(multiChainId[chainName], address as Address, 18, ''))
    let srcFromPCS = ''

    if (address === zeroAddress) {
      srcFromPCS = `${ASSET_CDN}/web/native/${multiChainId[chainName]}.png`
    } else {
      const imagePath = chainNameToPath(chainName)
      const checkedsummedAddress = safeGetAddress(address)
      srcFromPCS = checkedsummedAddress
        ? `https://tokens.pancakeswap.finance/images/${imagePath}${checkedsummedAddress}.png`
        : ''
    }
    return src ? [srcFromPCS, src] : [srcFromPCS]
  }, [address, chainName])

  return <StyledLogo size={size} srcs={srcs} alt="token logo" style={style} />
}
