import { writeCommissionsForRewardClaim } from 'lib/server/referral/commissionFromRewardPaid'
import { ensureStakingRewardIndexerSchema, withReferralPool } from 'lib/server/staking/rewardPaidStorePg'

/**
 * 为历史上已入库但未写返佣的 staking_reward_paid 行补写 referral_commission_record。
 * 每行单独事务，避免一条失败拖垮整批。
 */
export async function backfillCommissionsFromUnprocessedRewardPaid(
  limit = 500,
): Promise<{ processed: number; commissionRowsInserted: number }> {
  const lim = Math.min(Math.max(1, Math.floor(limit)), 2000)
  return withReferralPool(async (pg) => {
    await ensureStakingRewardIndexerSchema(pg)
    const { rows } = await pg.query<{
      chain_id: string
      tx_hash: string
      log_index: string
      user_address: string
      reward_amount: string
      created_at: string
    }>(
      `SELECT chain_id, tx_hash, log_index, user_address, reward_amount, created_at
       FROM staking_reward_paid
       WHERE commission_recorded IS NOT TRUE
       ORDER BY id ASC
       LIMIT $1`,
      [lim],
    )

    let processed = 0
    let commissionRowsInserted = 0

    for (const row of rows) {
      await pg.query('BEGIN')
      try {
        const { commissionRowsInserted: cr } = await writeCommissionsForRewardClaim(pg, {
          chainId: Number(row.chain_id),
          txHash: row.tx_hash,
          logIndex: Number(row.log_index),
          userAddress: row.user_address,
          rewardAmount: row.reward_amount,
          createdAt: Number(row.created_at),
        })
        commissionRowsInserted += cr
        processed += 1
        await pg.query('COMMIT')
      } catch (e) {
        await pg.query('ROLLBACK')
        throw e
      }
    }

    return { processed, commissionRowsInserted }
  })
}
