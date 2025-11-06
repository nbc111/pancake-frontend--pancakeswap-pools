import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from '@pancakeswap/localization'
import { useAccount, useReadContract, useWriteContract, useChainId } from 'wagmi'
import { useRouter } from 'next/router'
import {
  Button,
  Box,
  CardBody,
  Flex,
  Heading,
  Input,
  PageHeader,
  Text,
  useToast,
} from '@pancakeswap/uikit'
import { Pool } from '@pancakeswap/widgets-internal'
import { ERC20Token } from '@pancakeswap/sdk'
import BigNumber from 'bignumber.js'
import Page from 'components/Layout/Page'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import ConnectWalletButton from 'components/ConnectWalletButton'
import { LightGreyCard } from 'components/Card'
import STAKING_ABI from 'abis/nbcStaking.json'

// 代币配置接口
interface TokenConfig {
  symbol: string
  name: string
  tokenAddress: `0x${string}`
  stakingAddress: `0x${string}`
  chainId: number
  decimals: number
}

// 代币配置数组
const TOKEN_CONFIGS: TokenConfig[] = [
  {
    symbol: 'NBC',
    name: 'NBC Token',
    tokenAddress: '0xfE473265296e058fd1999cFf7E4536F51f5a1Fe6',
    stakingAddress: '0x3489A2343e53b122d0434aD39A82F274D76caBD2',
    chainId: 1281,
    decimals: 18,
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    tokenAddress: '0x5EaA2c6ae3bFf47D2188B64F743Ec777733a80ac',
    stakingAddress: '0x0000000000000000000000000000000000000000', // TODO: 需要部署 BTC 专用质押合约
    chainId: 1281,
    decimals: 8,
  },
  {
    symbol: 'ETH',
    name: 'Ether',
    tokenAddress: '0x934EbeB6D7D3821B604A5D10F80619d5bcBe49C3',
    stakingAddress: '0x0000000000000000000000000000000000000000', // TODO: 需要部署 ETH 专用质押合约
    chainId: 1281,
    decimals: 18,
  },
]

const CHAIN_ID = 1281

const ERC20_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'a', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'o', type: 'address' },
      { name: 's', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 's', type: 'address' },
      { name: 'v', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
]

const toUnits = (v: string, decimals: number) => {
  if (!v) return 0n
  const [i, d = ''] = v.split('.')
  const di = (d + '0'.repeat(decimals)).slice(0, decimals)
  return BigInt(i || '0') * 10n ** BigInt(decimals) + BigInt(di || '0')
}

const fromUnits = (n: bigint | undefined, decimals: number) => {
  if (n === undefined) return '0'
  const s = n.toString().padStart(decimals + 1, '0')
  const i = s.slice(0, -decimals)
  const d = s.slice(-decimals).replace(/0+$/, '')
  return d ? `${i}.${d}` : i
}

