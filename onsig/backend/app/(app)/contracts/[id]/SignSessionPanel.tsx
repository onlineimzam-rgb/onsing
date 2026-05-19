'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Copy, ExternalLink, CheckCircle2, Clock } from 'lucide-react'
import { api, ApiError } from '@/lib/client/api'
import { Field, FormError } from '@/components/ui/Field'

interface SignSessionRow {
  id: number
  role: string
  token: string
  status: string
  recipientName: string | null
  recipientEmail: string | null
  recipientPhone: string | null
  signedAt: string | null
  expiresAt: string | null
}

const ROLE_LABELS: Record<string, string> = {
  'kiraya-veren': 'Kiraya Veren',
  kiraci: 'Kiracı',
  kefil: 'Kefil',
  'mal-sahibi': 'Mal Sahibi',
  komisyoncu: 'Emlak Komisyoncusu',
  satici: 'Satıcı',
  alici: 'Alıcı',
  'yer-goren': 'Taşınmazı Gezen',
}

const STATUS_META: Record<string, { label: string; cls: string; icon?: 'check' | 'clock' }> = {
  bekliyor: { label: 'Bekliyor', cls: 'bg-amber-100 text-amber-700', icon: 'clock' },
  imzalandi: { label: 'İmzalandı', cls: 'bg-emerald-100 text-emerald-700', icon: 'check' },
  iptal: { label: 'İptal', cls: 'bg-slate-100 text-slate-600' },
  expired: { label: 'Süresi doldu', cls: 'bg-rose-100 text-rose-700' },
}

export default function SignSessionPanel({
  contractId,
  status,
  allowedRoles,
  initialSessions,
}: {
  contractId: number
  status: string
  allowedRoles: string[]
  initialSessions: SignSessionRow[]
}) {
  const router = useRouter()
  const [sessions, setSessions] = useState<SignSessionRow[]>(initialSessions)
  const [showForm, setShowForm] = useState(false)
  const [role, setRole] = useState(allowedRoles[0] ?? '')
  const [recipientName, setName] = useState('')
  const [recipientEmail, setEmail] = useState('')
  const [recipientPhone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const [copied, setCopied] = useState<number | null>(null)

  const isCancelled = status === 'iptal'

  const availableRoles = useMemo(() => {
    const taken = new Set(sessions.filter((s) => s.status !== 'iptal').map((s) => s.role))
    return allowedRoles.filter((r) => !taken.has(r))
  }, [sessions, allowedRoles])

  function createSession(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      try {
        const created = await api<{
          ok: true
          id: number
          token: string
          expiresAt: string
          publicUrl: string
        }>(`/api/contracts/${contractId}/sign-sessions`, {
          method: 'POST',
          json: {
            role,
            recipientName: recipientName.trim() || null,
            recipientEmail: recipientEmail.trim() || null,
            recipientPhone: recipientPhone.trim() || null,
          },
        })
        setSessions((prev) => [
          ...prev,
          {
            id: created.id,
            role,
            token: created.token,
            status: 'bekliyor',
            recipientName: recipientName || null,
            recipientEmail: recipientEmail || null,
            recipientPhone: recipientPhone || null,
            signedAt: null,
            expiresAt: created.expiresAt,
          },
        ])
        setShowForm(false)
        setName('')
        setEmail('')
        setPhone('')
        router.refresh()
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Bağlantı hatası.')
      }
    })
  }

  async function cancelSession(id: number) {
    if (!confirm('İmza oturumunu iptal etmek istiyor musunuz?')) return
    try {
      await api(`/api/sign-sessions/${id}`, { method: 'DELETE' })
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'iptal' } : s)))
      router.refresh()
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Bağlantı hatası.')
    }
  }

  function copyLink(token: string, id: number) {
    const url = `${window.location.origin}/sign/${token}`
    navigator.clipboard.writeText(url).then(
      () => {
        setCopied(id)
        setTimeout(() => setCopied((v) => (v === id ? null : v)), 1500)
      },
      () => alert('Kopyalama başarısız.')
    )
  }

  return (
    <aside className="card lg:sticky lg:top-6 self-start space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-lg">İmza oturumları</h2>
        {!isCancelled && availableRoles.length > 0 && (
          <button onClick={() => setShowForm((v) => !v)} className="btn-ghost !px-2 !py-1 text-xs">
            <Plus className="w-3.5 h-3.5" />
            {showForm ? 'Vazgeç' : 'Yeni'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={createSession} className="space-y-3 border-t border-slate-100 pt-3">
          <Field label="Rol" required>
            <select className="input" value={role} onChange={(e) => setRole(e.target.value)} required>
              {availableRoles.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r] ?? r}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ad Soyad">
            <input className="input" value={recipientName} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="E-posta" hint="OTP kodu buraya gönderilir">
            <input type="email" className="input" value={recipientEmail} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Telefon" hint="+90...">
            <input type="tel" className="input" value={recipientPhone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <FormError message={error} />
          <button className="btn-primary w-full text-sm" disabled={pending || !role}>
            {pending ? 'Oluşturuluyor…' : 'Linki oluştur'}
          </button>
        </form>
      )}

      {sessions.length === 0 ? (
        <p className="text-sm text-ink-muted">Henüz imza oturumu yok. {availableRoles.length > 0 ? 'Üstteki "Yeni" düğmesi ile bir paylaşım linki oluşturun.' : 'Bu sözleşme için tüm roller zaten oluşturulmuş.'}</p>
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => {
            const meta = STATUS_META[s.status] ?? STATUS_META.bekliyor!
            return (
              <li key={s.id} className="border border-slate-100 rounded-xl p-3 bg-slate-50/40">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm">{ROLE_LABELS[s.role] ?? s.role}</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.cls}`}>
                    {meta.icon === 'check' ? <CheckCircle2 className="w-3 h-3" /> : meta.icon === 'clock' ? <Clock className="w-3 h-3" /> : null}
                    {meta.label}
                  </span>
                </div>
                <p className="text-xs text-ink-muted mt-0.5">{s.recipientName || '(isim girilmedi)'}</p>
                {s.recipientEmail && <p className="text-xs text-ink-muted truncate">{s.recipientEmail}</p>}
                {s.recipientPhone && <p className="text-xs text-ink-muted">{s.recipientPhone}</p>}
                {s.signedAt && (
                  <p className="text-xs text-emerald-700 mt-1">İmza: {new Date(s.signedAt).toLocaleString('tr-TR')}</p>
                )}
                {s.status === 'bekliyor' && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button onClick={() => copyLink(s.token, s.id)} className="btn-ghost !px-2 !py-1 text-xs">
                      <Copy className="w-3 h-3" />
                      {copied === s.id ? 'Kopyalandı' : 'Linki kopyala'}
                    </button>
                    <a
                      href={`/sign/${s.token}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost !px-2 !py-1 text-xs"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Aç
                    </a>
                    <button onClick={() => cancelSession(s.id)} className="btn-ghost !px-2 !py-1 text-xs !text-danger !border-danger/30 hover:!bg-danger/5">
                      <Trash2 className="w-3 h-3" />
                      İptal
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </aside>
  )
}
