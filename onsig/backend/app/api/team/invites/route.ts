/**
 * GET  /api/team/invites — list pending invites for the tenant.
 * POST /api/team/invites — create a new invite token (returns the public URL).
 *
 * Tokens expire after 14 days by default. Consumed tokens stay in the DB for
 * audit but are filtered out of the active list.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { db, schema } from '@/db'
import { requireUser } from '@/lib/session'
import { appendAudit } from '@/lib/audit'
import { getClientIp, getUserAgent } from '@/lib/ip'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const PostSchema = z.object({
  email: z.string().trim().email(),
  role: z.enum(['owner', 'admin', 'member']).default('member'),
})

function inviteUrl(token: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/+$/, '')
  const path = `/register?invite=${encodeURIComponent(token)}`
  return base ? `${base}${path}` : path
}

export async function GET() {
  const session = await requireUser()
  if (session instanceof NextResponse) return session

  const rows = await db
    .select()
    .from(schema.teamInvites)
    .where(
      and(eq(schema.teamInvites.tenantId, session.tenantId), isNull(schema.teamInvites.consumedAt))
    )
    .orderBy(desc(schema.teamInvites.id))

  return NextResponse.json({
    ok: true,
    invites: rows.map((r) => ({
      id: r.id,
      email: r.email,
      role: r.role,
      token: r.token,
      url: inviteUrl(r.token),
      expiresAt: r.expiresAt,
      createdAt: r.createdAt,
    })),
  })
}

export async function POST(req: NextRequest) {
  const session = await requireUser()
  if (session instanceof NextResponse) return session

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: { code: 'bad_json' } }, { status: 400 })
  }
  const parsed = PostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: 'validation', message: parsed.error.message } },
      { status: 422 }
    )
  }

  const token = nanoid(32)
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14) // 14 days

  const [row] = await db
    .insert(schema.teamInvites)
    .values({
      tenantId: session.tenantId,
      email: parsed.data.email,
      role: parsed.data.role,
      token,
      invitedBy: session.userId,
      expiresAt,
    })
    .returning()

  await appendAudit({
    tenantId: session.tenantId,
    actorId: session.userId,
    entityKind: 'user',
    entityId: row!.id,
    eventType: 'team.invite_created',
    metadata: { email: parsed.data.email, role: parsed.data.role, inviteId: row!.id },
    ip: getClientIp(req),
    userAgent: getUserAgent(req),
  })

  return NextResponse.json({
    ok: true,
    invite: {
      id: row!.id,
      email: row!.email,
      role: row!.role,
      token: row!.token,
      url: inviteUrl(row!.token),
      expiresAt: row!.expiresAt,
    },
  })
}
