import { Flex, Text } from '@pancakeswap/uikit'

const ProposalPage = () => {
  return (
    <Flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="400px"
      p="24px"
      textAlign="center"
    >
      <Text fontSize="24px" bold mb="8px">
        Governance proposals are unavailable
      </Text>
      <Text color="textSubtle">NBC 版本暂未开放治理提案详情。</Text>
    </Flex>
  )
}

export default ProposalPage
