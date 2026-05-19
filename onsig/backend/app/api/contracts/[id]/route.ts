/**
 * GET    /api/contracts/[id]    — full contract + rendered text (incl. tenant ctx)
 * PATCH  /api/contracts/[id]    — partial update (form/title/status)
 * DELETE /api/contracts/[id]    — soft delete (status='iptal'); MVP only owners can delete
 */

import { NextResponse, type NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db, schema } from '@/db'
import { requireUser, requireRole, loadTenant } from '@/lib/session'
import { appendAudit } from '@/lib/audit'
import { getClientIp, getUserAgent } from '@/lib/ip'
import {
  UpdateContractSchema,
  buildContextFromTenant,
  getContractById,
  loadBranch,
  mergeForm,
} from '@/lib/contracts'
import { buildContractText, findTemplate, type Sector } from '@shared/contracts'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function parseId(raw: string): number | null {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireUser()
  if (session instanceof NextResponse) return session

  const id = parseId(params.id)
  if (!id) return NextResponse.json({ ok: false, error: { code: 'bad_id', message: 'Geçersiz id.' } }, { status: 400 })

  const row = await getContractById(session.tenantId, id)
  if (!row) return NextResponse.json({ ok: false, error: { code: 'not_found' } }, { status: 404 })

  const tenant = await loadTenant(session.tenantId)
  const branch = await loadBranch(session.tenantId, row.branchId)
  const ctx = buildContextFromTenant(tenant!, branch)
  const form = mergeForm(row.form, { templateKey: row.templateKey as never })
  const text = buildContractText(form, ctx)

  const sessions = await db
    .select({
      id: schema.signSessions.id,
      role: schema.signSessions.role,
      token: schema.signSessions.token,
      status: schema.signSessions.status,
      recipientName: schema.signSessions.recipientName,
      recipientEmail: schema.signSessions.recipientEmail,
      recipientPhone: schema.signSessions.recipientPhone,
      signedAt: schema.signSessions.signedAt,
      expiresAt: schema.signSessions.expiresAt,
      createdAt: schema.signSessions.createdAt,
    })
    .from(schema.signSessions)
    .where(eq(schema.signSessions.contractId, id))
    .orderBy(schema.signSessions.id)

  return NextResponse.json({
    ok: true,
    contract: {
      ...row,
      renderedText: text,
      template: findTemplate(row.sector as Sector, row.templateKey),
    },
    signSessions: sessions,
  })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireUser()
  if (session instanceof NextResponse) return session

  const id = parseId(params.id)
  if (!id) return NextResponse.json({ ok: false, error: { code: 'bad_id' } }, { status: 400 })

  let input: ReturnType<typeof UpdateContractSchema.parse>
  try {
    input = UpdateContractSchema.parse(await req.json())
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: { code: 'invalid_input', message: (e as Error).message } },
      { status: 400 }
    )
  }

  const row = await getContractById(session.tenantId, id)
  if (!row) return NextResponse.json({ ok: false, error: { code: 'not_found' } }, { status: 404 })

  if (row.status === 'tamamlandi') {
    return NextResponse.json(
      { ok: false, error: { code: 'locked', message: 'Tamamlanmış sözleşme düzenlenemez.' } },
      { status: 409 }
    )
  }

  const tenant = await loadTenant(session.tenantId)
  const branch = await loadBranch(session.tenantId, row.branchId)
  const nextForm = input.form
    ? mergeForm(row.form, { ...input.form, templateKey: row.templateKey as never })
    : null
  const ctx = buildContextFromTenant(tenant!, branch)
  const renderedText = nextForm
    ? buildContractText(nextForm, ctx)
    : row.renderedText

  await db
    .update(schema.contracts)
    .set({
      title: input.title !== undefined ? (input.title?.trim() || null) : row.title,
      status: input.status ?? row.status,
      form: nextForm ?? row.form,
      renderedText,
      updatedAt: new Date(),
    })
    .where(and(eq(schema.contracts.id, id), eq(schema.contracts.tenantId, session.tenantId)))

  await appendAudit({
    tenantId: session.tenantId,
    actorId: session.userId,
    entityKind: 'contract',
    entityId: id,
    eventType: 'contract.updated',
    metadata: {
      changedFields: Object.keys(input),
      newStatus: input.status ?? row.status,
    },
    ip: getClientIp(req),
    userAgent: getUserAgent(req),
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireRole(['owner', 'admin'])
  if (session instanceof NextResponse) return session

  const id = parseId(params.id)
  if (!id) return NextResponse.json({ ok: false, error: { code: 'bad_id' } }, { status: 400 })

  const row = await getContractById(session.tenantId, id)
  if (!row) return NextResponse.json({ ok: false, error: { code: 'not_found' } }, { status: 404 })

  await db
    .update(schema.contracts)
    .set({ status: 'iptal', updatedAt: new Date() })
    .where(and(eq(schema.contracts.id, id), eq(schema.contracts.tenantId, session.tenantId)))

  await appendAudit({
    tenantId: session.tenantId,
    actorId: session.userId,
    entityKind: 'contract',
    entityId: id,
    eventType: 'contract.cancelled',
    ip: getClientIp(req),
    userAgent: getUserAgent(req),
  })

  return NextResponse.json({ ok: true })
}
