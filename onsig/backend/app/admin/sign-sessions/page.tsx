import Link from 'next/link'
import {
  AdminBadge,
  MonoTag,
  Panel,
  PanelHeader,
} from '@/components/admin/ui'
import { listGlobalSignSessions } from '@/lib/admin'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Sign sessions' }

const STATUS_TONE: Record<string, 'neutral' | 'iris' | 'success' | 'warning' | 'danger'> = {
  bekliyor: 'warning',
  imzalandi: 'success',
  iptal: 'danger',
  expired: 'neutral',
}

export default async function SignSessionsPage() {
  const sessions = await listGlobalSignSessions(400)

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[var(--a-text-4)]">
          Operations · Sign sessions
        </div>
        <h1 className="mt-1 font-display text-[22px] tracking-tightest text-[var(--a-text-1)]">
          Aktif imza oturumları
        </h1>
        <p className="mt-1 text-[12.5px] text-[var(--a-text-3)] max-w-md">
          Tüm tenant&apos;ların bekleyen / tamamlanan imza oturumları. Süresi
          dolanlar otomatik kapatılır.
        </p>
      </div>

      <Panel flush>
        <PanelHeader title="Son 400 imza oturumu" hint="" />
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="bg-[var(--a-bg-elev)]">
                {[
                  'ID',
                  'Tenant',
                  'Sözleşme',
                  'Rol',
                  'Alıcı',
                  'Durum',
                  'İmza zamanı',
                  'Bitiş',
                ].map((c) => (
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
              {sessions.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-12 text-[12px] text-[var(--a-text-4)]"
                  >
                    Henüz imza oturumu yok.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-[var(--a-line)] hover:bg-white/[0.025] transition-colors"
                  >
                    <td className="px-3 py-2">
                      <MonoTag>#{s.id}</MonoTag>
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/tenants/${s.tenantId}`}
                        className="text-[var(--a-text-2)] hover:text-[var(--a-accent)] font-medium"
                      >
                        {s.tenantName}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-[var(--a-text-1)] truncate max-w-[200px]">
                      {s.contractTitle ?? (
                        <span className="text-[var(--a-text-5)]">
                          #{s.contractId}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-[var(--a-text-3)] font-mono text-[11.5px]">
                      {s.role}
                    </td>
                    <td className="px-3 py-2 text-[var(--a-text-2)]">
                      {s.recipientName ?? '—'}
                    </td>
                    <td className="px-3 py-2">
                      <AdminBadge tone={STATUS_TONE[s.status] ?? 'neutral'} dot>
                        {s.status}
                      </AdminBadge>
                    </td>
                    <td className="px-3 py-2 text-[var(--a-text-4)] num text-[11.5px]">
                      {s.signedAt
                        ? new Date(s.signedAt).toLocaleString('tr-TR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-[var(--a-text-4)] num text-[11.5px]">
                      {s.expiresAt
                        ? new Date(s.expiresAt).toLocaleString('tr-TR', {
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
