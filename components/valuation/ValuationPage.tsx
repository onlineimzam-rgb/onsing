'use client'

import { useState, useRef, type FormEvent } from 'react'
import { upload } from '@vercel/blob/client'
import { motion } from 'framer-motion'
import {
  Calculator, MapPin, Home, Phone, User, Mail, Send,
  CheckCircle2, Loader2, ClipboardList, ArrowRight,
  Upload, FileText, X, Image as ImageIcon, ExternalLink,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/I18nProvider'
import { PROPERTY_CATEGORIES } from '@/lib/config'

const DEFAULT = {
  name: '', phone: '', email: '',
  city: 'İzmir', district: 'Çandarlı', neighborhood: '',
  address: '', property_type: 'daire',
  area_m2: '', lot_m2: '', year_built: '', rooms: '', notes: '',
  ada_no: '', parsel_no: '', pafta_no: '', parcel_query_url: '',
  manual_property_info: '',
}

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_FILES = 5
const ALLOWED_MIME = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'application/pdf',
]

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

function safeFileName(name: string) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .toLowerCase()
}

async function readResponse(res: Response) {
  const text = await res.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return {
      error: text.includes('Request Entity Too Large') || text.includes('Request Entity')
        ? 'Yüklenen dosyalar çok büyük. Lütfen dosya boyutunu azaltıp tekrar deneyin.'
        : text.slice(0, 240),
    }
  }
}

