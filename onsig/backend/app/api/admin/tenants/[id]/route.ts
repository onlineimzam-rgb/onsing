/**
 * GET    /api/admin/tenants/:id  — fetch single tenant
 * PATCH  /api/admin/tenants/:id  — update plan, name
 * DELETE /api/admin/tenants/:id  — cascade delete (super_admin only)
 */
import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '@/db'
import { requireAdmin, requireSuperAdmin } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PatchSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  plan: z.enum(['free', 'pro', 'business', 'enterprise']).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(['super_admin', 'finance'])
  if (guard instanceof NextResponse) return guard

  const tenantId = Number(params.id)
  if (!Number.isFinite(tenantId)) {
    return NextResponse.json({ ok: false, error: { code: 'bad_request' } }, { status: 400 })
  }

  const body = PatchSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) {
    return NextResponse.json(
      { ok: false, error: { code: 'validation', message: 'Geçersiz veri.' } },
      { status: 400 }
    )
  }

  const patch = body.data
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: false, error: { code: 'noop' } }, { status: 400 })
  }

  const [updated] = await db
    .update(schema.tenants)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(schema.tenants.id, tenantId))
    .returning()

  if (!updated) {
    return NextResponse.json({ ok: false, error: { code: 'not_found' } }, { status: 404 })
  }

  await db.insert(schema.platformAuditLogs).values({
    actorId: guard.userId,
    actorRole: guard.platformRole,
    eventType: 'tenant.updated',
    entityKind: 'tenant',
    entityId: tenantId,
    metadata: patch,
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
  })

  return NextResponse.json({ ok: true, tenant: updated })
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const tenantId = Number(params.id)
  if (!Number.isFinite(tenantId)) {
    return NextResponse.json({ ok: false, error: { code: 'bad_request' } }, { status: 400 })
  }

  const [tenant] = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.id, tenantId))
    .limit(1)
  if (!tenant) {
    return NextResponse.json({ ok: false, error: { code: 'not_found' } }, { status: 404 })
  }
  return NextResponse.json({ ok: true, tenant })
}

/**
 * Hard-delete a tenant and all child rows. Idempotent.
 *
 * Schema does not declare FK CASCADE (ADR-005 keeps tenant_id as a plain int),
 * so we explicitly purge every tenant-scoped table before removing the parent.
 * Platform-level rows (`platform_audit_logs`) are NOT touched — they remain as
 * a tombstone of what was deleted, by whom, and when.
 *
 * Guard: super_admin only. The acting admin cannot delete the tenant that owns
 * their own user record (foot-gun protection).
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireSuperAdmin()
  if (guard instanceof NextResponse) return guard

  const tenantId = Number(params.id)
  if (!Number.isFinite(tenantId)) {
    return NextResponse.json({ ok: false, error: { code: 'bad_request' } }, { status: 400 })
  }

  if (guard.tenantId === tenantId) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'self_delete_blocked',
          message: 'Kendi tenant\u2019\u0131n\u0131z\u0131 silemezsiniz.',
        },
      },
      { status: 400 }
    )
  }

  const [tenant] = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.id, tenantId))
    .limit(1)
  if (!tenant) {
    return NextResponse.json({ ok: false, error: { code: 'not_found' } }, { status: 404 })
  }

  // Snapshot member ids so we can clean orphan users at the very end.
  const members = await db
    .select({ userId: schema.memberships.userId })
    .from(schema.memberships)
    .where(eq(schema.memberships.tenantId, tenantId))
  const memberIds = members.map((m) => m.userId)

  // Audit first — the platform_audit row needs to survive the cascade.
  await db.insert(schema.platformAuditLogs).values({
    actorId: guard.userId,
    actorRole: guard.platformRole,
    eventType: 'tenant.deleted',
    entityKind: 'tenant',
    entityId: tenantId,
    metadata: {
      name: tenant.name,
      plan: tenant.plan,
      slug: tenant.slug,
      memberCount: memberIds.length,
    },
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
  })

  // Order matters: child → parent. Schema does not declare FK CASCADE on
  // tenant_id (ADR-005), so each tenant-scoped table is purged explicitly.
  // OTP codes have no tenant_id of their own; they fall away with the sign
  // session they belong to (NULL FK).
  await db.delete(schema.documents).where(eq(schema.documents.tenantId, tenantId))
  await db.delete(schema.signSessions).where(eq(schema.signSessions.tenantId, tenantId))
  await db.delete(schema.contracts).where(eq(schema.contracts.tenantId, tenantId))
  await db.delete(schema.auditLogs).where(eq(schema.auditLogs.tenantId, tenantId))
  await db.delete(schema.teamInvites).where(eq(schema.teamInvites.tenantId, tenantId))
  await db.delete(schema.branches).where(eq(schema.branches.tenantId, tenantId))
  await db.delete(schema.invoices).where(eq(schema.invoices.tenantId, tenantId))
  await db.delete(schema.subscriptions).where(eq(schema.subscriptions.tenantId, tenantId))
  await db.delete(schema.supportTickets).where(eq(schema.supportTickets.tenantId, tenantId))
  await db.delete(schema.riskEvents).where(eq(schema.riskEvents.tenantId, tenantId))
  await db.delete(schema.featureFlags).where(eq(schema.featureFlags.tenantId, tenantId))
  await db.delete(schema.memberships).where(eq(schema.memberships.tenantId, tenantId))
  await db.delete(schema.tenants).where(eq(schema.tenants.id, tenantId))

  // Best-effort orphan-user sweep. A user that no longer belongs to any tenant
  // and has no platform role is unreachable and serves no purpose.
  for (const uid of memberIds) {
    if (uid === guard.userId) continue
    const stillMember = await db
      .select({ id: schema.memberships.id })
      .from(schema.memberships)
      .where(eq(schema.memberships.userId, uid))
      .limit(1)
    if (stillMember.length === 0) {
      const [u] = await db
        .select({ platformRole: schema.users.platformRole })
        .from(schema.users)
        .where(eq(schema.users.id, uid))
        .limit(1)
      if (u && u.platformRole === 'none') {
        await db.delete(schema.users).where(eq(schema.users.id, uid))
      }
    }
  }

  return NextResponse.json({ ok: true })
}
