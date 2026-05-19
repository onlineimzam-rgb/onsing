/**
 * GET    /api/admin/tenants/:id/subscription  — fetch active sub
 * POST   /api/admin/tenants/:id/subscription  — upsert (plan + price + seats)
 *
 * Roles:
 *   - super_admin: full
 *   - finance:     plan + price (no destructive actions)
 *
 * Side-effects:
 *   - Mirrors `plan` onto the parent tenants row.
 *   - Inserts a platform_audit_logs entry with the diff payload.
 */
import { NextRequest, NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '@/db'
import { requireAdmin } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UpsertSchema = z.object({
  plan: z.enum(['free', 'pro', 'business', 'enterprise']),
  pricePerMonth: z.number().int().min(0).max(10_000_000),
  seats: z.number().int().min(1).max(10_000).default(1),
  status: z
    .enum(['active', 'trialing', 'past_due', 'canceled', 'paused'])
    .default('active'),
  trialEndsAt: z.string().datetime().nullable().optional(),
})

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const tenantId = Number(params.id)
  if (!Number.isFinite(tenantId)) {
    return NextResponse.json({ ok: false, error: { code: 'bad_request' } }, { status: 400 })
  }

  const [sub] = await db
    .select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.tenantId, tenantId))
    .orderBy(desc(schema.subscriptions.createdAt))
    .limit(1)

  return NextResponse.json({ ok: true, subscription: sub ?? null })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(['super_admin', 'finance'])
  if (guard instanceof NextResponse) return guard

  const tenantId = Number(params.id)
  if (!Number.isFinite(tenantId)) {
    return NextResponse.json({ ok: false, error: { code: 'bad_request' } }, { status: 400 })
  }

  const body = UpsertSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: 'validation', message: 'Geçersiz veri.', issues: body.error.flatten() },
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

  const [existing] = await db
    .select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.tenantId, tenantId))
    .orderBy(desc(schema.subscriptions.createdAt))
    .limit(1)

  const data = body.data
  const trialEndsAt = data.trialEndsAt ? new Date(data.trialEndsAt) : null

  let saved: typeof schema.subscriptions.$inferSelect
  if (existing) {
    const [row] = await db
      .update(schema.subscriptions)
      .set({
        plan: data.plan,
        pricePerMonth: data.pricePerMonth,
        seats: data.seats,
        status: data.status,
        trialEndsAt,
        canceledAt: data.status === 'canceled' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(schema.subscriptions.id, existing.id))
      .returning()
    saved = row
  } else {
    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setMonth(periodEnd.getMonth() + 1)
    const [row] = await db
      .insert(schema.subscriptions)
      .values({
        tenantId,
        plan: data.plan,
        pricePerMonth: data.pricePerMonth,
        seats: data.seats,
        status: data.status,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        trialEndsAt,
      })
      .returning()
    saved = row
  }

  // Mirror plan onto the tenants row.
  if (tenant.plan !== data.plan) {
    await db
      .update(schema.tenants)
      .set({ plan: data.plan, updatedAt: new Date() })
      .where(eq(schema.tenants.id, tenantId))
  }

  await db.insert(schema.platformAuditLogs).values({
    actorId: guard.userId,
    actorRole: guard.platformRole,
    eventType: existing ? 'subscription.updated' : 'subscription.created',
    entityKind: 'tenant',
    entityId: tenantId,
    metadata: {
      plan: data.plan,
      pricePerMonth: data.pricePerMonth,
      seats: data.seats,
      status: data.status,
      previous: existing
        ? {
            plan: existing.plan,
            pricePerMonth: existing.pricePerMonth,
            seats: existing.seats,
            status: existing.status,
          }
        : null,
    },
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
  })

  return NextResponse.json({ ok: true, subscription: saved })
}
