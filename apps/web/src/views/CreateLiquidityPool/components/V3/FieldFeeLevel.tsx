import { usePreviousValue } from '@pancakeswap/hooks'
import styled from 'styled-components'
import { useTranslation } from '@pancakeswap/localization'
import {
  Box,
  BoxProps,
  ButtonMenu,
  ButtonMenuItem,
  FlexGap,
  Input,
  PreTitle,
  QuestionHelper,
  useMatchBreakpoints,
} from '@pancakeswap/uikit'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFeeLevelQueryState } from 'state/infinity/create'

import { PRESET_FEE_LEVELS_V3 } from '../../constants'

export type FieldFeeLevelProps = BoxProps

const decimals = 4

export const FieldFeeLevel: React.FC<FieldFeeLevelProps> = ({ ...boxProps }) => {
  const { t } = useTranslation()
  const { isMobile } = useMatchBreakpoints()
  const [feeLevel, setFeeLevel] = useFeeLevelQueryState()
  const [inputValue, setInputValue] = useState<string | null>(null)

  const handleQuickSelect = useCallback(
    (presetFeeLevel: number) => {
      setFeeLevel(presetFeeLevel)
      setInputValue(presetFeeLevel.toString())
    },
    [setFeeLevel],
  )

  const handleMenuItemClick = useCallback(
    (index: number) => {
      if (index < PRESET_FEE_LEVELS_V3.length) {
        handleQuickSelect(PRESET_FEE_LEVELS_V3[index])
      }
      // For custom fee input, we don't need to do anything here
      // as the input will be handled separately
    },
    [handleQuickSelect],
  )

  const activeIndex = useMemo(() => {
    const presetIndex = PRESET_FEE_LEVELS_V3.findIndex((preset) => preset === feeLevel)
    if (presetIndex !== -1) {
      return presetIndex
    }
    return -1
  }, [feeLevel])

  const prevFeeLevel = usePreviousValue(feeLevel)

  useEffect(() => {
    if (inputValue === null && feeLevel !== null) {
      setInputValue(parseFloat(feeLevel.toFixed(decimals)).toString())
    }
  }, [feeLevel, inputValue])

  useEffect(() => {
    if (prevFeeLevel !== null && feeLevel === null) {
      setInputValue(null)
    }
  }, [feeLevel, prevFeeLevel])

  return (
    <Box {...boxProps}>
      <FlexGap gap="4px">
        <PreTitle mb="8px">{t('Fee Level')}</PreTitle>
        <QuestionHelper
          placement="auto"
          mb="8px"
          color="secondary"
          text={t('Common range: 0.01% to 0.3%, Ideal range <1%')}
        />
      </FlexGap>

      <ButtonMenu
        activeIndex={activeIndex}
        onItemClick={handleMenuItemClick}
        variant="subtle"
        fullWidth={!isMobile}
        scale={isMobile ? 'sm' : 'md'}
      >
        <ButtonMenuItem padding={isMobile ? '0 8px' : '0 16px'}>{PRESET_FEE_LEVELS_V3[0]}%</ButtonMenuItem>
        <ButtonMenuItem padding={isMobile ? '0 8px' : '0 16px'}>{PRESET_FEE_LEVELS_V3[1]}%</ButtonMenuItem>
        <ButtonMenuItem padding={isMobile ? '0 8px' : '0 16px'}>{PRESET_FEE_LEVELS_V3[2]}%</ButtonMenuItem>
        <ButtonMenuItem padding={isMobile ? '0 8px' : '0 16px'}>{PRESET_FEE_LEVELS_V3[3]}%</ButtonMenuItem>
      </ButtonMenu>
    </Box>
  )
}
