/**
 * PATCH /api/admin/support/:id — update status / priority / assignee.
 */
import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '@/db'
import { requireAdmin } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PatchSchema = z.object({
  status: z.enum(['open', 'pending', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  assignedTo: z.number().int().positive().nullable().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(['super_admin', 'support'])
  if (guard instanceof NextResponse) return guard

  const id = Number(params.id)
  if (!Number.isFinite(id)) {
    return NextResponse.json({ ok: false, error: { code: 'bad_request' } }, { status: 400 })
  }
  const body = PatchSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) {
    return NextResponse.json({ ok: false, error: { code: 'validation' } }, { status: 400 })
  }

  const [updated] = await db
    .update(schema.supportTickets)
    .set({ ...body.data, updatedAt: new Date() })
    .where(eq(schema.supportTickets.id, id))
    .returning()
  if (!updated) {
    return NextResponse.json({ ok: false, error: { code: 'not_found' } }, { status: 404 })
  }

  await db.insert(schema.platformAuditLogs).values({
    actorId: guard.userId,
    actorRole: guard.platformRole,
    eventType: 'support_ticket.updated',
    entityKind: 'support_ticket',
    entityId: id,
    metadata: body.data,
  })

  return NextResponse.json({ ok: true, ticket: updated })
}
