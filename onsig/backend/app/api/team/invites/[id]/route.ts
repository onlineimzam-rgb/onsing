/**
 * DELETE /api/team/invites/[id] — revoke a pending invite.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db, schema } from '@/db'
import { requireUser } from '@/lib/session'
import { appendAudit } from '@/lib/audit'
import { getClientIp, getUserAgent } from '@/lib/ip'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function parseId(raw: string): number | null {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireUser()
  if (session instanceof NextResponse) return session

  const id = parseId(params.id)
  if (!id) return NextResponse.json({ ok: false, error: { code: 'bad_id' } }, { status: 400 })

  const [row] = await db
    .select()
    .from(schema.teamInvites)
    .where(and(eq(schema.teamInvites.id, id), eq(schema.teamInvites.tenantId, session.tenantId)))
    .limit(1)
  if (!row) return NextResponse.json({ ok: false, error: { code: 'not_found' } }, { status: 404 })

  await db.delete(schema.teamInvites).where(eq(schema.teamInvites.id, id))

  await appendAudit({
    tenantId: session.tenantId,
    actorId: session.userId,
    entityKind: 'user',
    entityId: row.id,
    eventType: 'team.invite_revoked',
    metadata: { email: row.email, role: row.role, inviteId: row.id },
    ip: getClientIp(req),
    userAgent: getUserAgent(req),
  })

  return NextResponse.json({ ok: true })
}