export default function NbcStaking() {
  const { t } = useTranslation()
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { toastSuccess, toastError } = useToast()
  const [amount, setAmount] = useState('')
  const [selectedToken, setSelectedToken] = useState<TokenConfig>(TOKEN_CONFIGS[0])
  const zero = '0x0000000000000000000000000000000000000000'
  const acct = address ?? zero

  // 当前选中的代币配置
  const currentToken = selectedToken

  // 创建当前代币的 ERC20Token 对象
  const TOKEN = useMemo(
    () =>
      new ERC20Token(
        currentToken.chainId,
        currentToken.tokenAddress,
        currentToken.decimals,
        currentToken.symbol,
        currentToken.name,
      ),
    [currentToken],
  )

  // Set default chain to NBC Chain (1281) on page load if no chain query param
  useEffect(() => {
    if (router.isReady && !router.query.chain) {
      router.replace(
        {
          pathname: router.pathname,
          query: { ...router.query, chain: 'nbc' },
        },
        undefined,
        { shallow: true },
      )
    }
  }, [router.isReady, router.query.chain, router.pathname])

  // 切换代币时清空输入和授权状态
  useEffect(() => {
    setAmount('')
  }, [selectedToken])

  const isWrongChain = chainId !== CHAIN_ID

  const { data: bal } = useReadContract({
    address: currentToken.tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [acct],
    chainId: currentToken.chainId,
    query: { enabled: isConnected && !isWrongChain },
  })

  const { data: allowance } = useReadContract({
    address: currentToken.tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [acct, currentToken.stakingAddress],
    chainId: currentToken.chainId,
    query: { enabled: isConnected && !isWrongChain },
  })

  const { data: staked } = useReadContract({
    address: currentToken.stakingAddress as `0x${string}`,
    abi: STAKING_ABI as any,
    functionName: 'balanceOf',
    args: [acct],
    chainId: currentToken.chainId,
    query: { enabled: isConnected && !isWrongChain },
  })

  const { data: earned } = useReadContract({
    address: currentToken.stakingAddress as `0x${string}`,
    abi: STAKING_ABI as any,
    functionName: 'earned',
    args: [acct],
    chainId: currentToken.chainId,
    query: { enabled: isConnected && !isWrongChain },
  })

  const { data: totalStaked } = useReadContract({
    address: currentToken.stakingAddress as `0x${string}`,
    abi: STAKING_ABI as any,
    functionName: 'totalStaked',
    args: [],
    chainId: currentToken.chainId,
  })

  const { writeContractAsync, isPending } = useWriteContract()

  const needApprove = useMemo(() => {
    if (!allowance || !amount || !isConnected) return true
    try {
      return (allowance as bigint) < toUnits(amount, currentToken.decimals)
    } catch {
      return true
    }
  }, [allowance, amount, isConnected, currentToken.decimals])

  const handleApprove = async () => {
    try {
      const tx = await writeContractAsync({
        address: currentToken.tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [currentToken.stakingAddress, toUnits(amount, currentToken.decimals)],
        chainId: currentToken.chainId,
      })
      toastSuccess(t('Approved'), t('Token approval successful'))
    } catch (error: any) {
      toastError(t('Error'), error?.message || t('Failed to approve'))
    }
  }

  const handleStake = async () => {
    try {
      await writeContractAsync({
        address: currentToken.stakingAddress as `0x${string}`,
        abi: STAKING_ABI as any,
        functionName: 'stake',
        args: [toUnits(amount, currentToken.decimals)],
        chainId: currentToken.chainId,
      })
      toastSuccess(t('Staked'), t('Tokens staked successfully'))
      setAmount('')
    } catch (error: any) {
      toastError(t('Error'), error?.message || t('Failed to stake'))
    }
  }

  const handleWithdraw = async () => {
    try {
      await writeContractAsync({
        address: currentToken.stakingAddress as `0x${string}`,
        abi: STAKING_ABI as any,
        functionName: 'withdraw',
        args: [toUnits(amount, currentToken.decimals)],
        chainId: currentToken.chainId,
      })
      toastSuccess(t('Withdrawn'), t('Tokens withdrawn successfully'))
      setAmount('')
    } catch (error: any) {
      toastError(t('Error'), error?.message || t('Failed to withdraw'))
    }
  }

  const handleClaim = async () => {
    try {
      await writeContractAsync({
        address: currentToken.stakingAddress as `0x${string}`,
        abi: STAKING_ABI as any,
        functionName: 'getReward',
        args: [],
        chainId: currentToken.chainId,
      })
      toastSuccess(t('Claimed'), t('Rewards claimed successfully'))
    } catch (error: any) {
      toastError(t('Error'), error?.message || t('Failed to claim'))
    }
  }

  const handleMax = () => {
    if (bal) {
      setAmount(fromUnits(bal as bigint, currentToken.decimals))
    }
  }

  const tokenBalance = useMemo(
    () => (bal ? new BigNumber(fromUnits(bal as bigint, currentToken.decimals)) : new BigNumber(0)),
    [bal, currentToken.decimals],
  )
  const stakedAmount = useMemo(
    () => (staked ? new BigNumber(fromUnits(staked as bigint, currentToken.decimals)) : new BigNumber(0)),
    [staked, currentToken.decimals],
  )
  const earnedAmount = useMemo(
    () => (earned ? new BigNumber(fromUnits(earned as bigint, currentToken.decimals)) : new BigNumber(0)),
    [earned, currentToken.decimals],
  )
  const totalStakedAmount = useMemo(
    () => (totalStaked ? new BigNumber(fromUnits(totalStaked as bigint, currentToken.decimals)) : new BigNumber(0)),
    [totalStaked, currentToken.decimals],
  )

  return (
    <>
      <PageHeader>
        <Flex justifyContent="space-between" flexDirection={['column', null, null, 'row']}>
          <Flex flex="1" flexDirection="column" mr={['8px', 0]}>
            <Heading as="h1" scale="xxl" color="secondary" mb="24px">
              {t('NBC Chain Staking')}
            </Heading>
            <Heading scale="md" color="text">
              {t('Stake %symbol% and earn rewards', { symbol: currentToken.symbol })}
            </Heading>
          </Flex>
        </Flex>
      </PageHeader>
      <Page title={t('NBC Staking')}>
        <Box maxWidth="600px" margin="0 auto">
          <Pool.StyledCard>
          <Flex px="24px" pt="24px" alignItems="center" justifyContent="space-between">
            <Flex alignItems="center">
              <CurrencyLogo currency={TOKEN} size="56px" />
              <Box ml="16px">
                <Heading scale="lg">{currentToken.symbol}</Heading>
                <Text fontSize="14px" color="textSubtle">
                  NBC Chain
                </Text>
              </Box>
            </Flex>
          </Flex>
          <CardBody>
            {/* 代币选择器 */}
            <Box mb="24px">
              <Text fontSize="14px" bold mb="12px">
                {t('Select Token')}
              </Text>
              <Flex flexWrap="wrap">
                {TOKEN_CONFIGS.map((token, index) => (
                  <Box key={token.symbol} mr={index < TOKEN_CONFIGS.length - 1 ? '8px' : '0'} mb="8px">
                    <Button
                      variant={selectedToken.symbol === token.symbol ? 'primary' : 'secondary'}
                      scale="sm"
                      onClick={() => setSelectedToken(token)}
                    >
                      {token.symbol}
                    </Button>
                  </Box>
                ))}
              </Flex>
            </Box>
            {isWrongChain && isConnected && (
              <Box mb="16px">
                <Text color="failure" fontSize="14px">
                  {t('Please switch to NBC Chain (1281)')}
                </Text>
              </Box>
            )}
            {!isConnected && (
              <Box mb="24px">
                <ConnectWalletButton />
              </Box>
            )}

            {isConnected && !isWrongChain && (
              <>
                {/* 提示：如果质押合约地址为 0x0，显示警告 */}
                {currentToken.stakingAddress === '0x0000000000000000000000000000000000000000' && (
                  <Box mb="16px" p="16px" style={{ backgroundColor: '#fff4e6', borderRadius: '8px', border: '1px solid #ffb84d' }}>
                    <Text color="warning" fontSize="14px" bold mb="4px">
                      {t('Warning')}
                    </Text>
                    <Text color="textSubtle" fontSize="12px">
                      {t('Staking contract for %symbol% is not deployed yet. Please deploy a staking contract for this token.', {
                        symbol: currentToken.symbol,
                      })}
                    </Text>
                  </Box>
                )}
                <LightGreyCard mb="24px" p="16px">
                  <Flex justifyContent="space-between" mb="12px">
                    <Text color="textSubtle">{t('Total Staked')}:</Text>
                    <Text fontSize="16px" bold>
                      {totalStakedAmount.toFixed(4)} {currentToken.symbol}
                    </Text>
                  </Flex>
                  <Flex justifyContent="space-between" mb="12px">
                    <Text color="textSubtle">{t('Your Token Balance')}:</Text>
                    <Text fontSize="16px" bold>
                      {tokenBalance.toFixed(4)} {currentToken.symbol}
                    </Text>
                  </Flex>
                  <Flex justifyContent="space-between" mb="12px">
                    <Text color="textSubtle">{t('Your Staked')}:</Text>
                    <Text fontSize="16px" bold>
                      {stakedAmount.toFixed(4)} {currentToken.symbol}
                    </Text>
                  </Flex>
                  <Flex justifyContent="space-between">
                    <Text color="textSubtle">{t('Rewards Earned')}:</Text>
                    <Text fontSize="16px" bold>
                      {earnedAmount.toFixed(4)} {currentToken.symbol}
                    </Text>
                  </Flex>
                </LightGreyCard>

                <Box mb="16px">
                  <Flex justifyContent="space-between" mb="8px">
                    <Text fontSize="14px" bold>
                      {t('Amount')}
                    </Text>
                    <Button variant="text" scale="sm" onClick={handleMax}>
                      {t('Max')}
                    </Button>
                  </Flex>
                  <Input
                    value={amount}
                    onChange={(e: any) => setAmount(e.target.value)}
                    placeholder="0.0"
                    type="number"
                  />
                </Box>

                <Box mb="16px">
                  {currentToken.stakingAddress === '0x0000000000000000000000000000000000000000' ? (
                    <Button width="100%" disabled mb="12px">
                      {t('Staking Contract Not Deployed')}
                    </Button>
                  ) : (
                    <>
                      {needApprove ? (
                        <Button width="100%" onClick={handleApprove} disabled={isPending || !amount} mb="12px">
                          {t('Approve %symbol%', { symbol: currentToken.symbol })}
                        </Button>
                      ) : (
                        <Button width="100%" onClick={handleStake} disabled={isPending || !amount} mb="12px">
                          {t('Stake')}
                        </Button>
                      )}
                      <Button
                        width="100%"
                        variant="secondary"
                        onClick={handleWithdraw}
                        disabled={isPending || !amount}
                        mb="12px"
                      >
                        {t('Withdraw')}
                      </Button>
                      <Button
                        width="100%"
                        variant="tertiary"
                        onClick={handleClaim}
                        disabled={isPending || earnedAmount.lte(0)}
                      >
                        {t('Claim Rewards')}
                      </Button>
                    </>
                  )}
                </Box>
              </>
            )}
          </CardBody>
        </Pool.StyledCard>
        </Box>
      </Page>
    </>
  )
}

NbcStaking.chains = [1281]