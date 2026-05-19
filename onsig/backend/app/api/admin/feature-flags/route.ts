/**
 * GET /api/admin/feature-flags — list
 * POST /api/admin/feature-flags — create
 */
import { NextRequest, NextResponse } from 'next/server'
import { desc } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '@/db'
import { requireSuperAdmin } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = await requireSuperAdmin()
  if (guard instanceof NextResponse) return guard
  const rows = await db
    .select()
    .from(schema.featureFlags)
    .orderBy(desc(schema.featureFlags.updatedAt))
  return NextResponse.json({ ok: true, flags: rows })
}

const CreateSchema = z.object({
  key: z.string().min(2).max(80),
  description: z.string().max(1000).optional().nullable(),
  enabled: z.boolean().default(false),
  rolloutPct: z.number().int().min(0).max(100).default(0),
  tenantId: z.number().int().positive().optional().nullable(),
})

export async function POST(req: NextRequest) {
  const guard = await requireSuperAdmin()
  if (guard instanceof NextResponse) return guard

  const body = CreateSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) {
    return NextResponse.json({ ok: false, error: { code: 'validation' } }, { status: 400 })
  }
  const [row] = await db
    .insert(schema.featureFlags)
    .values({
      key: body.data.key,
      description: body.data.description ?? null,
      enabled: body.data.enabled,
      rolloutPct: body.data.rolloutPct,
      tenantId: body.data.tenantId ?? null,
    })
    .returning()

  await db.insert(schema.platformAuditLogs).values({
    actorId: guard.userId,
    actorRole: guard.platformRole,
    eventType: 'feature_flag.created',
    entityKind: 'feature_flag',
    entityId: row.id,
    metadata: { key: row.key },
  })

  return NextResponse.json({ ok: true, flag: row }, { status: 201 })
}
