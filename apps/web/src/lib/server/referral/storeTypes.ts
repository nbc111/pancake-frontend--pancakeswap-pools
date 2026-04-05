export type ServerReferralRow = {
  referrer: `0x${string}`
  boundAt: number
  /** 最近一次同步时携带的签名（可选，便于审计） */
  signature?: string
}

export type ServerReferralFile = Record<string, ServerReferralRow>
