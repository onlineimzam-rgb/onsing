'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import {
  Mail,
  Plus,
  Trash2,
  ShieldCheck,
  Copy,
  Check,
  ChevronDown,
  UserPlus,
  AlertTriangle,
} from 'lucide-react'
import { api, ApiError } from '@/lib/client/api'
import { Field, FormError } from '@/components/ui/Field'

interface Member {
  membershipId: number
  userId: number
  name: string
  email: string | null
  phone: string | null
  role: 'owner' | 'admin' | 'member'
  createdAt: string | Date
}

interface Invite {
  id: number
  email: string
  role: string
  token: string
  url: string
  expiresAt: string | Date
  createdAt: string | Date
}

const ROLE_LABEL: Record<string, string> = {
  owner: 'Sahip',
  admin: 'Yönetici',
  member: 'Üye',
}

const ROLE_BADGE: Record<string, string> = {
  owner: 'bg-amber-100 text-amber-700',
  admin: 'bg-violet-100 text-violet-700',
  member: 'bg-slate-100 text-slate-700',
}

export default function TeamManager() {
  const [members, setMembers] = useState<Member[]>([])
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const [copied, setCopied] = useState<number | null>(null)

  // invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [m, i] = await Promise.all([
        api<{ ok: true; members: Member[]; currentUserId: number }>('/api/team/members'),
        api<{ ok: true; invites: Invite[] }>('/api/team/invites'),
      ])
      setMembers(m.members)
      setCurrentUserId(m.currentUserId)
      setInvites(i.invites)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  function changeRole(m: Member, nextRole: 'owner' | 'admin' | 'member') {
    if (nextRole === m.role) return
    if (!confirm(`${m.name} rolünü "${ROLE_LABEL[nextRole]}" yapılsın mı?`)) return
    start(async () => {
      try {
        await api(`/api/team/members/${m.membershipId}`, {
          method: 'PATCH',
          json: { role: nextRole },
        })
        await refresh()
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Güncellenemedi.')
      }
    })
  }

  function removeMember(m: Member) {
    if (m.userId === currentUserId) {
      if (!confirm('Kendi üyeliğinizi siliyorsunuz, devam etsin mi?')) return
    } else if (!confirm(`${m.name} ekipten çıkarılsın mı?`)) return
    start(async () => {
      try {
        await api(`/api/team/members/${m.membershipId}`, { method: 'DELETE' })
        await refresh()
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Silinemedi.')
      }
    })
  }

  function createInvite(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      try {
        const r = await api<{ ok: true; invite: Invite }>('/api/team/invites', {
          method: 'POST',
          json: { email: inviteEmail.trim(), role: inviteRole },
        })
        setInviteEmail('')
        setInvites((cur) => [r.invite, ...cur])
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Davet gönderilemedi.')
      }
    })
  }

  function revokeInvite(inv: Invite) {
    if (!confirm(`${inv.email} adresine gönderilen davet iptal edilsin mi?`)) return
    start(async () => {
      try {
        await api(`/api/team/invites/${inv.id}`, { method: 'DELETE' })
        setInvites((cur) => cur.filter((c) => c.id !== inv.id))
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'İptal edilemedi.')
      }
    })
  }

  async function copyInvite(inv: Invite) {
    try {
      const fullUrl = inv.url.startsWith('http')
        ? inv.url
        : `${window.location.origin}${inv.url}`
      await navigator.clipboard.writeText(fullUrl)
      setCopied(inv.id)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      /* noop */
    }
  }

  return (
    <div className="space-y-6">
      <FormError message={error} />

      {/* Invite create */}
      <form onSubmit={createInvite} className="card">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-brand-soft text-brand-deep grid place-items-center">
            <UserPlus className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight">Yeni üye davet et</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Davet bağlantısı üretilir; e-posta, WhatsApp veya SMS ile karşı tarafa iletebilirsin.
            </p>
          </div>
        </div>
        <div className="grid sm:grid-cols-[1fr,200px,auto] gap-3 items-end">
          <Field label="E-posta">
            <input
              required
              type="email"
              className="input"
              placeholder="ornek@firma.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </Field>
          <Field label="Rol">
            <select
              className="input"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
            >
              <option value="member">Üye</option>
              <option value="admin">Yönetici</option>
            </select>
          </Field>
          <button className="btn-primary" disabled={pending}>
            <Plus className="w-4 h-4" />
            {pending ? 'Üretiliyor…' : 'Davet üret'}
          </button>
        </div>
      </form>

      {/* Pending invites */}
      <div className="card">
        <h2 className="font-display text-lg font-bold tracking-tight">
          Bekleyen davetler
          <span className="ml-2 text-sm font-medium text-ink-muted">({invites.length})</span>
        </h2>
        {invites.length === 0 ? (
          <p className="text-sm text-ink-muted mt-3">Henüz aktif davet yok.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {invites.map((inv) => {
              const expired = new Date(inv.expiresAt) < new Date()
              return (
                <li key={inv.id} className="py-3 flex items-center gap-3 flex-wrap">
                  <Mail className="w-4 h-4 text-ink-muted shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{inv.email}</p>
                    <p className="text-[11px] text-ink-muted">
                      {ROLE_LABEL[inv.role] ?? inv.role} ·{' '}
                      {expired ? (
                        <span className="text-rose-600 font-semibold">süresi dolmuş</span>
                      ) : (
                        <>{new Date(inv.expiresAt).toLocaleDateString('tr-TR')} sonuna kadar</>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyInvite(inv)}
                    className="btn-secondary !py-1.5"
                  >
                    {copied === inv.id ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Kopyalandı
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Linki kopyala
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn-danger !py-1.5"
                    onClick={() => revokeInvite(inv)}
                    disabled={pending}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    İptal
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Members */}
      <div className="card !p-0 overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-soft text-brand-deep grid place-items-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight">Ekip üyeleri</h2>
            <p className="text-xs text-ink-muted">{members.length} kayıt</p>
          </div>
        </div>
        {loading ? (
          <div className="px-5 pb-5 text-sm text-ink-muted">Yükleniyor…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-ink-muted">
              <tr>
                <th className="px-4 py-3 text-left">Üye</th>
                <th className="px-4 py-3 text-left">E-posta</th>
                <th className="px-4 py-3 text-left">Rol</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => (
                <tr key={m.membershipId}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">
                      {m.name}
                      {m.userId === currentUserId && (
                        <span className="ml-2 text-[10px] uppercase tracking-wider font-bold bg-brand-soft text-brand-deep px-1.5 py-0.5 rounded">
                          Siz
                        </span>
                      )}
                    </p>
                    {m.phone && <p className="text-xs text-ink-muted">{m.phone}</p>}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{m.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <RoleSelect
                      value={m.role}
                      onChange={(v) => changeRole(m, v)}
                      disabled={pending}
                    />
                    <span
                      className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${ROLE_BADGE[m.role]}`}
                    >
                      {ROLE_LABEL[m.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="btn-danger !py-1.5 !px-2.5"
                      onClick={() => removeMember(m)}
                      disabled={pending}
                      title="Üyeyi çıkar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-ink-muted flex items-start gap-2">
        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        Davet bağlantıları 14 gün geçerlidir ve tek seferlik kullanılır. Davet edilen kişi linki
        açtığında şifresini belirleyerek hesabını oluşturur.
      </p>
    </div>
  )
}

function RoleSelect({
  value,
  onChange,
  disabled,
}: {
  value: 'owner' | 'admin' | 'member'
  onChange: (v: 'owner' | 'admin' | 'member') => void
  disabled?: boolean
}) {
  return (
    <span className="relative inline-block">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as 'owner' | 'admin' | 'member')}
        className="pl-2 pr-7 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold appearance-none focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none"
      >
        <option value="owner">Sahip</option>
        <option value="admin">Yönetici</option>
        <option value="member">Üye</option>
      </select>
      <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
    </span>
  )
}
