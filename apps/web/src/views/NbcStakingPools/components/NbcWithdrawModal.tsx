import { useState, useCallback } from 'react'
import BigNumber from 'bignumber.js'
import { BIG_ZERO } from '@pancakeswap/utils/bigNumber'
import { useTranslation } from '@pancakeswap/localization'
import { useToast } from '@pancakeswap/uikit'
import { Pool } from '@pancakeswap/widgets-internal'
import { Token } from '@pancakeswap/sdk'
import { useWriteContract, useAccount } from 'wagmi'
import STAKING_ABI from 'abis/nbcMultiRewardStaking.json'
import { ToastDescriptionWithTx } from 'components/Toast'

const STAKING_CONTRACT_ADDRESS = '0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789' as `0x${string}`
const CHAIN_ID = 1281

interface NbcWithdrawModalProps {
  pool: Pool.DeserializedPool<Token>
  stakingTokenBalance: BigNumber
  stakedBalance: BigNumber
  poolIndex: number
  onDismiss?: () => void
}

const NbcWithdrawModal: React.FC<NbcWithdrawModalProps> = ({ pool, stakingTokenBalance, poolIndex, onDismiss }) => {
  const { t } = useTranslation()
  const { toastSuccess, toastError } = useToast()
  const { writeContractAsync, isPending } = useWriteContract()
  const { address: account } = useAccount()
  const [, setAmount] = useState('')

  const toUnits = (v: string, decimals: number) => {
    if (!v) return 0n
    const [i, d = ''] = v.split('.')
    const di = (d + '0'.repeat(decimals)).slice(0, decimals)
    return BigInt(i || '0') * 10n ** BigInt(decimals) + BigInt(di || '0')
  }

  const handleConfirmClick = useCallback(
    async (stakeAmount: string) => {
      try {
        const amountInWei = toUnits(stakeAmount, 18) // NBC 精度是 18
        const txHash = await writeContractAsync({
          address: STAKING_CONTRACT_ADDRESS,
          abi: STAKING_ABI as any,
          functionName: 'withdraw',
          args: [poolIndex, amountInWei],
          chainId: CHAIN_ID,
        })

        toastSuccess(
          t('Unstaked!'),
          <ToastDescriptionWithTx txHash={txHash}>
            {t('Your NBC has been unstaked successfully!')}
          </ToastDescriptionWithTx>,
        )
        setAmount('')
        onDismiss?.()
      } catch (error: any) {
        toastError(t('Error'), error?.message || t('Failed to unstake'))
      }
    },
    [poolIndex, writeContractAsync, toastSuccess, toastError, t, onDismiss],
  )

  const { stakingToken, earningToken, apr, stakingTokenPrice, earningTokenPrice, userData } = pool

  return (
    <Pool.StakeModal
      enableEmergencyWithdraw={false}
      stakingLimit={BIG_ZERO}
      stakingTokenPrice={stakingTokenPrice || 0}
      earningTokenPrice={earningTokenPrice || 0}
      stakingTokenDecimals={stakingToken.decimals}
      earningTokenSymbol={earningToken.symbol}
      stakingTokenSymbol={stakingToken.symbol}
      stakingTokenAddress={stakingToken.address}
      stakingTokenBalance={stakingTokenBalance}
      apr={apr || 0}
      userDataStakedBalance={userData?.stakedBalance ?? BIG_ZERO}
      userDataStakingTokenBalance={userData?.stakingTokenBalance ?? BIG_ZERO}
      onDismiss={onDismiss}
      pendingTx={isPending}
      account={account ?? ''}
      needEnable={false} // 原生代币不需要 approve
      enablePendingTx={false}
      handleEnableApprove={() => {}}
      setAmount={setAmount}
      handleConfirmClick={handleConfirmClick}
      isRemovingStake
      imageUrl=""
      warning={undefined}
    />
  )
}

export default NbcWithdrawModal
