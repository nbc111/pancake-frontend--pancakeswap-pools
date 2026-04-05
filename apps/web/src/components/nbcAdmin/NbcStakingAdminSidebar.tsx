import React, { useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { styled } from 'styled-components'
import { Box, Text } from '@pancakeswap/uikit'
import { useTranslation } from '@pancakeswap/localization'
import type { NbcAdminSection } from 'config/nbcStakingAdminNav'
import { NBC_ADMIN_NAV_GROUPS } from 'config/nbcStakingAdminNav'

const NavRoot = styled(Box)`
  width: 100%;
  flex-shrink: 0;

  ${({ theme }) => theme.mediaQueries.lg} {
    width: 240px;
    position: sticky;
    top: 88px;
    align-self: flex-start;
  }
`

const NavButton = styled.a<{ $active?: boolean }>`
  display: block;
  padding: 10px 14px;
  border-radius: 8px;
  margin-bottom: 4px;
  font-size: 15px;
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  color: ${({ $active, theme }) => ($active ? theme.colors.background : theme.colors.text)};
  background: ${({ $active, theme }) => ($active ? theme.colors.primary : 'transparent')};
  border: 1px solid
    ${({ $active, theme }) => ($active ? theme.colors.primary : 'transparent')};
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.tertiary)};
  }
`

type Props = {
  section: NbcAdminSection
}

export const NbcStakingAdminSidebar: React.FC<Props> = ({ section }) => {
  const { t } = useTranslation()
  const router = useRouter()

  const query = useMemo(() => {
    const q = { ...router.query }
    if (!q.chain) {
      q.chain = 'nbc'
    }
    return q
  }, [router.query])

  return (
    <NavRoot p="16px" style={{ border: '1px solid var(--colors-input)', borderRadius: '12px' }} bg="backgroundAlt">
      {NBC_ADMIN_NAV_GROUPS.map((group) => (
        <Box key={group.titleKey} mb="20px">
          <Text
            fontSize="11px"
            color="textSubtle"
            textTransform="uppercase"
            mb="10px"
            px="4px"
            style={{ letterSpacing: '0.06em' }}
          >
            {t(group.titleKey)}
          </Text>
          {group.items.map((item) => {
            const active = section === item.section
            const href = { pathname: `/nbc-staking-admin/${item.section}`, query }
            return (
              <Link key={item.section} href={href} passHref legacyBehavior>
                <NavButton $active={active}>
                  {item.emoji ? `${item.emoji} ` : ''}
                  {t(item.labelKey)}
                </NavButton>
              </Link>
            )
          })}
        </Box>
      ))}
    </NavRoot>
  )
}
