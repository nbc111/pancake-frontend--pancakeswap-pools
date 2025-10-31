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

const TOKEN_ADDRESS = '0xfE473265296e058fd1999cFf7E4536F51f5a1Fe6'
const STAKING_ADDRESS = '0x3489A2343e53b122d0434aD39A82F274D76caBD2'
const CHAIN_ID = 1281
const DECIMALS = 18
const TOKEN_SYMBOL = 'NBC'

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

const TOKEN = new ERC20Token(CHAIN_ID, TOKEN_ADDRESS as `0x${string}`, DECIMALS, TOKEN_SYMBOL, 'NBC Token')

const toUnits = (v: string, decimals: number = DECIMALS) => {
  if (!v) return 0n
  const [i, d = ''] = v.split('.')
  const di = (d + '0'.repeat(decimals)).slice(0, decimals)
  return BigInt(i || '0') * 10n ** BigInt(decimals) + BigInt(di || '0')
}

const fromUnits = (n?: bigint, decimals: number = DECIMALS) => {
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
  const zero = '0x0000000000000000000000000000000000000000'
  const acct = address ?? zero

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

  const isWrongChain = chainId !== CHAIN_ID

  const { data: bal } = useReadContract({
    address: TOKEN_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [acct],
    chainId: CHAIN_ID,
    query: { enabled: isConnected && !isWrongChain },
  })

  const { data: allowance } = useReadContract({
    address: TOKEN_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [acct, STAKING_ADDRESS],
    chainId: CHAIN_ID,
    query: { enabled: isConnected && !isWrongChain },
  })

  const { data: staked } = useReadContract({
    address: STAKING_ADDRESS as `0x${string}`,
    abi: STAKING_ABI as any,
    functionName: 'balanceOf',
    args: [acct],
    chainId: CHAIN_ID,
    query: { enabled: isConnected && !isWrongChain },
  })

  const { data: earned } = useReadContract({
    address: STAKING_ADDRESS as `0x${string}`,
    abi: STAKING_ABI as any,
    functionName: 'earned',
    args: [acct],
    chainId: CHAIN_ID,
    query: { enabled: isConnected && !isWrongChain },
  })

  const { data: totalStaked } = useReadContract({
    address: STAKING_ADDRESS as `0x${string}`,
    abi: STAKING_ABI as any,
    functionName: 'totalStaked',
    args: [],
    chainId: CHAIN_ID,
  })

  const { writeContractAsync, isPending } = useWriteContract()

  const needApprove = useMemo(() => {
    if (!allowance || !amount || !isConnected) return true
    try {
      return (allowance as bigint) < toUnits(amount)
    } catch {
      return true
    }
  }, [allowance, amount, isConnected])

  const handleApprove = async () => {
    try {
      const tx = await writeContractAsync({
        address: TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [STAKING_ADDRESS, toUnits(amount)],
        chainId: CHAIN_ID,
      })
      toastSuccess(t('Approved'), t('Token approval successful'))
    } catch (error: any) {
      toastError(t('Error'), error?.message || t('Failed to approve'))
    }
  }

  const handleStake = async () => {
    try {
      await writeContractAsync({
        address: STAKING_ADDRESS as `0x${string}`,
        abi: STAKING_ABI as any,
        functionName: 'stake',
        args: [toUnits(amount)],
        chainId: CHAIN_ID,
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
        address: STAKING_ADDRESS as `0x${string}`,
        abi: STAKING_ABI as any,
        functionName: 'withdraw',
        args: [toUnits(amount)],
        chainId: CHAIN_ID,
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
        address: STAKING_ADDRESS as `0x${string}`,
        abi: STAKING_ABI as any,
        functionName: 'getReward',
        args: [],
        chainId: CHAIN_ID,
      })
      toastSuccess(t('Claimed'), t('Rewards claimed successfully'))
    } catch (error: any) {
      toastError(t('Error'), error?.message || t('Failed to claim'))
    }
  }

  const handleMax = () => {
    if (bal) {
      setAmount(fromUnits(bal as bigint))
    }
  }

  const tokenBalance = useMemo(() => (bal ? new BigNumber(fromUnits(bal as bigint)) : new BigNumber(0)), [bal])
  const stakedAmount = useMemo(() => (staked ? new BigNumber(fromUnits(staked as bigint)) : new BigNumber(0)), [staked])
  const earnedAmount = useMemo(() => (earned ? new BigNumber(fromUnits(earned as bigint)) : new BigNumber(0)), [earned])
  const totalStakedAmount = useMemo(
    () => (totalStaked ? new BigNumber(fromUnits(totalStaked as bigint)) : new BigNumber(0)),
    [totalStaked],
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
              {t('Stake %symbol% and earn rewards', { symbol: TOKEN_SYMBOL })}
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
                <Heading scale="lg">{TOKEN_SYMBOL}</Heading>
                <Text fontSize="14px" color="textSubtle">
                  NBC Chain
                </Text>
              </Box>
            </Flex>
          </Flex>
          <CardBody>
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
                <LightGreyCard mb="24px" p="16px">
                  <Flex justifyContent="space-between" mb="12px">
                    <Text color="textSubtle">{t('Total Staked')}:</Text>
                    <Text fontSize="16px" bold>
                      {totalStakedAmount.toFixed(4)} {TOKEN_SYMBOL}
                    </Text>
                  </Flex>
                  <Flex justifyContent="space-between" mb="12px">
                    <Text color="textSubtle">{t('Your Token Balance')}:</Text>
                    <Text fontSize="16px" bold>
                      {tokenBalance.toFixed(4)} {TOKEN_SYMBOL}
                    </Text>
                  </Flex>
                  <Flex justifyContent="space-between" mb="12px">
                    <Text color="textSubtle">{t('Your Staked')}:</Text>
                    <Text fontSize="16px" bold>
                      {stakedAmount.toFixed(4)} {TOKEN_SYMBOL}
                    </Text>
                  </Flex>
                  <Flex justifyContent="space-between">
                    <Text color="textSubtle">{t('Rewards Earned')}:</Text>
                    <Text fontSize="16px" bold>
                      {earnedAmount.toFixed(4)} {TOKEN_SYMBOL}
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
                  {needApprove ? (
                    <Button width="100%" onClick={handleApprove} disabled={isPending || !amount} mb="12px">
                      {t('Approve %symbol%', { symbol: TOKEN_SYMBOL })}
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