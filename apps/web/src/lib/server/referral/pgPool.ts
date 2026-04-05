import { Pool } from 'pg'

declare global {
  // eslint-disable-next-line no-var -- HMR singleton
  var __referralPgPool: Pool | undefined
}

/**
 * 单例连接池。需设置环境变量 DATABASE_URL（例如本地 docker-compose 中的 PostgreSQL）。
 */
export function getReferralPool(): Pool {
  const url = process.env.DATABASE_URL?.trim()
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  if (!globalThis.__referralPgPool) {
    globalThis.__referralPgPool = new Pool({
      connectionString: url,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    })
  }
  return globalThis.__referralPgPool
}

export function isPostgresReferralEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim())
}
