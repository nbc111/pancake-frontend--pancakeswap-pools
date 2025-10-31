import { ReactNode } from 'react'

export const CanonicalBridge = ({ children, ...props }: { children?: ReactNode; [key: string]: any }) => {
  return <div>{children}</div>
}

export default CanonicalBridge


