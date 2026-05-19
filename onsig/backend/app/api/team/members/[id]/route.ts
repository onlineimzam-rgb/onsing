/**
 * PATCH /api/team/members/[id] — update role for a membership (owner can promote).
 * DELETE /api/team/members/[id] — remove a member from the tenant.
 *
 * MVP rules:
 *   - Any authenticated user can manage the team (will be tightened to owner/admin).
 *   - You cannot delete or downgrade yourself if you are the last owner.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { and, eq, ne, count as dCount } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '@/db'
import { requireUser } from '@/lib/session'
import { appendAudit } from '@/lib/audit'
import { getClientIp, getUserAgent } from '@/lib/ip'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const PatchSchema = z.object({
  role: z.enum(['owner', 'admin', 'member']),
})

function parseId(raw: string): number | null {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null
}

async function loadMembership(tenantId: number, membershipId: number) {
  const [row] = await db
    .select()
    .from(schema.memberships)
    .where(
      and(eq(schema.memberships.id, membershipId), eq(schema.memberships.tenantId, tenantId))
    )
    .limit(1)
  return row || null
}

async function countOtherOwners(tenantId: number, exceptMembershipId: number): Promise<number> {
  const [row] = await db
    .select({ c: dCount() })
    .from(schema.memberships)
    .where(
      and(
        eq(schema.memberships.tenantId, tenantId),
        eq(schema.memberships.role, 'owner'),
        ne(schema.memberships.id, exceptMembershipId)
      )
    )
  return Number(row?.c ?? 0)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireUser()
  if (session instanceof NextResponse) return session

  const id = parseId(params.id)
  if (!id) return NextResponse.json({ ok: false, error: { code: 'bad_id' } }, { status: 400 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: { code: 'bad_json' } }, { status: 400 })
  }
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: 'validation', message: parsed.error.message } },
      { status: 422 }
    )
  }

  const m = await loadMembership(session.tenantId, id)
  if (!m) return NextResponse.json({ ok: false, error: { code: 'not_found' } }, { status: 404 })

  // safety: don't allow demoting the last owner
  if (m.role === 'owner' && parsed.data.role !== 'owner') {
    const others = await countOtherOwners(session.tenantId, id)
    if (others === 0) {
      return NextResponse.json(
        { ok: false, error: { code: 'last_owner', message: 'En az bir sahip kalmalı.' } },
        { status: 422 }
      )
    }
  }

  const [updated] = await db
    .update(schema.memberships)
    .set({ role: parsed.data.role })
    .where(eq(schema.memberships.id, id))
    .returning()

  await appendAudit({
    tenantId: session.tenantId,
    actorId: session.userId,
    entityKind: 'user',
    entityId: m.userId,
    eventType: 'team.role_changed',
    metadata: { previousRole: m.role, newRole: parsed.data.role, membershipId: id },
    ip: getClientIp(req),
    userAgent: getUserAgent(req),
  })

  return NextResponse.json({ ok: true, membership: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireUser()
  if (session instanceof NextResponse) return session

  const id = parseId(params.id)
  if (!id) return NextResponse.json({ ok: false, error: { code: 'bad_id' } }, { status: 400 })

  const m = await loadMembership(session.tenantId, id)
  if (!m) return NextResponse.json({ ok: false, error: { code: 'not_found' } }, { status: 404 })

  if (m.role === 'owner') {
    const others = await countOtherOwners(session.tenantId, id)
    if (others === 0) {
      return NextResponse.json(
        { ok: false, error: { code: 'last_owner', message: 'En az bir sahip kalmalı.' } },
        { status: 422 }
      )
    }
  }

  await db.delete(schema.memberships).where(eq(schema.memberships.id, id))

  await appendAudit({
    tenantId: session.tenantId,
    actorId: session.userId,
    entityKind: 'user',
    entityId: m.userId,
    eventType: 'team.removed',
    metadata: { previousRole: m.role, membershipId: id },
    ip: getClientIp(req),
    userAgent: getUserAgent(req),
  })

  return NextResponse.json({ ok: true })
}
