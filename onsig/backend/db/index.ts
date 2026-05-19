/**
 * Postgres client — single shared connection pool for serverless + edge runtimes.
 * Uses `postgres` (porsager) which is lightweight, supports prepared statements,
 * and pairs nicely with Drizzle's postgres-js adapter.
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const url = process.env.POSTGRES_URL

if (!url) {
  // We log instead of throwing here so `next build` works without DB.
  console.warn('[onsig] POSTGRES_URL is not set — DB calls will fail at runtime.')
}

// In dev with HMR Next.js evaluates modules many times; cache on globalThis.
declare global {
  // eslint-disable-next-line no-var
  var __ONSIG_PG__: ReturnType<typeof postgres> | undefined
}

const client =
  globalThis.__ONSIG_PG__ ??
  postgres(url || 'postgres://invalid', {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false, // Neon/pooler friendly
  })

if (process.env.NODE_ENV !== 'production') globalThis.__ONSIG_PG__ = client

export const db = drizzle(client, { schema, logger: false })
export { schema }
