import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { NBC_ADMIN_DEFAULT_SECTION } from 'config/nbcStakingAdminNav'

/**
 * 兼容旧入口 /nbc-staking-admin，统一跳转到带 section 的子路由。
 */
const NbcStakingAdminIndexRedirect = () => {
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) return
    router.replace({
      pathname: `/nbc-staking-admin/${NBC_ADMIN_DEFAULT_SECTION}`,
      query: router.query,
    })
  }, [router.isReady, router])

  return null
}

NbcStakingAdminIndexRedirect.chains = [1281]

export default NbcStakingAdminIndexRedirect
