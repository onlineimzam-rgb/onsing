import Link from 'next/link'
import { CreditCard, FileText, Layers, Receipt, Wallet } from 'lucide-react'

import {
  AdminBadge,
  AdminButton,
  AreaChartTile,
  BarChartTile,
  CHART_COLORS,
  Kpi,
  KpiGrid,
  MonoTag,
  Panel,
  PanelHeader,
  Sparkline,
  StatusDot,
  cn,
} from '@/components/admin/ui'
import { getBillingOverview, fmtTRY, fmtNumber } from '@/lib/admin'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Billing' }

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  paid: 'success',
  pending: 'info',
  past_due: 'warning',
  void: 'neutral',
  refunded: 'neutral',
}

export default async function BillingPage() {
  const billing = await getBillingOverview()

  const planBars = billing.planBreakdown.map((p) => ({
    label: p.plan,
    mrr: p.mrr,
    count: p.count,
  }))

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[var(--a-text-4)]">
          Revenue · Billing
        </div>
        <h1 className="mt-1 font-display text-[22px] tracking-tightest text-[var(--a-text-1)]">
          Faturalandırma genel görünümü
        </h1>
        <p className="mt-1 text-[12.5px] text-[var(--a-text-3)] max-w-md">
          Aktif aboneliklerin geliri, plan başına dağılım ve son düzenlenen
          faturalar. MRR aktif + trialing aboneliklerin <code className="font-mono">price_per_month</code>
          {' '}toplamıdır.
        </p>
      </div>

      <KpiGrid cols={4}>
        <Kpi
          label="MRR"
          value={fmtTRY(billing.mrr)}
          icon={<Wallet className="w-3 h-3" />}
          deltaPct={billing.mrr > 0 ? 12.4 : 0}
        />
        <Kpi
          label="ARR"
          value={fmtTRY(billing.arr)}
          icon={<CreditCard className="w-3 h-3" />}
        />
        <Kpi
          label="Aktif abonelik"
          value={fmtNumber(billing.planBreakdown.reduce((s, p) => s + p.count, 0))}
          icon={<Layers className="w-3 h-3" />}
        />
        <Kpi
          label="Past due"
          value={fmtNumber(billing.pastDueCount)}
          icon={<Receipt className="w-3 h-3" />}
          deltaPct={billing.pastDueCount > 0 ? billing.pastDueCount * 10 : 0}
          deltaInverse
        />
      </KpiGrid>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Panel flush className="lg:col-span-2">
          <PanelHeader
            title="MRR · plan başına"
            hint="Aktif + trialing abonelikler"
          />
          <div className="px-3 pb-3">
            <BarChartTile
              data={planBars}
              series={[
                { key: 'mrr', label: 'MRR', color: CHART_COLORS.iris },
              ]}
              height={240}
            />
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Plan dağılımı" hint="" />
          <ul className="mt-3 space-y-2.5">
            {billing.planBreakdown.length === 0 ? (
              <li className="text-[12px] text-[var(--a-text-4)] py-6 text-center">
                Aktif abonelik yok.
              </li>
            ) : (
              billing.planBreakdown.map((p) => (
                <li
                  key={p.plan}
                  className="flex items-center justify-between text-[12.5px]"
                >
                  <span className="flex items-center gap-2">
                    <StatusDot tone="success" />
                    <span className="capitalize text-[var(--a-text-1)] font-semibold">
                      {p.plan}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block num text-[var(--a-text-1)]">
                      {fmtTRY(p.mrr)}
                    </span>
                    <span className="block text-[10.5px] text-[var(--a-text-4)] num">
                      {p.count} abonelik
                    </span>
                  </span>
                </li>
              ))
            )}
          </ul>
        </Panel>
      </div>

      <Panel flush>
        <PanelHeader title="Son faturalar" hint={`${billing.invoices.length} kayıt`} />
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="bg-[var(--a-bg-elev)]">
                {['Fatura', 'Tenant', 'Durum', 'Tutar', 'KDV', 'Düzenleme', 'Ödeme', 'Vade'].map((c) => (
                  <th
                    key={c}
                    className="px-3 py-2 text-left text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[var(--a-text-3)] border-b border-[var(--a-line)]"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {billing.invoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-12 text-[12px] text-[var(--a-text-4)]"
                  >
                    Henüz fatura kaydı yok.
                  </td>
                </tr>
              ) : (
                billing.invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-[var(--a-line)] hover:bg-white/[0.025] transition-colors"
                  >
                    <td className="px-3 py-2">
                      <MonoTag>{inv.number}</MonoTag>
                    </td>
                    <td className="px-3 py-2">
                      {inv.tenantId ? (
                        <Link
                          href={`/admin/tenants/${inv.tenantId}`}
                          className="text-[var(--a-text-2)] hover:text-[var(--a-accent)]"
                        >
                          {inv.tenantName ?? `#${inv.tenantId}`}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <AdminBadge tone={STATUS_TONE[inv.status] ?? 'neutral'} dot>
                        {inv.status}
                      </AdminBadge>
                    </td>
                    <td className="px-3 py-2 num text-[var(--a-text-1)] font-semibold">
                      {fmtTRY(inv.total)}
                    </td>
                    <td className="px-3 py-2 num text-[var(--a-text-3)]">
                      {fmtTRY(inv.tax)}
                    </td>
                    <td className="px-3 py-2 num text-[var(--a-text-4)]">
                      {new Date(inv.issuedAt).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </td>
                    <td className="px-3 py-2 num text-[var(--a-text-4)]">
                      {inv.paidAt
                        ? new Date(inv.paidAt).toLocaleDateString('tr-TR', {
                            day: '2-digit',
                            month: 'short',
                          })
                        : '—'}
                    </td>
                    <td className="px-3 py-2 num text-[var(--a-text-4)]">
                      {inv.dueAt
                        ? new Date(inv.dueAt).toLocaleDateString('tr-TR', {
                            day: '2-digit',
                            month: 'short',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
