/**
 * GET  /api/contracts/[id]/sign-sessions   — list sessions for a contract
 * POST /api/contracts/[id]/sign-sessions   — create a new sign session (token)
 *
 * On POST: validates that the role is allowed for the contract's template,
 * generates a 32-char nanoid token (URL-safe), and writes a `session.created`
 * audit entry. Expires in 30 days by default.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { db, schema } from '@/db'
import { requireUser } from '@/lib/session'
import { appendAudit } from '@/lib/audit'
import { getClientIp, getUserAgent } from '@/lib/ip'
import { getContractById } from '@/lib/contracts'
import { findTemplate, ROLES_BY_TEMPLATE, type Sector, type SignerRole } from '@shared/contracts'
import { isRealEstateKey } from '@shared/contracts'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const Body = z.object({
  role: z.string().min(1).max(32),
  recipientName: z.string().trim().max(200).optional().nullable(),
  recipientEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email()
    .optional()
    .nullable()
    .or(z.literal('').transform(() => null)),
  recipientPhone: z.string().trim().max(40).optional().nullable(),
  expiresInDays: z.number().int().min(1).max(180).optional(),
})

function parseId(raw: string): number | null {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireUser()
  if (session instanceof NextResponse) return session

  const id = parseId(params.id)
  if (!id) return NextResponse.json({ ok: false, error: { code: 'bad_id' } }, { status: 400 })

  const contract = await getContractById(session.tenantId, id)
  if (!contract) return NextResponse.json({ ok: false, error: { code: 'not_found' } }, { status: 404 })

  const items = await db
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

  return NextResponse.json({ ok: true, items })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireUser()
  if (session instanceof NextResponse) return session

  const id = parseId(params.id)
  if (!id) return NextResponse.json({ ok: false, error: { code: 'bad_id' } }, { status: 400 })

  let body: z.infer<typeof Body>
  try {
    body = Body.parse(await req.json())
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: { code: 'invalid_input', message: (e as Error).message } },
      { status: 400 }
    )
  }

  const contract = await getContractById(session.tenantId, id)
  if (!contract) return NextResponse.json({ ok: false, error: { code: 'not_found' } }, { status: 404 })

  if (contract.status === 'iptal') {
    return NextResponse.json(
      { ok: false, error: { code: 'cancelled', message: 'İptal edilmiş sözleşme için imza alınamaz.' } },
      { status: 409 }
    )
  }

  // Role must belong to this template's allowed roles.
  const template = findTemplate(contract.sector as Sector, contract.templateKey)
  if (!template) {
    return NextResponse.json(
      { ok: false, error: { code: 'template_missing', message: 'Şablon bulunamadı.' } },
      { status: 500 }
    )
  }
  const allowedRoles: ReadonlyArray<SignerRole> = isRealEstateKey(contract.templateKey)
    ? ROLES_BY_TEMPLATE[contract.templateKey]
    : (template.roles as ReadonlyArray<SignerRole>)

  if (!allowedRoles.includes(body.role as SignerRole)) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'invalid_role',
          message: `Bu şablon için geçerli roller: ${allowedRoles.join(', ')}.`,
        },
      },
      { status: 400 }
    )
  }

  const expiresInDays = body.expiresInDays ?? 30
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
  const token = nanoid(32)

  const [inserted] = await db
    .insert(schema.signSessions)
    .values({
      tenantId: session.tenantId,
      contractId: id,
      role: body.role,
      token,
      recipientName: body.recipientName ?? null,
      recipientEmail: body.recipientEmail ?? null,
      recipientPhone: body.recipientPhone ?? null,
      status: 'bekliyor',
      expiresAt,
    })
    .returning({ id: schema.signSessions.id })

  if (!inserted) {
    return NextResponse.json(
      { ok: false, error: { code: 'create_failed' } },
      { status: 500 }
    )
  }

  // First non-draft session promotes contract to "aktif"
  if (contract.status === 'taslak') {
    await db
      .update(schema.contracts)
      .set({ status: 'aktif', updatedAt: new Date() })
      .where(and(eq(schema.contracts.id, id), eq(schema.contracts.tenantId, session.tenantId)))
  }

  await appendAudit({
    tenantId: session.tenantId,
    actorId: session.userId,
    entityKind: 'sign_session',
    entityId: inserted.id,
    eventType: 'session.created',
    metadata: {
      contractId: id,
      role: body.role,
      recipient: { name: body.recipientName, email: body.recipientEmail, phone: body.recipientPhone },
    },
    ip: getClientIp(req),
    userAgent: getUserAgent(req),
  })

  return NextResponse.json({
    ok: true,
    id: inserted.id,
    token,
    expiresAt,
    publicUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/sign/${token}`,
  })
}
