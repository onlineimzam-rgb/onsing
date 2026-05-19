import Link from 'next/link'
import { Hash, Search } from 'lucide-react'
import {
  AdminBadge,
  Kpi,
  KpiGrid,
  MonoTag,
  Panel,
  PanelHeader,
  cn,
} from '@/components/admin/ui'
import { listGlobalAudit, fmtNumber } from '@/lib/admin'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Audit log' }

const EVENT_TONE: Record<string, 'iris' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  'contract.created': 'iris',
  'contract.signed': 'success',
  'contract.canceled': 'danger',
  'session.opened': 'info',
  'otp.sent': 'info',
  'otp.verified': 'success',
  'pdf.archived': 'iris',
  'tenant.updated': 'warning',
}

export default async function GlobalAuditPage() {
  const audit = await listGlobalAudit(500)

  const groupCount = audit.reduce<Record<string, number>>((acc, row) => {
    acc[row.eventType] = (acc[row.eventType] ?? 0) + 1
    return acc
  }, {})
  const topEvents = Object.entries(groupCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[var(--a-text-4)]">
          Trust & Safety · Audit log
        </div>
        <h1 className="mt-1 font-display text-[22px] tracking-tightest text-[var(--a-text-1)]">
          Platform audit zinciri
        </h1>
        <p className="mt-1 text-[12.5px] text-[var(--a-text-3)] max-w-md">
          Tüm tenant&apos;ların audit kayıtları SHA-256 chain ile birbirine
          bağlıdır. Son 500 olay gösterilir.
        </p>
      </div>

      <KpiGrid cols={4}>
        <Kpi label="Toplam olay" value={fmtNumber(audit.length)} icon={<Hash className="w-3 h-3" />} />
        {topEvents.map(([evt, n]) => (
          <Kpi key={evt} label={evt} value={fmtNumber(n)} />
        ))}
      </KpiGrid>

      <Panel flush>
        <PanelHeader title="Olay akışı" hint={`${audit.length} kayıt`} />
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="bg-[var(--a-bg-elev)]">
                {['#', 'Zaman', 'Tenant', 'Olay', 'Varlık', 'IP', 'Hash'].map((c) => (
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
              {audit.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-12 text-[12px] text-[var(--a-text-4)]"
                  >
                    Henüz kayıt yok.
                  </td>
                </tr>
              ) : (
                audit.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[var(--a-line)] hover:bg-white/[0.025] transition-colors"
                  >
                    <td className="px-3 py-2 text-[var(--a-text-4)] num">
                      {row.id}
                    </td>
                    <td className="px-3 py-2 text-[var(--a-text-3)] num text-[11.5px]">
                      {new Date(row.createdAt).toLocaleString('tr-TR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="px-3 py-2">
                      {row.tenantId ? (
                        <Link
                          href={`/admin/tenants/${row.tenantId}`}
                          className="text-[var(--a-text-2)] hover:text-[var(--a-accent)]"
                        >
                          {row.tenantName ?? `#${row.tenantId}`}
                        </Link>
                      ) : (
                        <span className="text-[var(--a-text-5)]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <AdminBadge tone={EVENT_TONE[row.eventType] ?? 'neutral'} dot>
                        {row.eventType}
                      </AdminBadge>
                    </td>
                    <td className="px-3 py-2 text-[var(--a-text-3)] font-mono text-[11.5px]">
                      {row.entityKind}#{row.entityId}
                    </td>
                    <td className="px-3 py-2 text-[var(--a-text-4)] font-mono text-[11.5px]">
                      {row.ip ?? '—'}
                    </td>
                    <td className="px-3 py-2">
                      <MonoTag truncate>{row.recordHash}</MonoTag>
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
