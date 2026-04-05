import React, { useMemo } from 'react'
import { createPortal } from 'react-dom'
import { styled } from 'styled-components'
import { useAccount } from 'wagmi'
import { useTranslation } from '@pancakeswap/localization'
import { Button, ShareIcon, getPortalRoot, useModal } from '@pancakeswap/uikit'
import { NbcReferralShareModal } from './NbcReferralShareModal'

const FabWrap = styled.div`
  position: fixed;
  right: 18px;
  bottom: calc(24px + env(safe-area-inset-bottom));
  z-index: 101;
`

/**
 * NBC 质押页：连接钱包后展示；点击打开弹窗：邀请链接 + 当前钱包返佣记录。
 */
export const NbcReferralShareFab: React.FC = () => {
  const { t } = useTranslation()
  const { address } = useAccount()

  const [onPresentShareModal] = useModal(
    address ? <NbcReferralShareModal walletAddress={address} /> : <></>,
    false,
    true,
    'nbc-referral-share',
  )

  const portalTarget = useMemo(() => (typeof document !== 'undefined' ? getPortalRoot() : null), [])

  if (!address) {
    return null
  }

  const fab = (
    <FabWrap>
      <Button
        width={48}
        height={48}
        variant="primary"
        endIcon={<ShareIcon color="invertedContrast" style={{ marginLeft: 0 }} />}
        onClick={() => onPresentShareModal()}
        aria-label={t('NBC referral share fab aria')}
        title={t('NBC referral share fab aria')}
      />
    </FabWrap>
  )

  /** 挂到 portal-root/body，避免父级 transform 导致 position:fixed 随页面滚动 */
  if (portalTarget && portalTarget instanceof HTMLElement) {
    return createPortal(fab, portalTarget)
  }

  return fab
}
