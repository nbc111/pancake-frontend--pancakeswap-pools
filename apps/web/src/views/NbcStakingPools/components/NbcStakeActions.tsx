import { useEffect, useRef, useState } from 'react'
import BigNumber from 'bignumber.js'
import { useTranslation } from '@pancakeswap/localization'
import { Button, Flex, Text, useModal, useToast } from '@pancakeswap/uikit'
import { Token } from '@pancakeswap/sdk'
import { Pool } from '@pancakeswap/widgets-internal'
import { useQueryClient } from '@tanstack/react-query'
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import STAKING_ABI from 'abis/nbcMultiRewardStaking.json'
import { ToastDescriptionWithTx } from 'components/Toast'
import { CHAIN_ID, STAKING_CONTRACT_ADDRESS } from 'config/staking/constants'
import NbcStakeModal from './NbcStakeModal'
import NbcWithdrawModal from './NbcWithdrawModal'

interface NbcStakeActionsProps {
  isLoading: boolean
  pool: Pool.DeserializedPool<Token>
  stakingTokenBalance: BigNumber
  stakedBalance: BigNumber
  isStaked: boolean
}

const NbcStakeActions: React.FC<NbcStakeActionsProps> = ({
  isLoading,
  pool,
  stakingTokenBalance,
  stakedBalance,
  isStaked,
}) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { toastSuccess, toastError } = useToast()
  const { writeContractAsync, isPending: isExecutingWithdraw } = useWriteContract()
  const { sousId, stakingToken, isFinished } = pool
  const [executeWithdrawHash, setExecuteWithdrawHash] = useState<`0x${string}` | undefined>()
  const [isExecuteLocked, setIsExecuteLocked] = useState(false)
  const executeWithdrawLockRef = useRef(false)
  const withdrawRequest = (pool.userData as typeof pool.userData & {
    withdrawRequest?: { requestId: number; approved: boolean; executed: boolean; rejected: boolean }
  } | undefined)?.withdrawRequest
  const { isLoading: isExecuteConfirming, isSuccess: isExecuteConfirmed } = useWaitForTransactionReceipt({
    chainId: CHAIN_ID,
    hash: executeWithdrawHash,
    query: {
      enabled: !!executeWithdrawHash,
    },
  })

  const [onPresentStake] = useModal(
    <NbcStakeModal pool={pool} stakingTokenBalance={stakingTokenBalance} poolIndex={sousId} />,
  )

  const [onPresentUnstake] = useModal(
    <NbcWithdrawModal
      pool={pool}
      stakingTokenBalance={stakingTokenBalance}
      stakedBalance={stakedBalance}
      poolIndex={sousId}
    />,
  )

  const handleExecuteWithdraw = async () => {
    if (!withdrawRequest || executeWithdrawLockRef.current) return

    try {
      executeWithdrawLockRef.current = true
      setIsExecuteLocked(true)
      const txHash = await writeContractAsync({
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_ABI as any,
        functionName: 'executeWithdraw',
        args: [BigInt(withdrawRequest.requestId)],
        chainId: CHAIN_ID,
      })
      setExecuteWithdrawHash(txHash)

      toastSuccess(
        t('Withdraw executed!'),
        <ToastDescriptionWithTx txHash={txHash}>
          {t('Your NBC withdraw has been executed successfully!')}
        </ToastDescriptionWithTx>,
      )
    } catch (error: any) {
      executeWithdrawLockRef.current = false
      setIsExecuteLocked(false)
      setExecuteWithdrawHash(undefined)
      toastError(t('Error'), error?.message || t('Failed to execute withdraw'))
    }
  }

  useEffect(() => {
    if (!isExecuteConfirmed) return

    queryClient.invalidateQueries({ queryKey: ['nbcStakingUserWithdrawRequests'] })
    queryClient.refetchQueries({ queryKey: ['nbcStakingUserWithdrawRequests'] })
  }, [isExecuteConfirmed, queryClient])

  useEffect(() => {
    if (!withdrawRequest) {
      executeWithdrawLockRef.current = false
      setIsExecuteLocked(false)
      setExecuteWithdrawHash(undefined)
    }
  }, [withdrawRequest])

  if (isStaked) {
    if (withdrawRequest?.approved && !withdrawRequest.executed && !withdrawRequest.rejected) {
      const isExecuteBusy = isLoading || isExecutingWithdraw || isExecuteConfirming || isExecuteLocked
      const executeButtonText = isExecutingWithdraw
        ? t('Submitting...')
        : isExecuteConfirming
          ? t('Confirming...')
          : isExecuteLocked
            ? t('Refreshing...')
            : t('Execute Withdraw')
      const executeStatusText = isExecutingWithdraw
        ? t('Submitting withdraw execution to your wallet...')
        : isExecuteConfirming
          ? t('Withdraw execution submitted. Waiting for on-chain confirmation...')
          : isExecuteLocked
            ? t('On-chain confirmation received. Refreshing your staking status...')
            : t('Withdraw request approved. Execute to receive your NBC.')
      return (
        <Flex width="100%" flexDirection="column" style={{ gap: '8px' }}>
          <Text fontSize="12px" color={isExecuteBusy ? 'warning' : 'success'}>
            {executeStatusText}
          </Text>
          <Button onClick={handleExecuteWithdraw} disabled={isExecuteBusy} isLoading={isExecutingWithdraw || isExecuteConfirming} width="100%">
            {executeButtonText}
          </Button>
        </Flex>
      )
    }

    if (withdrawRequest && !withdrawRequest.approved && !withdrawRequest.executed && !withdrawRequest.rejected) {
      return (
        <Flex width="100%" flexDirection="column" style={{ gap: '8px' }}>
          <Text fontSize="12px" color="warning">
            {t('Withdraw request submitted. Awaiting admin approval.')}
          </Text>
          <Button disabled width="100%" variant="secondary">
            {t('Pending Approval')}
          </Button>
        </Flex>
      )
    }

    return (
      <Button onClick={onPresentUnstake} disabled={isLoading} width="100%" variant="secondary">
        {t('Unstake %symbol%', { symbol: stakingToken.symbol })}
      </Button>
    )
  }

  return (
    <Button onClick={onPresentStake} disabled={isLoading || isFinished} width="100%">
      {t('Stake %symbol%', { symbol: stakingToken.symbol })}
    </Button>
  )
}

export default NbcStakeActions
