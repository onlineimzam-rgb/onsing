import { listTenants, fmtNumber } from '@/lib/admin'
import { Kpi, KpiGrid, cn } from '@/components/admin/ui'
import { Building2, CreditCard, Hash, ScrollText } from 'lucide-react'
import { TenantsTable } from './TenantsTable'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Tenants' }

export default async function TenantsListPage() {
  const tenants = await listTenants()

  const totals = {
    tenants: tenants.length,
    contracts: tenants.reduce((s, t) => s + t.contractsTotal, 0),
    contracts30: tenants.reduce((s, t) => s + t.contractsLast30d, 0),
    mrr: tenants.reduce((s, t) => s + t.subscriptionPriceTRY, 0),
  }

  const rows = tenants

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[var(--a-text-4)]">
          Operations · Tenants
        </div>
        <h1 className="mt-1 font-display text-[22px] tracking-tightest text-[var(--a-text-1)]">
          Tüm tenants
        </h1>
        <p className="mt-1 text-[12.5px] text-[var(--a-text-3)] max-w-md">
          Tablo doğrudan Postgres&apos;ten okunuyor. Arama, plan filtresi ve toplu
          aksiyonlar destekleniyor.
        </p>
      </div>

      <KpiGrid cols={4}>
        <Kpi
          label="Tenant"
          value={fmtNumber(totals.tenants)}
          icon={<Building2 className="w-3 h-3" />}
        />
        <Kpi
          label="Sözleşme · 30g"
          value={fmtNumber(totals.contracts30)}
          icon={<ScrollText className="w-3 h-3" />}
        />
        <Kpi
          label="Toplam sözleşme"
          value={fmtNumber(totals.contracts)}
          icon={<Hash className="w-3 h-3" />}
        />
        <Kpi
          label="MRR (sum)"
          value={new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            maximumFractionDigits: 0,
          }).format(totals.mrr)}
          icon={<CreditCard className="w-3 h-3" />}
        />
      </KpiGrid>

      <TenantsTable rows={rows} />
    </div>
  )
}
