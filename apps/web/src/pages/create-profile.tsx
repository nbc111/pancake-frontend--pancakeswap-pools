import { Flex, Text } from '@pancakeswap/uikit'

const CreateProfilePage = () => {
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
        Profile creation is unavailable
      </Text>
      <Text color="textSubtle">NBC 版本暂未开放创建个人资料。</Text>
    </Flex>
  )
}

export default CreateProfilePage
