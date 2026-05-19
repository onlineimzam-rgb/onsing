/**
 * GET  /api/branches — list every branch for the current tenant.
 * POST /api/branches — create a new branch.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { and, asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '@/db'
import { requireUser } from '@/lib/session'
import { appendAudit } from '@/lib/audit'
import { getClientIp, getUserAgent } from '@/lib/ip'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const BranchBody = z.object({
  name: z.string().trim().min(2).max(200),
  address: z.string().trim().max(500).optional().nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.string().trim().email().or(z.literal('')).optional().nullable(),
  licenseNo: z.string().trim().max(120).optional().nullable(),
  isDefault: z.boolean().optional(),
})

export async function GET() {
  const session = await requireUser()
  if (session instanceof NextResponse) return session

  const rows = await db
    .select()
    .from(schema.branches)
    .where(eq(schema.branches.tenantId, session.tenantId))
    .orderBy(asc(schema.branches.name))

  return NextResponse.json({ ok: true, branches: rows })
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
  const parsed = BranchBody.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: 'validation', message: parsed.error.message } },
      { status: 422 }
    )
  }

  // If this is the first branch, force isDefault = true.
  const existing = await db
    .select({ id: schema.branches.id })
    .from(schema.branches)
    .where(eq(schema.branches.tenantId, session.tenantId))
  const isDefault = existing.length === 0 ? true : !!parsed.data.isDefault

  if (isDefault && existing.length > 0) {
    await db
      .update(schema.branches)
      .set({ isDefault: false })
      .where(eq(schema.branches.tenantId, session.tenantId))
  }

  const [row] = await db
    .insert(schema.branches)
    .values({
      tenantId: session.tenantId,
      name: parsed.data.name,
      address: parsed.data.address || null,
      city: parsed.data.city || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      licenseNo: parsed.data.licenseNo || null,
      isDefault,
    })
    .returning()

  await appendAudit({
    tenantId: session.tenantId,
    actorId: session.userId,
    entityKind: 'tenant',
    entityId: row!.id,
    eventType: 'branch.created',
    metadata: { branchId: row!.id, name: parsed.data.name, isDefault },
    ip: getClientIp(req),
    userAgent: getUserAgent(req),
  })
  void and // keep import live for future filters

  return NextResponse.json({ ok: true, branch: row })
}
