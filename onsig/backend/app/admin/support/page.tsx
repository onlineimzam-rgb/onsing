import { desc, eq } from 'drizzle-orm'
import Link from 'next/link'
import { Inbox } from 'lucide-react'
import {
  AdminBadge,
  AdminEmpty,
  Kpi,
  KpiGrid,
  MonoTag,
  Panel,
  PanelHeader,
} from '@/components/admin/ui'
import { db, schema } from '@/db'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Support' }

const STATUS_TONE: Record<string, 'iris' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  open: 'iris',
  pending: 'warning',
  resolved: 'success',
  closed: 'neutral',
}

const PRIORITY_TONE: Record<string, 'info' | 'iris' | 'warning' | 'danger'> = {
  low: 'info',
  normal: 'iris',
  high: 'warning',
  urgent: 'danger',
}

export default async function SupportPage() {
  const tickets = await db
    .select({
      id: schema.supportTickets.id,
      tenantId: schema.supportTickets.tenantId,
      tenantName: schema.tenants.name,
      userId: schema.supportTickets.userId,
      subject: schema.supportTickets.subject,
      status: schema.supportTickets.status,
      priority: schema.supportTickets.priority,
      assignedTo: schema.supportTickets.assignedTo,
      createdAt: schema.supportTickets.createdAt,
    })
    .from(schema.supportTickets)
    .leftJoin(schema.tenants, eq(schema.tenants.id, schema.supportTickets.tenantId))
    .orderBy(desc(schema.supportTickets.createdAt))
    .limit(200)

  const counts = {
    open: tickets.filter((t) => t.status === 'open').length,
    pending: tickets.filter((t) => t.status === 'pending').length,
    urgent: tickets.filter((t) => t.priority === 'urgent').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[var(--a-text-4)]">
          Trust & Safety · Support
        </div>
        <h1 className="mt-1 font-display text-[22px] tracking-tightest text-[var(--a-text-1)]">
          Destek talepleri
        </h1>
        <p className="mt-1 text-[12.5px] text-[var(--a-text-3)] max-w-md">
          Tenant ve kullanıcılardan gelen destek bildirimleri. Henüz form arayüzü
          devre dışı — admin tarafında yanıtlama ileride.
        </p>
      </div>

      <KpiGrid cols={4}>
        <Kpi label="Açık" value={counts.open} icon={<Inbox className="w-3 h-3" />} />
        <Kpi label="Bekleyen" value={counts.pending} />
        <Kpi label="Acil" value={counts.urgent} />
        <Kpi label="Çözüldü" value={counts.resolved} />
      </KpiGrid>

      <Panel flush>
        <PanelHeader title="Tüm talepler" hint={`${tickets.length} kayıt`} />
        {tickets.length === 0 ? (
          <AdminEmpty
            icon={<Inbox className="w-5 h-5" />}
            title="Henüz talep yok"
            description="Tenant veya kullanıcılar destek formundan bildirimde bulunduğunda burada görünür."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-[var(--a-bg-elev)]">
                  {['#', 'Konu', 'Tenant', 'Öncelik', 'Durum', 'Atanan', 'Açılma'].map((c) => (
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
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-[var(--a-line)] hover:bg-white/[0.025] transition-colors"
                  >
                    <td className="px-3 py-2"><MonoTag>#{t.id}</MonoTag></td>
                    <td className="px-3 py-2 text-[var(--a-text-1)] truncate max-w-[380px]">
                      {t.subject}
                    </td>
                    <td className="px-3 py-2">
                      {t.tenantId ? (
                        <Link
                          href={`/admin/tenants/${t.tenantId}`}
                          className="text-[var(--a-text-2)] hover:text-[var(--a-accent)]"
                        >
                          {t.tenantName ?? `#${t.tenantId}`}
                        </Link>
                      ) : (
                        <span className="text-[var(--a-text-5)]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <AdminBadge tone={PRIORITY_TONE[t.priority] ?? 'neutral'} dot>
                        {t.priority}
                      </AdminBadge>
                    </td>
                    <td className="px-3 py-2">
                      <AdminBadge tone={STATUS_TONE[t.status] ?? 'neutral'} dot>
                        {t.status}
                      </AdminBadge>
                    </td>
                    <td className="px-3 py-2 text-[var(--a-text-4)] font-mono text-[11.5px]">
                      {t.assignedTo ? `#${t.assignedTo}` : 'unassigned'}
                    </td>
                    <td className="px-3 py-2 text-[var(--a-text-4)] num text-[11.5px]">
                      {new Date(t.createdAt).toLocaleString('tr-TR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
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
