import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { CHAIN_QUERY_NAME, getChainId } from 'config/chains'
import { ChainId } from '@pancakeswap/chains'
import { useSetAtom } from 'jotai'
import { accountActiveChainAtom } from 'wallet/atoms/accountStateAtoms'
import NbcStakingPools from 'views/NbcStakingPools'

const NbcStakingPage = () => {
  const router = useRouter()
  const NBC_CHAIN_ID = 1281 as ChainId
  const updateAccountState = useSetAtom(accountActiveChainAtom)

  useEffect(() => {
    // 当路由准备就绪且没有 chain 参数时，自动添加 chain=nbc
    if (router.isReady && !router.query.chain) {
      router.replace(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            chain: CHAIN_QUERY_NAME[NBC_CHAIN_ID], // 'nbc'
          },
        },
        undefined,
        { shallow: true },
      )
    }
  }, [router.isReady, router.query.chain, router.pathname, router.query])

  useEffect(() => {
    // 当 URL 中有 chain=nbc 参数时，更新 accountActiveChainAtom
    if (router.isReady && router.query.chain === 'nbc') {
      const chainId = getChainId(router.query.chain as string)
      if (chainId === NBC_CHAIN_ID) {
        updateAccountState((prev) => ({
          ...prev,
          chainId: NBC_CHAIN_ID,
        }))
      }
    }
  }, [router.isReady, router.query.chain, updateAccountState, NBC_CHAIN_ID])

  return <NbcStakingPools />
}

NbcStakingPage.chains = [1281]

export default NbcStakingPage
