/**
 * GET /api/d/[hash]  — public verification endpoint.
 *
 * Anyone with a PDF's SHA-256 fingerprint can verify:
 *   - which contract it belongs to
 *   - who signed and when (masked T.C., IP redacted to /16)
 *   - that the audit chain hasn't been tampered with up to the relevant entries
 *
 * Sensitive fields (full IPs, raw signature PNG, contract body) are NOT returned.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { and, asc, eq } from 'drizzle-orm'
import { db, schema } from '@/db'
import { verifyAuditChain } from '@/lib/audit'
import { SIGNER_ROLE_LABELS, contractTitle, type RealEstateTemplateKey, type SignerRole } from '@shared/contracts'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function maskIp(ip: string | null): string | null {
  if (!ip) return null
  // IPv4: keep first two octets, IPv6: keep first two groups
  if (ip.includes('.')) {
    const parts = ip.split('.')
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.*.*`
  }
  if (ip.includes(':')) {
    const parts = ip.split(':')
    return parts.slice(0, 2).join(':') + ':****'
  }
  return ip
}

function maskTc(tc: string | null): string | null {
  if (!tc) return null
  return `*******${tc.slice(-4)}`
}

export async function GET(_req: NextRequest, { params }: { params: { hash: string } }) {
  const hash = (params.hash || '').trim().toLowerCase()
  if (!/^[a-f0-9]{64}$/.test(hash)) {
    return NextResponse.json({ ok: false, error: { code: 'invalid_hash' } }, { status: 400 })
  }

  const [doc] = await db
    .select()
    .from(schema.documents)
    .where(and(eq(schema.documents.sha256Hex, hash), eq(schema.documents.kind, 'pdf')))
    .orderBy(schema.documents.id)
    .limit(1)

  if (!doc) {
    return NextResponse.json({ ok: false, error: { code: 'not_found' } }, { status: 404 })
  }

  const [contract] = await db
    .select()
    .from(schema.contracts)
    .where(eq(schema.contracts.id, doc.contractId!))
    .limit(1)
  if (!contract) {
    return NextResponse.json({ ok: false, error: { code: 'orphan' } }, { status: 500 })
  }

  const [tenant] = await db
    .select({ name: schema.tenants.name })
    .from(schema.tenants)
    .where(eq(schema.tenants.id, doc.tenantId))
    .limit(1)

  const sessions = await db
    .select()
    .from(schema.signSessions)
    .where(eq(schema.signSessions.contractId, contract.id))
    .orderBy(asc(schema.signSessions.id))

  const audits = await db
    .select()
    .from(schema.auditLogs)
    .where(eq(schema.auditLogs.tenantId, doc.tenantId))
    .orderBy(asc(schema.auditLogs.id))

  // Filter only events relevant to this contract + cap at 200
  const filtered = audits
    .filter(
      (a) =>
        (a.entityKind === 'contract' && a.entityId === contract.id) ||
        (a.entityKind === 'sign_session' &&
          sessions.some((s) => s.id === a.entityId)) ||
        (a.entityKind === 'document' && a.entityId === doc.id)
    )
    .slice(-200)

  const chain = await verifyAuditChain(doc.tenantId)

  return NextResponse.json({
    ok: true,
    document: {
      id: doc.id,
      sha256: doc.sha256Hex,
      sizeBytes: doc.sizeBytes,
      createdAt: doc.createdAt,
    },
    contract: {
      id: contract.id,
      title: contract.title,
      templateKey: contract.templateKey,
      templateTitle: contractTitle(contract.templateKey as RealEstateTemplateKey),
      status: contract.status,
      createdAt: contract.createdAt,
    },
    tenant: tenant?.name ?? null,
    auditChain: {
      ok: chain.ok,
      brokenAt: chain.brokenAt,
      totalEntries: chain.count,
      relevantEntries: filtered.length,
    },
    signatures: sessions.map((s) => ({
      role: s.role,
      roleLabel: SIGNER_ROLE_LABELS[s.role as SignerRole] ?? s.role,
      status: s.status,
      signerName: s.recipientName,
      signerTcMasked: maskTc(s.signerTc),
      signedAt: s.signedAt,
      ipMasked: maskIp(s.signerIp),
      userAgent: s.signerUserAgent ?? null,
      geoApprox:
        s.signerGeoLat && s.signerGeoLng
          ? { lat: s.signerGeoLat.slice(0, 6), lng: s.signerGeoLng.slice(0, 6) }
          : null,
      acceptedTerms: s.signerAcceptedTerms,
      acceptedKvkk: s.signerAcceptedKvkk,
    })),
    events: filtered.map((a) => ({
      id: a.id,
      seq: a.id,
      eventType: a.eventType,
      entityKind: a.entityKind,
      entityId: a.entityId,
      createdAt: a.createdAt,
      ipMasked: maskIp(a.ip),
    })),
  })
}
