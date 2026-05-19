'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  Bot,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Printer,
  Save,
  Trash2,
} from 'lucide-react'
import type { ValuationRequest } from '@/lib/db'
import { getAdminKey } from './AdminLogin'

const STATUSES = ['yeni', 'incelemede', 'tamamlandi'] as const

type Comparable = {
  title?: string
  location?: string
  price?: number | string
  area_m2?: number | string
  note?: string
}

type DraftState = {
  estimated_value: string
  estimated_currency: string
  value_min: string
  value_max: string
  unit_price_min: string
  unit_price_max: string
  marketing_time: string
  market_position: string
  methodology: string
  expert_opinion: string
  response_notes: string
  report_status: string
  comparables: Comparable[]
}

function initialDraft(r: ValuationRequest): DraftState {
  return {
    estimated_value: r.estimated_value ? String(r.estimated_value) : '',
    estimated_currency: r.estimated_currency || 'TRY',
    value_min: r.value_min ? String(r.value_min) : '',
    value_max: r.value_max ? String(r.value_max) : '',
    unit_price_min: r.unit_price_min ? String(r.unit_price_min) : '',
    unit_price_max: r.unit_price_max ? String(r.unit_price_max) : '',
    marketing_time: r.marketing_time || '',
    market_position: r.market_position || '',
    methodology: r.methodology || '',
    expert_opinion: r.expert_opinion || '',
    response_notes: r.response_notes || '',
    report_status: r.report_status || 'taslak',
    comparables: Array.isArray(r.comparables) ? (r.comparables as Comparable[]) : [],
  }
}

function num(value: string) {
  return value.trim() ? Number(value) : null
}

