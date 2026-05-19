/**
 * Boot-time environment validation.
 *
 * Every server-side env var the app depends on flows through this single Zod
 * schema. Importing `env` anywhere outside this file gives you a fully-typed,
 * fully-validated object — no `process.env.X ?? ''` defensive fallbacks
 * scattered across the codebase.
 *
 * If validation fails at boot:
 *   - in development we print friendly errors and continue (so half-configured
 *     local setups don't block contract-writing iterations);
 *   - in production we throw, which crashes the process. Azure Container Apps
 *     will retry the revision a few times and then mark it failed so the
 *     previous revision keeps serving traffic — fail-fast, fail-safe.
 *
 * Add new vars HERE first, then read them via `env.X`.
 */

import { z } from 'zod'

const Schema = z.object({
  // ─── Runtime ─────────────────────────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),

  // ─── Public URLs ─────────────────────────────────────────────────────────
  // Canonical origin (used for absolute links, OAuth, e-signature share URLs).
  // We default to localhost in dev so devs don't need to set it explicitly.
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .default('http://localhost:3001'),
  NEXT_PUBLIC_MARKETING_URL: z.string().url().optional(),
  // When 'true', the root layout switches robots meta to allow indexing.
  // Pinned to a string union so we never index by accident.
  NEXT_PUBLIC_SEO_INDEXABLE: z.enum(['true', 'false']).default('false'),

  // ─── Database (Neon Postgres) ────────────────────────────────────────────
  POSTGRES_URL: z
    .string()
    .min(1, 'POSTGRES_URL is required')
    .refine((s) => s.startsWith('postgres://') || s.startsWith('postgresql://'), {
      message: 'POSTGRES_URL must be a postgres connection string',
    }),
  // Direct (non-pooling) URL — only needed by migration runs.
  POSTGRES_URL_NON_POOLING: z.string().optional(),

  // ─── JWT / auth ──────────────────────────────────────────────────────────
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 chars (use `openssl rand -base64 48`)'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('30d'),

  // ─── Email ───────────────────────────────────────────────────────────────
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().default('OnSig <noreply@onsig.dev>'),

  // ─── SMS (optional, OTP only) ────────────────────────────────────────────
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM: z.string().optional(),

  // ─── Storage (Azure Blob — signed PDFs + audit zip) ──────────────────────
  AZURE_STORAGE_CONNECTION_STRING: z.string().optional(),
  AZURE_STORAGE_CONTAINER: z.string().default('onsig-documents'),

  // ─── Observability ───────────────────────────────────────────────────────
  APPLICATIONINSIGHTS_CONNECTION_STRING: z.string().optional(),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),

  // ─── Feature flags ───────────────────────────────────────────────────────
  FEATURE_TSA_TIMESTAMPING: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  FEATURE_PUBLIC_REGISTRATION: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),

  // ─── Rate-limit overrides (env-tunable so we can react in prod) ──────────
  RATE_LIMIT_LOGIN_PER_MIN: z.coerce.number().int().min(1).default(10),
  RATE_LIMIT_OTP_PER_MIN: z.coerce.number().int().min(1).default(5),
  RATE_LIMIT_PUBLIC_SIGN_PER_MIN: z.coerce.number().int().min(1).default(30),
})

export type Env = z.infer<typeof Schema>

function parse(): Env {
  const parsed = Schema.safeParse(process.env)
  if (parsed.success) return parsed.data

  const issues = parsed.error.issues
    .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
    .join('\n')

  const banner =
    '\n──────────────── OnSig: environment validation failed ────────────────\n'

  if (process.env.NODE_ENV === 'production') {
    console.error(banner + issues + '\n────────────────────────────────────────────────────────────────────────')
    // Re-throw with a short summary; the container will fail health probes and
    // Azure will roll back to the previous revision.
    throw new Error(
      `Environment validation failed: ${issues.replace(/\n/g, ' | ')}`
    )
  }

  console.warn(
    banner +
      issues +
      '\n(continuing in dev with partial defaults — set vars in .env.local)\n'
  )
  // Return a best-effort partial — dev convenience only.
  return Schema.parse({
    ...process.env,
    POSTGRES_URL: process.env.POSTGRES_URL ?? 'postgresql://localhost/onsig-dev',
    JWT_SECRET:
      process.env.JWT_SECRET ?? 'dev-only-secret-please-change-in-production-12345',
  })
}

// Memoize so we never re-parse on each import. Drizzle / Next.js HMR can
// import this module dozens of times per request in dev.
let _env: Env | null = null
export function getEnv(): Env {
  if (!_env) _env = parse()
  return _env
}

/** Convenience for the common case. Throws once at first import if invalid. */
export const env: Env = getEnv()

/** True when running under `next start` (production server). */
export const isProd = env.NODE_ENV === 'production'

/** True when an App Insights connection string is configured. */
export const telemetryEnabled = Boolean(env.APPLICATIONINSIGHTS_CONNECTION_STRING)
