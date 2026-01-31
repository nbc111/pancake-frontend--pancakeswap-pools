import { useEffect } from 'react'
import { useRouter } from 'next/router'

const IndexPage = () => {
  const router = useRouter()
  useEffect(() => {
    router.replace('/nbc-staking')
  }, [router])
  return null
}

IndexPage.chains = []

export default IndexPage