export default function ValuationPage() {
  const { t } = useI18n()
  const [form, setForm] = useState(DEFAULT)
  const [files, setFiles] = useState<File[]>([])
  const [propertyPhotos, setPropertyPhotos] = useState<File[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const update = (k: keyof typeof DEFAULT, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'documents' | 'photos' = 'documents'
  ) => {
    setFileError(null)
    const incoming = Array.from(e.target.files || [])
    if (!incoming.length) return
    const current = target === 'documents' ? files : propertyPhotos
    const merged = [...current]
    for (const f of incoming) {
      if (merged.length >= MAX_FILES) {
        setFileError(`En fazla ${MAX_FILES} dosya yükleyebilirsiniz`)
        break
      }
      if (f.size > MAX_FILE_SIZE) {
        setFileError(`${f.name} 10 MB sınırını aşıyor`)
        continue
      }
      if (!ALLOWED_MIME.includes(f.type) && !/\.(jpe?g|png|webp|heic|pdf)$/i.test(f.name)) {
        setFileError(`${f.name}: Sadece JPG/PNG/WEBP/PDF kabul edilir`)
        continue
      }
      merged.push(f)
    }
    if (target === 'documents') setFiles(merged)
    else setPropertyPhotos(merged)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (idx: number, target: 'documents' | 'photos' = 'documents') => {
    if (target === 'documents') setFiles((prev) => prev.filter((_, i) => i !== idx))
    else setPropertyPhotos((prev) => prev.filter((_, i) => i !== idx))
    setFileError(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (files.length === 0) {
      setError('Tapu, web tapu belgesi veya mülkün size ait olduğunu gösteren belge yüklenmeden değerleme talebi alınmaz.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const uploadFile = async (file: File, folder: 'documents' | 'photos') => {
        const pathname = `valuations/${folder}/${Date.now()}-${safeFileName(file.name || 'dosya')}`
        const blob = await upload(pathname, file, {
          access: 'public',
          handleUploadUrl: '/api/valuations/upload/',
          contentType: file.type || undefined,
        })
        return blob.url
      }

      const documents = []
      for (const file of files) {
        documents.push(await uploadFile(file, 'documents'))
      }
      const uploadedPhotos = []
      for (const file of propertyPhotos) {
        uploadedPhotos.push(await uploadFile(file, 'photos'))
      }

      const res = await fetch('/api/valuations/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          documents,
          property_photos: uploadedPhotos,
        }),
      })
      const data = await readResponse(res)
      if (!res.ok) throw new Error(data.error || 'Hata')
      setDone(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pt-20 pb-16">
      <section className="bg-navy-gradient text-white py-12 md:py-16 mb-8">
        <div className="container-custom">
          <p className="text-gold-400 uppercase tracking-[0.25em] text-xs md:text-sm font-semibold mb-2">
            {t('valuation.eyebrow')}
          </p>
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-3 max-w-3xl">
            {t('valuation.title')}
          </h1>
          <p className="text-navy-100 text-base md:text-lg max-w-2xl">{t('valuation.subtitle')}</p>
        </div>
      </section>

      <div className="container-custom grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* How it works */}
        <aside className="lg:col-span-2 space-y-3">
          <h2 className="font-display text-xl md:text-2xl font-bold text-navy-950 mb-3">
            {t('valuation.info_title')}
          </h2>
          {(['step_1', 'step_2', 'step_3', 'step_4'] as const).map((k, i) => (
            <motion.div
              key={k}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="card p-4 flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center flex-shrink-0 font-bold text-navy-950 text-sm">
                {i + 1}
              </div>
              <div className="text-sm text-navy-700">{t(`valuation.${k}`)}</div>
            </motion.div>
          ))}

          <div className="card p-4 mt-2 bg-navy-50 border-navy-200">
            <div className="flex items-center gap-2 text-gold-700 text-sm font-semibold mb-1">
              <ClipboardList className="w-4 h-4" />
              Ücretsiz
            </div>
            <p className="text-xs text-navy-600">
              Mülk değerleme hizmetimiz tamamen ücretsizdir. Hiçbir taahhüt olmadan piyasa
              değerini öğrenebilirsiniz.
            </p>
          </div>
        </aside>

        {/* Form */}
        <div className="lg:col-span-3">
          <div className="card p-5 md:p-7">
            <h2 className="font-display text-xl md:text-2xl font-bold text-navy-950 mb-5 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-gold-500" />
              {t('valuation.form_title')}
            </h2>

            {done ? (
              <div className="text-center py-10">
                <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-3" />
                <h3 className="font-display text-xl font-bold text-navy-950 mb-2">Talebiniz alındı!</h3>
                <p className="text-navy-600 text-sm max-w-md mx-auto">
                  {t('valuation.success')}
                </p>
                <button
                  onClick={() => {
                    setForm(DEFAULT)
                    setFiles([])
                    setPropertyPhotos([])
                    setFileError(null)
                    setDone(false)
                  }}
                  className="btn-ghost border-2 border-navy-200 mt-5"
                >
                  Yeni Talep Gönder
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field icon={User} label={t('valuation.name')} required>
                    <input className="input" required value={form.name} onChange={(e) => update('name', e.target.value)} />
                  </Field>
                  <Field icon={Phone} label={t('valuation.phone')} required>
                    <input type="tel" className="input" required value={form.phone} onChange={(e) => update('phone', e.target.value)} />
                  </Field>
                </div>
                <Field icon={Mail} label={t('valuation.email')}>
                  <input type="email" className="input" value={form.email} onChange={(e) => update('email', e.target.value)} />
                </Field>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Field label="İl">
                    <input className="input" value={form.city} onChange={(e) => update('city', e.target.value)} />
                  </Field>
                  <Field label="İlçe">
                    <input className="input" value={form.district} onChange={(e) => update('district', e.target.value)} />
                  </Field>
                  <Field label="Mahalle / Mevki">
                    <input className="input" value={form.neighborhood} onChange={(e) => update('neighborhood', e.target.value)} placeholder="Çandarlı, Bahçeli..." />
                  </Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field icon={Home} label={t('valuation.type')}>
                    <select className="input" value={form.property_type} onChange={(e) => update('property_type', e.target.value)}>
                      {PROPERTY_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{t(`property_category.${c}` as any)}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t('valuation.year_built')}>
                    <input className="input" value={form.year_built} onChange={(e) => update('year_built', e.target.value)} placeholder="2010" />
                  </Field>
                </div>

                {/* Ada/Parsel — tüm mülk tipleri için (her zaman görünsün) */}
                <div className="bg-gold-50 border border-gold-200 rounded-xl p-3 space-y-3">
                  <div className="text-xs font-semibold text-gold-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5" />
                    Tapu / Kadastro Bilgileri (varsa)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Field label="Ada No">
                      <input className="input" value={form.ada_no} onChange={(e) => update('ada_no', e.target.value)} placeholder="123" />
                    </Field>
                    <Field label="Parsel No">
                      <input className="input" value={form.parsel_no} onChange={(e) => update('parsel_no', e.target.value)} placeholder="45" />
                    </Field>
                    <Field label="Pafta No">
                      <input className="input" value={form.pafta_no} onChange={(e) => update('pafta_no', e.target.value)} placeholder="(opsiyonel)" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
                    <Field label="Parsel Sorgu Linki">
                      <input
                        className="input"
                        value={form.parcel_query_url}
                        onChange={(e) => update('parcel_query_url', e.target.value)}
                        placeholder="TKGM parsel sorgudan kopyaladığınız link"
                      />
                    </Field>
                    <a
                      href="https://parselsorgu.tkgm.gov.tr/"
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost border-2 border-gold-300 text-gold-800 hover:bg-gold-50"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Parsel Sorgu'yu Aç
                    </a>
                  </div>
                  <p className="text-[11px] text-navy-600">
                    TKGM Parsel Sorgu kamu uygulaması ayrı sekmede açılır. Ada/parseli bulup linki veya bilgileri buraya yazabilirsiniz.
                  </p>
                </div>

                <Field icon={MapPin} label={t('valuation.address')}>
                  <input className="input" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Açık adres / sokak / no" />
                </Field>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Field label={t('valuation.area')}>
                    <input className="input" value={form.area_m2} onChange={(e) => update('area_m2', e.target.value)} />
                  </Field>
                  <Field label={t('valuation.lot_area')}>
                    <input className="input" value={form.lot_m2} onChange={(e) => update('lot_m2', e.target.value)} />
                  </Field>
                  <Field label={t('valuation.rooms')}>
                    <input className="input" value={form.rooms} onChange={(e) => update('rooms', e.target.value)} placeholder="3+1" />
                  </Field>
                </div>
                <Field label={t('valuation.notes')}>
                  <textarea
                    className="input min-h-[110px]"
                    value={form.notes}
                    onChange={(e) => update('notes', e.target.value)}
                    placeholder="Manzarası, kat durumu, tadilat geçmişi..."
                  />
                </Field>

                <Field label="Gayrimenkul Bilgileri (Manuel)">
                  <textarea
                    className="input min-h-[130px]"
                    value={form.manual_property_info}
                    onChange={(e) => update('manual_property_info', e.target.value)}
                    placeholder="Örn: Cephe, yol durumu, manzara, tapu niteliği, imar bilgisi, yapı durumu, kira getirisi, avantaj/dezavantaj..."
                  />
                </Field>

                <div className="bg-white border border-navy-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-navy-800 text-sm font-semibold">
                    <ImageIcon className="w-4 h-4 text-gold-500" />
                    Gayrimenkul Fotoğrafları (opsiyonel)
                  </div>
                  <p className="text-xs text-navy-600">
                    Mülkün dış/iç fotoğraflarını veya arsa görsellerini ekleyebilirsiniz. Bunlar talep kaydında ayrı görüntülenir.
                  </p>
                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-navy-200 hover:border-gold-400 hover:bg-navy-50 rounded-lg cursor-pointer py-5 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'photos')}
                      className="hidden"
                    />
                    <Upload className="w-5 h-5 text-navy-400" />
                    <span className="text-sm text-navy-600">
                      Fotoğraf seçmek için <span className="text-gold-700 font-semibold">tıklayın</span>
                    </span>
                  </label>
                  {propertyPhotos.length > 0 && (
                    <div className="space-y-2">
                      {propertyPhotos.map((f, i) => (
                        <div key={`${f.name}-${i}`} className="flex items-center gap-2 bg-navy-50 border border-navy-200 rounded-lg p-2">
                          <ImageIcon className="w-4 h-4 text-gold-500" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-navy-900 truncate">{f.name}</div>
                            <div className="text-[11px] text-navy-500">{formatBytes(f.size)}</div>
                          </div>
                          <button type="button" onClick={() => removeFile(i, 'photos')} className="text-navy-400 hover:text-red-600 p-1">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Belge yükleme */}
                <div className="bg-navy-50 border border-navy-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-navy-800 text-sm font-semibold">
                    <Upload className="w-4 h-4 text-gold-500" />
                    Tapu / Web Tapu Belgesi *
                  </div>
                  <p className="text-xs text-navy-600">
                    Tapu, web tapu belgesi veya mülkün size ait olduğunu gösteren belge yüklenmeden değerleme talebi alınmaz.
                    Maks. {MAX_FILES} dosya, her biri 10 MB. JPG, PNG, WEBP, PDF kabul edilir.
                  </p>

                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-navy-200 hover:border-gold-400 hover:bg-white rounded-lg cursor-pointer py-6 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileChange(e, 'documents')}
                      className="hidden"
                    />
                    <Upload className="w-6 h-6 text-navy-400" />
                    <span className="text-sm text-navy-600">
                      Dosya seçmek için <span className="text-gold-700 font-semibold">tıklayın</span>
                    </span>
                  </label>

                  {fileError && (
                    <div className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
                      {fileError}
                    </div>
                  )}

                  {files.length > 0 && (
                    <div className="space-y-2">
                      {files.map((f, i) => {
                        const isImg = f.type.startsWith('image/')
                        return (
                          <div
                            key={i}
                            className="flex items-center gap-2 bg-white border border-navy-200 rounded-lg p-2"
                          >
                            <div className="w-9 h-9 bg-navy-100 rounded flex items-center justify-center flex-shrink-0">
                              {isImg ? (
                                <ImageIcon className="w-4 h-4 text-gold-500" />
                              ) : (
                                <FileText className="w-4 h-4 text-gold-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-navy-900 truncate">
                                {f.name}
                              </div>
                              <div className="text-[11px] text-navy-500">{formatBytes(f.size)}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(i, 'documents')}
                              className="text-navy-400 hover:text-red-600 p-1"
                              aria-label="Kaldır"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <button type="submit" disabled={loading || files.length === 0} className="btn-primary w-full disabled:opacity-50">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {t('valuation.submit')}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  icon: Icon, label, required, children,
}: {
  icon?: any
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="label flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-gold-500" />}
        {label}{required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}
