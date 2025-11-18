import { atom } from 'jotai'

export const swapDetailsCollapseAtom = atom(false)
export const chartDisplayAtom = atom<'hidden' | 'visible'>('hidden')
