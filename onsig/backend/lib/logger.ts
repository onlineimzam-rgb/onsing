/**
 * Structured logger — JSON in production, human-readable in development.
 *
 * Design rules:
 *   - Always machine-parseable: every log line is a single JSON object on a
 *     single line. App Insights, Log Analytics and any pipe-tail tool will
 *     parse this without configuration.
 *   - No external runtime deps (pino, winston): we want zero overhead and
 *     zero npm-audit noise. The logger is ~80 lines.
 *   - Correlation-aware: callers pass a `requestId` / `tenantId` once via
 *     `logger.child({...})`, and every subsequent line inherits the fields.
 *   - Telemetry-aware: when App Insights is configured, `error` and `warn`
 *     also dispatch a trace event so SREs see them in the Failures blade
 *     without grepping log lines.
 *
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   logger.info('signup completed', { userId: 42 })
 *   const reqLog = logger.child({ requestId: 'a3f...' })
 *   reqLog.error('db failure', { err })
 */

import { env, isProd, telemetryEnabled } from './env'

type Level = 'trace' | 'debug' | 'info' | 'warn' | 'error'

const LEVEL_RANK: Record<Level, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
}

const ACTIVE_RANK = LEVEL_RANK[env.LOG_LEVEL]

// ─── App Insights forwarder (lazy) ───────────────────────────────────────────
// We deliberately do not import `applicationinsights` here — it's wired in
// `instrumentation.ts` and surfaces a global TelemetryClient on the
// `globalThis.__onsigTelemetry` slot. This keeps `lib/logger` runtime-agnostic
// (works in edge, in tests, and during build).
declare global {
  // eslint-disable-next-line no-var
  var __onsigTelemetry:
    | {
        trackTrace: (a: { message: string; severity?: number; properties?: Record<string, unknown> }) => void
        trackException: (a: { exception: Error; properties?: Record<string, unknown> }) => void
      }
    | undefined
}

// Severity codes match the Application Insights SeverityLevel enum.
const AI_SEVERITY: Record<Level, number> = {
  trace: 0,
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

function emit(level: Level, message: string, ctx?: Record<string, unknown>) {
  if (LEVEL_RANK[level] < ACTIVE_RANK) return

  const record = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...(ctx ?? {}),
  }

  if (isProd) {
    // One JSON object per line — Log Analytics' JSON parser is the consumer.
    process.stdout.write(JSON.stringify(record) + '\n')
  } else {
    // Pretty console in dev.
    const tag =
      level === 'error' ? '\x1b[31mERROR\x1b[0m'
      : level === 'warn' ? '\x1b[33mWARN \x1b[0m'
      : level === 'info' ? '\x1b[36mINFO \x1b[0m'
      : level === 'debug' ? '\x1b[35mDEBUG\x1b[0m'
      : '\x1b[90mTRACE\x1b[0m'
    const extra = ctx && Object.keys(ctx).length ? ' ' + JSON.stringify(ctx) : ''
    process.stdout.write(`${tag} ${message}${extra}\n`)
  }

  // Forward to App Insights when present.
  if (telemetryEnabled && globalThis.__onsigTelemetry) {
    try {
      if (level === 'error' && ctx && ctx.err instanceof Error) {
        globalThis.__onsigTelemetry.trackException({
          exception: ctx.err,
          properties: { message, ...(ctx as Record<string, unknown>) },
        })
      } else if (level === 'error' || level === 'warn') {
        globalThis.__onsigTelemetry.trackTrace({
          message,
          severity: AI_SEVERITY[level],
          properties: ctx as Record<string, unknown>,
        })
      }
    } catch {
      // Never let telemetry crash the request.
    }
  }
}

interface Logger {
  trace: (msg: string, ctx?: Record<string, unknown>) => void
  debug: (msg: string, ctx?: Record<string, unknown>) => void
  info: (msg: string, ctx?: Record<string, unknown>) => void
  warn: (msg: string, ctx?: Record<string, unknown>) => void
  error: (msg: string, ctx?: Record<string, unknown>) => void
  child: (ctx: Record<string, unknown>) => Logger
}

function build(base: Record<string, unknown>): Logger {
  const merge = (extra?: Record<string, unknown>) =>
    extra ? { ...base, ...extra } : base
  return {
    trace: (m, c) => emit('trace', m, merge(c)),
    debug: (m, c) => emit('debug', m, merge(c)),
    info: (m, c) => emit('info', m, merge(c)),
    warn: (m, c) => emit('warn', m, merge(c)),
    error: (m, c) => emit('error', m, merge(c)),
    child: (ctx) => build({ ...base, ...ctx }),
  }
}

export const logger: Logger = build({ service: 'onsig-backend' })
