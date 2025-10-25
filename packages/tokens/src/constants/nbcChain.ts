import { ChainId } from '@pancakeswap/chains'
import { ERC20Token, WETH9 } from '@pancakeswap/sdk'

export const nbcChainTokens = {
  wnbc: WETH9[ChainId.NBC_CHAIN],
  // NBC native token wrapped as ERC20
  nbc: new ERC20Token(
    ChainId.NBC_CHAIN,
    '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83', // NBC Chain WNBC合约地址
    18,
    'NBC',
    'NBC',
    'https://nbcex.com/',
  ),
}
