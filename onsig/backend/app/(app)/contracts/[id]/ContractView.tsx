'use client'

import { useMemo, useState } from 'react'
import { FileText, Table2 } from 'lucide-react'
import { GROUPS_BY_TEMPLATE, isRealEstateKey, type RealEstateTemplateKey, type ContractFormState } from '@shared/contracts'

/**
 * Sözleşme detay paneli — iki sekmeli (Bilgiler tablo / Sözleşme metni).
 *
 * Bilgiler sekmesi yalnızca dolu form alanlarını gösterir, "............."
 * placeholder'lı boş satırlar zaten gösterilmez. Tarih alanları locale
 * gösterimine çevrilir.
 */

interface Props {
  templateKey: string
  form: Partial<ContractFormState>
  body: string
}

function formatValue(name: string, raw: string): string {
  if (!raw) return ''
  // ISO date strings → tr-TR.
  if (/(Date|date|Tarihi)$/.test(name) && /^\d{4}-\d{2}-\d{2}/.test(raw)) {
    try {
      return new Date(raw).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch {
      return raw
    }
  }
  return raw
}

export default function ContractView({ templateKey, form, body }: Props) {
  const [tab, setTab] = useState<'info' | 'text'>('info')
  const groups = useMemo(() => {
    if (!isRealEstateKey(templateKey)) return []
    return GROUPS_BY_TEMPLATE[templateKey as RealEstateTemplateKey]
      .map((g) => ({
        title: g.title,
        rows: g.fields
          .map((f) => ({ label: f.label, type: f.type, value: formatValue(f.name, (form[f.name] as string) || '') }))
          .filter((r) => r.value && r.value.trim().length > 0),
      }))
      .filter((g) => g.rows.length > 0)
  }, [templateKey, form])

  return (
    <section className="card !p-0 overflow-hidden">
      <div className="flex border-b border-slate-200 bg-slate-50/60">
        <TabButton active={tab === 'info'} onClick={() => setTab('info')} icon={<Table2 className="w-4 h-4" />}>
          Bilgiler
        </TabButton>
        <TabButton active={tab === 'text'} onClick={() => setTab('text')} icon={<FileText className="w-4 h-4" />}>
          Sözleşme metni
        </TabButton>
      </div>

      {tab === 'info' ? (
        <div className="p-5 space-y-5">
          {groups.length === 0 ? (
            <p className="text-sm text-ink-muted">Bu sözleşmenin formunda henüz bilgi yok.</p>
          ) : (
            groups.map((g) => (
              <div key={g.title}>
                <h3 className="text-xs uppercase tracking-wider font-bold text-brand-deep mb-2">{g.title}</h3>
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-slate-100">
                      {g.rows.map((r) => (
                        <tr key={r.label} className="even:bg-slate-50/50">
                          <th
                            scope="row"
                            className="px-3 py-2 text-left text-xs font-semibold text-ink-muted w-1/3 align-top"
                          >
                            {r.label}
                          </th>
                          <td className="px-3 py-2 text-ink align-top">
                            {r.type === 'textarea' ? (
                              <span className="whitespace-pre-wrap break-words leading-relaxed">{r.value}</span>
                            ) : (
                              <span className="break-words">{r.value}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="p-5">
          <article className="contract-body bg-white rounded-xl border border-slate-100 p-5 max-h-[640px] overflow-auto">
            {body}
          </article>
        </div>
      )}
    </section>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 sm:flex-none px-4 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2 transition border-b-2 ${
        active
          ? 'border-brand text-brand-deep bg-white'
          : 'border-transparent text-ink-muted hover:text-ink hover:bg-white/60'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}
