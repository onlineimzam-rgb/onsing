'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Image from 'next/image'
import imageCompression from 'browser-image-compression'
import {
  Save, X, Upload, Trash2, Star, StarOff, Loader2, Plus, ArrowLeft, Link as LinkIcon, Download,
  Images, CheckSquare, Square,
} from 'lucide-react'
import {
  PROPERTY_TYPES, PROPERTY_CATEGORIES, PROPERTY_STATUS, CURRENCIES,
} from '@/lib/config'
import type { Property, PropertyImage } from '@/lib/db'
import { getAdminKey } from './AdminLogin'
import PropertyInstagramTemplates from './PropertyInstagramTemplates'

interface Props {
  propertyId?: number | null
  onClose: () => void
  onSaved: () => void
}

const DEFAULT_FORM = {
  type: 'satilik',
  category: 'daire',
  status: 'aktif',
  title_tr: '',
  title_en: '',
  description_tr: '',
  description_en: '',
  price: 0,
  currency: 'TRY',
  city: 'İzmir',
  district: 'Çandarlı',
  neighborhood: '',
  address: '',
  lat: '',
  lng: '',
  bedrooms: '',
  bathrooms: '',
  area_m2: '',
  lot_m2: '',
  building_age: '',
  floor: '',
  total_floors: '',
  heating_type: '',
  is_detached: '',
  in_site: '',
  land_status: '',
  owner_name: '',
  owner_phone: '',
  owner_email: '',
  owner_notes: '',
  features: [] as string[],
  is_featured: false,
  ada_no: '',
  parsel_no: '',
  pafta_no: '',
  external_url: '',
}

const FEATURE_PRESETS = [
  'Asansör', 'Otopark', 'Eşyalı', 'Balkon', 'Teras', 'Bahçe', 'Havuz',
  'Klima', 'Şömine', 'Site İçinde', 'Güvenlik', 'Deniz Manzarası',
  'Doğa Manzarası', 'Yola Cepheli', 'Tapulu', 'Krediye Uygun', 'İskânlı',
  'Yeni Yapı', 'Lüks', 'Yatırımlık',
]

