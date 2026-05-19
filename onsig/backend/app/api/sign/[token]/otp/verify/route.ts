/**
 * POST /api/sign/[token]/otp/verify  — check the code and mark the session.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, schema } from '@/db'
import { appendAudit } from '@/lib/audit'
import { getClientIp, getUserAgent } from '@/lib/ip'
import { verifyOtp } from '@/lib/otp'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const Body = z.object({
  channel: z.enum(['email', 'sms']),
  target: z.string().trim().min(3).max(200),
  code: z.string().trim().regex(/^\d{6}$/, '6 rakamlı kod girin.'),
})

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const token = (params.token || '').trim()
  if (!token) return NextResponse.json({ ok: false, error: { code: 'invalid_token' } }, { status: 400 })

  let body: z.infer<typeof Body>
  try {
    body = Body.parse(await req.json())
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.errors[0]?.message : (e as Error).message
    return NextResponse.json(
      { ok: false, error: { code: 'invalid_input', message: msg || 'Geçersiz veri.' } },
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
      { ok: false, error: { code: 'already_done' } },
      { status: 409 }
    )
  }

  const result = await verifyOtp('sign', body.target, body.code)

  const ip = getClientIp(req)
  const ua = getUserAgent(req)

  if (!result.ok) {
    await appendAudit({
      tenantId: s.tenantId,
      actorId: null,
      entityKind: 'sign_session',
      entityId: s.id,
      eventType: 'session.otp_failed',
      metadata: { reason: result.reason, channel: body.channel, target: body.target },
      ip,
      userAgent: ua,
    })
    const message =
      result.reason === 'too_many'
        ? 'Çok fazla yanlış deneme. Yeni kod isteyin.'
        : result.reason === 'expired' || result.reason === 'not_found'
          ? 'Kod süresi dolmuş veya bulunamadı. Yeni kod isteyin.'
          : 'Kod hatalı.'
    return NextResponse.json(
      { ok: false, error: { code: result.reason || 'invalid_code', message } },
      { status: 400 }
    )
  }

  await db
    .update(schema.signSessions)
    .set({ otpVerifiedAt: new Date() })
    .where(eq(schema.signSessions.id, s.id))

  await appendAudit({
    tenantId: s.tenantId,
    actorId: null,
    entityKind: 'sign_session',
    entityId: s.id,
    eventType: 'session.otp_verified',
    metadata: { channel: body.channel, target: body.target },
    ip,
    userAgent: ua,
  })

  return NextResponse.json({ ok: true })
}
