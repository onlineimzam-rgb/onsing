'use client'

import { useEffect, useMemo, useState } from 'react'
import { upload } from '@vercel/blob/client'
import {
  X, Send, Loader2, Phone, Mail, MessageCircle, Search, CheckSquare, Square,
  ExternalLink, Sparkles, Tag, Plus, Trash2, UploadCloud,
} from 'lucide-react'
import type { Lead } from '@/lib/db'
import { getAdminKey } from './AdminLogin'
import { SITE_CONFIG } from '@/lib/config'

interface PropertyLite {
  id?: number
  localId?: string
  reference_no?: string
  slug?: string
  external_url?: string
  type: string
  category: string
  title_tr: string
  title_en: string | null
  price: number
  currency: string
  district: string | null
  neighborhood: string | null
  bedrooms: number | null
  area_m2: number | null
  lot_m2: number | null
  lat: number | null
  lng: number | null
  ada_no?: string | null
  parsel_no?: string | null
  pafta_no?: string | null
  is_detached?: boolean | null
  in_site?: boolean | null
  land_status?: string | null
  cover_image: string | null
  image_urls?: string[]
}

function formatPrice(p: number, c: string) {
  const num = Number(p).toLocaleString('tr-TR', { maximumFractionDigits: 0 })
  const suffix = c === 'EUR' ? '€' : 'TL'
  return `${num} ${suffix}`
}

function boolLabel(value?: boolean | null) {
  if (value == null) return null
  return value ? 'Evet' : 'Hayır'
}

function blankManualProperty(): PropertyLite {
  return {
    localId: '',
    reference_no: '',
    type: 'satilik',
    category: 'arsa',
    title_tr: '',
    title_en: null,
    price: 0,
    currency: 'TRY',
    district: '',
    neighborhood: '',
    bedrooms: null,
    area_m2: null,
    lot_m2: null,
    lat: null,
    lng: null,
    ada_no: '',
    parsel_no: '',
    pafta_no: '',
    is_detached: null,
    in_site: null,
    land_status: '',
    cover_image: null,
    image_urls: [],
    external_url: '',
  }
}

function buildWhatsAppText(opts: {
  greetingName: string
  body: string
  properties: PropertyLite[]
}) {
  const lines: string[] = [`Merhaba ${opts.greetingName},`, '']
  if (opts.body) lines.push(opts.body, '')
  if (opts.properties.length > 0) {
    lines.push('Sizin için seçtiğimiz ilanlar:', '')
    opts.properties.forEach((p, i) => {
      const title = p.title_tr || p.title_en || `İlan ${p.reference_no}`
      const url = p.slug ? `${SITE_CONFIG.url}/tr/emlak/${p.slug}/` : (p.external_url || '')
      lines.push(`${i + 1}) ${title}`)
      const details = [
        formatPrice(p.price, p.currency),
        p.district || '',
        p.area_m2 ? `${p.area_m2} m² net` : '',
        p.lot_m2 ? `${p.lot_m2} m² arsa` : '',
        p.ada_no || p.parsel_no ? `Ada/Parsel: ${[p.ada_no, p.parsel_no].filter(Boolean).join('/')}` : '',
      ].filter(Boolean)
      lines.push(`   ${details.join(' · ')}`)
      if (p.lat && p.lng) lines.push(`   Harita: https://www.google.com/maps?q=${p.lat},${p.lng}`)
      if (url) lines.push(`   ${url}`)
      lines.push('')
    })
  }
  lines.push(`— ${SITE_CONFIG.name}`)
  lines.push(`📞 ${SITE_CONFIG.phoneDisplay}`)
  return lines.join('\n')
}

