/**
 * GET    /api/branches/[id]  — branch detail (within tenant).
 * PATCH  /api/branches/[id]  — partial update (name/address/.../isDefault).
 * DELETE /api/branches/[id]  — remove a branch. Cannot delete the only branch.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { and, eq, ne } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '@/db'
import { requireUser } from '@/lib/session'
import { appendAudit } from '@/lib/audit'
import { getClientIp, getUserAgent } from '@/lib/ip'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const PatchBody = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  address: z.string().trim().max(500).optional().nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.string().trim().email().or(z.literal('')).optional().nullable(),
  licenseNo: z.string().trim().max(120).optional().nullable(),
  isDefault: z.boolean().optional(),
})

function parseId(raw: string): number | null {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null
}

async function loadBranch(tenantId: number, id: number) {
  const [row] = await db
    .select()
    .from(schema.branches)
    .where(and(eq(schema.branches.id, id), eq(schema.branches.tenantId, tenantId)))
    .limit(1)
  return row || null
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireUser()
  if (session instanceof NextResponse) return session
  const id = parseId(params.id)
  if (!id) return NextResponse.json({ ok: false, error: { code: 'bad_id' } }, { status: 400 })
  const row = await loadBranch(session.tenantId, id)
  if (!row) return NextResponse.json({ ok: false, error: { code: 'not_found' } }, { status: 404 })
  return NextResponse.json({ ok: true, branch: row })
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
  const parsed = PatchBody.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: 'validation', message: parsed.error.message } },
      { status: 422 }
    )
  }

  const row = await loadBranch(session.tenantId, id)
  if (!row) return NextResponse.json({ ok: false, error: { code: 'not_found' } }, { status: 404 })

  if (parsed.data.isDefault) {
    await db
      .update(schema.branches)
      .set({ isDefault: false })
      .where(
        and(eq(schema.branches.tenantId, session.tenantId), ne(schema.branches.id, id))
      )
  }

  const patch: Partial<typeof schema.branches.$inferInsert> = {
    updatedAt: new Date(),
  }
  if (parsed.data.name !== undefined) patch.name = parsed.data.name
  if (parsed.data.address !== undefined) patch.address = parsed.data.address || null
  if (parsed.data.city !== undefined) patch.city = parsed.data.city || null
  if (parsed.data.phone !== undefined) patch.phone = parsed.data.phone || null
  if (parsed.data.email !== undefined) patch.email = parsed.data.email || null
  if (parsed.data.licenseNo !== undefined) patch.licenseNo = parsed.data.licenseNo || null
  if (parsed.data.isDefault !== undefined) patch.isDefault = parsed.data.isDefault

  const [updated] = await db
    .update(schema.branches)
    .set(patch)
    .where(eq(schema.branches.id, id))
    .returning()

  await appendAudit({
    tenantId: session.tenantId,
    actorId: session.userId,
    entityKind: 'tenant',
    entityId: id,
    eventType: 'branch.updated',
    metadata: { branchId: id, keys: Object.keys(parsed.data) },
    ip: getClientIp(req),
    userAgent: getUserAgent(req),
  })

  return NextResponse.json({ ok: true, branch: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireUser()
  if (session instanceof NextResponse) return session
  const id = parseId(params.id)
  if (!id) return NextResponse.json({ ok: false, error: { code: 'bad_id' } }, { status: 400 })

  const row = await loadBranch(session.tenantId, id)
  if (!row) return NextResponse.json({ ok: false, error: { code: 'not_found' } }, { status: 404 })

  // Unlink contracts that referenced this branch (they become "main office").
  await db
    .update(schema.contracts)
    .set({ branchId: null })
    .where(and(eq(schema.contracts.tenantId, session.tenantId), eq(schema.contracts.branchId, id)))

  await db.delete(schema.branches).where(eq(schema.branches.id, id))

  // If we deleted the default, promote another one (if any).
  if (row.isDefault) {
    const [next] = await db
      .select({ id: schema.branches.id })
      .from(schema.branches)
      .where(eq(schema.branches.tenantId, session.tenantId))
      .limit(1)
    if (next) {
      await db.update(schema.branches).set({ isDefault: true }).where(eq(schema.branches.id, next.id))
    }
  }

  await appendAudit({
    tenantId: session.tenantId,
    actorId: session.userId,
    entityKind: 'tenant',
    entityId: id,
    eventType: 'branch.deleted',
    metadata: { branchId: id, name: row.name },
    ip: getClientIp(req),
    userAgent: getUserAgent(req),
  })

  return NextResponse.json({ ok: true })
}
