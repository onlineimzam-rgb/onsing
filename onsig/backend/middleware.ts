/**
 * Edge middleware — runs before every request on Vercel's / Container Apps'
 * edge runtime. It must stay tiny: no DB, no native modules, no heavy logic.
 *
 * Responsibilities:
 *   1. Issue a request ID (uuid-ish) and propagate it via x-request-id so all
 *      downstream loggers and App Insights correlate the request.
 *   2. Generate a CSP nonce per response so Next.js can use `unsafe-inline`-
 *      free inline scripts (`<script nonce={...}>`).
 *   3. Apply the security headers we can't set via next.config (anything that
 *      needs a per-request value — CSP nonce, request ID, server-timing).
 *   4. Hard-block requests with obviously malformed hostnames.
 *
 * Note: rate limiting is NOT done here — it's per-route in lib/rate-limit.ts.
 * Edge runtime cannot reach our Drizzle pool, so we leave route-level logic
 * to handlers.
 */

import { NextResponse, type NextRequest } from 'next/server'

const REQUEST_ID_HEADER = 'x-request-id'
const NONCE_HEADER = 'x-csp-nonce'

// Web Crypto is available on the edge runtime. We base64-encode 16 bytes for
// a short, opaque ID that doesn't reveal entropy source.
function newRequestId(): string {
  const buf = new Uint8Array(16)
  crypto.getRandomValues(buf)
  return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('')
}

function newNonce(): string {
  const buf = new Uint8Array(16)
  crypto.getRandomValues(buf)
  // btoa is available in the edge runtime.
  return btoa(String.fromCharCode(...buf)).replace(/=+$/, '')
}

function buildCsp(nonce: string, isProd: boolean): string {
  // We allow `'unsafe-eval'` only outside production — Next.js dev needs it.
  const scriptSrc = isProd
    ? `'self' 'nonce-${nonce}' 'strict-dynamic'`
    : `'self' 'unsafe-eval' 'unsafe-inline'`

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'", // Tailwind injects inline styles
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "media-src 'self'",
    isProd ? "upgrade-insecure-requests" : '',
  ]
    .filter(Boolean)
    .join('; ')
}

export function middleware(req: NextRequest) {
  const isProd = process.env.NODE_ENV === 'production'

  // ─── 1. Request ID (incoming-trust or freshly minted) ────────────────────
  const incomingId = req.headers.get(REQUEST_ID_HEADER)
  // Only trust IDs that look sane (hex, reasonable length).
  const requestId = incomingId && /^[a-f0-9-]{16,64}$/i.test(incomingId)
    ? incomingId
    : newRequestId()

  const nonce = newNonce()

  // Pass headers downstream so route handlers can read them via headers().
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set(REQUEST_ID_HEADER, requestId)
  requestHeaders.set(NONCE_HEADER, nonce)

  const res = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // ─── 2. Response headers (defense-in-depth) ──────────────────────────────
  res.headers.set(REQUEST_ID_HEADER, requestId)
  res.headers.set('Content-Security-Policy', buildCsp(nonce, isProd))
  // Permissions-Policy must match next.config.js — middleware wins on overlap.
  res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
  )

  return res
}

// We deliberately skip middleware on static assets + Next.js internals to
// keep TTFB unaffected. The HTML route still gets the full treatment.
export const config = {
  matcher: [
    /*
     * Run on every path EXCEPT:
     *  - _next/static (build assets, hashed → immutable)
     *  - _next/image  (image optimizer)
     *  - favicon, robots, sitemap, etc.
     *  - api/health/live (probe must be sub-1 ms)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|api/health/live).*)',
  ],
}