export default function LeadDetailModal({
  lead,
  onClose,
  onUpdated,
}: {
  lead: Lead
  onClose: () => void
  onUpdated?: (next: Partial<Lead>) => void
}) {
  const [properties, setProperties] = useState<PropertyLite[]>([])
  const [loadingProps, setLoadingProps] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [manualProperties, setManualProperties] = useState<PropertyLite[]>([])
  const [manualDraft, setManualDraft] = useState<PropertyLite>(() => blankManualProperty())
  const [sourceHtml, setSourceHtml] = useState('')
  const [parsingSource, setParsingSource] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)

  const [subject, setSubject] = useState(`${SITE_CONFIG.name} — Sizin için seçtiklerimiz`)
  const [body, setBody] = useState(
    `Talebinizi aldık. Aşağıda sizin için uygun olabileceğini düşündüğümüz ilanları paylaşıyoruz. Detaylı bilgi veya yerinde inceleme için bize ulaşabilirsiniz.`
  )
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoadingProps(true)
      try {
        const params = new URLSearchParams()
        params.set('limit', '60')
        if (filterCat) params.set('category', filterCat)
        if (filterType) params.set('type', filterType)
        const res = await fetch(`/api/properties/?${params.toString()}`)
        const data = await res.json()
        setProperties(data.properties || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingProps(false)
      }
    }
    load()
  }, [filterCat, filterType])

  const filtered = useMemo(() => {
    if (!search.trim()) return properties
    const q = search.toLowerCase()
    return properties.filter(
      (p) =>
        (p.title_tr || '').toLowerCase().includes(q) ||
        (p.reference_no || '').toLowerCase().includes(q) ||
        (p.district || '').toLowerCase().includes(q) ||
        (p.neighborhood || '').toLowerCase().includes(q)
    )
  }, [properties, search])

  const selectedProps = useMemo(
    () => properties.filter((p) => p.id != null && selected.has(p.id)),
    [properties, selected]
  )
  const allSelectedProps = useMemo(
    () => [...selectedProps, ...manualProperties],
    [selectedProps, manualProperties]
  )

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const sendEmail = async () => {
    if (!lead.email) {
      setFeedback({ type: 'err', text: 'Müşterinin e-posta adresi yok. WhatsApp ile gönderin.' })
      return
    }
    setSending(true)
    setFeedback(null)
    try {
      const key = getAdminKey()
      if (!key) throw new Error('Yetkisiz')
      const res = await fetch(`/api/admin/leads/${lead.id}/send-message/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
        body: JSON.stringify({
          subject,
          body,
          propertyIds: Array.from(selected),
          manualProperties,
          channel: 'email',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Mail gönderilemedi')
      setFeedback({
        type: 'ok',
        text: `📧 Mail gönderildi → ${data.to} (${data.properties} ilan eklendi)`,
      })
      onUpdated?.({ status: 'iletisimde' })
    } catch (e) {
      setFeedback({ type: 'err', text: (e as Error).message })
    } finally {
      setSending(false)
    }
  }

  const openWhatsApp = () => {
    if (!lead.phone) {
      setFeedback({ type: 'err', text: 'Telefon numarası yok' })
      return
    }
    const phone = lead.phone.replace(/[^\d]/g, '')
    const normalizedPhone = phone.startsWith('90')
      ? phone
      : phone.startsWith('0')
        ? `9${phone}`
        : `90${phone}`
    const text = buildWhatsAppText({
      greetingName: lead.name,
      body,
      properties: allSelectedProps,
    })
    const url = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(text)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setFeedback({
      type: 'ok',
      text: '💬 WhatsApp yeni sekmede açıldı. Mesajı orada gönderin.',
    })
  }

  const addManualProperty = () => {
    if (!manualDraft.title_tr.trim()) {
      setFeedback({ type: 'err', text: 'Manuel öneri için en az başlık girin.' })
      return
    }
    setManualProperties((prev) => [
      ...prev,
      {
        ...manualDraft,
        localId: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        reference_no: manualDraft.reference_no || `MANUEL-${prev.length + 1}`,
      },
    ])
    setManualDraft(blankManualProperty())
    setFeedback({ type: 'ok', text: 'Manuel öneri mesaja eklendi.' })
  }

  const parseSahibindenSource = async () => {
    if (sourceHtml.trim().length < 1000) {
      setFeedback({ type: 'err', text: 'Sahibinden sayfa kaynağını tam olarak yapıştırın.' })
      return
    }
    const key = getAdminKey()
    if (!key) return
    setParsingSource(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/admin/import-sahibinden/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
        body: JSON.stringify({ html: sourceHtml }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Kaynak çözümlenemedi')
      const f = data.fields || {}
      const next: PropertyLite = {
        ...blankManualProperty(),
        localId: `${Date.now()}`,
        reference_no: 'SAHİBİNDEN',
        type: f.type || 'satilik',
        category: f.category || 'arsa',
        title_tr: f.title_tr || 'Sahibinden Portföy Önerisi',
        price: Number(f.price || 0),
        currency: f.currency || 'TRY',
        district: f.district || '',
        neighborhood: f.neighborhood || '',
        bedrooms: f.bedrooms ?? null,
        area_m2: f.area_m2 ?? null,
        lot_m2: f.lot_m2 ?? null,
        land_status: f.land_status || '',
        ada_no: f.ada_no || '',
        parsel_no: f.parsel_no || '',
        pafta_no: f.pafta_no || '',
        cover_image: Array.isArray(f.images) ? f.images[0] || null : null,
        image_urls: Array.isArray(f.images) ? f.images.slice(0, 4) : [],
        external_url: f.external_url || '',
      }
      setManualDraft(next)
      setSourceHtml('')
      setFeedback({ type: 'ok', text: 'Sahibinden kaynağından bilgiler forma dolduruldu. Kontrol edip “Manuel Öneriyi Ekle” deyin.' })
    } catch (e) {
      setFeedback({ type: 'err', text: (e as Error).message })
    } finally {
      setParsingSource(false)
    }
  }

  const uploadManualImages = async (files: FileList | null) => {
    const incoming = Array.from(files || []).filter((f) => f.type.startsWith('image/')).slice(0, 4)
    if (incoming.length === 0) return
    const key = getAdminKey()
    if (!key) return
    setUploadingImages(true)
    setFeedback(null)
    try {
      const urls: string[] = []
      for (const file of incoming) {
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase()
        const blob = await upload(`lead-presentations/${Date.now()}-${safeName}`, file, {
          access: 'public',
          handleUploadUrl: '/api/admin/leads/upload/',
          contentType: file.type,
          clientPayload: JSON.stringify({ adminKey: key }),
        })
        urls.push(blob.url)
      }
      setManualDraft((p) => {
        const image_urls = [...(p.image_urls || []), ...urls].slice(0, 4)
        return { ...p, image_urls, cover_image: p.cover_image || image_urls[0] || null }
      })
      setFeedback({ type: 'ok', text: `${urls.length} görsel yüklendi.` })
    } catch (e) {
      setFeedback({ type: 'err', text: (e as Error).message })
    } finally {
      setUploadingImages(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full md:max-w-5xl md:rounded-2xl rounded-t-2xl shadow-2xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-navy-100 flex items-start justify-between gap-3 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-gold-100 text-gold-800">
                {lead.intent === 'alici'
                  ? 'Alıcı'
                  : lead.intent === 'kiraci'
                    ? 'Kiracı'
                    : lead.intent === 'kiralik-veren'
                      ? 'Kiralık Veren'
                      : lead.intent === 'satici'
                        ? 'Satıcı'
                        : lead.intent}
              </span>
              <h3 className="font-display text-lg md:text-xl font-bold text-navy-950">
                {lead.name}
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs md:text-sm text-navy-600 flex-wrap">
              <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1 hover:text-gold-700">
                <Phone className="w-3.5 h-3.5 text-gold-500" />
                {lead.phone}
              </a>
              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  className="inline-flex items-center gap-1 hover:text-gold-700 truncate"
                >
                  <Mail className="w-3.5 h-3.5 text-gold-500" />
                  {lead.email}
                </a>
              )}
              {lead.district && <span>📍 {lead.district}</span>}
              {lead.category && <span>🏷 {lead.category}</span>}
              {lead.rooms && <span>Oda: {lead.rooms}</span>}
              {lead.area_min && <span>Min net: {lead.area_min} m²</span>}
              {lead.lot_min && <span>Min arsa: {lead.lot_min} m²</span>}
              {lead.land_status && <span>Nitelik: {lead.land_status}</span>}
              {lead.location_note && <span>Mevki: {lead.location_note}</span>}
              {(lead.budget_min || lead.budget_max) && (
                <span>
                  💰 {lead.budget_min || '?'} - {lead.budget_max || '?'} {lead.currency}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-navy-50 flex items-center justify-center text-navy-600"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Original message */}
        {lead.message && (
          <div className="px-4 md:px-6 py-2 bg-navy-50 border-b border-navy-100 flex-shrink-0">
            <div className="text-[10px] uppercase tracking-wider text-navy-500 font-semibold mb-1">
              Müşteri Notu
            </div>
            <div className="text-sm text-navy-800 whitespace-pre-line">{lead.message}</div>
          </div>
        )}

        {/* Body — 2 column on desktop */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-5 gap-4 p-4 md:p-6">
          {/* LEFT: property selector */}
          <div className="lg:col-span-3 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Sparkles className="w-4 h-4 text-gold-500" />
              <h4 className="font-display text-base font-bold text-navy-950">
                Müşteriye Önerilecek Mülkler
              </h4>
              <span className="text-[11px] text-navy-500">
                Varsayılan tüm aktif portföyler listelenir; aşağıdan filtreleyebilirsiniz.
              </span>
              {selected.size + manualProperties.length > 0 && (
                <span className="ml-auto text-xs bg-gold-100 text-gold-800 px-2 py-0.5 rounded-full font-semibold">
                  {selected.size + manualProperties.length} öneri
                </span>
              )}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-xs px-2 py-1.5 border border-navy-200 rounded bg-white"
              >
                <option value="">Tümü (tip)</option>
                <option value="satilik">Satılık</option>
                <option value="kiralik">Kiralık</option>
                <option value="gunluk-kiralik">Günlük Kiralık</option>
              </select>
              <select
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
                className="text-xs px-2 py-1.5 border border-navy-200 rounded bg-white"
              >
                <option value="">Tümü (kategori)</option>
                <option value="daire">Daire</option>
                <option value="villa">Villa</option>
                <option value="mustakil">Müstakil</option>
                <option value="dukkan">Dükkan</option>
                <option value="ofis">Ofis</option>
                <option value="arsa">Arsa</option>
                <option value="tarla">Tarla</option>
                <option value="bag-bahce">Bağ-Bahçe</option>
                <option value="yazlik">Yazlık</option>
              </select>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-navy-400 absolute left-2 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ara…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="text-xs pl-7 pr-2 py-1.5 border border-navy-200 rounded bg-white w-full"
                />
              </div>
            </div>

            {/* Property list */}
            <div className="space-y-2 max-h-[44vh] lg:max-h-[52vh] overflow-y-auto pr-1 -mr-1">
              {loadingProps ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-gold-500" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center text-xs text-navy-500 py-8 border border-dashed border-navy-200 rounded">
                  Bu kriterlere uyan ilan bulunamadı
                </div>
              ) : (
                filtered.map((p) => {
                  const propId = p.id || 0
                  const isSel = selected.has(propId)
                  return (
                    <button
                      type="button"
                      key={propId}
                      onClick={() => toggleSelect(propId)}
                      className={`w-full text-left flex items-stretch gap-2 border rounded-lg p-2 transition-colors ${
                        isSel
                          ? 'border-gold-400 bg-gold-50'
                          : 'border-navy-200 hover:border-navy-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-center w-6 flex-shrink-0">
                        {isSel ? (
                          <CheckSquare className="w-4 h-4 text-gold-600" />
                        ) : (
                          <Square className="w-4 h-4 text-navy-300" />
                        )}
                      </div>
                      {p.cover_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.cover_image}
                          alt=""
                          className="w-16 h-16 object-cover rounded flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-navy-50 rounded flex items-center justify-center text-xs text-navy-400 flex-shrink-0">
                          —
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-0.5">
                          <Tag className="w-3 h-3 text-gold-500" />
                          <span className="text-[10px] font-bold uppercase text-gold-700">
                            {p.type} {p.category}
                          </span>
                          <span className="text-[10px] text-navy-400 ml-1 font-mono">
                            {p.reference_no}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-navy-950 truncate">
                          {p.title_tr || p.title_en}
                        </div>
                        <div className="text-xs text-navy-500 truncate">
                          {[p.district, p.neighborhood].filter(Boolean).join(' / ')}
                          {p.area_m2 ? ` · ${p.area_m2} m²` : ''}
                          {p.lot_m2 ? ` · ${p.lot_m2} m² arsa` : ''}
                          {p.bedrooms != null ? ` · ${p.bedrooms} oda` : ''}
                          {p.ada_no || p.parsel_no ? ` · Ada/Parsel ${[p.ada_no, p.parsel_no].filter(Boolean).join('/')}` : ''}
                          {p.land_status ? ` · ${p.land_status}` : ''}
                        </div>
                        <div className="text-[11px] text-navy-500 truncate">
                          {boolLabel(p.is_detached) ? `Müstakil: ${boolLabel(p.is_detached)} · ` : ''}
                          {boolLabel(p.in_site) ? `Site: ${boolLabel(p.in_site)} · ` : ''}
                          {p.lat && p.lng ? 'Harita konumu var' : 'Harita konumu yok'}
                        </div>
                        <div className="text-sm font-bold text-navy-950 mt-0.5">
                          {formatPrice(p.price, p.currency)}
                        </div>
                      </div>
                      <a
                        href={`${SITE_CONFIG.url}/tr/emlak/${p.slug || ''}/`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-navy-400 hover:text-gold-700 self-start mt-1"
                        aria-label="İlanı yeni sekmede aç"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </button>
                  )
                })
              )}
            </div>

            <div className="rounded-xl border border-navy-100 bg-white p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h5 className="font-semibold text-navy-950 text-sm">Manuel / Sahibinden Öneri Ekle</h5>
                  <p className="text-[11px] text-navy-500">
                    Portföyde olmayan bir mülkü sadece bu müşteriye gönderilecek öneri kartı olarak ekleyin.
                  </p>
                </div>
                <span className="text-[11px] px-2 py-1 rounded-full bg-navy-50 text-navy-600">
                  {manualProperties.length} manuel
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  className="input text-xs"
                  placeholder="Başlık"
                  value={manualDraft.title_tr}
                  onChange={(e) => setManualDraft((p) => ({ ...p, title_tr: e.target.value }))}
                />
                <input
                  className="input text-xs"
                  placeholder="Fiyat"
                  type="number"
                  value={manualDraft.price || ''}
                  onChange={(e) => setManualDraft((p) => ({ ...p, price: Number(e.target.value || 0) }))}
                />
                <select
                  className="input text-xs"
                  value={manualDraft.type}
                  onChange={(e) => setManualDraft((p) => ({ ...p, type: e.target.value }))}
                >
                  <option value="satilik">Satılık</option>
                  <option value="kiralik">Kiralık</option>
                  <option value="gunluk-kiralik">Günlük Kiralık</option>
                </select>
                <select
                  className="input text-xs"
                  value={manualDraft.category}
                  onChange={(e) => setManualDraft((p) => ({ ...p, category: e.target.value }))}
                >
                  <option value="daire">Daire</option>
                  <option value="villa">Villa</option>
                  <option value="mustakil">Müstakil</option>
                  <option value="arsa">Arsa</option>
                  <option value="tarla">Tarla</option>
                  <option value="bag-bahce">Bağ-Bahçe</option>
                  <option value="dukkan">Dükkan</option>
                </select>
                <input
                  className="input text-xs"
                  placeholder="İlçe"
                  value={manualDraft.district || ''}
                  onChange={(e) => setManualDraft((p) => ({ ...p, district: e.target.value }))}
                />
                <input
                  className="input text-xs"
                  placeholder="Mahalle"
                  value={manualDraft.neighborhood || ''}
                  onChange={(e) => setManualDraft((p) => ({ ...p, neighborhood: e.target.value }))}
                />
                <input
                  className="input text-xs"
                  placeholder="m²"
                  type="number"
                  value={manualDraft.area_m2 || ''}
                  onChange={(e) => setManualDraft((p) => ({ ...p, area_m2: e.target.value ? Number(e.target.value) : null }))}
                />
                <input
                  className="input text-xs"
                  placeholder="Arsa m²"
                  type="number"
                  value={manualDraft.lot_m2 || ''}
                  onChange={(e) => setManualDraft((p) => ({ ...p, lot_m2: e.target.value ? Number(e.target.value) : null }))}
                />
                <input
                  className="input text-xs"
                  placeholder="Ada"
                  value={manualDraft.ada_no || ''}
                  onChange={(e) => setManualDraft((p) => ({ ...p, ada_no: e.target.value }))}
                />
                <input
                  className="input text-xs"
                  placeholder="Parsel"
                  value={manualDraft.parsel_no || ''}
                  onChange={(e) => setManualDraft((p) => ({ ...p, parsel_no: e.target.value }))}
                />
                <input
                  className="input text-xs md:col-span-2"
                  placeholder="İlan / harici link"
                  value={manualDraft.external_url || ''}
                  onChange={(e) => setManualDraft((p) => ({ ...p, external_url: e.target.value }))}
                />
                <input
                  className="input text-xs md:col-span-2"
                  placeholder="Kapak görsel URL"
                  value={manualDraft.cover_image || ''}
                  onChange={(e) => setManualDraft((p) => ({ ...p, cover_image: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <label className="btn-ghost border-2 border-navy-200 text-xs cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => uploadManualImages(e.target.files)}
                    disabled={uploadingImages}
                  />
                  {uploadingImages ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                  Resim Yükle
                </label>
                <button type="button" onClick={addManualProperty} className="btn-ghost border-2 border-gold-300 text-xs">
                  <Plus className="w-4 h-4" />
                  Manuel Öneriyi Ekle
                </button>
              </div>
              {(manualDraft.image_urls || []).length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {(manualDraft.image_urls || []).map((url) => (
                    <div key={url} className="relative h-16 rounded-lg overflow-hidden border border-navy-100 bg-navy-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              <details className="rounded-lg border border-dashed border-navy-200 bg-navy-50 p-3">
                <summary className="cursor-pointer text-xs font-semibold text-navy-700">
                  Sahibinden sayfa kaynağından formu doldur
                </summary>
                <textarea
                  className="input text-xs min-h-[120px] mt-2 font-mono"
                  placeholder="Sahibinden ilanında Ctrl+U → Ctrl+A → Ctrl+C ile kopyaladığınız sayfa kaynağını buraya yapıştırın."
                  value={sourceHtml}
                  onChange={(e) => setSourceHtml(e.target.value)}
                />
                <button
                  type="button"
                  onClick={parseSahibindenSource}
                  disabled={parsingSource}
                  className="mt-2 inline-flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-navy-950 text-white disabled:opacity-50"
                >
                  {parsingSource ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                  Kaynaktan Formu Doldur
                </button>
              </details>

              {manualProperties.length > 0 && (
                <div className="space-y-1.5">
                  {manualProperties.map((p) => (
                    <div key={p.localId || p.reference_no} className="flex items-center justify-between gap-2 rounded-lg bg-gold-50 border border-gold-100 px-2 py-1.5">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-navy-950 truncate">{p.title_tr}</div>
                        <div className="text-[11px] text-navy-500 truncate">
                          {[p.district, p.neighborhood].filter(Boolean).join(' / ')} · {formatPrice(p.price, p.currency)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setManualProperties((prev) => prev.filter((x) => x.localId !== p.localId))}
                        className="w-7 h-7 rounded hover:bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: message composer */}
          <div className="lg:col-span-2 space-y-3 lg:border-l lg:border-navy-100 lg:pl-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-gold-500" />
              <h4 className="font-display text-base font-bold text-navy-950">Mesaj</h4>
            </div>
            <div>
              <label className="label">Konu (mail başlığı)</label>
              <input
                className="input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Mesaj</label>
              <textarea
                className="input min-h-[140px]"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Müşteriye özel mesajınız..."
              />
              <p className="text-[11px] text-navy-500 mt-1">
                Seçtiğiniz {selected.size} portföy ve {manualProperties.length} manuel/Sahibinden öneri otomatik olarak mesaja eklenir.
              </p>
            </div>

            {feedback && (
              <div
                className={`text-xs px-3 py-2 rounded-lg border ${
                  feedback.type === 'ok'
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                {feedback.text}
              </div>
            )}

            <div className="grid grid-cols-1 gap-2 pt-1">
              <button
                onClick={sendEmail}
                disabled={sending || !lead.email}
                className="btn-primary disabled:opacity-50"
                title={!lead.email ? 'Müşterinin e-postası yok' : ''}
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                E-posta Gönder {!lead.email ? '(e-posta yok)' : ''}
              </button>
              <button
                onClick={openWhatsApp}
                disabled={!lead.phone}
                className="btn-ghost border-2 border-green-500 text-green-700 hover:bg-green-50 disabled:opacity-50"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp ile Aç
              </button>
            </div>

            <div className="text-[11px] text-navy-500 pt-2 border-t border-navy-100">
              <strong>Nasıl çalışır?</strong>
              <ul className="list-disc pl-4 mt-1 space-y-0.5">
                <li>Soldan müşteriye uygun ilanları seçin</li>
                <li>Sağdaki mesajı kişiselleştirin</li>
                <li>
                  <strong>E-posta Gönder</strong>: ilanlar görselli kartlar olarak gönderilir
                </li>
                <li>
                  <strong>WhatsApp ile Aç</strong>: WhatsApp Web/Mobil yeni sekmede mesajla
                  birlikte açılır
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
