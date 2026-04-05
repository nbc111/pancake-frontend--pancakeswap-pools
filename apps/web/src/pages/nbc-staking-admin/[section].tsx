import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { isValidNbcAdminSection, NBC_ADMIN_DEFAULT_SECTION } from 'config/nbcStakingAdminNav'
import NbcStakingAdminView from 'views/nbc-staking-admin/NbcStakingAdminView'

function sectionFromQuery(raw: string | string[] | undefined): string | undefined {
  if (typeof raw === 'string') return raw
  if (Array.isArray(raw) && raw[0]) return raw[0]
  return undefined
}

const NbcStakingAdminSectionPage = () => {
  const router = useRouter()
  const raw = sectionFromQuery(router.query.section)
  const section = isValidNbcAdminSection(raw) ? raw : undefined

  useEffect(() => {
    if (!router.isReady || section !== undefined) return
    const { section: _drop, ...rest } = router.query
    router.replace(
      {
        pathname: `/nbc-staking-admin/${NBC_ADMIN_DEFAULT_SECTION}`,
        query: rest,
      },
      undefined,
      { shallow: true },
    )
  }, [router, router.isReady, section])

  if (!router.isReady || section === undefined) {
    return null
  }

  return <NbcStakingAdminView section={section} />
}

NbcStakingAdminSectionPage.chains = [1281]

export default NbcStakingAdminSectionPage
