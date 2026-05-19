import { desc } from 'drizzle-orm'
import { db, schema } from '@/db'
import { FeatureFlagsTable, FlagRow } from './FeatureFlagsTable'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Feature flags' }

export default async function FeatureFlagsPage() {
  const flags = await db
    .select()
    .from(schema.featureFlags)
    .orderBy(desc(schema.featureFlags.updatedAt))

  const rows: FlagRow[] = flags.map((f) => ({
    id: f.id,
    key: f.key,
    description: f.description ?? null,
    enabled: f.enabled,
    tenantId: f.tenantId ?? null,
    rolloutPct: f.rolloutPct,
    updatedAt: f.updatedAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[var(--a-text-4)]">
          System · Feature flags
        </div>
        <h1 className="mt-1 font-display text-[22px] tracking-tightest text-[var(--a-text-1)]">
          Özellik bayrakları
        </h1>
        <p className="mt-1 text-[12.5px] text-[var(--a-text-3)] max-w-md">
          Yayınları aşamalı açın/kapayın. Global bayraklar tüm tenant&apos;ları
          etkiler. Tenant-scope bayraklar tek bir kuruma hedeflenir.
        </p>
      </div>
      <FeatureFlagsTable initial={rows} />
    </div>
  )
}
