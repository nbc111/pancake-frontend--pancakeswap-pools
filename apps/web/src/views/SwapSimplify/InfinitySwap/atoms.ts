import { atom } from 'jotai'

// 占位符 atoms - 用于广告面板位置控制
// 这些 atoms 用于控制广告面板在桌面上的显示位置
// 当图表显示和交换详情打开时，广告面板会移动到左侧
export const swapDetailsCollapseAtom = atom<boolean>(false)
export const chartDisplayAtom = atom<boolean>(false)
