'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import {
  Search, Tag, User, Phone, Mail, MapPin, Send,
  CheckCircle2, Loader2, ArrowRight, Calculator, FileText,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/I18nProvider'
import { PROPERTY_CATEGORIES, PROPERTY_TYPES } from '@/lib/config'

type Tab = 'buyer' | 'seller'

const DEFAULT = {
  name: '', phone: '', email: '',
  property_type: 'satilik', category: 'daire',
  district: 'Çandarlı',
  budget_min: '', budget_max: '', currency: 'TRY',
  rooms: '', area_min: '', lot_min: '', total_floors: '',
  is_detached: '', in_site: '', land_status: '', location_note: '',
  message: '',
}

const DISTRICTS = ['Çandarlı', 'Dikili', 'Bademli', 'İzmir', 'Diğer']
const LAND_CATEGORIES = ['arsa', 'tarla', 'bag-bahce']

export default function LeadPage() {
  const { t, locale } = useI18n()
  const [tab, setTab] = useState<Tab>('buyer')
  const [form, setForm] = useState(DEFAULT)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isLand = LAND_CATEGORIES.includes(form.category)

  const update = (k: keyof typeof DEFAULT, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const intent = tab === 'buyer' ? 'alici' : 'satici'
      const res = await fetch('/api/leads/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, intent }),
      })
      const data = await res.json()
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
            {t('lead_form.eyebrow')}
          </p>
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-3 max-w-3xl">
            {t('lead_form.title')}
          </h1>
          <p className="text-navy-100 text-base md:text-lg max-w-2xl">{t('lead_form.subtitle')}</p>
        </div>
      </section>

      <div className="container-custom max-w-3xl">
        <div className="card overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-navy-100">
            <button
              onClick={() => {
                setTab('buyer')
                setForm((p) => ({ ...p, property_type: 'satilik' }))
              }}
              className={`flex-1 py-3 px-4 text-sm font-semibold border-b-2 inline-flex items-center justify-center gap-2 transition-colors ${
                tab === 'buyer'
                  ? 'border-gold-500 text-navy-950 bg-gold-50/40'
                  : 'border-transparent text-navy-500 hover:text-navy-800'
              }`}
            >
              <Search className="w-4 h-4" />
              {t('lead_form.buyer_tab')}
            </button>
            <button
              onClick={() => {
                setTab('seller')
                setForm((p) => ({ ...p, property_type: 'satilik' }))
              }}
              className={`flex-1 py-3 px-4 text-sm font-semibold border-b-2 inline-flex items-center justify-center gap-2 transition-colors ${
                tab === 'seller'
                  ? 'border-gold-500 text-navy-950 bg-gold-50/40'
                  : 'border-transparent text-navy-500 hover:text-navy-800'
              }`}
            >
              <Tag className="w-4 h-4" />
              {t('lead_form.seller_tab')}
            </button>
          </div>

          <div className="p-5 md:p-7">
            {/* Satıcı sekmesi: değerleme sayfasına yönlendir */}
            {tab === 'seller' ? (
              <div className="py-4">
                <div className="bg-gradient-to-br from-gold-50 to-gold-100 border border-gold-300 rounded-xl p-5 md:p-6 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-full bg-gold-gradient flex items-center justify-center">
                    <Calculator className="w-7 h-7 text-navy-950" />
                  </div>
                  <h3 className="font-display text-xl md:text-2xl font-bold text-navy-950">
                    Mülk Değerleme Sayfamıza Buyurun
                  </h3>
                  <p className="text-sm md:text-base text-navy-700 max-w-lg mx-auto">
                    Mülkünüz için <strong>ücretsiz piyasa değerlemesi</strong> almak,
                    ada/parsel bilgilerini iletmek ve <strong>tapu / kadastro belgelerinizi</strong>
                    {' '}güvenli bir şekilde yüklemek için detaylı değerleme formumuza geçin.
                  </p>
                  <ul className="text-left max-w-md mx-auto text-sm text-navy-700 space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-gold-600 mt-0.5">✓</span>
                      <span>İl, ilçe, mahalle ve ada/parsel kriterleri</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gold-600 mt-0.5">✓</span>
                      <span>Tapu fotoğrafı / PDF / çap belgesi yükleme (5 dosya, 10 MB)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gold-600 mt-0.5">✓</span>
                      <span>48 saat içinde uzman değerleme dönüşü</span>
                    </li>
                  </ul>
                  <Link
                    href={`/${locale}/mulk-degerleme/`}
                    className="btn-primary inline-flex"
                  >
                    <FileText className="w-4 h-4" />
                    Mülk Değerleme'ye Git
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <p className="text-xs text-navy-500 pt-2">
                    Veya alıcılarımız için talep bırakmak isterseniz
                    <button
                      type="button"
                      onClick={() => setTab('buyer')}
                      className="text-gold-700 hover:text-gold-900 font-semibold ml-1 underline underline-offset-2"
                    >
                      Mülk arıyorum
                    </button>
                    {' '}sekmesine geçebilirsiniz.
                  </p>
                </div>
              </div>
            ) : done ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-3" />
                <h3 className="font-display text-xl font-bold text-navy-950 mb-2">Talebiniz alındı!</h3>
                <p className="text-navy-600 text-sm">{t('lead_form.success')}</p>
                <button
                  onClick={() => {
                    setForm(DEFAULT)
                    setDone(false)
                  }}
                  className="btn-ghost border-2 border-navy-200 mt-5"
                >
                  Yeni Talep
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
                  <Field icon={User} label={t('lead_form.name')} required>
                    <input className="input" required value={form.name} onChange={(e) => update('name', e.target.value)} />
                  </Field>
                  <Field icon={Phone} label={t('lead_form.phone')} required>
                    <input type="tel" className="input" required value={form.phone} onChange={(e) => update('phone', e.target.value)} />
                  </Field>
                </div>
                <Field icon={Mail} label={t('lead_form.email')}>
                  <input type="email" className="input" value={form.email} onChange={(e) => update('email', e.target.value)} />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-navy-100">
                  <Field label={t('lead_form.type')}>
                    <select className="input" value={form.property_type} onChange={(e) => update('property_type', e.target.value)}>
                      {PROPERTY_TYPES.map((p) => (
                        <option key={p} value={p}>{t(`property_type.${p}` as any)}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t('lead_form.category')}>
                    <select className="input" value={form.category} onChange={(e) => update('category', e.target.value)}>
                      {PROPERTY_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{t(`property_category.${c}` as any)}</option>
                      ))}
                    </select>
                  </Field>
                  <Field icon={MapPin} label={t('lead_form.district')}>
                    <select className="input" value={form.district} onChange={(e) => update('district', e.target.value)}>
                      {DISTRICTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Field label={t('lead_form.budget_min')}>
                    <input type="number" className="input" value={form.budget_min} onChange={(e) => update('budget_min', e.target.value)} />
                  </Field>
                  <Field label={t('lead_form.budget_max')}>
                    <input type="number" className="input" value={form.budget_max} onChange={(e) => update('budget_max', e.target.value)} />
                  </Field>
                  <Field label="Para Birimi">
                    <select className="input" value={form.currency} onChange={(e) => update('currency', e.target.value)}>
                      <option value="TRY">TL</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </Field>
                  <Field label={t('lead_form.rooms')}>
                    <input className="input" value={form.rooms} onChange={(e) => update('rooms', e.target.value)} placeholder="3+1" />
                  </Field>
                </div>

                {isLand ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-navy-50 border border-navy-100 rounded-xl p-3">
                    <Field label="Arsanın Niteliği">
                      <select className="input" value={form.land_status} onChange={(e) => update('land_status', e.target.value)}>
                        <option value="">Fark etmez</option>
                        <option value="İmarlı">İmarlı</option>
                        <option value="Konut imarlı">Konut imarlı</option>
                        <option value="Tarla">Tarla</option>
                        <option value="Zeytinlik">Zeytinlik</option>
                        <option value="Bağ / Bahçe">Bağ / Bahçe</option>
                        <option value="Yatırımlık">Yatırımlık</option>
                      </select>
                    </Field>
                    <Field label="Minimum m²">
                      <input type="number" className="input" value={form.lot_min} onChange={(e) => update('lot_min', e.target.value)} placeholder="500" />
                    </Field>
                    <Field label="Mevki / Harita Notu">
                      <input className="input" value={form.location_note} onChange={(e) => update('location_note', e.target.value)} placeholder="Denize yakın, yol cepheli..." />
                    </Field>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-navy-50 border border-navy-100 rounded-xl p-3">
                    <Field label={t('lead_form.area_min')}>
                      <input type="number" className="input" value={form.area_min} onChange={(e) => update('area_min', e.target.value)} placeholder="100" />
                    </Field>
                    <Field label="Kaç Katlı?">
                      <input type="number" className="input" value={form.total_floors} onChange={(e) => update('total_floors', e.target.value)} placeholder="2" />
                    </Field>
                    <Field label="Tam Müstakil mi?">
                      <select className="input" value={form.is_detached} onChange={(e) => update('is_detached', e.target.value)}>
                        <option value="">Fark etmez</option>
                        <option value="evet">Evet</option>
                        <option value="hayir">Hayır</option>
                      </select>
                    </Field>
                    <Field label="Site İçinde mi?">
                      <select className="input" value={form.in_site} onChange={(e) => update('in_site', e.target.value)}>
                        <option value="">Fark etmez</option>
                        <option value="evet">Evet</option>
                        <option value="hayir">Hayır</option>
                      </select>
                    </Field>
                  </div>
                )}

                <Field label={t('lead_form.message')}>
                  <textarea
                    className="input min-h-[110px]"
                    value={form.message}
                    onChange={(e) => update('message', e.target.value)}
                    placeholder="Aradığınız mülkün özelliklerini detaylı yazın..."
                  />
                </Field>
                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {t('lead_form.submit_buyer')}
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
