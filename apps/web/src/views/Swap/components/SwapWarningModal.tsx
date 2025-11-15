import { Modal, ModalV2 } from '@pancakeswap/uikit'
import { ReactNode } from 'react'

interface SwapWarningModalProps {
  title?: string
  children: ReactNode
  onDismiss?: () => void
}

export default function SwapWarningModal({ title, children, onDismiss }: SwapWarningModalProps) {
  return (
    <ModalV2 isOpen onDismiss={onDismiss}>
      <Modal title={title} onDismiss={onDismiss}>
        {children}
      </Modal>
    </ModalV2>
  )
}
