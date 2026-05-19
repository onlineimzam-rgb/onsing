/**
 * GET  /api/contracts            — list this tenant's contracts
 * POST /api/contracts            — create a draft contract
 *
 * Authentication: requires a logged-in user (any membership role).
 * Audit: `contract.created` event on POST.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { db, schema } from '@/db'
import { requireUser, loadTenant } from '@/lib/session'
import { appendAudit } from '@/lib/audit'
import { getClientIp, getUserAgent } from '@/lib/ip'
import {
  CreateContractSchema,
  buildContextFromTenant,
  listContracts,
  loadBranch,
  loadDefaultBranch,
  mergeForm,
  validateTemplate,
} from '@/lib/contracts'
import { buildContractText, listTemplates } from '@shared/contracts'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const session = await requireUser()
  if (session instanceof NextResponse) return session

  const items = await listContracts(session.tenantId)
  return NextResponse.json({
    ok: true,
    items,
    templates: listTemplates(),
  })
}

export async function POST(req: NextRequest) {
  const session = await requireUser()
  if (session instanceof NextResponse) return session

  let input: ReturnType<typeof CreateContractSchema.parse>
  try {
    input = CreateContractSchema.parse(await req.json())
  } catch (e) {
    const msg = (e as Error).message
    return NextResponse.json(
      { ok: false, error: { code: 'invalid_input', message: msg } },
      { status: 400 }
    )
  }

  const valid = validateTemplate(input.sector, input.templateKey)
  if (!valid.ok) {
    return NextResponse.json(
      { ok: false, error: { code: 'invalid_template', message: valid.message } },
      { status: 400 }
    )
  }

  const tenant = await loadTenant(session.tenantId)
  if (!tenant) {
    return NextResponse.json(
      { ok: false, error: { code: 'tenant_missing', message: 'Tenant bulunamadı.' } },
      { status: 500 }
    )
  }

  // Resolve which branch this contract belongs to.
  //   - explicit branchId from form
  //   - otherwise tenant default (if any)
  const branch =
    (await loadBranch(session.tenantId, input.branchId ?? null)) ??
    (await loadDefaultBranch(session.tenantId))

  const form = mergeForm({}, { ...input.form, templateKey: input.templateKey as never })
  const ctx = buildContextFromTenant(tenant, branch)
  const text = buildContractText(form, ctx)

  const [inserted] = await db
    .insert(schema.contracts)
    .values({
      tenantId: session.tenantId,
      branchId: branch?.id ?? null,
      sector: input.sector,
      templateKey: input.templateKey,
      templateVersion: 1,
      title: input.title?.trim() || null,
      status: 'taslak',
      form,
      renderedText: text,
      createdBy: session.userId,
    })
    .returning({ id: schema.contracts.id })

  if (!inserted) {
    return NextResponse.json(
      { ok: false, error: { code: 'create_failed', message: 'Sözleşme oluşturulamadı.' } },
      { status: 500 }
    )
  }

  await appendAudit({
    tenantId: session.tenantId,
    actorId: session.userId,
    entityKind: 'contract',
    entityId: inserted.id,
    eventType: 'contract.created',
    metadata: { sector: input.sector, templateKey: input.templateKey, title: input.title ?? null },
    ip: getClientIp(req),
    userAgent: getUserAgent(req),
  })

  return NextResponse.json({ ok: true, id: inserted.id })
}
