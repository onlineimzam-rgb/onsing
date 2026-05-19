/**
 * Extract client IP from various reverse-proxy headers.
 *
 * Order: cf-connecting-ip > x-real-ip > x-forwarded-for (first hop).
 * Returns null when nothing is available.
 */

import type { NextRequest } from 'next/server'

export function getClientIp(req: NextRequest): string | null {
  const h = req.headers
  const cf = h.get('cf-connecting-ip')
  if (cf) return cf.trim()
  const real = h.get('x-real-ip')
  if (real) return real.trim()
  const fwd = h.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]?.trim() || null
  return null
}

export function getUserAgent(req: NextRequest): string | null {
  return req.headers.get('user-agent') || null
}
