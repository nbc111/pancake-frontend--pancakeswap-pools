import BigNumber from 'bignumber.js'
import { useTranslation } from '@pancakeswap/localization'
import { Button, useToast } from '@pancakeswap/uikit'
import { getBalanceNumber } from '@pancakeswap/utils/formatBalance'
import { usePublicClient, useWriteContract } from 'wagmi'
import STAKING_ABI from 'abis/nbcMultiRewardStaking.json'
import { ToastDescriptionWithTx } from 'components/Toast'

const STAKING_CONTRACT_ADDRESS = '0x930BEcf16Ab2b20CcEe9f327f61cCB5B9352c789' as `0x${string}`
const CHAIN_ID = 1281

interface NbcHarvestActionsProps {
  earnings: BigNumber
  earningTokenSymbol: string
  earningTokenDecimals: number
  sousId: number
  earningTokenPrice: number
  isLoading: boolean
}

const NbcHarvestActions: React.FC<NbcHarvestActionsProps> = ({
  earnings,
  earningTokenDecimals,
  sousId,
  earningTokenPrice,
  isLoading,
}) => {
  const { t } = useTranslation()
  const { toastSuccess, toastError } = useToast()
  const { writeContractAsync, isPending } = useWriteContract()
  const publicClient = usePublicClient({ chainId: CHAIN_ID })

  const handleClaim = async () => {
    try {
      const txHash = await writeContractAsync({
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_ABI as any,
        functionName: 'getReward',
        args: [sousId],
        chainId: CHAIN_ID,
      })
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash })
        toastSuccess(
          t('Claimed!'),
          <ToastDescriptionWithTx txHash={txHash}>{t('Rewards claimed successfully!')}</ToastDescriptionWithTx>,
        )
      } else {
        toastSuccess(
          t('Transaction submitted'),
          <ToastDescriptionWithTx txHash={txHash}>
            {t('Rewards claim submitted. Please wait for confirmation.')}
          </ToastDescriptionWithTx>,
        )
      }
    } catch (error: any) {
      toastError(t('Error'), error?.message || t('Failed to claim rewards'))
    }
  }

  const rawEarnings = getBalanceNumber(earnings, earningTokenDecimals)

  return (
    <Button onClick={handleClaim} disabled={rawEarnings === 0 || isPending || isLoading} scale="md">
      {t('Harvest')}
    </Button>
  )
}

export default NbcHarvestActions
