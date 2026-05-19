'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import {
  Building,
  MapPin,
  Phone,
  Mail,
  Plus,
  Trash2,
  Star,
  Pencil,
  Save,
  X,
  Check,
} from 'lucide-react'
import { api, ApiError } from '@/lib/client/api'
import { Field, FormError } from '@/components/ui/Field'

interface Branch {
  id: number
  name: string
  address: string | null
  city: string | null
  phone: string | null
  email: string | null
  licenseNo: string | null
  isDefault: boolean
}

interface BranchPatch {
  name: string
  address: string
  city: string
  phone: string
  email: string
  licenseNo: string
  isDefault: boolean
}

const EMPTY: BranchPatch = {
  name: '',
  address: '',
  city: '',
  phone: '',
  email: '',
  licenseNo: '',
  isDefault: false,
}

export default function BranchManager() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const [editingId, setEditingId] = useState<number | 'new' | null>(null)
  const [draft, setDraft] = useState<BranchPatch>(EMPTY)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api<{ ok: true; branches: Branch[] }>('/api/branches')
      setBranches(r.branches)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  function startNew() {
    setDraft(EMPTY)
    setEditingId('new')
  }

  function startEdit(b: Branch) {
    setDraft({
      name: b.name,
      address: b.address ?? '',
      city: b.city ?? '',
      phone: b.phone ?? '',
      email: b.email ?? '',
      licenseNo: b.licenseNo ?? '',
      isDefault: b.isDefault,
    })
    setEditingId(b.id)
  }

  function cancel() {
    setEditingId(null)
    setDraft(EMPTY)
  }

  function save(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      try {
        if (editingId === 'new') {
          await api('/api/branches', { method: 'POST', json: draft })
        } else if (typeof editingId === 'number') {
          await api(`/api/branches/${editingId}`, { method: 'PATCH', json: draft })
        }
        setEditingId(null)
        setDraft(EMPTY)
        await refresh()
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Kaydedilemedi.')
      }
    })
  }

  function remove(b: Branch) {
    if (!confirm(`"${b.name}" şubesi silinsin mi? Bu şubeye bağlı sözleşmeler ana ofise taşınır.`)) return
    start(async () => {
      try {
        await api(`/api/branches/${b.id}`, { method: 'DELETE' })
        await refresh()
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Silinemedi.')
      }
    })
  }

  function makeDefault(b: Branch) {
    start(async () => {
      try {
        await api(`/api/branches/${b.id}`, { method: 'PATCH', json: { isDefault: true } })
        await refresh()
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Güncellenemedi.')
      }
    })
  }

  const formOpen = editingId !== null

  return (
    <div className="space-y-6">
      <FormError message={error} />

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-ink-muted">
            Şubelerini ekle; sözleşme oluştururken hangi şubeden yapıldığını seçebilir, PDF antetinde
            o şubenin adresini gösterebilirsin.
          </p>
        </div>
        {!formOpen && (
          <button className="btn-primary" onClick={startNew} disabled={pending}>
            <Plus className="w-4 h-4" />
            Yeni şube
          </button>
        )}
      </div>

      {/* Form */}
      {formOpen && (
        <form onSubmit={save} className="card">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-brand-soft text-brand-deep grid place-items-center">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold tracking-tight">
                {editingId === 'new' ? 'Yeni şube' : 'Şubeyi düzenle'}
              </h2>
              <p className="text-xs text-ink-muted">
                Adı zorunlu, diğer alanlar ileri tarihte sözleşme metnine yansıyacaktır.
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Şube adı" required>
                <input
                  required
                  className="input"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Şehir / İlçe">
              <input
                className="input"
                value={draft.city}
                onChange={(e) => setDraft({ ...draft, city: e.target.value })}
              />
            </Field>
            <Field label="Yetki belgesi / oda sicil no">
              <input
                className="input"
                value={draft.licenseNo}
                onChange={(e) => setDraft({ ...draft, licenseNo: e.target.value })}
              />
            </Field>
            <Field label="Telefon">
              <input
                className="input"
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              />
            </Field>
            <Field label="E-posta">
              <input
                type="email"
                className="input"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Adres">
                <textarea
                  rows={2}
                  className="input"
                  value={draft.address}
                  onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.isDefault}
                onChange={(e) => setDraft({ ...draft, isDefault: e.target.checked })}
              />
              <span>Varsayılan şube yap</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <button type="button" className="btn-ghost" onClick={cancel} disabled={pending}>
              <X className="w-4 h-4" />
              Vazgeç
            </button>
            <button className="btn-primary" disabled={pending}>
              <Save className="w-4 h-4" />
              {pending ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {loading ? (
        <div className="card text-sm text-ink-muted">Yükleniyor…</div>
      ) : branches.length === 0 ? (
        <div className="card text-center py-12">
          <Building className="w-10 h-10 mx-auto text-ink-muted/40" />
          <h2 className="mt-3 font-display text-lg font-semibold">Henüz şube eklenmedi</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Tek bir ofisle çalışıyorsan bile şube olarak eklemen önerilir; ileride yetki/lokasyon
            yönetimi kolaylaşır.
          </p>
          {!formOpen && (
            <button className="btn-primary mt-5 inline-flex" onClick={startNew}>
              <Plus className="w-4 h-4" />
              İlk şubeyi oluştur
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {branches.map((b) => (
            <div
              key={b.id}
              className={`card relative ${b.isDefault ? 'border-brand ring-1 ring-brand/30' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-brand-soft text-brand-deep grid place-items-center">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold flex items-center gap-2">
                      {b.name}
                      {b.isDefault && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold bg-brand text-white px-1.5 py-0.5 rounded">
                          <Star className="w-3 h-3" />
                          Varsayılan
                        </span>
                      )}
                    </h3>
                    {b.city && <p className="text-xs text-ink-muted">{b.city}</p>}
                  </div>
                </div>
              </div>
              <ul className="mt-3 space-y-1 text-xs text-ink-muted">
                {b.address && (
                  <li className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{b.address}</span>
                  </li>
                )}
                {b.phone && (
                  <li className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> {b.phone}
                  </li>
                )}
                {b.email && (
                  <li className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> {b.email}
                  </li>
                )}
                {b.licenseNo && (
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" /> Yetki No: {b.licenseNo}
                  </li>
                )}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                {!b.isDefault && (
                  <button
                    className="btn-secondary !py-1.5 !text-xs"
                    onClick={() => makeDefault(b)}
                    disabled={pending}
                  >
                    <Star className="w-3.5 h-3.5" />
                    Varsayılan yap
                  </button>
                )}
                <button
                  className="btn-secondary !py-1.5 !text-xs"
                  onClick={() => startEdit(b)}
                  disabled={pending}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Düzenle
                </button>
                <button
                  className="btn-danger !py-1.5 !text-xs"
                  onClick={() => remove(b)}
                  disabled={pending}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
