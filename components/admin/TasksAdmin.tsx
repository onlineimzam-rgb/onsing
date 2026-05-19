'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Bell, CheckCircle2, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { getAdminKey } from './AdminLogin'

type Task = Record<string, unknown>

const PRIORITIES = [
  { value: 'dusuk', label: 'Düşük', cls: 'bg-slate-100 text-slate-700' },
  { value: 'normal', label: 'Normal', cls: 'bg-gold-100 text-gold-800' },
  { value: 'yuksek', label: 'Yüksek', cls: 'bg-red-100 text-red-800' },
]

const KINDS = [
  { value: 'genel', label: 'Genel' },
  { value: 'lead', label: 'Müşteri talebi' },
  { value: 'valuation', label: 'Değerleme' },
  { value: 'owner', label: 'Portföy sahibi' },
  { value: 'contract', label: 'Sözleşme' },
  { value: 'sale', label: 'Satış' },
]

const STATUSES = [
  { value: 'acik', label: 'Açık' },
  { value: 'tamamlandi', label: 'Tamamlandı' },
  { value: 'iptal', label: 'İptal' },
]

export default function TasksAdmin() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [editing, setEditing] = useState<Task | null>(null)
  const [filter, setFilter] = useState<'acik' | 'tamamlandi' | 'iptal' | 'all'>('acik')
  const [form, setForm] = useState({
    title: '',
    description: '',
    due_at: '',
    priority: 'normal',
    related_kind: 'genel',
    related_label: '',
    assignee: '',
    status: 'acik',
  })

  const load = useCallback(async () => {
    const key = getAdminKey()
    if (!key) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/tasks/', { headers: { 'x-admin-key': key } })
      const json = await res.json()
      setTasks((json.tasks || []) as Task[])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const resetForm = () => {
    setEditing(null)
    setForm({
      title: '',
      description: '',
      due_at: '',
      priority: 'normal',
      related_kind: 'genel',
      related_label: '',
      assignee: '',
      status: 'acik',
    })
  }

  const startEdit = (t: Task) => {
    setEditing(t)
    setForm({
      title: String(t.title || ''),
      description: String(t.description || ''),
      due_at: t.due_at ? toLocalInput(String(t.due_at)) : '',
      priority: String(t.priority || 'normal'),
      related_kind: String(t.related_kind || 'genel'),
      related_label: String(t.related_label || ''),
      assignee: String(t.assignee || ''),
      status: String(t.status || 'acik'),
    })
  }

  const save = async () => {
    const key = getAdminKey()
    if (!key) return
    if (!form.title.trim()) return alert('Başlık zorunludur.')
    setSaving(true)
    try {
      const body = {
        ...form,
        due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
        description: form.description.trim() || null,
        related_label: form.related_label.trim() || null,
        assignee: form.assignee.trim() || null,
      }
      const url = editing ? `/api/admin/tasks/${editing.id}/` : '/api/admin/tasks/'
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Kaydedilemedi')
      await load()
      resetForm()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: number) => {
    if (!confirm('Görev silinsin mi?')) return
    const key = getAdminKey()
    if (!key) return
    await fetch(`/api/admin/tasks/${id}/`, {
      method: 'DELETE',
      headers: { 'x-admin-key': key },
    })
    await load()
    if (editing && Number(editing.id) === id) resetForm()
  }

  const toggleDone = async (t: Task) => {
    const key = getAdminKey()
    if (!key) return
    const next = t.status === 'tamamlandi' ? 'acik' : 'tamamlandi'
    await fetch(`/api/admin/tasks/${t.id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
      body: JSON.stringify({ status: next }),
    })
    await load()
  }

  const filtered = useMemo(
    () => (filter === 'all' ? tasks : tasks.filter((t) => t.status === filter)),
    [tasks, filter]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gold-500" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <h3 className="font-display text-xl font-bold text-navy-950 flex items-center gap-2">
          <Bell className="w-6 h-6 text-gold-600" />
          Görevler ve hatırlatıcılar
        </h3>
        <p className="text-sm text-navy-600 mt-1">
          “Yarın ara”, “bu hafta yer göster”, “yetki sözleşmesi bitiyor” gibi takip görevlerini buraya yazın; tarihi
          geçenler dashboard’da kırmızı görünür.
        </p>
      </div>

      <div className="card p-5 space-y-3">
        <h4 className="font-semibold text-navy-950">{editing ? 'Görev düzenle' : 'Yeni görev'}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Başlık" className="md:col-span-2">
            <input
              className="input text-sm"
              placeholder="Örn: Ahmet Bey'i yarın 11:00'de ara"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </Field>
          <Field label="Tarih ve saat">
            <input
              className="input text-sm"
              type="datetime-local"
              value={form.due_at}
              onChange={(e) => setForm((f) => ({ ...f, due_at: e.target.value }))}
            />
          </Field>
          <Field label="Öncelik">
            <select
              className="input text-sm"
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Bağlı olduğu kayıt türü">
            <select
              className="input text-sm"
              value={form.related_kind}
              onChange={(e) => setForm((f) => ({ ...f, related_kind: e.target.value }))}
            >
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Etiket / kişi / sözleşme">
            <input
              className="input text-sm"
              placeholder="Örn: Sözleşme #45 · CUG-12345"
              value={form.related_label}
              onChange={(e) => setForm((f) => ({ ...f, related_label: e.target.value }))}
            />
          </Field>
          <Field label="Sorumlu (opsiyonel)">
            <input
              className="input text-sm"
              placeholder="Bülent"
              value={form.assignee}
              onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}
            />
          </Field>
          <Field label="Durum">
            <select
              className="input text-sm"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Açıklama" className="md:col-span-2">
            <textarea
              className="input text-sm min-h-[72px]"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="btn-primary inline-flex items-center gap-1"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : editing ? (
              <Pencil className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {editing ? 'Güncelle' : 'Kaydet'}
          </button>
          {editing && (
            <button type="button" onClick={resetForm} className="btn-ghost border-2 border-navy-200 text-sm">
              İptal
            </button>
          )}
        </div>
      </div>

      <section className="card p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h4 className="font-display text-lg font-bold text-navy-950">Kayıtlar ({filtered.length})</h4>
          <div className="flex items-center gap-1 flex-wrap">
            {[
              { v: 'acik', l: 'Açık' },
              { v: 'tamamlandi', l: 'Tamamlanan' },
              { v: 'iptal', l: 'İptal' },
              { v: 'all', l: 'Tümü' },
            ].map((b) => (
              <button
                key={b.v}
                type="button"
                onClick={() => setFilter(b.v as typeof filter)}
                className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                  filter === b.v ? 'bg-navy-950 text-gold-300' : 'bg-navy-50 text-navy-700'
                }`}
              >
                {b.l}
              </button>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm text-navy-500">Bu filtrede kayıt yok.</p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((t) => {
              const overdue = Boolean(
                t.status === 'acik' && t.due_at && new Date(String(t.due_at)) < new Date()
              )
              const prio = PRIORITIES.find((p) => p.value === t.priority) || PRIORITIES[1]!
              return (
                <li
                  key={String(t.id)}
                  className={`p-3 rounded-xl border flex items-start gap-3 ${
                    overdue
                      ? 'border-red-200 bg-red-50/50'
                      : t.status === 'tamamlandi'
                        ? 'border-emerald-200 bg-emerald-50/40'
                        : 'border-navy-100 bg-white'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleDone(t)}
                    title="Tamamlandı olarak işaretle"
                    className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                      t.status === 'tamamlandi'
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-navy-300 text-navy-300 hover:border-emerald-500'
                    }`}
                  >
                    {t.status === 'tamamlandi' ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className={`font-semibold ${
                          t.status === 'tamamlandi' ? 'text-navy-500 line-through' : 'text-navy-950'
                        }`}
                      >
                        {String(t.title)}
                      </p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${prio.cls}`}>
                        {prio.label}
                      </span>
                      {overdue && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Gecikmiş
                        </span>
                      )}
                    </div>
                    {t.description ? (
                      <p className="text-xs text-navy-600 mt-1 whitespace-pre-line">{String(t.description)}</p>
                    ) : null}
                    <p className="text-[11px] text-navy-500 mt-1">
                      {t.due_at ? new Date(String(t.due_at)).toLocaleString('tr-TR') : 'Tarihsiz'}
                      {t.related_label ? ` · ${String(t.related_label)}` : ''}
                      {t.assignee ? ` · ${String(t.assignee)}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(t)}
                      className="text-xs px-2 py-1 rounded bg-gold-100 text-gold-800 font-semibold"
                    >
                      Düzenle
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(Number(t.id))}
                      className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 font-semibold inline-flex items-center justify-center"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label className="label text-xs">{label}</label>
      {children}
    </div>
  )
}

function toLocalInput(iso: string): string {
  // datetime-local için "YYYY-MM-DDTHH:MM" formatı bekleniyor.
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`
}
