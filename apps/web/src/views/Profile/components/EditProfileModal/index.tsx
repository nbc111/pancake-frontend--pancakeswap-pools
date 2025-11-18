import { Button, Modal, Text } from '@pancakeswap/uikit'

interface EditProfileModalProps {
  onDismiss?: () => void
  onSuccess?: () => void
}

const EditProfileModal: React.FC<React.PropsWithChildren<EditProfileModalProps>> = ({ onDismiss }) => {
  return (
    <Modal title="Profile unavailable" onDismiss={onDismiss}>
      <Text mb="16px">NBC 版本暂未开放头像设置。</Text>
      <Button width="100%" onClick={onDismiss}>
        OK
      </Button>
    </Modal>
  )
}

export default EditProfileModal
