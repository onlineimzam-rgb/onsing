/**
 * GET   /api/auth/me   — return the current user + tenant + role
 * PATCH /api/auth/me   — update the user's display name
 *
 * Email is treated as the identity primary key and is NOT editable from this
 * endpoint (changing email requires a dedicated verification flow).
 *
 * Authentication: Bearer token (mobile) OR httpOnly cookie (web). The
 * `getCurrentSession()` helper handles both transports.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'

import { db, schema } from '@/db'
import { requireUser } from '@/lib/session'
import { appendAudit } from '@/lib/audit'
import { getClientIp, getUserAgent } from '@/lib/ip'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const session = await requireUser()
  if (session instanceof NextResponse) return session

  const [user] = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      phone: schema.users.phone,
      platformRole: schema.users.platformRole,
      lastLoginAt: schema.users.lastLoginAt,
    })
    .from(schema.users)
    .where(eq(schema.users.id, session.userId))
    .limit(1)

  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'not_found', message: 'Kullanıcı bulunamadı.' } },
      { status: 404 }
    )
  }

  const [tenant] = await db
    .select({
      id: schema.tenants.id,
      name: schema.tenants.name,
      slug: schema.tenants.slug,
    })
    .from(schema.tenants)
    .where(eq(schema.tenants.id, session.tenantId))
    .limit(1)

  const [membership] = await db
    .select({ role: schema.memberships.role })
    .from(schema.memberships)
    .where(
      and(
        eq(schema.memberships.userId, session.userId),
        eq(schema.memberships.tenantId, session.tenantId)
      )
    )
    .limit(1)

  return NextResponse.json({
    ok: true,
    user,
    tenant,
    role: membership?.role ?? null,
  })
}

const PatchBody = z.object({
  name: z.string().trim().min(2).max(120),
})

export async function PATCH(req: NextRequest) {
  const session = await requireUser()
  if (session instanceof NextResponse) return session

  let body: z.infer<typeof PatchBody>
  try {
    body = PatchBody.parse(await req.json())
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: { code: 'invalid_input', message: (e as Error).message } },
      { status: 400 }
    )
  }

  await db
    .update(schema.users)
    .set({ name: body.name, updatedAt: new Date() })
    .where(eq(schema.users.id, session.userId))

  await appendAudit({
    tenantId: session.tenantId,
    actorId: session.userId,
    entityKind: 'user',
    entityId: session.userId,
    eventType: 'user.profile_updated',
    metadata: { fields: ['name'] },
    ip: getClientIp(req),
    userAgent: getUserAgent(req),
  })

  return NextResponse.json({ ok: true, user: { id: session.userId, name: body.name } })
}
