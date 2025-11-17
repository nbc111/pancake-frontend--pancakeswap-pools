/**
 * Tick data types - Replaces deleted views/V3Info/data/pool/tickData
 */

export interface TickProcessed {
  liquidityActive: bigint
  tick: number
  liquidityNet: bigint
  price0: string
  tickIdx: number
  liquidityGross?: bigint
  price1?: string
}

export interface PoolTickData {
  ticksProcessed: TickProcessed[]
  activeTickIdx: number
}
