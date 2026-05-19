/**
 * GET  /api/contracts/[id]/pdf  — generate (or fetch cached) PDF and stream it.
 *
 * Behaviour:
 *   1. If a `documents` row of kind=`pdf` exists, return its bytes from storage.
 *   2. Otherwise render a fresh PDF using current rendered text + signatures,
 *      persist it under `tenant-N/contracts/M/contract.pdf`, write a `documents`
 *      row + audit log, then stream the bytes.
 *
 * Query params:
 *   ?force=1   → regenerate even when cached (used after edits).
 */

import { NextResponse, type NextRequest } from 'next/server'
import { and, desc, eq, max } from 'drizzle-orm'
import { db, schema } from '@/db'
import { requireUser, loadTenant } from '@/lib/session'
import { appendAudit } from '@/lib/audit'
import { getClientIp, getUserAgent } from '@/lib/ip'
import {
  buildContextFromTenant,
  getContractById,
  loadBranch,
  mergeForm,
} from '@/lib/contracts'
import { generateContractPdf } from '@/lib/pdf'
import { readBytes, saveBytes } from '@/lib/storage'
import {
  buildContractText,
  contractTitle,
  SIGNER_ROLE_LABELS,
  type RealEstateTemplateKey,
  type SignerRole,
} from '@shared/contracts'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function parseId(raw: string): number | null {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireUser()
  if (session instanceof NextResponse) return session

  const id = parseId(params.id)
  if (!id) return NextResponse.json({ ok: false, error: { code: 'bad_id' } }, { status: 400 })

  const force = new URL(req.url).searchParams.get('force') === '1'

  const contract = await getContractById(session.tenantId, id)
  if (!contract) return NextResponse.json({ ok: false, error: { code: 'not_found' } }, { status: 404 })

  // Use newest cached doc unless:
  //   • ?force=1
  //   • contract.updatedAt > cached.createdAt   (form edited)
  //   • max(signSessions.signedAt) > cached.createdAt  (a new signer signed)
  if (!force) {
    const cached = await db
      .select()
      .from(schema.documents)
      .where(and(eq(schema.documents.contractId, id), eq(schema.documents.kind, 'pdf')))
      .orderBy(desc(schema.documents.id))
      .limit(1)

    if (cached.length > 0 && cached[0]!.storageUrl) {
      const cachedAt = cached[0]!.createdAt
      const contractTouched = contract.updatedAt > cachedAt

      const [lastSigRow] = await db
        .select({ max: max(schema.signSessions.signedAt) })
        .from(schema.signSessions)
        .where(eq(schema.signSessions.contractId, id))
      const lastSignedAt = lastSigRow?.max ? new Date(lastSigRow.max as unknown as string) : null
      const sigTouched = lastSignedAt ? lastSignedAt > cachedAt : false

      if (!contractTouched && !sigTouched) {
        const rel = cached[0]!.storageUrl.replace(/^\/api\/files\//, '')
        const file = await readBytes(rel)
        if (file) {
          return new NextResponse(new Uint8Array(file.data), {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="sozlesme-${id}.pdf"`,
              'X-OnSig-Cached': '1',
              'X-OnSig-Sha256': cached[0]!.sha256Hex,
            },
          })
        }
      }
    }
  }

  const tenant = await loadTenant(session.tenantId)
  if (!tenant) {
    return NextResponse.json({ ok: false, error: { code: 'tenant_missing' } }, { status: 500 })
  }

  const branch = await loadBranch(session.tenantId, contract.branchId)
  const form = mergeForm(contract.form, { templateKey: contract.templateKey as never })
  const ctx = buildContextFromTenant(tenant, branch)
  const body = buildContractText(form, ctx)
  const formAny = form as { customTitle?: string }
  const title = contractTitle(
    contract.templateKey as RealEstateTemplateKey,
    formAny.customTitle
  )

  // Only include *completed* sign sessions in the PDF — cancelled / expired /
  // pending ones must not appear in the signature grid.
  const sessions = await db
    .select()
    .from(schema.signSessions)
    .where(
      and(
        eq(schema.signSessions.contractId, id),
        eq(schema.signSessions.status, 'imzalandi')
      )
    )
    .orderBy(schema.signSessions.id)

  const signatures = sessions.map((s) => ({
    role: s.role,
    roleLabel: SIGNER_ROLE_LABELS[s.role as SignerRole] ?? s.role,
    signerName: s.recipientName,
    signerTcLast4: s.signerTc ? s.signerTc.slice(-4) : null,
    signedAt: s.signedAt,
    signaturePng: s.signaturePng,
  }))

  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/d/`

  const pdfBytes = await generateContractPdf({
    contractId: contract.id,
    title,
    body,
    tenantName: tenant.name,
    signatures,
    verificationUrl,
  })

  const stored = await saveBytes({
    tenantId: session.tenantId,
    scope: `contracts/${contract.id}`,
    filename: 'contract.pdf',
    data: pdfBytes,
    contentType: 'application/pdf',
  })

  const [doc] = await db
    .insert(schema.documents)
    .values({
      tenantId: session.tenantId,
      contractId: contract.id,
      kind: 'pdf',
      storageUrl: stored.storageUrl,
      sha256Hex: stored.sha256Hex,
      sizeBytes: stored.sizeBytes,
    })
    .returning({ id: schema.documents.id })

  await appendAudit({
    tenantId: session.tenantId,
    actorId: session.userId,
    entityKind: 'document',
    entityId: doc!.id,
    eventType: 'pdf.generated',
    metadata: {
      contractId: contract.id,
      sha256: stored.sha256Hex,
      sizeBytes: stored.sizeBytes,
      regenerated: force,
    },
    ip: getClientIp(req),
    userAgent: getUserAgent(req),
  })

  return new NextResponse(new Uint8Array(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="sozlesme-${id}.pdf"`,
      'X-OnSig-Sha256': stored.sha256Hex,
      'X-OnSig-Generated': new Date().toISOString(),
    },
  })
}
