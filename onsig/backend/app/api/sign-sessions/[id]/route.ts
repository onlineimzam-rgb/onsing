/**
 * DELETE /api/sign-sessions/[id]  — cancel a pending session.
 *
 * Only sessions in `bekliyor` status can be cancelled. Signed sessions are
 * immutable to preserve the audit trail.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db, schema } from '@/db'
import { requireUser } from '@/lib/session'
import { appendAudit } from '@/lib/audit'
import { getClientIp, getUserAgent } from '@/lib/ip'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireUser()
  if (session instanceof NextResponse) return session

  const id = Number(params.id)
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: { code: 'bad_id' } }, { status: 400 })
  }

  const [row] = await db
    .select({
      id: schema.signSessions.id,
      contractId: schema.signSessions.contractId,
      status: schema.signSessions.status,
    })
    .from(schema.signSessions)
    .where(
      and(
        eq(schema.signSessions.id, id),
        eq(schema.signSessions.tenantId, session.tenantId)
      )
    )
    .limit(1)

  if (!row) return NextResponse.json({ ok: false, error: { code: 'not_found' } }, { status: 404 })

  if (row.status !== 'bekliyor') {
    return NextResponse.json(
      { ok: false, error: { code: 'immutable', message: 'İmzalanmış oturum iptal edilemez.' } },
      { status: 409 }
    )
  }

  await db
    .update(schema.signSessions)
    .set({ status: 'iptal' })
    .where(eq(schema.signSessions.id, id))

  await appendAudit({
    tenantId: session.tenantId,
    actorId: session.userId,
    entityKind: 'sign_session',
    entityId: id,
    eventType: 'session.cancelled',
    metadata: { contractId: row.contractId },
    ip: getClientIp(req),
    userAgent: getUserAgent(req),
  })

  return NextResponse.json({ ok: true })
}
