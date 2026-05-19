/**
 * Rate limiting — sliding-window with Postgres backing.
 *
 * Decisions:
 *   - In-memory limits do not survive across ACA replicas. Even with min=1,
 *     replicas are stateless and may be replaced mid-attack. We therefore
 *     keep counters in Postgres (one row per bucket key per minute).
 *   - We piggyback on the existing Drizzle pool — no Redis to operate.
 *   - The counter rows auto-expire after 10 minutes via a cheap janitor pass
 *     triggered probabilistically (1% of writes) — no cron required.
 *
 * Trade-offs:
 *   - One write per limited request. With 100 req/s budget the cost is
 *     ~0.1 Neon CU. Acceptable for the surface area we protect (login, OTP,
 *     public sign endpoints — never hot paths).
 *   - The window is wall-clock minutes, not a true sliding window, so an
 *     attacker can burst 2× the quota right around the boundary. Fine for
 *     MVP; revisit when traffic warrants a leaky-bucket implementation.
 *
 * Usage:
 *   const r = await rateLimit({ key: `login:${ip}`, limit: 10, windowSec: 60 })
 *   if (!r.ok) return new Response('Too many requests', {
 *     status: 429,
 *     headers: { 'Retry-After': String(r.retryAfterSec) },
 *   })
 */

import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { logger } from './logger'

const TABLE_CREATED = { v: false }

/**
 * Idempotent — runs once per process. The table is intentionally NOT in
 * Drizzle's schema file because it's plumbing, not data. Letting the runtime
 * create it on first hit keeps the migration story for app data clean.
 */
async function ensureTable() {
  if (TABLE_CREATED.v) return
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS rate_limit_buckets (
        bucket_key  TEXT        NOT NULL,
        window_at   TIMESTAMPTZ NOT NULL,
        count       INTEGER     NOT NULL DEFAULT 1,
        PRIMARY KEY (bucket_key, window_at)
      )
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_rate_limit_window
        ON rate_limit_buckets (window_at)
    `)
    TABLE_CREATED.v = true
  } catch (err) {
    logger.warn('rate_limit table init failed (will retry next request)', {
      err: (err as Error).message,
    })
  }
}

export interface RateLimitInput {
  /** Stable identifier — usually `<scope>:<ip>` or `<scope>:<email>`. */
  key: string
  /** Allowed events per window. */
  limit: number
  /** Window length in seconds (default 60). */
  windowSec?: number
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfterSec: number
  limit: number
  windowSec: number
}

export async function rateLimit(input: RateLimitInput): Promise<RateLimitResult> {
  const limit = Math.max(1, input.limit)
  const windowSec = Math.max(1, input.windowSec ?? 60)

  await ensureTable()

  // Quantize "now" to the start of the window. All requests inside the same
  // window land on the same row.
  const now = new Date()
  const windowStart = new Date(
    Math.floor(now.getTime() / (windowSec * 1000)) * windowSec * 1000
  )

  try {
    // Atomic insert-or-increment. ON CONFLICT returns the existing row's count
    // + 1, so the read-modify-write is a single round-trip.
    const result = await db.execute(sql`
      INSERT INTO rate_limit_buckets (bucket_key, window_at, count)
      VALUES (${input.key}, ${windowStart.toISOString()}, 1)
      ON CONFLICT (bucket_key, window_at)
      DO UPDATE SET count = rate_limit_buckets.count + 1
      RETURNING count
    `)

    const row = (result as unknown as { rows: { count: number }[] }).rows?.[0]
    const count = row?.count ?? 1
    const remaining = Math.max(0, limit - count)
    const ok = count <= limit

    // Sweep old rows ~1% of the time. Cheap and self-healing.
    if (Math.random() < 0.01) {
      void db
        .execute(sql`
          DELETE FROM rate_limit_buckets
          WHERE window_at < now() - interval '10 minutes'
        `)
        .catch(() => {})
    }

    return {
      ok,
      remaining,
      retryAfterSec: ok
        ? 0
        : Math.max(
            1,
            Math.ceil((windowStart.getTime() + windowSec * 1000 - Date.now()) / 1000)
          ),
      limit,
      windowSec,
    }
  } catch (err) {
    // If the DB is down we MUST NOT block traffic — fail open. The downstream
    // route will still error out on its own DB usage, and we want the user to
    // see that error, not a fake 429.
    logger.warn('rate_limit eval failed; failing open', {
      key: input.key,
      err: (err as Error).message,
    })
    return { ok: true, remaining: limit, retryAfterSec: 0, limit, windowSec }
  }
}

/**
 * Convenience helper for API route handlers. Returns a JSON 429 Response
 * when blocked, otherwise null.
 */
export async function rateLimitOrBlock(input: RateLimitInput) {
  const r = await rateLimit(input)
  if (r.ok) return null

  const body = JSON.stringify({
    ok: false,
    error: {
      code: 'rate_limited',
      message: `\u00c7ok say\u0131da istek. ${r.retryAfterSec} saniye sonra tekrar deneyin.`,
      retryAfterSec: r.retryAfterSec,
    },
  })

  return new Response(body, {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(r.retryAfterSec),
      'X-RateLimit-Limit': String(r.limit),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000) + r.retryAfterSec),
    },
  })
}

/**
 * Extracts the client IP from common reverse-proxy headers, with safe
 * fallbacks. Container Apps puts the real IP in `x-forwarded-for`.
 */
export function clientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]?.trim() || 'unknown'
  return (
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    headers.get('fly-client-ip') ||
    'unknown'
  )
}