export default function ValuationsAdmin() {
  const [requests, setRequests] = useState<ValuationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [drafts, setDrafts] = useState<Record<number, DraftState>>({})
  const [aiLoading, setAiLoading] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = async () => {
    const key = getAdminKey()
    if (!key) return
    setLoading(true)
    const res = await fetch('/api/admin/valuations/', { headers: { 'x-admin-key': key } })
    const data = await res.json()
    setRequests(data.requests || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const updateDraft = (id: number, patch: Partial<DraftState>) => {
    const current = drafts[id] || initialDraft(requests.find((r) => r.id === id)!)
    setDrafts((prev) => ({ ...prev, [id]: { ...current, ...patch } }))
  }

  const patchRemote = async (id: number, body: Record<string, unknown>) => {
    const key = getAdminKey()
    if (!key) return
    const res = await fetch(`/api/admin/valuations/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Kayıt güncellenemedi')
    if (data.request) setRequests((prev) => prev.map((r) => (r.id === id ? data.request : r)))
  }

  const updateStatus = async (id: number, status: string) => {
    await patchRemote(id, { status })
  }

  const saveValuation = async (r: ValuationRequest) => {
    const d = drafts[r.id] || initialDraft(r)
    await patchRemote(r.id, {
      estimated_value: num(d.estimated_value),
      estimated_currency: d.estimated_currency || 'TRY',
      value_min: num(d.value_min),
      value_max: num(d.value_max),
      unit_price_min: num(d.unit_price_min),
      unit_price_max: num(d.unit_price_max),
      marketing_time: d.marketing_time || null,
      market_position: d.market_position || null,
      methodology: d.methodology || null,
      expert_opinion: d.expert_opinion || null,
      response_notes: d.response_notes || null,
      report_status: d.report_status || 'taslak',
      comparables: d.comparables,
      status: d.report_status === 'tamamlandi' ? 'tamamlandi' : r.status,
    })
    setMessage('Değerleme bilgileri kaydedildi.')
  }

  const runAi = async (id: number) => {
    const key = getAdminKey()
    if (!key) return
    setAiLoading(id)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/valuations/${id}/ai-draft/`, {
        method: 'POST',
        headers: { 'x-admin-key': key },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'AI taslak oluşturamadı')
      if (data.request) {
        setRequests((prev) => prev.map((r) => (r.id === id ? data.request : r)))
        setDrafts((prev) => ({ ...prev, [id]: initialDraft(data.request) }))
      }
      setMessage('AI taslak oluşturuldu. Lütfen kontrol edip kaydedin.')
    } catch (e) {
      setMessage((e as Error).message)
    } finally {
      setAiLoading(null)
    }
  }

  const remove = async (id: number) => {
    if (!confirm('Bu talebi silmek istediğinize emin misiniz?')) return
    const key = getAdminKey()
    if (!key) return
    await fetch(`/api/admin/valuations/${id}/`, { method: 'DELETE', headers: { 'x-admin-key': key } })
    setRequests((prev) => prev.filter((r) => r.id !== id))
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gold-500" /></div>
  if (requests.length === 0) return <div className="card p-10 text-center text-navy-600">Henüz değerleme talebi yok.</div>

  return (
    <div className="space-y-4">
      {message && <div className="card p-3 text-sm text-navy-700 bg-gold-50 border-gold-200">{message}</div>}
      {requests.map((r) => {
        const draft = drafts[r.id] || initialDraft(r)
        return (
          <div key={r.id} className="card p-4 md:p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs uppercase font-bold px-2 py-0.5 rounded ${r.status === 'tamamlandi' ? 'bg-green-100 text-green-700' : r.status === 'incelemede' ? 'bg-yellow-100 text-yellow-800' : 'bg-navy-100 text-navy-700'}`}>{r.status}</span>
                  <span className="font-display font-bold text-navy-950">{r.name}</span>
                  <span className="text-xs text-navy-500">{new Date(r.created_at).toLocaleString('tr-TR')}</span>
                </div>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                  <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1.5 text-navy-700"><Phone className="w-3.5 h-3.5 text-gold-500" />{r.phone}</a>
                  {r.email && <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1.5 text-navy-700 truncate"><Mail className="w-3.5 h-3.5 text-gold-500" />{r.email}</a>}
                  {r.property_type && <span className="text-navy-600">{r.property_type}</span>}
                  {(r.area_m2 || r.lot_m2) && <span className="text-navy-600">{r.area_m2 || r.lot_m2} m²</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                <Link href={`/tr/admin/degerleme-raporu/${r.id}/`} target="_blank" className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-gold-300 bg-gold-50 hover:bg-gold-100 text-gold-800 font-semibold">
                  <Printer className="w-3.5 h-3.5" /> Rapor
                </Link>
                <button onClick={() => runAi(r.id)} disabled={aiLoading === r.id} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-purple-200 bg-purple-50 text-purple-700 font-semibold disabled:opacity-50">
                  {aiLoading === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />} AI Taslak
                </button>
                <select value={r.status} onChange={(e) => updateStatus(r.id, e.target.value)} className="text-xs px-2 py-1 rounded border border-navy-200 bg-white">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => remove(r.id)} className="w-7 h-7 rounded hover:bg-red-50 text-red-600 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <InfoBlock title="Konum ve Tapu">
                <Line icon={<MapPin className="w-3.5 h-3.5 text-gold-500" />} text={r.address} />
                <Line text={[r.neighborhood, r.district, r.city].filter(Boolean).join(' / ') || 'Konum detayı yok'} />
                <Line text={[r.ada_no && `Ada ${r.ada_no}`, r.parsel_no && `Parsel ${r.parsel_no}`, r.pafta_no && `Pafta ${r.pafta_no}`].filter(Boolean).join(' / ') || 'Tapu bilgisi yok'} />
                {r.parcel_query_url && <a href={r.parcel_query_url} target="_blank" rel="noreferrer" className="text-xs text-gold-800 underline inline-flex items-center gap-1">Parsel sorgu <ExternalLink className="w-3 h-3" /></a>}
              </InfoBlock>
              <InfoBlock title="Mülk Özeti">
                <Line text={`Oda: ${r.rooms || '-'} · Yapım: ${r.year_built || '-'}`} />
                <Line text={`Alan: ${r.area_m2 || '-'} m² · Arsa: ${r.lot_m2 || '-'} m²`} />
                {r.manual_property_info && <p className="text-xs text-navy-600 whitespace-pre-line">{r.manual_property_info}</p>}
              </InfoBlock>
              <InfoBlock title="Belge / Fotoğraf">
                <Line icon={<FileText className="w-3.5 h-3.5 text-gold-500" />} text={`Fotoğraf: ${r.property_photos?.length || 0}`} />
                <Line icon={<FileText className="w-3.5 h-3.5 text-gold-500" />} text={`Belge: ${r.documents?.length || 0}`} />
                {r.notes && <p className="text-xs text-navy-600 whitespace-pre-line">{r.notes}</p>}
              </InfoBlock>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-6 gap-2">
              <Field label="Min Değer" value={draft.value_min} onChange={(v) => updateDraft(r.id, { value_min: v })} type="number" />
              <Field label="Tahmini Değer" value={draft.estimated_value} onChange={(v) => updateDraft(r.id, { estimated_value: v })} type="number" />
              <Field label="Max Değer" value={draft.value_max} onChange={(v) => updateDraft(r.id, { value_max: v })} type="number" />
              <Field label="Min m² Fiyat" value={draft.unit_price_min} onChange={(v) => updateDraft(r.id, { unit_price_min: v })} type="number" />
              <Field label="Max m² Fiyat" value={draft.unit_price_max} onChange={(v) => updateDraft(r.id, { unit_price_max: v })} type="number" />
              <div>
                <label className="label">Para</label>
                <select className="input" value={draft.estimated_currency} onChange={(e) => updateDraft(r.id, { estimated_currency: e.target.value })}>
                  <option value="TRY">TL</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
              <Field label="Pazarlama Süresi" value={draft.marketing_time} onChange={(v) => updateDraft(r.id, { marketing_time: v })} placeholder="Örn: 3-6 ay" />
              <Field label="Pazar Pozisyonu" value={draft.market_position} onChange={(v) => updateDraft(r.id, { market_position: v })} placeholder="Örn: rekabetçi / yüksek" />
              <div>
                <label className="label">Rapor Durumu</label>
                <select className="input" value={draft.report_status} onChange={(e) => updateDraft(r.id, { report_status: e.target.value })}>
                  <option value="taslak">Taslak</option>
                  <option value="ai-taslak">AI Taslak</option>
                  <option value="onaylandi">Onaylandı</option>
                  <option value="tamamlandi">Tamamlandı</option>
                </select>
              </div>
            </div>

            <ComparablesEditor comparables={draft.comparables} onChange={(comparables) => updateDraft(r.id, { comparables })} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
              <TextArea label="Yöntem" value={draft.methodology} onChange={(v) => updateDraft(r.id, { methodology: v })} />
              <TextArea label="Uzman Görüşü" value={draft.expert_opinion} onChange={(v) => updateDraft(r.id, { expert_opinion: v })} />
              <TextArea label="Kısa Yanıt Notu" value={draft.response_notes} onChange={(v) => updateDraft(r.id, { response_notes: v })} />
            </div>

            {r.ai_draft && Object.keys(r.ai_draft).length > 0 && (
              <details className="rounded-xl border border-purple-100 bg-purple-50 p-3 text-sm">
                <summary className="font-semibold text-purple-800 cursor-pointer">AI çıktısı</summary>
                <pre className="mt-2 whitespace-pre-wrap text-xs text-purple-950">{JSON.stringify(r.ai_draft, null, 2)}</pre>
              </details>
            )}

            <div className="flex justify-end">
              <button onClick={() => saveValuation(r)} className="btn-primary">
                <Save className="w-4 h-4" /> Değerlemeyi Kaydet
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function InfoBlock({ title, children }: { title: string; children: ReactNode }) {
  return <div className="rounded-xl border border-navy-100 bg-white p-3"><h4 className="font-semibold text-navy-950 mb-2">{title}</h4><div className="space-y-1.5">{children}</div></div>
}

function Line({ text, icon }: { text: string; icon?: ReactNode }) {
  return <div className="text-xs text-navy-700 flex items-start gap-1.5">{icon}{text}</div>
}

function Field({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return <div><label className="label">{label}</label><input type={type} className="input" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></div>
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <div><label className="label">{label}</label><textarea className="input min-h-[110px]" value={value} onChange={(e) => onChange(e.target.value)} /></div>
}

function ComparablesEditor({ comparables, onChange }: { comparables: Comparable[]; onChange: (items: Comparable[]) => void }) {
  const add = () => onChange([...comparables, { title: '', location: '', price: '', area_m2: '', note: '' }])
  const update = (idx: number, patch: Comparable) => onChange(comparables.map((c, i) => (i === idx ? { ...c, ...patch } : c)))
  const remove = (idx: number) => onChange(comparables.filter((_, i) => i !== idx))
  return (
    <div className="rounded-xl border border-navy-100 p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-navy-950">Emsal Kayıtları</h4>
        <button type="button" onClick={add} className="text-xs px-2 py-1 rounded bg-gold-100 text-gold-800 font-semibold inline-flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Emsal Ekle</button>
      </div>
      {comparables.length === 0 ? (
        <p className="text-xs text-navy-500">Henüz emsal yok.</p>
      ) : (
        <div className="space-y-2">
          {comparables.map((c, idx) => (
            <div key={idx} className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-end">
              <div className="lg:col-span-3"><input className="input text-sm" value={c.title || ''} placeholder="Başlık" onChange={(e) => update(idx, { title: e.target.value })} /></div>
              <div className="lg:col-span-2"><input className="input text-sm" value={c.location || ''} placeholder="Lokasyon" onChange={(e) => update(idx, { location: e.target.value })} /></div>
              <div className="lg:col-span-2"><input className="input text-sm" value={c.price || ''} placeholder="Fiyat" onChange={(e) => update(idx, { price: e.target.value })} /></div>
              <div className="lg:col-span-1"><input className="input text-sm" value={c.area_m2 || ''} placeholder="m²" onChange={(e) => update(idx, { area_m2: e.target.value })} /></div>
              <div className="lg:col-span-3"><input className="input text-sm" value={c.note || ''} placeholder="Not" onChange={(e) => update(idx, { note: e.target.value })} /></div>
              <button type="button" onClick={() => remove(idx)} className="lg:col-span-1 h-10 rounded hover:bg-red-50 text-red-600 flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
