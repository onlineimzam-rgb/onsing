/**
 * GET   /api/tenant — current tenant snapshot (name + settings).
 * PATCH /api/tenant — update name / settings (merged shallow into JSON).
 *
 * MVP behaviour: any authenticated user belonging to the tenant can edit. We
 * will tighten this to `owner/admin` when the membership UI lands.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '@/db'
import type { TenantSettings } from '@/db/schema'
import { requireUser, loadTenant } from '@/lib/session'
import { appendAudit } from '@/lib/audit'
import { getClientIp, getUserAgent } from '@/lib/ip'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const PatchSchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  settings: z
    .object({
      legalName: z.string().trim().max(200).optional(),
      taxId: z.string().trim().max(40).optional(),
      taxOffice: z.string().trim().max(120).optional(),
      address: z.string().trim().max(500).optional(),
      city: z.string().trim().max(120).optional(),
      phone: z.string().trim().max(40).optional(),
      email: z.string().trim().email().or(z.literal('')).optional(),
      website: z.string().trim().max(200).optional(),
      competentCourt: z.string().trim().max(120).optional(),
      brokerageLicenseNo: z.string().trim().max(120).optional(),
      defaultLocale: z.enum(['tr', 'en']).optional(),
      brand: z
        .object({
          logoUrl: z.string().trim().max(500).optional(),
          primaryColor: z.string().trim().max(20).optional(),
          senderName: z.string().trim().max(120).optional(),
          senderEmail: z.string().trim().max(200).optional(),
        })
        .partial()
        .optional(),
    })
    .partial()
    .optional(),
})

export async function GET() {
  const session = await requireUser()
  if (session instanceof NextResponse) return session

  const tenant = await loadTenant(session.tenantId)
  if (!tenant) {
    return NextResponse.json({ ok: false, error: { code: 'not_found' } }, { status: 404 })
  }

  return NextResponse.json({
    ok: true,
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
      settings: (tenant.settings ?? {}) as TenantSettings,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    },
  })
}

export async function PATCH(req: NextRequest) {
  const session = await requireUser()
  if (session instanceof NextResponse) return session

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: { code: 'bad_json' } }, { status: 400 })
  }

  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: 'validation', message: parsed.error.message } },
      { status: 422 }
    )
  }

  const current = await loadTenant(session.tenantId)
  if (!current) {
    return NextResponse.json({ ok: false, error: { code: 'not_found' } }, { status: 404 })
  }

  // shallow merge settings (brand goes one level deeper)
  const currentSettings = (current.settings ?? {}) as TenantSettings
  const incoming = parsed.data.settings ?? {}
  const mergedSettings: TenantSettings = {
    ...currentSettings,
    ...incoming,
    brand: {
      ...(currentSettings.brand ?? {}),
      ...(incoming.brand ?? {}),
    },
  }

  // strip empty strings → undefined to keep the JSON tidy
  for (const k of Object.keys(mergedSettings) as Array<keyof TenantSettings>) {
    const v = mergedSettings[k]
    if (typeof v === 'string' && v === '') (mergedSettings as Record<string, unknown>)[k as string] = undefined
  }

  const [updated] = await db
    .update(schema.tenants)
    .set({
      name: parsed.data.name ?? current.name,
      settings: mergedSettings,
      updatedAt: new Date(),
    })
    .where(eq(schema.tenants.id, session.tenantId))
    .returning({
      id: schema.tenants.id,
      name: schema.tenants.name,
      slug: schema.tenants.slug,
      plan: schema.tenants.plan,
      settings: schema.tenants.settings,
      updatedAt: schema.tenants.updatedAt,
    })

  await appendAudit({
    tenantId: session.tenantId,
    actorId: session.userId,
    entityKind: 'tenant',
    entityId: session.tenantId,
    eventType: 'tenant.updated',
    metadata: {
      nameChanged: parsed.data.name != null && parsed.data.name !== current.name,
      settingsKeys: Object.keys(incoming),
    },
    ip: getClientIp(req),
    userAgent: getUserAgent(req),
  })

  return NextResponse.json({ ok: true, tenant: updated })
}
