import React, { useState } from 'react'
import { Text, TextProps } from '@pancakeswap/uikit'

/**
 * HoverInlineText - Simple hover text component
 * Replaces deleted views/V3Info/components/HoverInlineText
 */
interface HoverInlineTextProps extends TextProps {
  text: string
  maxCharacters?: number
}

const HoverInlineText: React.FC<HoverInlineTextProps> = ({ text, maxCharacters = 20, ...props }) => {
  const [isHovered, setIsHovered] = useState(false)

  const displayText = text.length > maxCharacters && !isHovered ? `${text.slice(0, maxCharacters)}...` : text

  return (
    <Text
      {...props}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={text.length > maxCharacters ? text : undefined}
    >
      {displayText}
    </Text>
  )
}

export default HoverInlineText
