export const userRejectedError = (error: unknown): boolean => {
  if (!error) {
    return false
  }
  if (error instanceof Error) {
    return ['UserRejectedRequestError', 'TransactionRejectedError'].includes(error.name)
  }
  if (typeof error === 'object' && 'code' in (error as Record<string, unknown>)) {
    const { code } = error as { code?: number }
    return code === 4001
  }
  return false
}
