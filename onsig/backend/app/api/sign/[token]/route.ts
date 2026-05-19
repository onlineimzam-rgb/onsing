/**
 * GET  /api/sign/[token]  — public; returns contract text + session status.
 * POST /api/sign/[token]  — public; finalize signature (canvas PNG + consent).
 *
 * No login required. The token itself is the credential. Audit entries
 * track every open, OTP attempt, and final signature.
 *
 * On final sign the parent contract is auto-completed once **all** sessions
 * are signed; the contract's renderedText is refreshed with tenant context.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db, schema } from '@/db'
import { appendAudit } from '@/lib/audit'
import { getClientIp, getUserAgent } from '@/lib/ip'
import { rateLimitOrBlock } from '@/lib/rate-limit'
import { env } from '@/lib/env'
import {
  buildContextFromTenant,
  mergeForm,
} from '@/lib/contracts'
import { buildContractText, contractTitle, SIGNER_ROLE_LABELS, type RealEstateTemplateKey, type SignerRole } from '@shared/contracts'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_SIG_LEN = 900_000 // ~675 KB base64 → ~500 KB PNG, plenty for ink

// ---------------------------------------------------------------------------
// GET — show contract + status
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const token = (params.token || '').trim()
  if (!token || token.length > 96) {
    return NextResponse.json({ ok: false, error: { code: 'invalid_token' } }, { status: 400 })
  }

  const [s] = await db
    .select()
    .from(schema.signSessions)
    .where(eq(schema.signSessions.token, token))
    .limit(1)

  if (!s) return NextResponse.json({ ok: false, error: { code: 'not_found' } }, { status: 404 })

  const [contract] = await db
    .select()
    .from(schema.contracts)
    .where(eq(schema.contracts.id, s.contractId))
    .limit(1)

  const [tenant] = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.id, s.tenantId))
    .limit(1)

  if (!contract || !tenant) {
    return NextResponse.json({ ok: false, error: { code: 'corrupt' } }, { status: 500 })
  }

  // Idempotent first-open audit — only when status is still "bekliyor"
  if (s.status === 'bekliyor' && !s.otpVerifiedAt) {
    await appendAudit({
      tenantId: s.tenantId,
      actorId: null,
      entityKind: 'sign_session',
      entityId: s.id,
      eventType: 'session.opened',
      metadata: { contractId: s.contractId, role: s.role },
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
    })
  }

  const form = mergeForm(contract.form, { templateKey: contract.templateKey as never })
  const ctx = buildContextFromTenant(tenant)
  const text = buildContractText(form, ctx)

  // Mask the signature PNG out — only return when actually signed
  const signaturePng = s.status === 'imzalandi' && s.signaturePng ? s.signaturePng : null

  return NextResponse.json({
    ok: true,
    title: contractTitle(contract.templateKey as RealEstateTemplateKey),
    body: text,
    contract: {
      id: contract.id,
      sector: contract.sector,
      templateKey: contract.templateKey,
      status: contract.status,
      title: contract.title,
    },
    session: {
      id: s.id,
      role: s.role,
      roleLabel: SIGNER_ROLE_LABELS[s.role as SignerRole] ?? s.role,
      status: s.status,
      recipientName: s.recipientName,
      recipientEmail: s.recipientEmail,
      recipientPhone: s.recipientPhone,
      otpVerifiedAt: s.otpVerifiedAt,
      signedAt: s.signedAt,
      expiresAt: s.expiresAt,
      signerName: null,
      signerTc: null,
      signaturePng,
    },
    tenant: {
      name: tenant.name,
      brand: (tenant.settings as { brand?: { logoUrl?: string | null; primaryColor?: string | null } })?.brand ?? null,
    },
  })
}

// ---------------------------------------------------------------------------
// POST — final signature submit
// ---------------------------------------------------------------------------
const SignBody = z.object({
  signerName: z.string().trim().min(3, 'Ad Soyad en az 3 karakter olmalı.').max(200),
  signerTc: z
    .string()
    .trim()
    .regex(/^\d{11}$/, 'T.C. Kimlik No 11 rakam olmalı.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  signerEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email()
    .optional()
    .or(z.literal('').transform(() => undefined)),
  signerPhone: z.string().trim().max(40).optional().or(z.literal('').transform(() => undefined)),
  signaturePng: z.string().min(50).max(MAX_SIG_LEN),
  acceptedTerms: z.literal(true, { errorMap: () => ({ message: 'Sözleşmeyi okuduğunuzu onaylamalısınız.' }) }),
  acceptedKvkk: z.literal(true, { errorMap: () => ({ message: 'KVKK aydınlatma metnini onaylamalısınız.' }) }),
  geo: z
    .object({ lat: z.string().max(32), lng: z.string().max(32) })
    .optional()
    .nullable(),
})

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const token = (params.token || '').trim()
  if (!token || token.length > 96) {
    return NextResponse.json({ ok: false, error: { code: 'invalid_token' } }, { status: 400 })
  }

  // Public endpoint — defend the bandwidth + signature submit endpoint.
  // We rate-limit by IP first (cheap), then by token to prevent a single token
  // from being battered with malformed signatures.
  const sigIp = getClientIp(req)
  const sigIpBlock = await rateLimitOrBlock({
    key: `sign:ip:${sigIp}`,
    limit: env.RATE_LIMIT_PUBLIC_SIGN_PER_MIN,
    windowSec: 60,
  })
  if (sigIpBlock) return sigIpBlock
  const sigTokenBlock = await rateLimitOrBlock({
    key: `sign:token:${token}`,
    limit: 5, // a real signer needs 1 successful submit
    windowSec: 60,
  })
  if (sigTokenBlock) return sigTokenBlock

  let body: z.infer<typeof SignBody>
  try {
    body = SignBody.parse(await req.json())
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.errors[0]?.message : (e as Error).message
    return NextResponse.json(
      { ok: false, error: { code: 'invalid_input', message: msg || 'Geçersiz veri.' } },
      { status: 400 }
    )
  }

  const [existing] = await db
    .select()
    .from(schema.signSessions)
    .where(eq(schema.signSessions.token, token))
    .limit(1)

  if (!existing) return NextResponse.json({ ok: false, error: { code: 'not_found' } }, { status: 404 })
  if (existing.status !== 'bekliyor') {
    return NextResponse.json(
      { ok: false, error: { code: 'already_done', message: 'Bu bağlantı kullanılmış veya iptal edilmiş.' } },
      { status: 409 }
    )
  }
  if (existing.expiresAt && existing.expiresAt < new Date()) {
    await db
      .update(schema.signSessions)
      .set({ status: 'expired' })
      .where(eq(schema.signSessions.id, existing.id))
    return NextResponse.json(
      { ok: false, error: { code: 'expired', message: 'Bu bağlantının süresi dolmuş.' } },
      { status: 410 }
    )
  }
  if (!existing.otpVerifiedAt) {
    return NextResponse.json(
      { ok: false, error: { code: 'otp_required', message: 'Önce doğrulama kodunu girmelisiniz.' } },
      { status: 412 }
    )
  }

  // Normalize PNG → strip data-URL prefix; persist raw base64
  let png = body.signaturePng.trim()
  if (png.startsWith('data:image')) {
    const parts = png.split(',')
    png = parts.length > 1 ? parts[1]! : png
  }

  const ip = getClientIp(req)
  const ua = getUserAgent(req)

  await db
    .update(schema.signSessions)
    .set({
      status: 'imzalandi',
      recipientName: existing.recipientName ?? body.signerName,
      recipientEmail: existing.recipientEmail ?? body.signerEmail ?? null,
      recipientPhone: existing.recipientPhone ?? body.signerPhone ?? null,
      signaturePng: png,
      signerTc: body.signerTc ?? null,
      signerIp: ip,
      signerUserAgent: ua,
      signerGeoLat: body.geo?.lat ?? null,
      signerGeoLng: body.geo?.lng ?? null,
      signerAcceptedTerms: true,
      signerAcceptedKvkk: true,
      signedAt: new Date(),
    })
    .where(eq(schema.signSessions.id, existing.id))

  await appendAudit({
    tenantId: existing.tenantId,
    actorId: null,
    entityKind: 'sign_session',
    entityId: existing.id,
    eventType: 'session.signed',
    metadata: {
      contractId: existing.contractId,
      role: existing.role,
      signerName: body.signerName,
      signerTcLast4: body.signerTc?.slice(-4) ?? null,
    },
    ip,
    userAgent: ua,
    geo: body.geo ?? null,
  })

  // Auto-complete contract once every session is signed.
  const pending = await db
    .select({ id: schema.signSessions.id })
    .from(schema.signSessions)
    .where(
      and(
        eq(schema.signSessions.contractId, existing.contractId),
        eq(schema.signSessions.status, 'bekliyor')
      )
    )
    .limit(1)

  if (pending.length === 0) {
    await db
      .update(schema.contracts)
      .set({ status: 'tamamlandi', updatedAt: new Date() })
      .where(eq(schema.contracts.id, existing.contractId))

    await appendAudit({
      tenantId: existing.tenantId,
      actorId: null,
      entityKind: 'contract',
      entityId: existing.contractId,
      eventType: 'contract.completed',
      metadata: { sessionId: existing.id },
      ip,
      userAgent: ua,
    })
  }

  return NextResponse.json({ ok: true, signedAt: new Date() })
}
