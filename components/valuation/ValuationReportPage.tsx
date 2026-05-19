'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Loader2, Phone, Mail, MapPin, FileText } from 'lucide-react'
import type { ValuationRequest } from '@/lib/db'
import { SITE_CONFIG } from '@/lib/config'
import { getAdminKey } from '@/components/admin/AdminLogin'
import { useSiteSettings } from '@/lib/settings/useSiteSettings'

function fmtMoney(v: number | string | null | undefined, currency = 'TRY') {
  if (!v) return '-'
  const n = Number(v)
  if (!Number.isFinite(n)) return '-'
  const symbol = currency === 'EUR' ? '€' : '₺'
  return `${n.toLocaleString('tr-TR')} ${symbol}`
}

function fmtDate(d?: string | Date | null) {
  if (!d) return new Date().toLocaleDateString('tr-TR')
  return new Date(d).toLocaleDateString('tr-TR')
}

function calcBand(value?: number | null) {
  if (!value) return { min: null, max: null }
  return {
    min: Math.round(value * 0.95),
    max: Math.round(value * 1.12),
  }
}

export default function ValuationReportPage({ id }: { id: string }) {
  const siteSettings = useSiteSettings()
  const [request, setRequest] = useState<ValuationRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const key = getAdminKey()
    if (!key) {
      setError('Admin girişi gerekiyor')
      setLoading(false)
      return
    }
    fetch('/api/admin/valuations/', { headers: { 'x-admin-key': key } })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Rapor verisi alınamadı')
        const item = (data.requests || []).find((r: ValuationRequest) => String(r.id) === String(id))
        if (!item) throw new Error('Değerleme talebi bulunamadı')
        setRequest(item)
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <p className="text-red-600 mb-4">{error || 'Rapor bulunamadı'}</p>
          <Link href="/tr/admin/" className="btn-primary">
            Admin Paneline Dön
          </Link>
        </div>
      </div>
    )
  }

  const currency = request.estimated_currency || 'TRY'
  const estimated = request.estimated_value ? Number(request.estimated_value) : null
  const band = calcBand(estimated)
  const valueMin = request.value_min ? Number(request.value_min) : band.min
  const valueMax = request.value_max ? Number(request.value_max) : band.max
  const unitMin = request.unit_price_min ? Number(request.unit_price_min) : null
  const unitMax = request.unit_price_max ? Number(request.unit_price_max) : null
  const comparables = Array.isArray(request.comparables) ? request.comparables : []
  const aiDraft = request.ai_draft && typeof request.ai_draft === 'object' ? request.ai_draft as Record<string, unknown> : {}
  const hasAiMarketText = Boolean(aiDraft.region_comment || aiDraft.comparables_comment)
  const aiReportText = typeof aiDraft.report_text === 'string' ? aiDraft.report_text : ''
  const risks = Array.isArray(aiDraft.risks) ? aiDraft.risks.map(String) : []
  const location = [request.neighborhood, request.district, request.city].filter(Boolean).join(', ')
  const parcel = [request.ada_no && `${request.ada_no} Ada`, request.parsel_no && `${request.parsel_no} Parsel`, request.pafta_no && `Pafta ${request.pafta_no}`]
    .filter(Boolean)
    .join(' / ')

  return (
    <div className="min-h-screen bg-slate-200 py-6 print:bg-white print:py-0">
      <div className="max-w-[900px] mx-auto mb-4 print:hidden flex items-center justify-between gap-3 px-4">
        <Link href="/tr/admin/" className="inline-flex items-center gap-2 text-sm text-navy-700 hover:text-gold-700">
          <ArrowLeft className="w-4 h-4" />
          Admin Paneline Dön
        </Link>
        <button onClick={() => window.print()} className="btn-primary">
          <Download className="w-4 h-4" />
          PDF / Yazdır
        </button>
      </div>

      <article className="max-w-[900px] mx-auto bg-white shadow-2xl print:shadow-none text-navy-950">
        {/* Cover */}
        <section className="min-h-[1120px] p-10 md:p-14 flex flex-col bg-gradient-to-br from-navy-950 via-navy-900 to-black text-white print:min-h-[1050px]">
          <div className="flex items-start justify-between gap-8">
            <img src={siteSettings.logoLightUrl} alt={SITE_CONFIG.name} className="h-28 md:h-36 w-auto object-contain" />
            <div className="text-right text-xs md:text-sm text-navy-200">
              <div>Rapor No: CUGM-{String(request.id).padStart(5, '0')}</div>
              <div>Rapor Tarihi: {fmtDate(new Date())}</div>
            </div>
          </div>

          <div className="mt-24 md:mt-32 max-w-2xl">
            <p className="text-gold-300 uppercase tracking-[0.25em] text-sm font-semibold mb-4">
              Elektronik Değerleme Raporu
            </p>
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight">
              Satılık / Kiralık Mülk Değerleme Raporu
            </h1>
            <p className="mt-6 text-xl text-navy-100">
              Bu rapor <strong>{request.name}</strong> adına hazırlanmıştır.
            </p>
          </div>

          <div className="mt-auto grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <Info label="Adres" value={request.address || location || 'Belirtilmedi'} dark />
            <Info label="Parsel Bilgisi" value={parcel || 'Belirtilmedi'} dark />
            <Info label="Mülk Tipi" value={request.property_type || 'Belirtilmedi'} dark />
            <Info label="Tahmini Piyasa Değeri" value={estimated ? fmtMoney(estimated, currency) : 'Değer girilmedi'} dark highlight />
          </div>
        </section>

        {/* Consultant */}
        <section className="p-10 md:p-14 border-b border-slate-200 page-break">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <img src={siteSettings.logoDarkUrl} alt={SITE_CONFIG.name} className="h-24 w-auto object-contain mb-6" />
              <h2 className="font-display text-2xl font-bold">Bülent TÜM</h2>
              <div className="space-y-2 mt-4 text-sm text-navy-700">
                <a className="flex items-center gap-2" href={`tel:${SITE_CONFIG.phoneRaw}`}>
                  <Phone className="w-4 h-4 text-gold-600" />
                  {SITE_CONFIG.phoneDisplay}
                </a>
                <a className="flex items-center gap-2" href={`mailto:${SITE_CONFIG.email}`}>
                  <Mail className="w-4 h-4 text-gold-600" />
                  {SITE_CONFIG.email}
                </a>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gold-600 mt-0.5" />
                  {SITE_CONFIG.address.full}
                </div>
              </div>
            </div>
            <div className="md:col-span-2">
              <p className="text-gold-700 uppercase tracking-[0.22em] text-xs font-semibold mb-2">
                Hakkımda
              </p>
              <h2 className="font-display text-3xl font-bold mb-4">
                Çandarlı Uzman Gayrimenkul
              </h2>
              <p className="text-navy-700 leading-relaxed">
                Gayrimenkul alanında proje bazlı yatırım danışmanlığı, arsa ve arazi
                değerlendirmesi, konut portföy yönetimi ve bölgesel piyasa analizi konularında
                müşterilerimize hizmet veriyoruz. Bu rapor, müşteri tarafından sağlanan bilgiler,
                saha gözlemi ve bölgesel piyasa tecrübesi doğrultusunda tavsiye niteliğinde
                hazırlanmıştır.
              </p>
            </div>
          </div>
        </section>

        {/* Property + valuation */}
        <section className="p-10 md:p-14 page-break">
          <p className="text-gold-700 uppercase tracking-[0.22em] text-xs font-semibold mb-2">
            Mülk Özellikleri
          </p>
          <h2 className="font-display text-3xl font-bold mb-6">Taşınmaz Bilgileri</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <Info label="Oda" value={request.rooms || '-'} />
            <Info label="Net Alan" value={request.area_m2 ? `${request.area_m2} m²` : '-'} />
            <Info label="Arsa Alanı" value={request.lot_m2 ? `${request.lot_m2} m²` : '-'} />
            <Info label="Yapım Yılı" value={request.year_built ? String(request.year_built) : '-'} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            <div className="rounded-2xl border border-slate-200 p-5">
              <h3 className="font-display text-xl font-bold mb-3">Konum ve Kadastro</h3>
              <div className="space-y-3 text-sm">
                <Line label="Lokasyon" value={location || '-'} />
                <Line label="Adres" value={request.address || '-'} />
                <Line label="Ada / Parsel" value={parcel || '-'} />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <h3 className="font-display text-xl font-bold mb-3">Müşteri Bilgileri</h3>
              <div className="space-y-3 text-sm">
                <Line label="Ad Soyad" value={request.name} />
                <Line label="Telefon" value={request.phone} />
                <Line label="E-posta" value={request.email || '-'} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-navy-950 text-white p-6 md:p-8 mb-8">
            <p className="text-gold-300 uppercase tracking-[0.22em] text-xs font-semibold mb-3">
              Taşınmazın Değer / Fiyat Analizi
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ValueBox title="Minimum Fiyat" value={valueMin ? fmtMoney(valueMin, currency) : '-'} note={request.marketing_time || '3-6 Ay'} />
              <ValueBox title="Tahmini Piyasa Değeri" value={estimated ? fmtMoney(estimated, currency) : '-'} note={request.market_position || 'Piyasa ortalaması'} highlight />
              <ValueBox title="Maksimum Fiyat" value={valueMax ? fmtMoney(valueMax, currency) : '-'} note="Pazarlık payı dahil" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <Info label="m² Birim Fiyat Aralığı" value={unitMin || unitMax ? `${unitMin ? fmtMoney(unitMin, currency) : '-'} / ${unitMax ? fmtMoney(unitMax, currency) : '-'}` : '-'} dark />
              <Info label="Rapor Durumu" value={request.report_status || 'taslak'} dark />
            </div>
            <p className="text-xs text-navy-300 mt-5">
              Açıklama: Bu değerleme; kullanıcı beyanı, lokasyon, mülk özellikleri ve bölgesel
              piyasa bilgileri esas alınarak hazırlanmış tavsiye niteliğinde bir ön analizdir.
            </p>
          </div>

          {(request.methodology || hasAiMarketText) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              <ReportPanel title="Değerleme Yöntemi" text={request.methodology || String(aiDraft.methodology || '')} />
              <ReportPanel title="Bölge ve Emsal Yorumu" text={[aiDraft.region_comment, aiDraft.comparables_comment].filter(Boolean).join('\n\n') || 'Bölgesel yorum girilmedi.'} />
            </div>
          )}

          {request.expert_opinion && (
            <div className="rounded-2xl bg-gold-50 border border-gold-200 p-5 mb-8">
              <h3 className="font-display text-xl font-bold mb-2">Uzman Görüşü</h3>
              <p className="text-navy-700 whitespace-pre-line">{request.expert_opinion}</p>
            </div>
          )}

          {request.response_notes && (
            <ReportPanel title="Kısa Yanıt Notu" text={request.response_notes} />
          )}

          {request.notes && (
            <div className="rounded-2xl border border-slate-200 p-5 mt-8">
              <h3 className="font-display text-xl font-bold mb-2">Müşteri Notu</h3>
              <p className="text-navy-700 whitespace-pre-line">{request.notes}</p>
            </div>
          )}
        </section>

        <section className="p-10 md:p-14 border-t border-slate-200 page-break">
          <p className="text-gold-700 uppercase tracking-[0.22em] text-xs font-semibold mb-2">
            Emsal ve Pazar Projeksiyonu
          </p>
          <h2 className="font-display text-3xl font-bold mb-6">Karşılaştırmalı Analiz</h2>
          {comparables.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 mb-8">
              <table className="w-full text-sm">
                <thead className="bg-navy-950 text-white">
                  <tr>
                    <th className="text-left p-3">Emsal</th>
                    <th className="text-left p-3">Lokasyon</th>
                    <th className="text-right p-3">Fiyat</th>
                    <th className="text-right p-3">m²</th>
                    <th className="text-left p-3">Not</th>
                  </tr>
                </thead>
                <tbody>
                  {comparables.map((c, i) => {
                    const row = c as Record<string, unknown>
                    return (
                      <tr key={i} className="border-t border-slate-200">
                        <td className="p-3 font-semibold">{String(row.title || `Emsal ${i + 1}`)}</td>
                        <td className="p-3">{String(row.location || '-')}</td>
                        <td className="p-3 text-right">{row.price ? fmtMoney(row.price as string | number, currency) : '-'}</td>
                        <td className="p-3 text-right">{row.area_m2 ? `${row.area_m2} m²` : '-'}</td>
                        <td className="p-3">{String(row.note || '-')}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-slate-500 mb-8">
              Rapor için emsal kaydı girilmemiştir.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <ReportPanel title="Pazar Pozisyonu" text={request.market_position || 'Pazar pozisyonu girilmedi.'} />
            <ReportPanel title="Pazarlama Süresi" text={request.marketing_time || 'Pazarlama süresi girilmedi.'} />
            <ReportPanel title="Riskler" text={risks.length ? risks.map((r) => `• ${r}`).join('\n') : 'Belirgin risk notu girilmedi.'} />
          </div>
        </section>

        {((request.property_photos?.length || 0) > 0 || aiReportText) && (
          <section className="p-10 md:p-14 border-t border-slate-200 page-break">
            <p className="text-gold-700 uppercase tracking-[0.22em] text-xs font-semibold mb-2">
              Görsel ve Rapor Metni
            </p>
            <h2 className="font-display text-3xl font-bold mb-6">Taşınmaz Sunumu</h2>
            {request.property_photos && request.property_photos.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-8">
                {request.property_photos.slice(0, 6).map((url, i) => (
                  <img key={url} src={url} alt={`Taşınmaz fotoğrafı ${i + 1}`} className="w-full h-48 object-cover rounded-2xl border border-slate-200" />
                ))}
              </div>
            )}
            {aiReportText && <ReportPanel title="AI Destekli Rapor Metni" text={aiReportText} />}
          </section>
        )}

        {/* Documents */}
        <section className="p-10 md:p-14 border-t border-slate-200 page-break">
          <p className="text-gold-700 uppercase tracking-[0.22em] text-xs font-semibold mb-2">
            Ekler
          </p>
          <h2 className="font-display text-3xl font-bold mb-6">Belgeler ve Uyarı</h2>
          {request.documents && request.documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
              {request.documents.map((url, i) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-slate-200 p-4 flex items-center gap-3 hover:border-gold-400"
                >
                  <FileText className="w-6 h-6 text-gold-600" />
                  <span className="font-semibold">Belge {i + 1}</span>
                </a>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-slate-500 mb-8">
              Bu rapora belge eklenmemiştir.
            </div>
          )}

          <div className="text-xs leading-relaxed text-slate-600">
            Bu rapor, satış, saha çalışmaları, müşteri beyanı ve piyasa gözlemlerine dayalı ön
            değerleme niteliğindedir. Raporda yer alan bilgiler ve tahminler herhangi bir hukuki
            bağlayıcılık veya kesin taahhüt içermez. Nihai değer; ekspertiz, tapu, belediye,
            imar ve saha incelemesi sonucunda değişebilir.
          </div>
        </section>
      </article>
    </div>
  )
}

function Info({
  label,
  value,
  dark,
  highlight,
}: {
  label: string
  value: string
  dark?: boolean
  highlight?: boolean
}) {
  return (
    <div className={`${dark ? 'bg-white/10 text-white' : 'bg-slate-50 text-navy-950'} rounded-2xl p-4 border ${dark ? 'border-white/10' : 'border-slate-200'} ${highlight ? 'ring-2 ring-gold-400/50' : ''}`}>
      <div className={`${dark ? 'text-navy-200' : 'text-slate-500'} text-xs uppercase tracking-wider mb-1`}>
        {label}
      </div>
      <div className="font-semibold">{value}</div>
    </div>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-right">{value}</span>
    </div>
  )
}

function ReportPanel({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="font-display text-xl font-bold mb-3">{title}</h3>
      <p className="text-navy-700 whitespace-pre-line leading-relaxed">{text || '-'}</p>
    </div>
  )
}

function ValueBox({ title, value, note, highlight }: { title: string; value: string; note: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 ${highlight ? 'bg-gold-gradient text-navy-950' : 'bg-white/10 text-white border border-white/10'}`}>
      <div className={`text-xs uppercase tracking-wider mb-2 ${highlight ? 'text-navy-700' : 'text-navy-200'}`}>
        {title}
      </div>
      <div className="font-display text-2xl font-bold">{value}</div>
      <div className={`text-xs mt-2 ${highlight ? 'text-navy-700' : 'text-navy-300'}`}>
        Tahmini Satış Süresi: {note}
      </div>
    </div>
  )
}
