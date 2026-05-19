'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiError } from '@/lib/client/api'
import { Field, FormError } from '@/components/ui/Field'
import { GROUPS_BY_TEMPLATE, type AnyTemplateKey, type FieldGroup } from '@shared/contracts'

interface BranchLite {
  id: number
  name: string
  city: string | null
  isDefault: boolean
}

interface TemplateOption {
  sector: string
  key: string
  label: string
  roles: string[]
}

interface NewContractFormProps {
  templates: TemplateOption[]
  /** Preselect a specific template (use with `fixed` for the deep-link page). */
  initialTemplateKey?: string
  /** Hide the template selector — useful when the template is already chosen via URL. */
  fixed?: boolean
}

export default function NewContractForm({
  templates,
  initialTemplateKey,
  fixed,
}: NewContractFormProps) {
  const router = useRouter()
  const [templateKey, setTemplateKey] = useState<string>(
    initialTemplateKey ?? templates[0]?.key ?? 'kira'
  )
  const [title, setTitle] = useState('')
  const [form, setForm] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const [branches, setBranches] = useState<BranchLite[]>([])
  const [branchId, setBranchId] = useState<number | ''>('')

  useEffect(() => {
    let cancelled = false
    api<{ ok: true; branches: BranchLite[] }>('/api/branches')
      .then((r) => {
        if (cancelled) return
        setBranches(r.branches)
        const def = r.branches.find((b) => b.isDefault) ?? r.branches[0]
        if (def) setBranchId(def.id)
      })
      .catch(() => {
        /* shubeler optional; sessizce yoksay */
      })
    return () => {
      cancelled = true
    }
  }, [])

  const selectedTemplate = templates.find((t) => t.key === templateKey) ?? templates[0]
  const groups: FieldGroup[] = useMemo(() => {
    const groupTable = GROUPS_BY_TEMPLATE as Record<string, FieldGroup[]>
    return groupTable[templateKey] ?? []
  }, [templateKey])

  function set(name: string, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      try {
        const { id } = await api<{ ok: true; id: number }>('/api/contracts', {
          method: 'POST',
          json: {
            sector: selectedTemplate?.sector ?? 'real-estate',
            templateKey: templateKey as AnyTemplateKey,
            title: title.trim() || null,
            form,
            branchId: typeof branchId === 'number' ? branchId : null,
          },
        })
        router.push(`/contracts/${id}`)
        router.refresh()
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Bağlantı hatası.')
      }
    })
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="card space-y-4">
        {!fixed && (
          <Field label="Sözleşme tipi" required>
            <select
              className="input"
              value={templateKey}
              onChange={(e) => {
                setTemplateKey(e.target.value)
                setForm({})
              }}
            >
              {templates.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Başlık (opsiyonel)" hint="Örn: Mavişehir Kira #2026-01">
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        {branches.length > 0 && (
          <Field
            label="Şube / lokasyon"
            hint="Sözleşme antetinde bu şubenin adı ve adresi gözükür."
          >
            <select
              className="input"
              value={branchId}
              onChange={(e) =>
                setBranchId(e.target.value === '' ? '' : Number(e.target.value))
              }
            >
              <option value="">Ana ofis (şubesiz)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                  {b.city ? ` — ${b.city}` : ''}
                  {b.isDefault ? ' ★' : ''}
                </option>
              ))}
            </select>
          </Field>
        )}
        <div className="text-xs text-ink-muted">
          Bu şablonda{' '}
          <span className="font-semibold text-ink">{selectedTemplate?.roles.length ?? 0}</span>{' '}
          imzacı rolü vardır: {selectedTemplate?.roles.join(', ')}
        </div>
      </div>

      {groups.map((group) => (
        <div key={group.title} className="card">
          <h2 className="font-display font-bold text-lg mb-4">{group.title}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {group.fields.map((meta) => {
              const value = form[meta.name] ?? ''
              const isTextarea = meta.type === 'textarea'
              const span = isTextarea ? 'sm:col-span-2' : ''
              return (
                <div key={meta.name} className={span}>
                  <Field label={meta.label} hint={meta.hint}>
                    {isTextarea ? (
                      <textarea
                        rows={meta.rows ?? 3}
                        className="input font-mono"
                        placeholder={meta.placeholder}
                        value={value}
                        onChange={(e) => set(meta.name, e.target.value)}
                      />
                    ) : (
                      <input
                        type={meta.type ?? 'text'}
                        className="input"
                        placeholder={meta.placeholder}
                        value={value}
                        onChange={(e) => set(meta.name, e.target.value)}
                      />
                    )}
                  </Field>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <FormError message={error} />
      <div className="flex justify-end">
        <button className="btn-primary" disabled={pending}>
          {pending ? 'Oluşturuluyor…' : 'Sözleşmeyi oluştur'}
        </button>
      </div>
    </form>
  )
}
