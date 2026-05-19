/**
 * POST /api/auth/change-password
 *
 * Body: { currentPassword, newPassword }
 *
 * Authenticated route — re-verifies the current password before applying the
 * change, even though we already have a valid session. This is the standard
 * "step-up" guard used by Stripe/Linear: protects against device theft where
 * a session token survives but the user no longer trusts the device.
 *
 * Side effects:
 *   • Rotates `passwordHash` to the new argon2id digest.
 *   • Writes an `auth.password_changed` audit entry (no plaintext).
 *
 * Future hardening (Phase 5+): invalidate all other refresh tokens, send the
 * user an email/SMS heads-up.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'

import { db, schema } from '@/db'
import { hashPassword, verifyPassword } from '@/lib/auth'
import { requireUser } from '@/lib/session'
import { appendAudit } from '@/lib/audit'
import { getClientIp, getUserAgent } from '@/lib/ip'
import { rateLimitOrBlock } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const Body = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z
    .string()
    .min(8, 'En az 8 karakter olmalı.')
    .max(200, 'En fazla 200 karakter olabilir.'),
})

export async function POST(req: NextRequest) {
  const session = await requireUser()
  if (session instanceof NextResponse) return session

  // Rate-limit per user (5 attempts / 15 minutes).
  const blocked = await rateLimitOrBlock({
    key: `change-pw:user:${session.userId}`,
    limit: 5,
    windowSec: 15 * 60,
  })
  if (blocked) return blocked

  let body: z.infer<typeof Body>
  try {
    body = Body.parse(await req.json())
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: { code: 'invalid_input', message: (e as Error).message } },
      { status: 400 }
    )
  }

  if (body.currentPassword === body.newPassword) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: 'same_password', message: 'Yeni şifre eskisinden farklı olmalı.' },
      },
      { status: 400 }
    )
  }

  const [user] = await db
    .select({ id: schema.users.id, passwordHash: schema.users.passwordHash })
    .from(schema.users)
    .where(eq(schema.users.id, session.userId))
    .limit(1)

  if (!user || !user.passwordHash) {
    return NextResponse.json(
      { ok: false, error: { code: 'not_found', message: 'Kullanıcı bulunamadı.' } },
      { status: 404 }
    )
  }

  const ok = await verifyPassword(body.currentPassword, user.passwordHash)
  if (!ok) {
    await appendAudit({
      tenantId: session.tenantId,
      actorId: session.userId,
      entityKind: 'user',
      entityId: session.userId,
      eventType: 'auth.password_change_failed',
      metadata: { reason: 'wrong_current' },
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
    })
    return NextResponse.json(
      {
        ok: false,
        error: { code: 'invalid_current', message: 'Mevcut şifre hatalı.' },
      },
      { status: 401 }
    )
  }

  const nextHash = await hashPassword(body.newPassword)
  await db
    .update(schema.users)
    .set({ passwordHash: nextHash, updatedAt: new Date() })
    .where(eq(schema.users.id, session.userId))

  await appendAudit({
    tenantId: session.tenantId,
    actorId: session.userId,
    entityKind: 'user',
    entityId: session.userId,
    eventType: 'auth.password_changed',
    ip: getClientIp(req),
    userAgent: getUserAgent(req),
  })

  return NextResponse.json({ ok: true })
}
