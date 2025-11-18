import { Text, TextProps } from '@pancakeswap/uikit'

const Percent: React.FC<TextProps & { value?: number }> = ({ value, ...props }) => {
  return <Text {...props}>{typeof value === 'number' ? `${value.toFixed(2)}%` : props.children ?? '--'}</Text>
}

export default Percent
