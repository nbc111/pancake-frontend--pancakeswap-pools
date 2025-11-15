export interface GelatoLimitOrder {
  id: string
  [key: string]: any
}

export function useGelatoLimitOrdersHistory(): {
  orders: GelatoLimitOrder[]
  isLoading: boolean
} {
  return {
    orders: [],
    isLoading: false,
  }
}
