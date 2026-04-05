import type { PoolClient } from 'pg'
import { getReferralPool } from 'lib/server/referral/pgPool'

let schemaEnsured = false

const SYNC_KEY_REWARD_PAID = 'reward_paid'

export async function ensureStakingRewardIndexerSchema(client: PoolClient): Promise<void> {
  if (schemaEnsured) return
  await client.query(`
    CREATE TABLE IF NOT EXISTS staking_reward_paid (
      id BIGSERIAL PRIMARY KEY,
      chain_id INT NOT NULL,
      tx_hash TEXT NOT NULL,
      log_index INT NOT NULL,
      block_number BIGINT NOT NULL,
      block_timestamp BIGINT,
      pool_index BIGINT NOT NULL,
      user_address TEXT NOT NULL,
      reward_amount TEXT NOT NULL,
      created_at BIGINT NOT NULL,
      commission_recorded BOOLEAN NOT NULL DEFAULT FALSE,
      UNIQUE (chain_id, tx_hash, log_index)
    );
  `)
  await client.query(`
    ALTER TABLE staking_reward_paid
    ADD COLUMN IF NOT EXISTS commission_recorded BOOLEAN NOT NULL DEFAULT FALSE;
  `)
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_staking_reward_paid_user ON staking_reward_paid (user_address);
  `)
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_staking_reward_paid_block ON staking_reward_paid (chain_id, block_number);
  `)
  await client.query(`
    CREATE TABLE IF NOT EXISTS staking_indexer_state (
      chain_id INT NOT NULL,
      sync_key TEXT NOT NULL,
      last_scanned_to_block BIGINT NOT NULL,
      updated_at BIGINT NOT NULL,
      PRIMARY KEY (chain_id, sync_key)
    );
  `)
  schemaEnsured = true
}

export async function getLastScannedToBlockPg(client: PoolClient, chainId: number): Promise<bigint | null> {
  await ensureStakingRewardIndexerSchema(client)
  const { rows } = await client.query<{ last_scanned_to_block: string }>(
    'SELECT last_scanned_to_block FROM staking_indexer_state WHERE chain_id = $1 AND sync_key = $2',
    [chainId, SYNC_KEY_REWARD_PAID],
  )
  const v = rows[0]?.last_scanned_to_block
  return v !== undefined && v !== null ? BigInt(v) : null
}

export async function setLastScannedToBlockPg(
  client: PoolClient,
  chainId: number,
  lastScannedToBlock: bigint,
): Promise<void> {
  await ensureStakingRewardIndexerSchema(client)
  const now = Date.now()
  await client.query(
    `INSERT INTO staking_indexer_state (chain_id, sync_key, last_scanned_to_block, updated_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (chain_id, sync_key)
     DO UPDATE SET last_scanned_to_block = EXCLUDED.last_scanned_to_block, updated_at = EXCLUDED.updated_at`,
    [chainId, SYNC_KEY_REWARD_PAID, lastScannedToBlock.toString(), now],
  )
}

export type RewardPaidRowInput = {
  chainId: number
  txHash: string
  logIndex: number
  blockNumber: bigint
  blockTimestamp: bigint | null
  poolIndex: bigint
  userAddress: string
  rewardAmount: string
  /** 与返佣记录 createdAt 对齐；默认 Date.now() */
  createdAtMs?: number
}

/** 单条插入，冲突则忽略。返回是否新插入。 */
export async function insertRewardPaidRowPg(client: PoolClient, row: RewardPaidRowInput): Promise<boolean> {
  await ensureStakingRewardIndexerSchema(client)
  const now = row.createdAtMs ?? Date.now()
  const r = await client.query(
    `INSERT INTO staking_reward_paid (
      chain_id, tx_hash, log_index, block_number, block_timestamp,
      pool_index, user_address, reward_amount, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (chain_id, tx_hash, log_index) DO NOTHING
    RETURNING id`,
    [
      row.chainId,
      row.txHash.toLowerCase(),
      row.logIndex,
      row.blockNumber.toString(),
      row.blockTimestamp !== null ? row.blockTimestamp.toString() : null,
      row.poolIndex.toString(),
      row.userAddress.toLowerCase(),
      row.rewardAmount,
      now,
    ],
  )
  return (r.rowCount ?? 0) > 0
}

export async function countRewardPaidRowsPg(client: PoolClient, chainId: number): Promise<number> {
  await ensureStakingRewardIndexerSchema(client)
  const { rows } = await client.query<{ c: string }>(
    'SELECT COUNT(*)::text AS c FROM staking_reward_paid WHERE chain_id = $1',
    [chainId],
  )
  return Number(rows[0]?.c ?? 0)
}

export function withReferralPool<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const pool = getReferralPool()
  return pool.connect().then(async (client) => {
    try {
      return await fn(client)
    } finally {
      client.release()
    }
  })
}
