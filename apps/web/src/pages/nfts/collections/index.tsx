import dynamic from 'next/dynamic'
import { GetServerSideProps } from 'next'
import Collections from 'views/Nft/market/Collections'

const CollectionsPage = () => {
  return <Collections />
}

// 强制仅在请求时渲染，跳过静态生成
// 这个页面依赖客户端数据（NFT 集合），在构建时无法静态生成
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  }
}

export default dynamic(() => Promise.resolve(CollectionsPage), { ssr: false })
