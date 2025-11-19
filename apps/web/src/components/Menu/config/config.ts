import { ChainId } from '@pancakeswap/chains'
import { ContextApi } from '@pancakeswap/localization'
import { SUPPORTED_CHAIN_IDS as POOL_SUPPORTED_CHAINS } from '@pancakeswap/pools'
import { DropdownMenuItems, EarnFillIcon, EarnIcon, MenuItemsType } from '@pancakeswap/uikit'
import { CHAIN_QUERY_NAME } from 'config/chains'
import { SUPPORT_FARMS } from 'config/constants/supportChains'

export type ConfigMenuDropDownItemsType = DropdownMenuItems & {
  hideSubNav?: boolean
  overrideSubNavItems?: DropdownMenuItems['items']
  matchHrefs?: string[]
}
export type ConfigMenuItemsType = Omit<MenuItemsType, 'items'> & {
  hideSubNav?: boolean
  image?: string
  items?: ConfigMenuDropDownItemsType[]
  overrideSubNavItems?: ConfigMenuDropDownItemsType[]
}

export const addMenuItemSupported = (item, chainId: number | undefined) => {
  if (!chainId || !item.supportChainIds) {
    return item
  }
  if (item.supportChainIds?.includes(chainId)) {
    return item
  }
  // if unsupport chain, redirect to bsc
  if (item?.href) {
    return {
      ...item,
      href: `${item.href}?chain=${CHAIN_QUERY_NAME[ChainId.BSC]}`,
    }
  }
  return item
}

const config: (
  t: ContextApi['t'],
  isDark: boolean,
  languageCode?: string,
  chainId?: number,
) => ConfigMenuItemsType[] = (t, isDark, languageCode, chainId) =>
  [
    {
      label: t('Earn.verb'),
      href: '/liquidity/pools',
      icon: EarnIcon,
      fillIcon: EarnFillIcon,
      image: '/images/decorations/pe2.png',
      supportChainIds: SUPPORT_FARMS,
      // Temporarily disable submenu popup for Earn by removing dropdown items
      overrideSubNavItems: [],
      items: [],
    },
  ].map((item) => addMenuItemSupported(item, chainId))

export default config