export default function PropertyForm({ propertyId, onClose, onSaved }: Props) {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [images, setImages] = useState<PropertyImage[]>([])
  const [savedProperty, setSavedProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [customFeature, setCustomFeature] = useState('')
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [showHtmlPaste, setShowHtmlPaste] = useState(false)
  const [pastedHtml, setPastedHtml] = useState('')

  // Sahibinden import sırasında bulunan resim URL'leri (henüz indirilmedi)
  const [pendingImages, setPendingImages] = useState<string[]>([])
  const [selectedPendingIdx, setSelectedPendingIdx] = useState<Set<number>>(new Set())
  const [downloadingImages, setDownloadingImages] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<{ done: number; total: number; failed: number } | null>(null)

  // Edit mode: ilk yüklemede mevcut property'i çek
  useEffect(() => {
    if (!propertyId) return
    const adminKey = getAdminKey()
    if (!adminKey) return
    fetch(`/api/admin/properties/${propertyId}/`, {
      headers: { 'x-admin-key': adminKey },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.property) return
        const p: Property = data.property
        setSavedProperty(p)
        setImages(data.images || [])
        setForm({
          type: p.type,
          category: p.category,
          status: p.status,
          title_tr: p.title_tr,
          title_en: p.title_en || '',
          description_tr: p.description_tr || '',
          description_en: p.description_en || '',
          price: Number(p.price) || 0,
          currency: p.currency,
          city: p.city || '',
          district: p.district || '',
          neighborhood: p.neighborhood || '',
          address: p.address || '',
          lat: p.lat?.toString() || '',
          lng: p.lng?.toString() || '',
          bedrooms: p.bedrooms?.toString() || '',
          bathrooms: p.bathrooms?.toString() || '',
          area_m2: p.area_m2?.toString() || '',
          lot_m2: p.lot_m2?.toString() || '',
          building_age: p.building_age?.toString() || '',
          floor: p.floor?.toString() || '',
          total_floors: p.total_floors?.toString() || '',
          heating_type: p.heating_type || '',
          is_detached: (p as any).is_detached == null ? '' : ((p as any).is_detached ? 'evet' : 'hayir'),
          in_site: (p as any).in_site == null ? '' : ((p as any).in_site ? 'evet' : 'hayir'),
          land_status: (p as any).land_status || '',
          owner_name: (p as any).owner_name || '',
          owner_phone: (p as any).owner_phone || '',
          owner_email: (p as any).owner_email || '',
          owner_notes: (p as any).owner_notes || '',
          features: p.features || [],
          is_featured: p.is_featured,
          ada_no: p.ada_no || '',
          parsel_no: p.parsel_no || '',
          pafta_no: p.pafta_no || '',
          external_url: p.external_url || '',
        })
      })
  }, [propertyId])

  const update = (k: keyof typeof DEFAULT_FORM, v: any) => {
    setForm((prev) => ({ ...prev, [k]: v }))
  }

  const toggleFeature = (f: string) => {
    setForm((prev) => ({
      ...prev,
      features: prev.features.includes(f)
        ? prev.features.filter((x) => x !== f)
        : [...prev.features, f],
    }))
  }

  const addCustomFeature = () => {
    const v = customFeature.trim()
    if (!v) return
    if (!form.features.includes(v)) {
      setForm((prev) => ({ ...prev, features: [...prev.features, v] }))
    }
    setCustomFeature('')
  }

  const handleImport = async (mode: 'url' | 'html' = 'url') => {
    const url = importUrl.trim()
    const html = pastedHtml.trim()
    if (mode === 'url' && !url) return
    if (mode === 'html' && html.length < 1000) {
      setError('Yapıştırılan HTML çok kısa, sayfanın tamamını kopyaladığınızdan emin olun.')
      return
    }
    setImporting(true)
    setError(null)
    setSuccess(null)
    try {
      const adminKey = getAdminKey()
      if (!adminKey) throw new Error('Yetki yok')
      const payload = mode === 'html' ? { url: url || undefined, html } : { url }
      const res = await fetch('/api/admin/import-sahibinden/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.blockedByBot) {
          setShowHtmlPaste(true)
        }
        throw new Error(data.error || 'İçeri aktarma başarısız')
      }

      const f = data.fields || {}
      setForm((prev) => ({
        ...prev,
        type: f.type || prev.type,
        category: f.category || prev.category,
        title_tr: f.title_tr || prev.title_tr,
        description_tr: f.description_tr || prev.description_tr,
        price: f.price ? Number(f.price) : prev.price,
        currency: f.currency || prev.currency,
        city: f.city || prev.city,
        district: f.district || prev.district,
        neighborhood: f.neighborhood || prev.neighborhood,
        bedrooms: f.bedrooms != null ? String(f.bedrooms) : prev.bedrooms,
        bathrooms: f.bathrooms != null ? String(f.bathrooms) : prev.bathrooms,
        area_m2: f.area_m2 != null ? String(f.area_m2) : prev.area_m2,
        lot_m2: f.lot_m2 != null ? String(f.lot_m2) : prev.lot_m2,
        building_age: f.building_age != null ? String(f.building_age) : prev.building_age,
        floor: f.floor != null ? String(f.floor) : prev.floor,
        total_floors: f.total_floors != null ? String(f.total_floors) : prev.total_floors,
        heating_type: f.heating_type || prev.heating_type,
        lat: f.lat != null ? String(f.lat) : prev.lat,
        lng: f.lng != null ? String(f.lng) : prev.lng,
        ada_no: f.ada_no || prev.ada_no,
        parsel_no: f.parsel_no || prev.parsel_no,
        pafta_no: f.pafta_no || prev.pafta_no,
        external_url: mode === 'url' ? url : (url || prev.external_url),
        features: Array.from(new Set([...(prev.features || []), ...(f.features || [])])),
      }))
      // Sahibinden CDN resim URL'lerini ayrı state'e koy
      if (Array.isArray(f.images) && f.images.length > 0) {
        setPendingImages(f.images)
        // Varsayılan: hepsi seçili
        setSelectedPendingIdx(new Set(f.images.map((_: any, i: number) => i)))
      } else {
        setPendingImages([])
        setSelectedPendingIdx(new Set())
      }
      const imgInfo =
        Array.isArray(f.images) && f.images.length > 0
          ? ` · ${f.images.length} fotoğraf bulundu (aşağıdan indirin)`
          : ''
      setSuccess(`Form bilgileri ilandan dolduruldu (${data.fieldCount} alan)${imgInfo}.`)
      setShowHtmlPaste(false)
      setPastedHtml('')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setImporting(false)
    }
  }

  const togglePendingImg = (i: number) => {
    setSelectedPendingIdx((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const selectAllPending = () => {
    setSelectedPendingIdx(new Set(pendingImages.map((_, i) => i)))
  }
  const selectNonePending = () => setSelectedPendingIdx(new Set())

  const downloadPendingImages = async () => {
    const id = savedProperty?.id || propertyId
    if (!id) {
      setError('Önce ilanı kaydedin, sonra fotoğrafları indirin.')
      return
    }
    const indices = Array.from(selectedPendingIdx).sort((a, b) => a - b)
    if (indices.length === 0) {
      setError('İndirilecek fotoğraf seçili değil.')
      return
    }
    const urlsToImport = indices.map((i) => pendingImages[i]).filter(Boolean)
    setDownloadingImages(true)
    setError(null)
    setDownloadProgress({ done: 0, total: urlsToImport.length, failed: 0 })
    try {
      const adminKey = getAdminKey()
      if (!adminKey) throw new Error('Yetki yok')

      // Server tarafı tek istekte hepsini indirir; sahibinden CDN'den fetch + blob + DB
      const res = await fetch(`/api/admin/properties/${id}/import-images/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ urls: urlsToImport }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'İndirme başarısız')

      // Yeni eklenen görselleri image listesine ekle
      if (Array.isArray(data.images)) {
        setImages((prev) => [...prev, ...data.images])
      }
      setDownloadProgress({
        done: data.uploaded || 0,
        total: urlsToImport.length,
        failed: data.failedCount || 0,
      })
      // Başarılı olanları pending listesinden çıkar
      const failedUrls = new Set((data.failed || []).map((f: any) => f.url))
      const remaining: string[] = []
      pendingImages.forEach((u, i) => {
        if (!selectedPendingIdx.has(i)) {
          remaining.push(u)
        } else if (failedUrls.has(u)) {
          remaining.push(u)
        }
      })
      setPendingImages(remaining)
      setSelectedPendingIdx(new Set(remaining.map((_, i) => i)))
      setSuccess(
        `${data.uploaded} fotoğraf indirildi ve yüklendi${
          data.failedCount ? ` (${data.failedCount} başarısız)` : ''
        }.`
      )
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setDownloadingImages(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const adminKey = getAdminKey()
      if (!adminKey) throw new Error('Yetki yok')

      const payload = {
        ...form,
        price: Number(form.price) || 0,
        lat: form.lat ? Number(form.lat) : null,
        lng: form.lng ? Number(form.lng) : null,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
        area_m2: form.area_m2 ? Number(form.area_m2) : null,
        lot_m2: form.lot_m2 ? Number(form.lot_m2) : null,
        building_age: form.building_age ? Number(form.building_age) : null,
        floor: form.floor ? Number(form.floor) : null,
        total_floors: form.total_floors ? Number(form.total_floors) : null,
        is_detached: form.is_detached === '' ? null : form.is_detached === 'evet',
        in_site: form.in_site === '' ? null : form.in_site === 'evet',
        land_status: form.land_status?.trim() || null,
        owner_name: form.owner_name?.trim() || null,
        owner_phone: form.owner_phone?.trim() || null,
        owner_email: form.owner_email?.trim() || null,
        owner_notes: form.owner_notes?.trim() || null,
        ada_no: form.ada_no?.trim() || null,
        parsel_no: form.parsel_no?.trim() || null,
        pafta_no: form.pafta_no?.trim() || null,
        external_url: form.external_url?.trim() || null,
      }

      const id = propertyId || savedProperty?.id
      const url = id ? `/api/admin/properties/${id}/` : '/api/admin/properties/'
      const method = id ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Kayıt başarısız')

      setSavedProperty(data.property)
      setSuccess(id ? 'Güncellendi.' : 'İlan oluşturuldu. Şimdi görsel yükleyebilirsiniz.')
      onSaved()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const id = savedProperty?.id || propertyId
    if (!id) {
      setError('Önce ilanı kaydedin, sonra görsel yükleyin.')
      return
    }
    setUploading(true)
    setError(null)
    try {
      const adminKey = getAdminKey()
      if (!adminKey) throw new Error('Yetki yok')

      const fd = new FormData()
      for (const f of Array.from(files)) {
        if (!f.type.startsWith('image/')) continue
        // 1.6MB üstündeyse sıkıştır
        const compressed = f.size > 1_600_000
          ? await imageCompression(f, {
              maxSizeMB: 1.5,
              maxWidthOrHeight: 2400,
              useWebWorker: true,
              fileType: 'image/jpeg',
            })
          : f
        fd.append('files', compressed, f.name)
      }

      const res = await fetch(`/api/admin/properties/${id}/images/`, {
        method: 'POST',
        headers: { 'x-admin-key': adminKey },
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Yükleme başarısız')
      setImages((prev) => [...prev, ...(data.images || [])])
      setSuccess(`${data.images?.length || 0} görsel yüklendi.`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const deleteImage = async (imageId: number) => {
    if (!confirm('Bu görseli silmek istediğinize emin misiniz?')) return
    const id = savedProperty?.id || propertyId
    if (!id) return
    const adminKey = getAdminKey()
    if (!adminKey) return
    const res = await fetch(`/api/admin/properties/${id}/images/${imageId}/`, {
      method: 'DELETE',
      headers: { 'x-admin-key': adminKey },
    })
    if (res.ok) {
      setImages((prev) => prev.filter((i) => i.id !== imageId))
    }
  }

  const setCover = async (imageId: number) => {
    const id = savedProperty?.id || propertyId
    if (!id) return
    const adminKey = getAdminKey()
    if (!adminKey) return
    await fetch(`/api/admin/properties/${id}/images/${imageId}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify({ set_cover: true }),
    })
    setSuccess('Kapak fotoğrafı güncellendi.')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 text-navy-600 hover:text-navy-900 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Geri
        </button>
        <div className="flex gap-2 text-xs">
          {savedProperty && (
            <span className="bg-navy-100 text-navy-800 px-2 py-1 rounded font-mono">
              {savedProperty.reference_no}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm flex items-start justify-between gap-2">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm flex items-start justify-between gap-2">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sahibinden.com'dan içeri aktar */}
      <section className="card p-5 bg-gradient-to-br from-gold-50 to-white border-gold-200">
        <h3 className="font-display text-lg font-bold text-navy-950 mb-1 flex items-center gap-2">
          <Download className="w-5 h-5 text-gold-600" />
          Sahibinden.com'dan İçeri Aktar
        </h3>
        <p className="text-xs text-navy-600 mb-3">
          Bir sahibinden.com ilan linki yapıştırın → form sahibinden.com'daki bilgilerle otomatik dolar.
          {' '}<strong>Fotoğraflar da bulunur</strong>; istediklerinizi seçip tek tıkla içe aktarabilirsiniz
          (ilanı önce kaydetmeniz gerekir).
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
            <input
              className="input pl-9"
              type="url"
              placeholder="https://www.sahibinden.com/ilan/..."
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              disabled={importing}
            />
          </div>
          <button
            type="button"
            onClick={() => handleImport('url')}
            disabled={importing || !importUrl.trim()}
            className="btn-primary whitespace-nowrap"
          >
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            İçeri Aktar
          </button>
        </div>

        {/* HTML yapıştırma fallback (otomatik açılır engellendiğinde) */}
        <details
          open={showHtmlPaste}
          className="mt-3 group rounded-lg border border-navy-200 bg-white"
        >
          <summary className="cursor-pointer text-xs font-semibold text-navy-700 px-3 py-2 hover:bg-navy-50 list-none flex items-center justify-between">
            <span>Engellendi mi? Sayfa kaynağını yapıştırın ↓</span>
            <span className="text-navy-400 group-open:rotate-180 transition-transform">▾</span>
          </summary>
          <div className="px-3 pb-3 space-y-2">
            <ol className="text-[11px] text-navy-600 list-decimal pl-4 space-y-0.5">
              <li>Sahibinden ilan sayfasını <strong>kendi tarayıcınızda</strong> açın.</li>
              <li>Sağ tık → "Sayfa kaynağını görüntüle" (Ctrl+U).</li>
              <li>Tüm metni seçin (Ctrl+A) ve kopyalayın (Ctrl+C).</li>
              <li>Aşağıdaki kutuya yapıştırın (Ctrl+V) ve "Yapıştırılan Kaynaktan İçeri Aktar"a basın.</li>
            </ol>
            <textarea
              className="input min-h-[120px] font-mono text-[11px]"
              placeholder="<html>... sahibinden ilan sayfa kaynağı ..."
              value={pastedHtml}
              onChange={(e) => setPastedHtml(e.target.value)}
              disabled={importing}
            />
            <button
              type="button"
              onClick={() => handleImport('html')}
              disabled={importing || pastedHtml.trim().length < 1000}
              className="btn-primary text-xs"
            >
              {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Yapıştırılan Kaynaktan İçeri Aktar
            </button>
          </div>
        </details>

        {/* Bulunan fotoğraflar (sahibinden CDN URL'leri) */}
        {pendingImages.length > 0 && (
          <div className="mt-4 bg-white border border-gold-300 rounded-lg p-3">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
              <div className="flex items-center gap-2">
                <Images className="w-4 h-4 text-gold-600" />
                <span className="font-display text-sm font-bold text-navy-950">
                  Bulunan Fotoğraflar
                </span>
                <span className="text-xs bg-gold-100 text-gold-800 px-2 py-0.5 rounded-full font-semibold">
                  {selectedPendingIdx.size} / {pendingImages.length} seçili
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={selectAllPending}
                  className="text-xs px-2 py-1 rounded border border-navy-200 hover:bg-navy-50 text-navy-700"
                >
                  Tümünü Seç
                </button>
                <button
                  type="button"
                  onClick={selectNonePending}
                  className="text-xs px-2 py-1 rounded border border-navy-200 hover:bg-navy-50 text-navy-700"
                >
                  Hiçbiri
                </button>
                <button
                  type="button"
                  onClick={downloadPendingImages}
                  disabled={downloadingImages || selectedPendingIdx.size === 0 || !(savedProperty?.id || propertyId)}
                  className="btn-primary text-xs py-1.5 px-3"
                  title={
                    !(savedProperty?.id || propertyId)
                      ? 'Önce ilanı kaydedin'
                      : 'Seçilenleri sunucuya indir + Vercel Blob\'a yükle'
                  }
                >
                  {downloadingImages ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  İndir & Yükle
                </button>
              </div>
            </div>

            {!(savedProperty?.id || propertyId) && (
              <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1.5 rounded mb-2">
                ⚠ Fotoğrafları indirebilmek için önce <strong>ilanı kaydetmeniz</strong> gerekir.
              </div>
            )}

            {downloadProgress && (
              <div className="text-[11px] text-navy-600 mb-2">
                {downloadingImages
                  ? `İndiriliyor: ${downloadProgress.done}/${downloadProgress.total}...`
                  : `Sonuç: ${downloadProgress.done} indirildi, ${downloadProgress.failed} başarısız`}
              </div>
            )}

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5 max-h-[260px] overflow-y-auto">
              {pendingImages.map((url, i) => {
                const sel = selectedPendingIdx.has(i)
                return (
                  <button
                    key={url}
                    type="button"
                    onClick={() => togglePendingImg(i)}
                    className={`relative aspect-square rounded overflow-hidden border-2 transition-all ${
                      sel ? 'border-gold-500 ring-2 ring-gold-200' : 'border-navy-200 opacity-60 hover:opacity-100'
                    }`}
                    title={`${i + 1}. fotoğraf`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Fotoğraf ${i + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 right-1 bg-white/90 rounded-sm w-4 h-4 flex items-center justify-center">
                      {sel ? (
                        <CheckSquare className="w-3.5 h-3.5 text-gold-600" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-navy-400" />
                      )}
                    </div>
                    <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-[10px] font-mono px-1 py-0.5">
                      #{i + 1}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </section>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Temel bilgiler */}
        <section className="card p-5 space-y-3">
          <h3 className="font-display text-lg font-bold text-navy-950 mb-2">Temel Bilgiler</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="label">İlan Türü *</label>
              <select
                className="input"
                value={form.type}
                onChange={(e) => update('type', e.target.value)}
                required
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Kategori *</label>
              <select
                className="input"
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                required
              >
                {PROPERTY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Durum</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
              >
                {PROPERTY_STATUS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">Başlık (TR) *</label>
              <input
                className="input"
                value={form.title_tr}
                onChange={(e) => update('title_tr', e.target.value)}
                required
                placeholder="Örn: Çandarlı'da Denize Sıfır 3+1 Yazlık"
              />
            </div>
            <div>
              <label className="label">Başlık (EN)</label>
              <input
                className="input"
                value={form.title_en}
                onChange={(e) => update('title_en', e.target.value)}
                placeholder="Beachfront 3+1 Summer House in Çandarlı"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">Açıklama (TR)</label>
              <textarea
                className="input min-h-[140px]"
                value={form.description_tr}
                onChange={(e) => update('description_tr', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Açıklama (EN)</label>
              <textarea
                className="input min-h-[140px]"
                value={form.description_en}
                onChange={(e) => update('description_en', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="label">Fiyat *</label>
              <input
                type="number"
                className="input"
                value={form.price}
                onChange={(e) => update('price', e.target.value)}
                required
                min={0}
              />
            </div>
            <div>
              <label className="label">Para Birimi</label>
              <select
                className="input"
                value={form.currency}
                onChange={(e) => update('currency', e.target.value)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-navy-200 bg-white w-full cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => update('is_featured', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Öne Çıkar</span>
              </label>
            </div>
          </div>
        </section>

        {/* Portföy sahibi */}
        <section className="card p-5 space-y-3">
          <h3 className="font-display text-lg font-bold text-navy-950 mb-1">Portföy Sahibi Bilgileri</h3>
          <p className="text-xs text-navy-500">
            Bu bilgiler yalnızca admin panelinde görünür; müşteri/portföy sahibi veritabanı ekranında takip için kullanılır.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="label">Sahip Adı</label>
              <input className="input" value={form.owner_name} onChange={(e) => update('owner_name', e.target.value)} />
            </div>
            <div>
              <label className="label">Sahip Telefon</label>
              <input className="input" value={form.owner_phone} onChange={(e) => update('owner_phone', e.target.value)} />
            </div>
            <div>
              <label className="label">Sahip E-posta</label>
              <input className="input" value={form.owner_email} onChange={(e) => update('owner_email', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Sahip Notu</label>
            <textarea
              className="input min-h-[80px]"
              value={form.owner_notes}
              onChange={(e) => update('owner_notes', e.target.value)}
              placeholder="Yetki durumu, görüşme notu, fiyat beklentisi..."
            />
          </div>
        </section>

        {/* Konum */}
        <section className="card p-5 space-y-3">
          <h3 className="font-display text-lg font-bold text-navy-950 mb-2">Konum</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="label">İl</label>
              <input className="input" value={form.city} onChange={(e) => update('city', e.target.value)} />
            </div>
            <div>
              <label className="label">İlçe / Bölge</label>
              <input className="input" value={form.district} onChange={(e) => update('district', e.target.value)} />
            </div>
            <div>
              <label className="label">Mahalle / Mevki</label>
              <input className="input" value={form.neighborhood} onChange={(e) => update('neighborhood', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Adres</label>
            <input className="input" value={form.address} onChange={(e) => update('address', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">Enlem (lat)</label>
              <input className="input" value={form.lat} onChange={(e) => update('lat', e.target.value)} placeholder="38.9358" />
            </div>
            <div>
              <label className="label">Boylam (lng)</label>
              <input className="input" value={form.lng} onChange={(e) => update('lng', e.target.value)} placeholder="26.9349" />
            </div>
          </div>
          <p className="text-xs text-navy-500">
            Koordinat almak için Google Maps'te konuma sağ tıklayın → ilk satıra tıklayarak kopyalayın.
            {form.lat && form.lng && (
              <>
                {' • '}
                <a
                  href={`https://www.google.com/maps?q=${form.lat},${form.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold-700 hover:text-gold-900 font-semibold"
                >
                  Bu konumu Maps'te aç ↗
                </a>
              </>
            )}
          </p>
          {form.lat && form.lng && !Number.isNaN(Number(form.lat)) && !Number.isNaN(Number(form.lng)) && (
            <div className="rounded-lg overflow-hidden border border-navy-200">
              <iframe
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                  Number(form.lng) - 0.01
                }%2C${Number(form.lat) - 0.005}%2C${Number(form.lng) + 0.01}%2C${
                  Number(form.lat) + 0.005
                }&layer=mapnik&marker=${form.lat}%2C${form.lng}`}
                width="100%"
                height="240"
                style={{ border: 0 }}
                loading="lazy"
                title="Konum önizleme"
              />
            </div>
          )}
        </section>

        {/* Tapu / Kadastro */}
        <section className="card p-5 space-y-3">
          <h3 className="font-display text-lg font-bold text-navy-950 mb-2">
            Tapu / Kadastro Bilgileri
          </h3>
          <p className="text-xs text-navy-500 -mt-2">
            Özellikle arsa, tarla ve bağ-bahçe ilanları için ada/parsel bilgisi giriniz.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="label">Ada No</label>
              <input className="input" value={form.ada_no} onChange={(e) => update('ada_no', e.target.value)} placeholder="123" />
            </div>
            <div>
              <label className="label">Parsel No</label>
              <input className="input" value={form.parsel_no} onChange={(e) => update('parsel_no', e.target.value)} placeholder="45" />
            </div>
            <div>
              <label className="label">Pafta No</label>
              <input className="input" value={form.pafta_no} onChange={(e) => update('pafta_no', e.target.value)} placeholder="L17-A-21-B (opsiyonel)" />
            </div>
          </div>
          <div>
            <label className="label">Kaynak / Harici Link</label>
            <input
              className="input"
              type="url"
              value={form.external_url}
              onChange={(e) => update('external_url', e.target.value)}
              placeholder="https://www.sahibinden.com/ilan/..."
            />
            <p className="text-[11px] text-navy-500 mt-1">
              Sahibinden.com'dan içeri aktardığınızda otomatik dolar.
            </p>
          </div>
        </section>

        {/* Detaylar */}
        <section className="card p-5 space-y-3">
          <h3 className="font-display text-lg font-bold text-navy-950 mb-2">Mülk Detayları</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="label">Oda</label>
              <input className="input" value={form.bedrooms} onChange={(e) => update('bedrooms', e.target.value)} placeholder="3" />
            </div>
            <div>
              <label className="label">Banyo</label>
              <input className="input" value={form.bathrooms} onChange={(e) => update('bathrooms', e.target.value)} placeholder="1" />
            </div>
            <div>
              <label className="label">Net m²</label>
              <input className="input" value={form.area_m2} onChange={(e) => update('area_m2', e.target.value)} />
            </div>
            <div>
              <label className="label">Arsa m²</label>
              <input className="input" value={form.lot_m2} onChange={(e) => update('lot_m2', e.target.value)} />
            </div>
            <div>
              <label className="label">Bina Yaşı</label>
              <input className="input" value={form.building_age} onChange={(e) => update('building_age', e.target.value)} />
            </div>
            <div>
              <label className="label">Kat</label>
              <input className="input" value={form.floor} onChange={(e) => update('floor', e.target.value)} />
            </div>
            <div>
              <label className="label">Toplam Kat</label>
              <input className="input" value={form.total_floors} onChange={(e) => update('total_floors', e.target.value)} />
            </div>
            <div>
              <label className="label">Isıtma</label>
              <input className="input" value={form.heating_type} onChange={(e) => update('heating_type', e.target.value)} placeholder="Klima / Soba / Doğalgaz..." />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-navy-100">
            <div>
              <label className="label">Tam Müstakil / Kendi Arsasında mı?</label>
              <select className="input" value={form.is_detached} onChange={(e) => update('is_detached', e.target.value)}>
                <option value="">Belirtilmedi</option>
                <option value="evet">Evet</option>
                <option value="hayir">Hayır</option>
              </select>
            </div>
            <div>
              <label className="label">Site İçerisinde mi?</label>
              <select className="input" value={form.in_site} onChange={(e) => update('in_site', e.target.value)}>
                <option value="">Belirtilmedi</option>
                <option value="evet">Evet</option>
                <option value="hayir">Hayır</option>
              </select>
            </div>
            <div>
              <label className="label">Arsa Niteliği / İmar Durumu</label>
              <input
                className="input"
                value={form.land_status}
                onChange={(e) => update('land_status', e.target.value)}
                placeholder="İmarlı / zeytinlik / tarla / konut imarlı..."
              />
            </div>
          </div>
        </section>

        {/* Özellikler */}
        <section className="card p-5">
          <h3 className="font-display text-lg font-bold text-navy-950 mb-3">Özellikler</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {FEATURE_PRESETS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => toggleFeature(f)}
                className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                  form.features.includes(f)
                    ? 'bg-gold-gradient text-navy-950 border-gold-500 font-semibold'
                    : 'bg-white border-navy-200 text-navy-700 hover:border-gold-400'
                }`}
              >
                {f}
              </button>
            ))}
            {form.features
              .filter((f) => !FEATURE_PRESETS.includes(f))
              .map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFeature(f)}
                  className="px-3 py-1.5 rounded-full bg-gold-gradient text-navy-950 border-gold-500 font-semibold text-sm"
                >
                  {f} ×
                </button>
              ))}
          </div>
          <div className="flex gap-2">
            <input
              value={customFeature}
              onChange={(e) => setCustomFeature(e.target.value)}
              placeholder="Özel özellik ekle..."
              className="input flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCustomFeature()
                }
              }}
            />
            <button
              type="button"
              onClick={addCustomFeature}
              className="btn-ghost border-2 border-navy-200"
            >
              <Plus className="w-4 h-4" />
              Ekle
            </button>
          </div>
        </section>

        <div className="flex flex-wrap gap-2 sticky bottom-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {savedProperty ? 'Değişiklikleri Kaydet' : 'İlanı Oluştur'}
          </button>
          <button type="button" onClick={onClose} className="btn-ghost border-2 border-navy-200">
            <X className="w-4 h-4" />
            Kapat
          </button>
        </div>
      </form>

      {/* Görseller — sadece kayıt sonrası */}
      {(savedProperty || propertyId) && (
        <section className="card p-5">
          <h3 className="font-display text-lg font-bold text-navy-950 mb-3">
            Görseller ({images.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
            {images.map((img) => {
              const isCover = savedProperty?.cover_image === img.url
              return (
                <div key={img.id} className="relative group rounded-lg overflow-hidden border border-navy-200">
                  <div className="relative aspect-square bg-navy-100">
                    <Image src={img.url} alt={img.alt_text || ''} fill sizes="200px" className="object-cover" />
                  </div>
                  <div className="absolute inset-0 bg-navy-950/0 group-hover:bg-navy-950/70 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setCover(img.id)}
                      title="Kapak yap"
                      className="w-9 h-9 rounded-full bg-gold-500 text-navy-950 flex items-center justify-center"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteImage(img.id)}
                      title="Sil"
                      className="w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {isCover && (
                    <span className="absolute top-1 left-1 bg-gold-gradient text-navy-950 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shadow">
                      Kapak
                    </span>
                  )}
                </div>
              )
            })}

            <label className="aspect-square rounded-lg border-2 border-dashed border-navy-300 hover:border-gold-400 cursor-pointer flex flex-col items-center justify-center text-navy-500 hover:text-gold-600 text-sm bg-navy-50/50">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleImageUpload(e.target.files)}
                disabled={uploading}
              />
              {uploading ? (
                <Loader2 className="w-6 h-6 animate-spin mb-1" />
              ) : (
                <Upload className="w-6 h-6 mb-1" />
              )}
              <span className="text-xs font-medium">Görsel Yükle</span>
            </label>
          </div>
          <p className="text-xs text-navy-500">
            Çoklu seçim aktif. Görsele tıklayıp kapak yapabilir veya silebilirsiniz.
          </p>
        </section>
      )}

      {(savedProperty || propertyId) && (
        <PropertyInstagramTemplates
          form={{
            type: form.type,
            category: form.category,
            title_tr: form.title_tr,
            price: form.price,
            currency: form.currency,
            city: form.city,
            district: form.district,
            neighborhood: form.neighborhood,
            bedrooms: form.bedrooms,
            bathrooms: form.bathrooms,
            area_m2: form.area_m2,
            lot_m2: form.lot_m2,
            features: form.features,
          }}
          images={images}
          coverUrl={savedProperty?.cover_image ?? null}
          slug={savedProperty?.slug ?? null}
        />
      )}
    </div>
  )
}
