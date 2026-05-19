/**
 * POST /api/admin/tenants/:id/subscription/status
 * Body: { action: 'pause' | 'resume' | 'cancel' }
 *
 * Roles: super_admin (full); finance (pause/resume only).
 */
import { NextRequest, NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '@/db'
import { requireAdmin } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const Schema = z.object({
  action: z.enum(['pause', 'resume', 'cancel']),
  reason: z.string().max(500).optional(),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const tenantId = Number(params.id)
  if (!Number.isFinite(tenantId)) {
    return NextResponse.json({ ok: false, error: { code: 'bad_request' } }, { status: 400 })
  }

  const body = Schema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) {
    return NextResponse.json({ ok: false, error: { code: 'validation' } }, { status: 400 })
  }
  const { action, reason } = body.data

  const allowed: Parameters<typeof requireAdmin>[0] =
    action === 'cancel' ? ['super_admin'] : ['super_admin', 'finance']
  const guard = await requireAdmin(allowed)
  if (guard instanceof NextResponse) return guard

  const [sub] = await db
    .select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.tenantId, tenantId))
    .orderBy(desc(schema.subscriptions.createdAt))
    .limit(1)

  if (!sub) {
    return NextResponse.json(
      { ok: false, error: { code: 'no_subscription', message: 'Tenant\u2019\u0131n aktif aboneli\u011fi yok.' } },
      { status: 404 }
    )
  }

  let nextStatus: 'active' | 'paused' | 'canceled'
  switch (action) {
    case 'pause':
      nextStatus = 'paused'
      break
    case 'resume':
      nextStatus = 'active'
      break
    case 'cancel':
      nextStatus = 'canceled'
      break
  }

  const [updated] = await db
    .update(schema.subscriptions)
    .set({
      status: nextStatus,
      canceledAt: nextStatus === 'canceled' ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(schema.subscriptions.id, sub.id))
    .returning()

  await db.insert(schema.platformAuditLogs).values({
    actorId: guard.userId,
    actorRole: guard.platformRole,
    eventType: `subscription.${action}`,
    entityKind: 'tenant',
    entityId: tenantId,
    metadata: { previousStatus: sub.status, status: nextStatus, reason: reason ?? null },
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
  })

  return NextResponse.json({ ok: true, subscription: updated })
}
