import Link from 'next/link'
import { AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react'
import {
  AdminBadge,
  AdminEmpty,
  Kpi,
  KpiGrid,
  MonoTag,
  Panel,
  PanelHeader,
  StatusDot,
  cn,
} from '@/components/admin/ui'
import { listRiskEvents, fmtNumber } from '@/lib/admin'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Risk monitor' }

const SEVERITY_TONE: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
  low: 'info',
  medium: 'warning',
  high: 'warning',
  critical: 'danger',
}

export default async function RiskMonitorPage() {
  const events = await listRiskEvents(300)

  const counts = {
    open: events.filter((e) => !e.resolvedAt).length,
    critical: events.filter((e) => e.severity === 'critical' && !e.resolvedAt).length,
    last24h: events.filter(
      (e) => Date.now() - new Date(e.createdAt).getTime() < 24 * 3600_000
    ).length,
    resolved: events.filter((e) => !!e.resolvedAt).length,
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[var(--a-text-4)]">
          Trust & Safety · Risk monitor
        </div>
        <h1 className="mt-1 font-display text-[22px] tracking-tightest text-[var(--a-text-1)]">
          Risk & fraud sinyalleri
        </h1>
        <p className="mt-1 text-[12.5px] text-[var(--a-text-3)] max-w-md">
          Başarısız OTP denemeleri, rate-limit ihlalleri, şüpheli imza
          aktiviteleri. Her olay bir tenant&apos;a iliştirilebilir.
        </p>
      </div>

      <KpiGrid cols={4}>
        <Kpi
          label="Açık olay"
          value={fmtNumber(counts.open)}
          icon={<ShieldAlert className="w-3 h-3" />}
          deltaInverse
          deltaPct={counts.open > 0 ? -counts.open * 5 : 0}
        />
        <Kpi label="Kritik" value={fmtNumber(counts.critical)} icon={<AlertTriangle className="w-3 h-3" />} />
        <Kpi label="Son 24 saat" value={fmtNumber(counts.last24h)} />
        <Kpi label="Çözüldü" value={fmtNumber(counts.resolved)} icon={<ShieldCheck className="w-3 h-3" />} />
      </KpiGrid>

      <Panel flush>
        <PanelHeader title="Olay akışı" hint={`${events.length} kayıt`} />
        {events.length === 0 ? (
          <AdminEmpty
            icon={<ShieldCheck className="w-5 h-5" />}
            title="Hiç risk olayı yok"
            description="Sistem temiz. OTP başarısızlıkları, rate-limit ihlalleri ve şüpheli imzalar burada görünür."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-[var(--a-bg-elev)]">
                  {['Zaman', 'Tenant', 'Tür', 'Şiddet', 'Açıklama', 'IP', 'Durum'].map((c) => (
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
                {events.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-[var(--a-line)] hover:bg-white/[0.025] transition-colors"
                  >
                    <td className="px-3 py-2 text-[var(--a-text-4)] num text-[11.5px]">
                      {new Date(e.createdAt).toLocaleString('tr-TR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-3 py-2">
                      {e.tenantId ? (
                        <Link
                          href={`/admin/tenants/${e.tenantId}`}
                          className="text-[var(--a-text-2)] hover:text-[var(--a-accent)]"
                        >
                          {e.tenantName ?? `#${e.tenantId}`}
                        </Link>
                      ) : (
                        <span className="text-[var(--a-text-5)]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-[var(--a-text-3)] font-mono text-[11.5px]">
                      {e.kind}
                    </td>
                    <td className="px-3 py-2">
                      <AdminBadge tone={SEVERITY_TONE[e.severity] ?? 'neutral'} dot>
                        {e.severity}
                      </AdminBadge>
                    </td>
                    <td className="px-3 py-2 text-[var(--a-text-2)] truncate max-w-[280px]">
                      {e.description ?? '—'}
                    </td>
                    <td className="px-3 py-2 font-mono text-[11.5px] text-[var(--a-text-4)]">
                      {e.ip ?? '—'}
                    </td>
                    <td className="px-3 py-2">
                      {e.resolvedAt ? (
                        <AdminBadge tone="success" dot>
                          resolved
                        </AdminBadge>
                      ) : (
                        <AdminBadge tone="warning" dot>
                          open
                        </AdminBadge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}
