/**
 * PATCH /api/admin/feature-flags/:id — toggle, rollout, description
 * DELETE /api/admin/feature-flags/:id
 */
import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '@/db'
import { requireSuperAdmin } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PatchSchema = z.object({
  enabled: z.boolean().optional(),
  rolloutPct: z.number().int().min(0).max(100).optional(),
  description: z.string().max(1000).nullable().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireSuperAdmin()
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
    .update(schema.featureFlags)
    .set({ ...body.data, updatedAt: new Date() })
    .where(eq(schema.featureFlags.id, id))
    .returning()
  if (!updated) {
    return NextResponse.json({ ok: false, error: { code: 'not_found' } }, { status: 404 })
  }

  await db.insert(schema.platformAuditLogs).values({
    actorId: guard.userId,
    actorRole: guard.platformRole,
    eventType: 'feature_flag.updated',
    entityKind: 'feature_flag',
    entityId: id,
    metadata: body.data,
  })

  return NextResponse.json({ ok: true, flag: updated })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireSuperAdmin()
  if (guard instanceof NextResponse) return guard

  const id = Number(params.id)
  if (!Number.isFinite(id)) {
    return NextResponse.json({ ok: false, error: { code: 'bad_request' } }, { status: 400 })
  }
  await db.delete(schema.featureFlags).where(eq(schema.featureFlags.id, id))
  await db.insert(schema.platformAuditLogs).values({
    actorId: guard.userId,
    actorRole: guard.platformRole,
    eventType: 'feature_flag.deleted',
    entityKind: 'feature_flag',
    entityId: id,
    metadata: {},
  })
  return NextResponse.json({ ok: true })
}
