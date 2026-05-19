import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, ExternalLink } from 'lucide-react'
import { getOptionalUser } from '@/lib/session'
import { listRecentAudit, verifyAuditChain } from '@/lib/audit'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Audit zinciri · OnSig' }

const EVENT_LABEL: Record<string, string> = {
  'contract.created': 'Sözleşme oluşturuldu',
  'contract.updated': 'Sözleşme güncellendi',
  'contract.deleted': 'Sözleşme silindi',
  'sign_session.created': 'İmza oturumu oluşturuldu',
  'sign_session.cancelled': 'İmza oturumu iptal edildi',
  'sign_session.otp_sent': 'OTP gönderildi',
  'sign_session.otp_verified': 'OTP doğrulandı',
  'sign_session.signed': 'İmza atıldı',
  'pdf.generated': 'PDF oluşturuldu',
  'tenant.updated': 'Firma bilgileri güncellendi',
  'user.login': 'Giriş yapıldı',
  'user.register': 'Hesap oluşturuldu',
}

function fmt(d: Date | string) {
  try {
    return new Date(d).toLocaleString('tr-TR')
  } catch {
    return String(d)
  }
}

export default async function AuditPage() {
  const session = await getOptionalUser()
  if (!session) redirect('/login')

  const [rows, chain] = await Promise.all([
    listRecentAudit(session.tenantId, 100),
    verifyAuditChain(session.tenantId),
  ])

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Audit zinciri</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Tüm sistem olayları SHA-256 zinciriyle bağlanır. Herhangi bir satır değişirse zincir kırılır.
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold ${
            chain.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          {chain.ok
            ? `Zincir geçerli · ${chain.count} kayıt`
            : `Zincir kırık — kayıt #${chain.brokenAt}`}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="card text-center py-12 text-sm text-ink-muted">Henüz kayıt yok.</div>
      ) : (
        <div className="card !p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-ink-muted">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Olay</th>
                <th className="px-4 py-3 text-left">Varlık</th>
                <th className="px-4 py-3 text-right">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => {
                const isContract = r.entityKind === 'contract'
                const href = isContract ? `/contracts/${r.entityId}` : null
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-2.5 font-mono text-xs text-ink-muted">#{r.id}</td>
                    <td className="px-4 py-2.5">
                      <p className="font-semibold text-ink">
                        {EVENT_LABEL[r.eventType] ?? r.eventType}
                      </p>
                      <p className="text-[11px] text-ink-muted font-mono">{r.eventType}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      {href ? (
                        <Link
                          href={href}
                          className="inline-flex items-center gap-1 text-brand hover:underline"
                        >
                          {r.entityKind} #{r.entityId}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="text-ink-muted">
                          {r.entityKind} #{r.entityId}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-ink-muted whitespace-nowrap">
                      {fmt(r.createdAt)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
