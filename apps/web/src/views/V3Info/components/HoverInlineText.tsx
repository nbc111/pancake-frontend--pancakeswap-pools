import { Text, TextProps } from '@pancakeswap/uikit'
import { useState } from 'react'

interface HoverInlineTextProps extends TextProps {
  text: string
  maxCharacters?: number
}

export default function HoverInlineText({ text, maxCharacters = 20, ...props }: HoverInlineTextProps) {
  const [hovered, setHovered] = useState(false)

  if (text.length <= maxCharacters) {
    return <Text {...props}>{text}</Text>
  }

  return (
    <Text {...props} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} title={text}>
      {hovered ? text : `${text.slice(0, maxCharacters)}...`}
    </Text>
  )
}
