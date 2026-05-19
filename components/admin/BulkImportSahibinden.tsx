'use client'

import { useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, Download, Loader2, Plus, UploadCloud, XCircle } from 'lucide-react'
import { formatPrice } from '@/lib/format'
import { getAdminKey } from './AdminLogin'

type ImportedFields = {
  type?: string
  category?: string | null
  title_tr?: string
  description_tr?: string
  price?: number
  currency?: 'TRY' | 'EUR'
  city?: string
  district?: string
  neighborhood?: string
  bedrooms?: number
  bathrooms?: number
  area_m2?: number
  lot_m2?: number
  building_age?: number
  floor?: number
  total_floors?: number
  heating_type?: string
  ada_no?: string
  parsel_no?: string
  pafta_no?: string
  features?: string[]
  lat?: number
  lng?: number
  images?: string[]
}

type ImportItem = {
  id: string
  html: string
  selected: boolean
  loading: boolean
  creating: boolean
  error: string | null
  fields: ImportedFields | null
  fieldCount?: number
  propertyId?: number
  referenceNo?: string
  imageImport?: { uploaded: number; failed: number }
}

function splitHtmlSources(raw: string): string[] {
  const text = raw.trim()
  if (!text) return []
  const manual = text
    .split(/\n\s*(?:---+|###|===+)\s*(?:İLAN|ILAN|HTML)?\s*(?:---+|###|===+)?\s*\n/gi)
    .map((s) => s.trim())
    .filter((s) => s.length > 1000)
  if (manual.length > 1) return manual

  const starts: number[] = []
  const re = /(?:<!doctype\s+html|<html[\s>])/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) starts.push(m.index)
  if (starts.length <= 1) return [text]
  return starts
    .map((start, idx) => text.slice(start, starts[idx + 1] ?? text.length).trim())
    .filter((s) => s.length > 1000)
}

function payloadFromFields(f: ImportedFields, status: string) {
  return {
    type: f.type || 'satilik',
    category: f.category || 'arsa',
    title_tr: f.title_tr || 'Sahibinden İlanı',
    title_en: f.title_tr || 'Property',
    description_tr: f.description_tr || '',
    description_en: '',
    price: f.price || 0,
    currency: f.currency || 'TRY',
    city: f.city || '',
    district: f.district || '',
    neighborhood: f.neighborhood || '',
    address: [f.neighborhood, f.district, f.city].filter(Boolean).join(', '),
    lat: f.lat || null,
    lng: f.lng || null,
    bedrooms: f.bedrooms ?? null,
    bathrooms: f.bathrooms ?? null,
    area_m2: f.area_m2 ?? null,
    lot_m2: f.lot_m2 ?? null,
    building_age: f.building_age ?? null,
    floor: f.floor ?? null,
    total_floors: f.total_floors ?? null,
    heating_type: f.heating_type || null,
    features: f.features || [],
    is_featured: false,
    status,
    ada_no: f.ada_no || null,
    parsel_no: f.parsel_no || null,
    pafta_no: f.pafta_no || null,
  }
}

export default function BulkImportSahibinden({
  onClose,
  onDone,
}: {
  onClose: () => void
  onDone: () => void
}) {
  const [raw, setRaw] = useState('')
  const [items, setItems] = useState<ImportItem[]>([])
  const [parsing, setParsing] = useState(false)
  const [creatingAll, setCreatingAll] = useState(false)
  const [targetStatus, setTargetStatus] = useState<'aktif' | 'pasif'>('pasif')
  const [importImages, setImportImages] = useState(true)

  const selectedCount = useMemo(() => items.filter((i) => i.selected && i.fields && !i.propertyId).length, [items])

  const prepare = async () => {
    const parts = splitHtmlSources(raw)
    if (parts.length === 0) return
    const next = parts.map((html, idx) => ({
      id: `${Date.now()}-${idx}`,
      html,
      selected: true,
      loading: true,
      creating: false,
      error: null,
      fields: null,
    }))
    setItems(next)
    setParsing(true)
    const key = getAdminKey()
    if (!key) return
    for (const item of next) {
      try {
        const res = await fetch('/api/admin/import-sahibinden/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
          body: JSON.stringify({ html: item.html }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'HTML çözümlenemedi')
        setItems((prev) =>
          prev.map((x) =>
            x.id === item.id
              ? { ...x, loading: false, fields: data.fields || {}, fieldCount: data.fieldCount || 0 }
              : x
          )
        )
      } catch (e) {
        setItems((prev) =>
          prev.map((x) =>
            x.id === item.id ? { ...x, loading: false, selected: false, error: (e as Error).message } : x
          )
        )
      }
    }
    setParsing(false)
  }

  const createOne = async (item: ImportItem) => {
    const key = getAdminKey()
    if (!key || !item.fields) return
    setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, creating: true, error: null } : x)))
    try {
      const res = await fetch('/api/admin/properties/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
        body: JSON.stringify(payloadFromFields(item.fields, targetStatus)),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'İlan kaydedilemedi')
      const propertyId = data.property?.id as number | undefined
      let imageImport: ImportItem['imageImport']
      if (propertyId && importImages && item.fields.images?.length) {
        const imgRes = await fetch(`/api/admin/properties/${propertyId}/import-images/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
          body: JSON.stringify({ urls: item.fields.images }),
        })
        const imgData = await imgRes.json()
        imageImport = {
          uploaded: Number(imgData.uploaded || imgData.images?.length || 0),
          failed: Number(imgData.failedCount || 0),
        }
      }
      setItems((prev) =>
        prev.map((x) =>
          x.id === item.id
            ? {
                ...x,
                creating: false,
                selected: false,
                propertyId,
                referenceNo: data.property?.reference_no,
                imageImport,
              }
            : x
        )
      )
      onDone()
    } catch (e) {
      setItems((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, creating: false, error: (e as Error).message } : x))
      )
    }
  }

  const createSelected = async () => {
    setCreatingAll(true)
    for (const item of items.filter((i) => i.selected && i.fields && !i.propertyId)) {
      await createOne(item)
    }
    setCreatingAll(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={onClose} className="inline-flex items-center gap-1 text-sm font-semibold text-navy-700">
          <ArrowLeft className="w-4 h-4" />
          Portföye dön
        </button>
        <h3 className="font-display text-xl font-bold text-navy-950">Toplu Sahibinden HTML Aktar</h3>
        <div />
      </div>

      <section className="card p-5 space-y-3">
        <p className="text-sm text-navy-600">
          Her ilan için sahibinden sayfasında <strong>Ctrl+U</strong>, sonra <strong>Ctrl+A</strong> ve{' '}
          <strong>Ctrl+C</strong> yapın. Birden fazla HTML kaynağını alt alta yapıştırabilirsiniz; isterseniz
          araya <code>---</code> satırı koyun.
        </p>
        <textarea
          className="input min-h-[220px] font-mono text-xs"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="<!doctype html>... ilan 1 ...&#10;---&#10;<!doctype html>... ilan 2 ..."
        />
        <div className="flex items-center gap-3 flex-wrap">
          <select className="input text-sm w-auto" value={targetStatus} onChange={(e) => setTargetStatus(e.target.value as any)}>
            <option value="pasif">Pasif/Taslak olarak ekle</option>
            <option value="aktif">Aktif yayınla</option>
          </select>
          <label className="inline-flex items-center gap-2 text-sm text-navy-700">
            <input type="checkbox" checked={importImages} onChange={(e) => setImportImages(e.target.checked)} />
            Fotoğrafları da indir
          </label>
          <button onClick={prepare} disabled={parsing || !raw.trim()} className="btn-primary disabled:opacity-50">
            {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            HTML’leri Çözümle
          </button>
          {items.length > 0 && (
            <button onClick={createSelected} disabled={creatingAll || selectedCount === 0} className="btn-ghost border-2 border-gold-300 disabled:opacity-50">
              {creatingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Seçilileri Portföye Ekle ({selectedCount})
            </button>
          )}
        </div>
      </section>

      {items.length > 0 && (
        <section className="space-y-2">
          {items.map((item, idx) => {
            const f = item.fields
            return (
              <div key={item.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={item.selected}
                    disabled={!f || !!item.propertyId}
                    onChange={(e) => setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, selected: e.target.checked } : x)))}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-navy-500">#{idx + 1}</span>
                      {item.loading && <span className="text-xs text-amber-700">Çözümleniyor…</span>}
                      {item.error && <span className="text-xs text-red-600 inline-flex items-center gap-1"><XCircle className="w-3.5 h-3.5" />{item.error}</span>}
                      {item.propertyId && <span className="text-xs text-green-700 inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Kaydedildi {item.referenceNo}</span>}
                    </div>
                    {f && (
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                        <div>
                          <h4 className="font-semibold text-navy-950 truncate">{f.title_tr || 'Başlık bulunamadı'}</h4>
                          <p className="text-xs text-navy-500 mt-1">
                            {[f.neighborhood, f.district, f.city].filter(Boolean).join(', ') || 'Konum yok'} ·{' '}
                            {f.category || 'kategori yok'} · {f.lot_m2 || f.area_m2 || '-'} m²
                          </p>
                          <p className="text-xs text-navy-500 mt-1">
                            Tapu: {[f.ada_no && `Ada ${f.ada_no}`, f.parsel_no && `Parsel ${f.parsel_no}`].filter(Boolean).join(' / ') || '—'} ·{' '}
                            Fotoğraf: {f.images?.length || 0}
                            {item.imageImport ? ` · İndirilen: ${item.imageImport.uploaded}, Hata: ${item.imageImport.failed}` : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-display text-lg font-bold text-navy-950">
                            {f.price ? formatPrice(f.price, f.currency || 'TRY') : 'Fiyat yok'}
                          </div>
                          {!item.propertyId && (
                            <button onClick={() => createOne(item)} disabled={item.creating} className="mt-2 text-xs px-3 py-2 rounded-xl bg-gold-100 text-gold-800 font-semibold inline-flex items-center gap-1 disabled:opacity-50">
                              {item.creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                              Portföye ekle
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </section>
      )}
    </div>
  )
}
