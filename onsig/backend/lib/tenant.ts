/**
 * Single-tenant bootstrap helper (ADR-005).
 *
 * During MVP we operate on one default tenant. This helper ensures the tenant
 * row exists at startup and returns its id. Once we ship the multi-tenant UI,
 * routes will resolve `tenantId` from the auth token (membership table) instead.
 */

import { eq } from 'drizzle-orm'
import { db, schema } from '@/db'

const DEFAULT_SLUG = 'default'

let cachedTenantId: number | null = null

export async function getDefaultTenantId(): Promise<number> {
  if (cachedTenantId != null) return cachedTenantId

  const existing = await db
    .select({ id: schema.tenants.id })
    .from(schema.tenants)
    .where(eq(schema.tenants.slug, DEFAULT_SLUG))
    .limit(1)

  if (existing.length > 0) {
    cachedTenantId = existing[0]!.id
    return cachedTenantId
  }

  const [created] = await db
    .insert(schema.tenants)
    .values({
      slug: DEFAULT_SLUG,
      name: process.env.DEFAULT_TENANT_NAME || 'OnSig Default',
      plan: 'pro',
      settings: {
        competentCourt: process.env.DEFAULT_TENANT_COMPETENT_COURT || 'İZMİR',
        brokerageLicenseNo: process.env.DEFAULT_TENANT_BROKERAGE_LICENSE || '',
        defaultLocale: 'tr',
      },
    })
    .returning({ id: schema.tenants.id })

  cachedTenantId = created!.id
  return cachedTenantId
}

export function invalidateTenantCache(): void {
  cachedTenantId = null
}
