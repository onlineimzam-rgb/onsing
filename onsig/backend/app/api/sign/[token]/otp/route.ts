/**
 * POST /api/sign/[token]/otp           — issue OTP (channel auto-picked)
 * POST /api/sign/[token]/otp/verify    — verify OTP, marks session OTP-passed
 *
 * The signing flow is gated behind successful OTP verification:
 *   GET  /api/sign/[token]            → see contract metadata + body
 *   POST /api/sign/[token]/otp        → trigger code delivery
 *   POST /api/sign/[token]/otp/verify → confirm code
 *   POST /api/sign/[token]            → submit signature + consent
 */

import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, schema } from '@/db'
import { appendAudit } from '@/lib/audit'
import { getClientIp, getUserAgent } from '@/lib/ip'
import { issueOtp } from '@/lib/otp'
import { deliverOtp, isDevMode } from '@/lib/notify'
import { rateLimitOrBlock } from '@/lib/rate-limit'
import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const Body = z
  .object({
    channel: z.enum(['email', 'sms']).optional(),
    target: z.string().trim().min(3).max(200).optional(),
  })
  .optional()

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const token = (params.token || '').trim()
  if (!token || token.length > 96) {
    return NextResponse.json({ ok: false, error: { code: 'invalid_token' } }, { status: 400 })
  }

  // Throttle OTP issuance hard — IP can ask for a code at most N times per
  // minute regardless of which session it targets. Phone/SMS abuse is the main
  // worry: spending real money for someone else's "verification" SMS.
  const ip = getClientIp(req)
  const ipBlock = await rateLimitOrBlock({
    key: `otp:ip:${ip}`,
    limit: env.RATE_LIMIT_OTP_PER_MIN,
    windowSec: 60,
  })
  if (ipBlock) return ipBlock

  const tokenBlock = await rateLimitOrBlock({
    key: `otp:token:${token}`,
    limit: env.RATE_LIMIT_OTP_PER_MIN,
    windowSec: 60,
  })
  if (tokenBlock) return tokenBlock

  let body: z.infer<typeof Body>
  try {
    body = Body.parse((await req.json().catch(() => ({}))) || {})
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: { code: 'invalid_input', message: (e as Error).message } },
      { status: 400 }
    )
  }

  const [s] = await db
    .select()
    .from(schema.signSessions)
    .where(eq(schema.signSessions.token, token))
    .limit(1)

  if (!s) return NextResponse.json({ ok: false, error: { code: 'not_found' } }, { status: 404 })
  if (s.status !== 'bekliyor') {
    return NextResponse.json(
      { ok: false, error: { code: 'already_done', message: 'Bu bağlantı kullanılmış.' } },
      { status: 409 }
    )
  }

  const preferEmail = (body?.target && body.target.includes('@')) || (body?.channel === 'email')
  const channel: 'email' | 'sms' =
    body?.channel ?? (preferEmail || s.recipientEmail ? 'email' : 'sms')
  const target =
    body?.target ?? (channel === 'email' ? s.recipientEmail : s.recipientPhone) ?? null

  if (!target) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'no_target',
          message: 'OTP gönderilecek e-posta veya telefon bilgisi yok.',
        },
      },
      { status: 400 }
    )
  }

  const { code } = await issueOtp({ purpose: 'sign', channel, target })
  const result = await deliverOtp({
    channel,
    target,
    code,
    contextLabel: `Sözleşme #${s.contractId}`,
  })

  await appendAudit({
    tenantId: s.tenantId,
    actorId: null,
    entityKind: 'sign_session',
    entityId: s.id,
    eventType: 'session.otp_issued',
    metadata: { channel, provider: result.provider, externalId: result.externalId },
    ip: getClientIp(req),
    userAgent: getUserAgent(req),
  })

  return NextResponse.json({
    ok: true,
    channel,
    target,
    delivered: result.delivered,
    provider: result.provider,
    // Only exposed in dev so we can test the flow without configuring providers.
    devCode: isDevMode() ? code : undefined,
  })
}
