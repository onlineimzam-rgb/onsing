/**
 * Route-handler wrapper — every API route should run through this.
 *
 * Why:
 *   - Single source of truth for the error envelope shape (clients depend on
 *     `{ ok: boolean, error?: { code, message } }`).
 *   - Centralized request-scoped logger with correlation id from middleware.
 *   - Catches Zod errors and 400s them with a useful payload.
 *   - Catches every other throw and 500s without leaking stack traces.
 *   - Records the request to App Insights via the logger.
 *
 * Usage:
 *
 *   export const POST = apiHandler(async (req, ctx) => {
 *     const body = ctx.parseJson(LoginSchema)   // throws → 400
 *     ...
 *     return ctx.ok({ user })
 *   })
 *
 *   // Or with explicit error:
 *   return ctx.fail('invalid_credentials', 'E-posta veya parola hatalı.', 401)
 */

import { NextResponse, type NextRequest } from 'next/server'
import { ZodError, type ZodSchema } from 'zod'
import { logger as rootLogger } from './logger'

export interface ApiContext {
  /** Per-request logger with `requestId` already attached. */
  logger: ReturnType<typeof rootLogger.child>
  /** Echo of the request ID (matches middleware-generated one). */
  requestId: string
  /** JSON body parse with Zod validation. Throws a typed 400 on failure. */
  parseJson: <T>(schema: ZodSchema<T>) => Promise<T>
  /** Success response builder. */
  ok: <T>(data: T, init?: ResponseInit) => NextResponse
  /** Failure response builder — shape matches the rest of the app. */
  fail: (code: string, message: string, status?: number, extra?: Record<string, unknown>) => NextResponse
}

export type ApiHandler = (
  req: NextRequest,
  ctx: ApiContext & { params?: Record<string, string> }
) => Promise<NextResponse | Response> | NextResponse | Response

const REQUEST_ID_HEADER = 'x-request-id'

class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    public publicMessage: string,
    public extra?: Record<string, unknown>
  ) {
    super(publicMessage)
  }
}

function makeContext(req: NextRequest): ApiContext {
  const requestId = req.headers.get(REQUEST_ID_HEADER) ?? '-'
  const log = rootLogger.child({ requestId, route: req.nextUrl.pathname, method: req.method })

  return {
    logger: log,
    requestId,
    async parseJson<T>(schema: ZodSchema<T>): Promise<T> {
      let raw: unknown
      try {
        raw = await req.json()
      } catch {
        throw new HttpError(400, 'invalid_json', 'Gönderilen veri JSON formatında değil.')
      }
      const parsed = schema.safeParse(raw)
      if (!parsed.success) {
        throw new HttpError(400, 'validation', 'Gönderilen veri geçerli değil.', {
          issues: parsed.error.flatten(),
        })
      }
      return parsed.data
    },
    ok<T>(data: T, init: ResponseInit = {}) {
      const res = NextResponse.json({ ok: true, ...data }, init)
      res.headers.set(REQUEST_ID_HEADER, requestId)
      return res
    },
    fail(code, message, status = 400, extra) {
      const res = NextResponse.json(
        { ok: false, error: { code, message, ...(extra ?? {}) } },
        { status }
      )
      res.headers.set(REQUEST_ID_HEADER, requestId)
      return res
    },
  }
}

export function apiHandler(handler: ApiHandler) {
  return async function wrapped(
    req: NextRequest,
    routeCtx?: { params: Record<string, string> }
  ): Promise<NextResponse | Response> {
    const start = Date.now()
    const ctx = makeContext(req)

    try {
      const res = await handler(req, { ...ctx, params: routeCtx?.params })
      // Always echo the request ID for client-side debugging.
      if ('headers' in res && !res.headers.get(REQUEST_ID_HEADER)) {
        res.headers.set(REQUEST_ID_HEADER, ctx.requestId)
      }
      const ms = Date.now() - start
      ctx.logger.info('request', { status: (res as Response).status, ms })
      return res as NextResponse
    } catch (err) {
      const ms = Date.now() - start
      if (err instanceof HttpError) {
        ctx.logger.warn('request_error', { code: err.code, status: err.status, ms })
        return ctx.fail(err.code, err.publicMessage, err.status, err.extra)
      }
      if (err instanceof ZodError) {
        ctx.logger.warn('zod_error', { ms, issues: err.flatten() })
        return ctx.fail('validation', 'Gönderilen veri geçerli değil.', 400, {
          issues: err.flatten(),
        })
      }
      // Anything else — log full stack, return generic 500.
      ctx.logger.error('request_unhandled', {
        ms,
        err: err instanceof Error ? err : new Error(String(err)),
        errMessage: err instanceof Error ? err.message : String(err),
      })
      return ctx.fail(
        'internal_error',
        'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
        500
      )
    }
  }
}

/** Thrown helpers for handler code that wants to short-circuit. */
export function httpError(
  status: number,
  code: string,
  message: string,
  extra?: Record<string, unknown>
): never {
  throw new HttpError(status, code, message, extra)
}
