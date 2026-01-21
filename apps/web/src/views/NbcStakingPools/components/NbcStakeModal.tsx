import { useState, useCallback, useMemo } from 'react'
import BigNumber from 'bignumber.js'
import { BIG_ZERO } from '@pancakeswap/utils/bigNumber'
import { useTranslation } from '@pancakeswap/localization'
import { useToast } from '@pancakeswap/uikit'
import { Pool } from '@pancakeswap/widgets-internal'
import { Token } from '@pancakeswap/sdk'
import { useWriteContract, useAccount } from 'wagmi'
import STAKING_ABI from 'abis/nbcMultiRewardStaking.json'
import { ToastDescriptionWithTx } from 'components/Toast'
import { checkStakeThreshold } from 'config/staking/minStakeThreshold'
import { STAKING_POOL_CONFIGS } from 'config/staking'

const STAKING_CONTRACT_ADDRESS = '0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789' as `0x${string}`
const CHAIN_ID = 1281
const TARGET_APR = 30 // 目标 APR 30%

interface NbcStakeModalProps {
  pool: Pool.DeserializedPool<Token>
  stakingTokenBalance: BigNumber
  poolIndex: number
  onDismiss?: () => void
}

const NbcStakeModal: React.FC<NbcStakeModalProps> = ({ pool, stakingTokenBalance, poolIndex, onDismiss }) => {
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

  // 获取池配置
  const poolConfig = useMemo(() => {
    return STAKING_POOL_CONFIGS.find((config) => config.sousId === poolIndex)
  }, [poolIndex])

  const handleConfirmClick = useCallback(
    async (stakeAmount: string) => {
      try {
        const amountInWei = toUnits(stakeAmount, 18) // NBC 精度是 18

        // 检查最小质押量门槛
        if (poolConfig && pool.apr && pool.apr > TARGET_APR) {
          const totalStaked = pool.totalStaked?.toString() || '0'
          const totalStakedBigInt = BigInt(totalStaked)
          const rewardRateStr = pool.tokenPerBlock?.toString() || '0'
          const rewardRate = BigInt(rewardRateStr)
          const nbcPrice = pool.stakingTokenPrice || 1
          const tokenPrice = pool.earningTokenPrice || 1
          const conversionRate = tokenPrice / nbcPrice
          const rewardTokenDecimals = poolConfig.rewardTokenDecimals || 18

          // 使用默认的 1 年作为 rewardsDuration（与前端 APR 计算保持一致）
          const SECONDS_PER_YEAR = 365 * 24 * 60 * 60
          const rewardsDuration = BigInt(SECONDS_PER_YEAR)

          const checkResult = checkStakeThreshold(
            amountInWei,
            totalStakedBigInt,
            rewardRate,
            conversionRate,
            rewardTokenDecimals,
            TARGET_APR,
            rewardsDuration,
          )

          if (!checkResult.isValid) {
            toastError(
              t('Stake Amount Too Low'),
              checkResult.message || t('The stake amount is too low to maintain APR ≤ %targetAPR%%.', { targetAPR: TARGET_APR }),
            )
            return
          }
        }

        const txHash = await writeContractAsync({
          address: STAKING_CONTRACT_ADDRESS,
          abi: STAKING_ABI as any,
          functionName: 'stake',
          args: [poolIndex],
          value: amountInWei,
          chainId: CHAIN_ID,
        })

        toastSuccess(
          t('Staked!'),
          <ToastDescriptionWithTx txHash={txHash}>
            {t('Your NBC has been staked successfully!')}
          </ToastDescriptionWithTx>,
        )
        setAmount('')
        onDismiss?.()
      } catch (error: any) {
        toastError(t('Error'), error?.message || t('Failed to stake'))
      }
    },
    [poolIndex, pool, poolConfig, writeContractAsync, toastSuccess, toastError, t, onDismiss],
  )

  const { stakingToken, earningToken, apr, stakingTokenPrice, earningTokenPrice, userData } = pool
  const tokenWithLogo = stakingToken as Token & { logoURI?: string }

  // 确保 apr 和 earningTokenPrice 是有效的数字
  // 注意：earningTokenPrice 不能为 0，否则会导致 getInterestBreakdown 计算出 NaN
  // 如果 earningTokenPrice 无效，使用 1 作为默认值（这样至少不会导致 NaN）
  const validApr = typeof apr === 'number' && Number.isFinite(apr) && apr >= 0 ? apr : 0
  const validEarningTokenPrice = typeof earningTokenPrice === 'number' && Number.isFinite(earningTokenPrice) && earningTokenPrice > 0 ? earningTokenPrice : 1

  return (
    <Pool.StakeModal
      enableEmergencyWithdraw={false}
      stakingLimit={BIG_ZERO} // 改为 BIG_ZERO 而不是 null
      stakingTokenPrice={stakingTokenPrice || 0}
      earningTokenPrice={validEarningTokenPrice}
      stakingTokenDecimals={stakingToken.decimals}
      earningTokenSymbol={earningToken.symbol}
      stakingTokenSymbol={stakingToken.symbol}
      stakingTokenAddress={stakingToken.address}
      stakingTokenBalance={stakingTokenBalance}
      apr={validApr}
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
      isRemovingStake={false}
      imageUrl=""
      stakingTokenLogoURI={tokenWithLogo.logoURI}
      warning={undefined}
    />
  )
}

export default NbcStakeModal
