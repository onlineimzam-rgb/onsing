import Link from 'next/link'
import {
  Activity,
  ArrowUpRight,
  Building2,
  CreditCard,
  FileSignature,
  Flame,
  Gauge,
  Hash,
  Layers,
  ScrollText,
  ShieldAlert,
  Users,
} from 'lucide-react'

import {
  AdminBadge,
  AdminButton,
  AreaChartTile,
  BarChartTile,
  CHART_COLORS,
  DonutTile,
  Kpi,
  KpiGrid,
  Panel,
  PanelHeader,
  Sparkline,
  StatusDot,
  AdminAvatar,
  MonoTag,
  cn,
} from '@/components/admin/ui'

import {
  getPlatformOverview,
  fmtTRY,
  fmtNumber,
  listGlobalAudit,
  listRiskEvents,
  listTenants,
} from '@/lib/admin'
import { LiveTicker, HealthProbes } from './_components/LiveTicker'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Overview' }

export default async function AdminOverviewPage() {
  const [overview, audit, risk, tenants] = await Promise.all([
    getPlatformOverview(),
    listGlobalAudit(8),
    listRiskEvents(5),
    listTenants(),
  ])

  const topTenants = [...tenants]
    .sort((a, b) => b.contractsLast30d - a.contractsLast30d)
    .slice(0, 6)

  const planMixData = overview.planMix.map((p, i) => ({
    name: p.plan,
    value: p.count,
    color: PLAN_COLOR[p.plan] ?? CHART_COLORS.slate,
  }))

  return (
    <div className="space-y-6">
      {/* Hero strip */}
      <div className="relative overflow-hidden rounded-[12px] bg-[var(--a-panel)] ring-1 ring-[var(--a-line)]">
        <div className="absolute inset-0 a-grid opacity-50" aria-hidden />
        <div className="absolute -right-20 -top-24 w-[340px] h-[340px] rounded-full bg-[var(--a-accent-2)] opacity-15 blur-3xl" aria-hidden />
        <div className="relative px-6 py-6 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[var(--a-text-4)]">
              OnSig · Platform overview
            </div>
            <h1 className="mt-1 font-display text-[26px] tracking-tightest text-[var(--a-text-1)]">
              Tüm tenant&apos;lar, tek bakışta
            </h1>
            <p className="mt-1.5 text-[12.5px] text-[var(--a-text-3)] max-w-md leading-relaxed">
              Son 30 günün özet metrikleri. Tablolar canlı, sayılar Postgres&apos;ten,
              audit kayıtları zincirlenmiş.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <LiveTicker />
            <div className="flex items-center gap-1.5">
              <AdminButton variant="secondary" size="sm">
                <Hash className="w-3 h-3" />
                Snapshot kopyala
              </AdminButton>
              <AdminButton variant="primary" size="sm">
                <Flame className="w-3 h-3" />
                Incident başlat
              </AdminButton>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <KpiGrid cols={4}>
        <Kpi
          label="MRR"
          value={fmtTRY(overview.mrrTRY)}
          hint={`ARR ${fmtTRY(overview.arrTRY)}`}
          icon={<CreditCard className="w-3 h-3" />}
          deltaPct={overview.mrrTRY > 0 ? 12.4 : 0}
          chart={
            <Sparkline
              values={overview.contractsPerDay.map((d) => d.value)}
              width={220}
              height={32}
              stroke={CHART_COLORS.teal}
              fill="rgba(45, 212, 191, 0.18)"
            />
          }
        />
        <Kpi
          label="Active tenants"
          value={fmtNumber(overview.tenants.total)}
          hint={`+${overview.tenants.lastWeek} bu hafta`}
          icon={<Building2 className="w-3 h-3" />}
          deltaPct={6.1}
        />
        <Kpi
          label="Signatures · 30g"
          value={fmtNumber(overview.contracts.signedLast30d)}
          hint={`bugün ${overview.signSessions.signedToday}`}
          icon={<FileSignature className="w-3 h-3" />}
          deltaPct={18.7}
          chart={
            <Sparkline
              values={overview.signaturesPerDay.map((d) => d.value)}
              width={220}
              height={32}
              stroke={CHART_COLORS.iris}
              fill="rgba(124, 119, 255, 0.15)"
            />
          }
        />
        <Kpi
          label="Churn"
          value={`${overview.churnPct.toFixed(1)}%`}
          hint="son 30 gün"
          icon={<Gauge className="w-3 h-3" />}
          deltaPct={overview.churnPct > 0 ? -overview.churnPct : 0}
          deltaInverse
        />
      </KpiGrid>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Panel flush className="lg:col-span-2">
          <PanelHeader
            title="İmza akışı"
            hint="Günlük imza & sözleşme — son 30 gün"
            actions={
              <div className="flex items-center gap-3">
                <LegendDot color={CHART_COLORS.iris} label="İmzalar" />
                <LegendDot color={CHART_COLORS.teal} label="Sözleşmeler" />
              </div>
            }
          />
          <div className="px-3 pb-3">
            <AreaChartTile
              data={overview.signaturesPerDay.map((d, i) => ({
                label: d.label,
                signatures: d.value,
                contracts: overview.contractsPerDay[i]?.value ?? 0,
              }))}
              series={[
                { key: 'signatures', label: 'İmzalar', color: CHART_COLORS.iris },
                { key: 'contracts', label: 'Sözleşmeler', color: CHART_COLORS.teal },
              ]}
              height={260}
            />
          </div>
        </Panel>

        <Panel flush>
          <PanelHeader title="Plan dağılımı" hint={`${overview.tenants.total} tenant`} />
          <div className="px-3 pb-3">
            <DonutTile
              data={planMixData}
              centerLabel="Toplam tenant"
              centerValue={fmtNumber(overview.tenants.total)}
            />
          </div>
          <div className="px-4 pb-4 space-y-1.5">
            {planMixData.map((p) => (
              <div
                key={p.name}
                className="flex items-center justify-between text-[12px]"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="block w-2 h-2 rounded-full"
                    style={{ background: p.color }}
                  />
                  <span className="text-[var(--a-text-2)] capitalize">{p.name}</span>
                </span>
                <span className="text-[var(--a-text-3)] num">{p.value}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Activity row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Top tenants */}
        <Panel flush>
          <PanelHeader
            title="Top tenants · 30g"
            hint="İmza üretim hacmine göre"
            actions={
              <Link
                href="/admin/tenants"
                className="text-[11px] font-semibold text-[var(--a-text-3)] hover:text-[var(--a-text-1)] inline-flex items-center gap-1"
              >
                Tümü
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            }
          />
          <div className="px-2 py-2 space-y-0.5">
            {topTenants.length === 0 ? (
              <div className="text-[12px] text-[var(--a-text-4)] px-3 py-6 text-center">
                Henüz tenant aktivitesi yok.
              </div>
            ) : (
              topTenants.map((t) => (
                <Link
                  key={t.id}
                  href={`/admin/tenants/${t.id}`}
                  className="flex items-center justify-between gap-3 px-2.5 py-2 rounded-md hover:bg-white/[0.04] transition-colors"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <AdminAvatar name={t.name} size={26} />
                    <span className="min-w-0">
                      <span className="block text-[12.5px] font-semibold text-[var(--a-text-1)] truncate">
                        {t.name}
                      </span>
                      <span className="block text-[10.5px] text-[var(--a-text-4)] truncate font-mono">
                        @{t.slug}
                      </span>
                    </span>
                  </span>
                  <span className="text-right shrink-0">
                    <span className="block text-[13px] font-semibold text-[var(--a-text-1)] num">
                      {t.contractsLast30d}
                    </span>
                    <span className="block text-[10.5px] text-[var(--a-text-4)] num">
                      {t.contractsTotal} toplam
                    </span>
                  </span>
                </Link>
              ))
            )}
          </div>
        </Panel>

        {/* Audit feed */}
        <Panel flush>
          <PanelHeader
            title="Audit feed"
            hint="Son 8 olay"
            actions={
              <Link
                href="/admin/audit"
                className="text-[11px] font-semibold text-[var(--a-text-3)] hover:text-[var(--a-text-1)] inline-flex items-center gap-1"
              >
                Hepsi
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            }
          />
          <ul className="px-2 py-2 space-y-0.5">
            {audit.length === 0 ? (
              <li className="text-[12px] text-[var(--a-text-4)] px-3 py-6 text-center">
                Henüz audit olayı yok.
              </li>
            ) : (
              audit.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-white/[0.04]"
                >
                  <Activity className="w-3 h-3 text-[var(--a-text-4)]" />
                  <span className="text-[11.5px] font-mono text-[var(--a-text-2)] truncate flex-1">
                    {row.eventType}
                  </span>
                  <span className="text-[10.5px] text-[var(--a-text-4)] truncate max-w-[100px]">
                    {row.tenantName ?? '—'}
                  </span>
                  <MonoTag truncate className="max-w-[80px]">
                    {row.recordHash?.slice(0, 8)}
                  </MonoTag>
                </li>
              ))
            )}
          </ul>
        </Panel>

        {/* Risk + System health stack */}
        <div className="space-y-3">
          <Panel flush>
            <PanelHeader
              title="Risk monitor"
              hint={`${risk.filter((r) => !r.resolvedAt).length} açık`}
              actions={
                <Link
                  href="/admin/risk"
                  className="text-[11px] font-semibold text-[var(--a-text-3)] hover:text-[var(--a-text-1)] inline-flex items-center gap-1"
                >
                  Detay
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              }
            />
            <ul className="px-2 py-2 space-y-0.5">
              {risk.length === 0 ? (
                <li className="flex items-center gap-2 text-[12px] text-[var(--a-text-4)] px-3 py-6">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Hiç risk olayı yok — temizsin.
                </li>
              ) : (
                risk.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-white/[0.04]"
                  >
                    <AdminBadge
                      tone={
                        r.severity === 'critical'
                          ? 'danger'
                          : r.severity === 'high'
                            ? 'warning'
                            : 'info'
                      }
                      dot
                    >
                      {r.severity}
                    </AdminBadge>
                    <span className="text-[11.5px] text-[var(--a-text-2)] truncate flex-1">
                      {r.kind}
                    </span>
                    <span className="text-[10.5px] text-[var(--a-text-4)] shrink-0">
                      {fmtRelative(r.createdAt)}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </Panel>

          <Panel>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[var(--a-text-3)]">
                System health
              </span>
              <Link
                href="/admin/health"
                className="text-[11px] font-semibold text-[var(--a-text-3)] hover:text-[var(--a-text-1)] inline-flex items-center gap-1"
              >
                Detay
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <HealthProbes />
          </Panel>
        </div>
      </div>

      {/* Volume bar chart */}
      <Panel flush>
        <PanelHeader
          title="Tenant aktivitesi"
          hint="Son 30 günde tenant başına oluşturulan sözleşme"
        />
        <div className="px-3 pb-3">
          <BarChartTile
            data={topTenants.map((t) => ({
              label: t.slug,
              contracts: t.contractsLast30d,
            }))}
            series={[
              { key: 'contracts', label: 'Sözleşme', color: CHART_COLORS.iris },
            ]}
            height={220}
          />
        </div>
      </Panel>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────

const PLAN_COLOR: Record<string, string> = {
  free: '#64748B',
  pro: '#7C77FF',
  business: '#2DD4BF',
  enterprise: '#F59E0B',
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--a-text-3)]">
      <span className="block w-2 h-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}

function fmtRelative(d: Date | null | undefined): string {
  if (!d) return '—'
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'şimdi'
  if (m < 60) return `${m}d önce`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}sa önce`
  const day = Math.floor(h / 24)
  return `${day}g önce`
}
