export interface InterfaceOrder {
  type: string
  inputAmount: string
  outputAmount: string
  [key: string]: any
}

export function isBridgeOrder(order: InterfaceOrder): boolean {
  return order.type === 'bridge'
}

export function isSVMOrder(order: InterfaceOrder): boolean {
  return order.type === 'svm'
}
