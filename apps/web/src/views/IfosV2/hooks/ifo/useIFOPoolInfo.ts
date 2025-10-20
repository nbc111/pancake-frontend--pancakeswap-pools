import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { useLatestTxReceipt } from 'state/farmsV4/state/accountPositions/hooks/useLatestTxReceipt'
import { getViemClients } from 'utils/viem'
import { zeroAddress, isAddressEqual, type Address } from 'viem'
import { useCurrency } from 'hooks/Tokens'
import { Currency } from '@pancakeswap/swap-sdk-core'
import { useAtomValue } from 'jotai'
import { ifoPoolsAtom } from 'views/IfosV2/atom/ifo.atoms'
import { useIfoV2Context } from 'views/IfosV2/contexts/useIfoV2Context'
import { CAKE } from '@pancakeswap/tokens'
import { ifoVersionAtom } from 'views/IfosV2/atom/ifoVersionAtom'
import { useIFOAddresses } from './useIFOAddresses'
import type { PoolInfo } from '../../ifov2.types'
import { mapToPoolInfo, type RawPoolInfo } from './mapToPoolInfo'

export const useIFOPoolInfo = () => {
  const { config } = useIfoV2Context()
  const pools = useAtomValue(ifoPoolsAtom(config.id))
  return pools ?? []
}

export const useIFOPoolInfoCtx = (): PoolInfo[] => {
  const { chainId } = useActiveChainId()
  const { ifoContract } = useIfoV2Context()
  const latestTxReceipt = useLatestTxReceipt()
  const { data: addresses } = useIFOAddresses()
  const stakeCurrency0 = useCurrency(addresses?.lpToken0)
  const stakeCurrency1 = useCurrency(addresses?.lpToken1)
  const offeringCurrency = useCurrency(addresses?.offeringToken)
  const cakeAddress = CAKE[chainId as keyof typeof CAKE]?.address ?? zeroAddress
  const version = useAtomValue(ifoVersionAtom)

  const { data } = useQuery({
    queryKey: ['ifoPoolInfo', chainId, addresses, latestTxReceipt, version],
    queryFn: async (): Promise<{ raw: RawPoolInfo; taxRateRaw: bigint }[]> => {
      const publicClient = getViemClients({ chainId })
      if (!ifoContract || !publicClient || !addresses) throw new Error('IFO contract not found')

      const [infos, taxRates] = await Promise.all([
        publicClient.multicall({
          contracts: [
            {
              address: ifoContract.address,
              abi: ifoContract.abi,
              functionName: 'viewPoolInformation',
              args: [0n],
            },
            {
              address: ifoContract.address,
              abi: ifoContract.abi,
              functionName: 'viewPoolInformation',
              args: [1n],
            },
          ],
          allowFailure: false,
        }),
        publicClient.multicall({
          contracts: [
            {
              address: ifoContract.address,
              abi: ifoContract.abi,
              functionName: 'viewPoolTaxRateOverflow',
              args: [0n],
            },
            {
              address: ifoContract.address,
              abi: ifoContract.abi,
              functionName: 'viewPoolTaxRateOverflow',
              args: [1n],
            },
          ],
          allowFailure: false,
        }),
      ])

      return (infos as RawPoolInfo[]).map((info, idx) => ({
        raw: info,
        taxRateRaw: taxRates[idx] as bigint,
      }))
    },
    enabled: !!ifoContract && !!addresses,
  })

  return useMemo(() => {
    if (!data || !addresses) return []

    return data
      .map(({ raw, taxRateRaw }, idx) => {
        const poolToken = ((idx === 0 ? addresses.lpToken0 : addresses.lpToken1) ?? zeroAddress) as Address
        const stakeCurrency = (idx === 0 ? stakeCurrency0 : stakeCurrency1) as Currency
        const [raisingAmountPool, , , , totalAmountPool] = raw
        const feeTier = totalAmountPool < raisingAmountPool ? 0 : Number(taxRateRaw) / 1e12
        const mapped = mapToPoolInfo({
          raw,
          pid: idx,
          poolToken,
          stakeCurrency,
          offeringCurrency: offeringCurrency as Currency,
          feeTier,
        })

        if (!mapped) return undefined

        return {
          ...mapped,
          isCakePool: isAddressEqual(poolToken, cakeAddress as `0x${string}`),
        } as PoolInfo
      })
      .filter((pool): pool is PoolInfo => Boolean(pool))
  }, [data, addresses, stakeCurrency0, stakeCurrency1, offeringCurrency, cakeAddress])
}
