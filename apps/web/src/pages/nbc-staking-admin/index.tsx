import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { NBC_ADMIN_DEFAULT_SECTION } from 'config/nbcStakingAdminNav'

/**
 * 旧版 Tab 布局已移除；访问 /nbc-staking-admin 时进入新版侧栏后台（默认 pools）。
 */
const NbcStakingAdminIndexRedirect = () => {
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) return
    router.replace(
      {
        pathname: `/nbc-staking-admin/${NBC_ADMIN_DEFAULT_SECTION}`,
        query: router.query,
      },
      undefined,
      { shallow: false },
    )
  }, [router, router.isReady])

  return null
}

const NbcStakingAdminIndexWithChains = NbcStakingAdminIndexRedirect as typeof NbcStakingAdminIndexRedirect & {
  chains?: number[]
}
NbcStakingAdminIndexWithChains.chains = [1281]

export default NbcStakingAdminIndexWithChains
