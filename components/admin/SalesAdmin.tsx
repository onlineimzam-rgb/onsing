'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Briefcase,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  FileSignature,
  Loader2,
  Pencil,
  Plus,
  Receipt,
  Trash2,
} from 'lucide-react'
import { getAdminKey } from './AdminLogin'
import { formatPrice } from '@/lib/format'
import type { Currency } from '@/lib/config'

type Tx = Record<string, unknown>
type PropLite = { id: number; title_tr: string; reference_no: string }

type ContractLite = {
  id: number
  contractType: string
  title: string | null
  status: string
  createdAt: string
  formSnapshot: Record<string, unknown> | null
}

const STAGE_OPTIONS: { value: string; label: string; cls: string }[] = [
  { value: 'sozlesme', label: 'Sözleşme aşamasında', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'tapu-bekliyor', label: 'Tapu bekleniyor', cls: 'bg-sky-100 text-sky-800 border-sky-200' },
  { value: 'fatura-bekliyor', label: 'Fatura bekleniyor', cls: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { value: 'tamamlandi', label: 'Tamamlandı', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'iptal', label: 'İptal', cls: 'bg-red-100 text-red-800 border-red-200' },
]

function asCurrency(c: unknown): Currency {
  return c === 'EUR' ? 'EUR' : 'TRY'
}

function stageMeta(s: unknown) {
  return STAGE_OPTIONS.find((o) => o.value === s) || STAGE_OPTIONS[0]!
}

function parseTrDate(input: unknown): string {
  // Sözleşme formundan gelen tarih "DD.MM.YYYY", "DD/MM/YYYY" veya ISO olabilir; HTML date input için YYYY-MM-DD'e çeviriyoruz.
  const s = String(input || '').trim()
  if (!s) return ''
  const iso = /^\d{4}-\d{2}-\d{2}/.exec(s)
  if (iso) return s.slice(0, 10)
  const m = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(s)
  if (m) {
    const d = m[1]!.padStart(2, '0')
    const mo = m[2]!.padStart(2, '0')
    return `${m[3]}-${mo}-${d}`
  }
  return ''
}

function parseMoney(input: unknown): string {
  const s = String(input || '').replace(/\s|TL|TRY|EUR|€|₺/gi, '').trim()
  if (!s) return ''
  const normalized = s.replace(/\./g, '').replace(/,/g, '.')
  const n = Number(normalized)
  return Number.isFinite(n) && n > 0 ? String(n) : ''
}

export default function SalesAdmin({
  highlightContractId,
  onConsumedHighlight,
}: {
  highlightContractId?: number | null
  onConsumedHighlight?: () => void
} = {}) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [transactions, setTransactions] = useState<Tx[]>([])
  const [properties, setProperties] = useState<PropLite[]>([])
  const [contracts, setContracts] = useState<ContractLite[]>([])
  const [editing, setEditing] = useState<Tx | null>(null)
  const [contractSearch, setContractSearch] = useState('')
  const [highlightId, setHighlightId] = useState<number | null>(null)
  const [form, setForm] = useState({
    property_id: '',
    contract_id: '',
    buyer_name: '',
    seller_name: '',
    sale_price: '',
    currency: 'TRY' as Currency,
    commission_amount: '',
    commission_currency: 'TRY' as Currency,
    invoice_issued: false,
    invoice_no: '',
    contract_signed_at: '',
    sale_completed_at: '',
    notes: '',
    stage: 'sozlesme',
  })

  const load = useCallback(async () => {
    const key = getAdminKey()
    if (!key) return
    setLoading(true)
    try {
      const [tRes, pRes, cRes] = await Promise.all([
        fetch('/api/admin/sales-transactions/', { headers: { 'x-admin-key': key } }),
        fetch('/api/admin/properties/', { headers: { 'x-admin-key': key } }),
        fetch('/api/admin/contracts/', { headers: { 'x-admin-key': key } }),
      ])
      const tJson = await tRes.json()
      const pJson = await pRes.json()
      const cJson = await cRes.json()
      setTransactions((tJson.transactions || []) as Tx[])
      const props = (pJson.properties || []) as PropLite[]
      setProperties(props.map((p) => ({ id: p.id, title_tr: p.title_tr, reference_no: p.reference_no })).slice(0, 500))
      setContracts((cJson.contracts || []) as ContractLite[])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (highlightContractId == null || transactions.length === 0) return
    const tx = transactions.find((t) => Number(t.contract_id) === Number(highlightContractId))
    if (tx) {
      setHighlightId(Number(tx.id))
      onConsumedHighlight?.()
      setTimeout(() => setHighlightId((v) => (v === Number(tx.id) ? null : v)), 4000)
    }
  }, [highlightContractId, transactions, onConsumedHighlight])

  const resetForm = () => {
    setEditing(null)
    setContractSearch('')
    setForm({
      property_id: '',
      contract_id: '',
      buyer_name: '',
      seller_name: '',
      sale_price: '',
      currency: 'TRY',
      commission_amount: '',
      commission_currency: 'TRY',
      invoice_issued: false,
      invoice_no: '',
      contract_signed_at: '',
      sale_completed_at: '',
      notes: '',
      stage: 'sozlesme',
    })
  }

  const startEdit = (row: Tx) => {
    setEditing(row)
    setContractSearch('')
    setForm({
      property_id: row.property_id != null ? String(row.property_id) : '',
      contract_id: row.contract_id != null ? String(row.contract_id) : '',
      buyer_name: String(row.buyer_name || ''),
      seller_name: String(row.seller_name || ''),
      sale_price: row.sale_price != null ? String(row.sale_price) : '',
      currency: asCurrency(row.currency),
      commission_amount: row.commission_amount != null ? String(row.commission_amount) : '',
      commission_currency: asCurrency(row.commission_currency),
      invoice_issued: !!row.invoice_issued,
      invoice_no: String(row.invoice_no || ''),
      contract_signed_at: row.contract_signed_at ? String(row.contract_signed_at).slice(0, 10) : '',
      sale_completed_at: row.sale_completed_at ? String(row.sale_completed_at).slice(0, 10) : '',
      notes: String(row.notes || ''),
      stage: String(row.stage || 'sozlesme'),
    })
  }

  /**
   * Sözleşme seçildiğinde alıcı / satıcı / satış bedeli / sözleşme tarihi gibi alanları otomatik doldur.
   * Mevcut form alanı boş ise doldurur, kullanıcı elle yazdıysa üzerine yazmaz.
   */
  const applyContract = (contractId: string) => {
    setForm((f) => ({ ...f, contract_id: contractId }))
    if (!contractId) return
    const c = contracts.find((x) => String(x.id) === contractId)
    if (!c) return
    const snap = (c.formSnapshot || {}) as Record<string, unknown>
    const isSale = c.contractType === 'alim-satim'
    const buyer = isSale ? String(snap.customerName || '') : ''
    const seller = isSale ? String(snap.ownerName || '') : ''
    const price = parseMoney(snap.salePrice)
    const date = parseTrDate(snap.contractDate)
    setForm((f) => ({
      ...f,
      buyer_name: f.buyer_name.trim() ? f.buyer_name : buyer,
      seller_name: f.seller_name.trim() ? f.seller_name : seller,
      sale_price: f.sale_price ? f.sale_price : price,
      contract_signed_at: f.contract_signed_at ? f.contract_signed_at : date,
    }))
  }

  const payload = () => ({
    property_id: form.property_id === '' ? null : Number(form.property_id),
    contract_id: form.contract_id === '' ? null : Number(form.contract_id),
    buyer_name: form.buyer_name.trim() || null,
    seller_name: form.seller_name.trim() || null,
    sale_price: form.sale_price === '' ? null : Number(form.sale_price),
    currency: form.currency,
    commission_amount: form.commission_amount === '' ? null : Number(form.commission_amount),
    commission_currency: form.commission_currency,
    invoice_issued: form.invoice_issued,
    invoice_no: form.invoice_no.trim() || null,
    contract_signed_at: form.contract_signed_at || null,
    sale_completed_at: form.sale_completed_at || null,
    notes: form.notes.trim() || null,
    stage: form.stage,
  })

  const save = async () => {
    const key = getAdminKey()
    if (!key) return
    setSaving(true)
    try {
      const body = payload()
      const url = editing
        ? `/api/admin/sales-transactions/${editing.id}/`
        : '/api/admin/sales-transactions/'
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
    if (!confirm('Bu iş kaydını silmek istiyor musunuz?')) return
    const key = getAdminKey()
    if (!key) return
    await fetch(`/api/admin/sales-transactions/${id}/`, {
      method: 'DELETE',
      headers: { 'x-admin-key': key },
    })
    await load()
    if (editing && Number(editing.id) === id) resetForm()
  }

  const filteredContracts = useMemo(() => {
    const q = contractSearch.trim().toLowerCase()
    const sorted = [...contracts].sort((a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)))
    if (!q) return sorted.slice(0, 80)
    return sorted
      .filter((c) =>
        [
          String(c.id),
          c.title || '',
          c.contractType,
          c.status,
          String((c.formSnapshot as Record<string, unknown> | null)?.customerName || ''),
          String((c.formSnapshot as Record<string, unknown> | null)?.ownerName || ''),
        ]
          .join(' ')
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 80)
  }, [contracts, contractSearch])

  const totals = useMemo(() => {
    const sale: Record<string, number> = { TRY: 0, EUR: 0 }
    const commission: Record<string, number> = { TRY: 0, EUR: 0 }
    const invoiced: Record<string, number> = { TRY: 0, EUR: 0 }
    const counts: Record<string, number> = {}
    let completed = 0
    for (const t of transactions) {
      const c = asCurrency(t.currency)
      const cc = asCurrency(t.commission_currency)
      sale[c] = (sale[c] || 0) + Number(t.sale_price || 0)
      commission[cc] = (commission[cc] || 0) + Number(t.commission_amount || 0)
      if (t.invoice_issued) invoiced[cc] = (invoiced[cc] || 0) + Number(t.commission_amount || 0)
      const stg = String(t.stage || 'sozlesme')
      counts[stg] = (counts[stg] || 0) + 1
      if (stg === 'tamamlandi') completed++
    }
    return { sale, commission, invoiced, counts, completed, total: transactions.length }
  }, [transactions])

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
          <Briefcase className="w-6 h-6 text-gold-600" />
          İşler (Satış ve komisyon)
        </h3>
        <p className="text-sm text-navy-600 mt-1">
          Satışları, komisyonu, faturayı ve sözleşme ile mülk ilişkisini buradan takip edin. Sözleşme seçtiğinizde alıcı,
          satıcı, satış bedeli ve sözleşme tarihi otomatik doldurulur.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          icon={CircleDollarSign}
          label="Toplam satış"
          values={[
            formatPrice(totals.sale.TRY || 0, 'TRY'),
            ...(totals.sale.EUR ? [formatPrice(totals.sale.EUR, 'EUR')] : []),
          ]}
          accent="bg-gold-50 text-gold-900 border-gold-200"
        />
        <SummaryCard
          icon={Receipt}
          label="Toplam komisyon"
          values={[
            formatPrice(totals.commission.TRY || 0, 'TRY'),
            ...(totals.commission.EUR ? [formatPrice(totals.commission.EUR, 'EUR')] : []),
          ]}
          accent="bg-emerald-50 text-emerald-900 border-emerald-200"
        />
        <SummaryCard
          icon={FileSignature}
          label="Fatura kesilen"
          values={[
            formatPrice(totals.invoiced.TRY || 0, 'TRY'),
            ...(totals.invoiced.EUR ? [formatPrice(totals.invoiced.EUR, 'EUR')] : []),
          ]}
          accent="bg-indigo-50 text-indigo-900 border-indigo-200"
        />
        <SummaryCard
          icon={ClipboardList}
          label="Kayıt / tamamlanan"
          values={[`${totals.total} kayıt`, `${totals.completed} tamamlandı`]}
          accent="bg-navy-50 text-navy-900 border-navy-200"
        />
      </div>

      <div className="card p-5 space-y-3">
        <h4 className="font-semibold text-navy-950">{editing ? 'Kayıt düzenle' : 'Yeni iş kaydı'}</h4>

        <Field label="Sözleşme">
          <input
            className="input text-sm"
            placeholder="ID, başlık, alıcı veya satıcı adıyla ara..."
            value={contractSearch}
            onChange={(e) => setContractSearch(e.target.value)}
          />
          <select
            className="input text-sm mt-2"
            value={form.contract_id}
            onChange={(e) => applyContract(e.target.value)}
            size={Math.min(8, Math.max(4, filteredContracts.length))}
          >
            <option value="">— Sözleşme seçilmedi —</option>
            {filteredContracts.map((c) => {
              const snap = (c.formSnapshot || {}) as Record<string, unknown>
              const cust = String(snap.customerName || '')
              const own = String(snap.ownerName || '')
              const tag = c.contractType === 'alim-satim' ? 'SATIŞ' : c.contractType.toUpperCase()
              return (
                <option key={c.id} value={c.id}>
                  #{c.id} · {tag} · {c.title || 'Adsız'}
                  {(cust || own) ? ` — ${[own, cust].filter(Boolean).join(' / ')}` : ''}
                </option>
              )
            })}
          </select>
          {form.contract_id && (
            <p className="text-xs text-navy-600 mt-1">
              Seçilen sözleşme: <span className="font-mono font-semibold">#{form.contract_id}</span>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, contract_id: '' }))}
                className="ml-2 text-red-700 underline"
              >
                Temizle
              </button>
            </p>
          )}
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="İlan (portföy)">
            <select
              className="input text-sm"
              value={form.property_id}
              onChange={(e) => setForm((f) => ({ ...f, property_id: e.target.value }))}
            >
              <option value="">— Seçin —</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.reference_no} · {(p.title_tr || '').slice(0, 60)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Süreç (aşama)">
            <select
              className="input text-sm"
              value={form.stage}
              onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))}
            >
              {STAGE_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Alıcı adı">
            <input
              className="input text-sm"
              value={form.buyer_name}
              onChange={(e) => setForm((f) => ({ ...f, buyer_name: e.target.value }))}
            />
          </Field>
          <Field label="Satıcı adı">
            <input
              className="input text-sm"
              value={form.seller_name}
              onChange={(e) => setForm((f) => ({ ...f, seller_name: e.target.value }))}
            />
          </Field>
          <Field label="Satış bedeli">
            <input
              className="input text-sm"
              type="number"
              value={form.sale_price}
              onChange={(e) => setForm((f) => ({ ...f, sale_price: e.target.value }))}
            />
          </Field>
          <Field label="Para birimi">
            <select
              className="input text-sm"
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value === 'EUR' ? 'EUR' : 'TRY' }))}
            >
              <option value="TRY">TRY</option>
              <option value="EUR">EUR</option>
            </select>
          </Field>
          <Field label="Komisyon tutarı">
            <input
              className="input text-sm"
              type="number"
              value={form.commission_amount}
              onChange={(e) => setForm((f) => ({ ...f, commission_amount: e.target.value }))}
            />
          </Field>
          <Field label="Komisyon para birimi">
            <select
              className="input text-sm"
              value={form.commission_currency}
              onChange={(e) => setForm((f) => ({ ...f, commission_currency: e.target.value === 'EUR' ? 'EUR' : 'TRY' }))}
            >
              <option value="TRY">TRY</option>
              <option value="EUR">EUR</option>
            </select>
          </Field>
          <Field label="Sözleşme imza tarihi">
            <input
              className="input text-sm"
              type="date"
              value={form.contract_signed_at}
              onChange={(e) => setForm((f) => ({ ...f, contract_signed_at: e.target.value }))}
            />
          </Field>
          <Field label="Satış / tapu tarihi">
            <input
              className="input text-sm"
              type="date"
              value={form.sale_completed_at}
              onChange={(e) => setForm((f) => ({ ...f, sale_completed_at: e.target.value }))}
            />
          </Field>
          <Field label="Fatura kesildi">
            <label className="inline-flex items-center gap-2 text-sm mt-2">
              <input
                type="checkbox"
                checked={form.invoice_issued}
                onChange={(e) => setForm((f) => ({ ...f, invoice_issued: e.target.checked }))}
              />
              Evet
            </label>
          </Field>
          <Field label="Fatura no">
            <input
              className="input text-sm"
              value={form.invoice_no}
              onChange={(e) => setForm((f) => ({ ...f, invoice_no: e.target.value }))}
            />
          </Field>
          <Field label="Notlar" className="md:col-span-2">
            <textarea
              className="input text-sm min-h-[72px]"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
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
          <h4 className="font-display text-lg font-bold text-navy-950">Kayıtlar ({transactions.length})</h4>
          <div className="flex items-center gap-1 text-xs flex-wrap">
            {STAGE_OPTIONS.map((s) => (
              <span key={s.value} className={`px-2 py-0.5 rounded-full border ${s.cls}`}>
                {s.label}: {totals.counts[s.value] || 0}
              </span>
            ))}
          </div>
        </div>
        {transactions.length === 0 ? (
          <p className="text-sm text-navy-500">Henüz iş kaydı yok.</p>
        ) : (
          <div className="overflow-x-auto border border-navy-100 rounded-xl">
            <table className="min-w-[1200px] w-full text-sm">
              <thead className="bg-navy-50 text-navy-700">
                <tr>
                  <th className="text-left px-3 py-2">Süreç</th>
                  <th className="text-left px-3 py-2">Sz. tarihi</th>
                  <th className="text-left px-3 py-2">Satış / tapu</th>
                  <th className="text-left px-3 py-2">Mülk</th>
                  <th className="text-left px-3 py-2">Alıcı</th>
                  <th className="text-left px-3 py-2">Satıcı</th>
                  <th className="text-left px-3 py-2">Satış</th>
                  <th className="text-left px-3 py-2">Komisyon</th>
                  <th className="text-left px-3 py-2">Fatura</th>
                  <th className="text-left px-3 py-2">Sz.</th>
                  <th className="text-right px-3 py-2">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100 bg-white">
                {transactions.map((t) => {
                  const stg = stageMeta(t.stage)
                  const isHighlight = highlightId != null && Number(t.id) === highlightId
                  return (
                    <tr
                      key={String(t.id)}
                      className={`hover:bg-gold-50/40 ${isHighlight ? 'bg-emerald-50/70 ring-2 ring-emerald-300' : ''}`}
                    >
                      <td className="px-3 py-2">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${stg.cls} inline-flex items-center gap-1`}>
                          {stg.value === 'tamamlandi' && <CheckCircle2 className="w-3 h-3" />}
                          {stg.label}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-navy-600">
                        {t.contract_signed_at
                          ? new Date(String(t.contract_signed_at)).toLocaleDateString('tr-TR')
                          : '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-navy-600">
                        {t.sale_completed_at
                          ? new Date(String(t.sale_completed_at)).toLocaleDateString('tr-TR')
                          : '-'}
                      </td>
                      <td className="px-3 py-2 max-w-[220px] truncate" title={String(t.property_title || '')}>
                        {t.property_title
                          ? `${String(t.property_reference_no || '').trim()} ${String(t.property_title)}`.trim()
                          : '-'}
                      </td>
                      <td className="px-3 py-2">{String(t.buyer_name || '-')}</td>
                      <td className="px-3 py-2">{String(t.seller_name || '-')}</td>
                      <td className="px-3 py-2 font-semibold">
                        {t.sale_price != null ? formatPrice(Number(t.sale_price), asCurrency(t.currency)) : '-'}
                      </td>
                      <td className="px-3 py-2">
                        {t.commission_amount != null
                          ? formatPrice(Number(t.commission_amount), asCurrency(t.commission_currency))
                          : '-'}
                      </td>
                      <td className="px-3 py-2">
                        {t.invoice_issued ? (
                          <span className="text-emerald-700 font-semibold">
                            Evet{t.invoice_no ? ` · ${String(t.invoice_no)}` : ''}
                          </span>
                        ) : (
                          <span className="text-navy-500">Hayır</span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{t.contract_id != null ? `#${String(t.contract_id)}` : '-'}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => startEdit(t)}
                          className="text-xs px-2 py-1 rounded bg-gold-100 text-gold-800 font-semibold mr-1"
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(Number(t.id))}
                          className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 font-semibold"
                        >
                          <Trash2 className="w-3 h-3 inline" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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

function SummaryCard({
  icon: Icon,
  label,
  values,
  accent,
}: {
  icon: typeof Briefcase
  label: string
  values: string[]
  accent: string
}) {
  return (
    <div className={`rounded-2xl border p-4 ${accent}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
        <Icon className="w-4 h-4" />
      </div>
      <div className="space-y-0.5">
        {values.map((v, i) => (
          <p key={i} className="font-display text-lg font-bold leading-tight">
            {v}
          </p>
        ))}
      </div>
    </div>
  )
}
