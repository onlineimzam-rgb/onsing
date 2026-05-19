'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, MapPin, Bed, Bath, Maximize, Calendar, Home,
  Layers, Flame, Tag, Phone, MessageCircle, Mail, Loader2,
  Camera, Hash, ShieldCheck, ChevronRight, FileText, CalendarCheck,
} from 'lucide-react'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { useI18n } from '@/lib/i18n/I18nProvider'
import { formatPrice, formatPriceParts, formatNumber } from '@/lib/format'
import { SITE_CONFIG } from '@/lib/config'
import type { Property, PropertyImage } from '@/lib/db'
import PropertyCard from './PropertyCard'
import CompareButton from './CompareButton'
import BookingModal from './BookingModal'

interface DetailData {
  property: Property
  images: PropertyImage[]
  similar: Partial<Property>[]
}

type DescriptionGroup = {
  title: string
  items: string[]
}

const DETAIL_ITEM_LIMIT = 12

const DESCRIPTION_GROUP_TITLES = new Map<string, string>([
  ['cephe', 'Cephe'],
  ['ic ozellikler', 'İç Özellikler'],
  ['iç özellikler', 'İç Özellikler'],
  ['dis ozellikler', 'Dış Özellikler'],
  ['dış özellikler', 'Dış Özellikler'],
  ['muhit', 'Muhit'],
  ['ulasim', 'Ulaşım'],
  ['ulaşım', 'Ulaşım'],
  ['manzara', 'Manzara'],
  ['konut tipi', 'Konut Tipi'],
  ['engelliye uygun', 'Engelliye Uygun'],
  ['tapu durumu', 'Tapu Durumu'],
  ['site özellikleri', 'Site Özellikleri'],
])

function normalizeHeading(s: string) {
  return s
    .toLocaleLowerCase('tr-TR')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseDescription(raw?: string | null): { summary: string[]; groups: DescriptionGroup[] } {
  if (!raw) return { summary: [], groups: [] }

  const lines = raw
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const summary: string[] = []
  const groups: DescriptionGroup[] = []
  let current: DescriptionGroup | null = null

  for (const line of lines) {
    const normalized = normalizeHeading(line)
    const heading = DESCRIPTION_GROUP_TITLES.get(normalized)

    if (heading) {
      current = { title: heading, items: [] }
      groups.push(current)
      continue
    }

    // Sahibinden'den gelen ilanlarda özellik blokları çoğu zaman sadece başlık +
    // alt alta değer şeklindedir; bunları uzun açıklama içinde bırakmak yerine
    // ayrı gruplara taşıyoruz.
    if (current) {
      current.items.push(line.replace(/^[-•*]\s*/, ''))
    } else {
      summary.push(line)
    }
  }

  const filteredGroups = groups
    .map((group) => {
      const seen = new Set<string>()
      const items = group.items
        .map((item) => item.replace(/^[-•*]\s*/, '').trim())
        .filter((item) => {
          if (!item || item.length > 48) return false
          if (/^(var|yok)$/i.test(item)) return false
          const normalized = normalizeHeading(item)
          if (!normalized || seen.has(normalized)) return false
          seen.add(normalized)
          return true
        })
        .slice(0, DETAIL_ITEM_LIMIT)
      return { ...group, items }
    })
    .filter((g) => g.items.length > 0)

  return {
    summary: summary.slice(0, 8),
    groups: filteredGroups,
  }
}

function compactDescriptionText(lines: string[]) {
  if (lines.length === 0) return ''
  return lines.join('\n\n')
}

export default function PropertyDetailPage({ slug }: { slug: string }) {
  const { t, locale } = useI18n()
  const [data, setData] = useState<DetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState(0)
  const [bookingOpen, setBookingOpen] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/properties/${slug}/`)
      .then(async (r) => {
        if (!r.ok) throw new Error('not-found')
        return r.json()
      })
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="pt-32 pb-20 container-custom flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
      </div>
    )
  }
  if (error || !data) {
    return (
      <div className="pt-32 pb-20 container-custom text-center">
        <p className="text-navy-600 mb-4">{t('property.no_results')}</p>
        <Link href={`/${locale}/emlak/`} className="btn-primary">
          <ArrowLeft className="w-4 h-4" />
          {t('property.back_to_list')}
        </Link>
      </div>
    )
  }

  const { property, images, similar } = data
  const title = locale === 'en' && property.title_en ? property.title_en : property.title_tr
  const description =
    locale === 'en' && property.description_en
      ? property.description_en
      : property.description_tr
  const location = [property.neighborhood, property.district, property.city]
    .filter(Boolean)
    .join(', ')
  const slides = images.map((img) => ({
    src: img.url,
    alt: img.alt_text || title,
  }))

  const features = property.features || []
  const parsedDescription = parseDescription(description)
  const summaryText = compactDescriptionText(parsedDescription.summary)
  const isLand = ['arsa', 'tarla', 'bag-bahce'].includes(property.category)
  const primaryArea = isLand
    ? property.lot_m2 ?? property.area_m2
    : property.area_m2 ?? property.lot_m2
  const propertyExtras = property as Property & {
    is_detached?: boolean | null
    in_site?: boolean | null
    land_status?: string | null
  }

  return (
    <div className="pt-20 md:pt-24 pb-16 bg-gradient-to-b from-white via-navy-50/40 to-white">
      <div className="container-custom">
        {/* Back link */}
        <Link
          href={`/${locale}/emlak/`}
          className="inline-flex items-center gap-2 text-navy-600 hover:text-gold-600 text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('property.back_to_list')}
        </Link>

        {/* Title & badges */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
          <div className="lg:col-span-8 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="bg-gold-gradient text-navy-950 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                {t(`property_type.${property.type}` as any)}
              </span>
              <span className="bg-navy-100 text-navy-800 text-xs font-semibold px-3 py-1 rounded-full">
                {t(`property_category.${property.category}` as any)}
              </span>
              {property.is_featured && (
                <span className="bg-navy-950 text-gold-400 text-xs font-bold px-3 py-1 rounded-full border border-gold-500/40">
                  ★ {locale === 'en' ? 'Featured' : 'Öne Çıkan'}
                </span>
              )}
            </div>
            <h1 className="font-display text-2xl md:text-4xl font-bold text-navy-950 mb-2">
              {title}
            </h1>
            {location && (
              <div className="flex items-center gap-1.5 text-sm text-navy-600">
                <MapPin className="w-4 h-4 text-gold-500" />
                {location}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 card p-4 md:p-5 bg-white/95 border-gold-200">
            <div className="text-xs uppercase tracking-wider text-navy-500 font-semibold mb-1">
              {locale === 'en' ? 'Sale Price' : 'İlan Fiyatı'}
            </div>
            <div className="font-display leading-none text-navy-950">
              {(() => {
                const p = formatPriceParts(property.price, property.currency, locale)
                if (!p.available) return <span className="text-3xl md:text-4xl font-bold">{formatPrice(property.price, property.currency, locale)}</span>
                return (
                  <span className="flex items-baseline gap-2 tracking-tight">
                    <span className="text-3xl md:text-4xl font-bold tabular-nums">{p.amount}</span>
                    <span className="text-xl md:text-2xl font-semibold text-gold-600">{p.suffix}</span>
                  </span>
                )
              })()}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-navy-50 rounded-xl p-3">
                <div className="text-navy-500 mb-1 inline-flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  {t('property.ref')}
                </div>
                <div className="font-mono font-bold text-navy-950">{property.reference_no}</div>
              </div>
              {property.price_per_m2 ? (
                <div className="bg-navy-50 rounded-xl p-3">
                  <div className="text-navy-500 mb-1">m² Fiyatı</div>
                  <div className="font-bold text-navy-950">
                    {formatPrice(property.price_per_m2, property.currency, locale)}
                  </div>
                </div>
              ) : (
                <div className="bg-navy-50 rounded-xl p-3">
                  <div className="text-navy-500 mb-1">Durum</div>
                  <div className="font-bold text-navy-950">{property.status}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gallery */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 mb-8">
          {slides.length > 0 ? (
            <>
              <button
                onClick={() => {
                  setLightboxIdx(0)
                  setLightboxOpen(true)
                }}
                className="lg:col-span-7 aspect-[4/3] md:aspect-[3/2] relative bg-navy-100 hover:opacity-95 rounded-3xl overflow-hidden shadow-xl"
              >
                <Image
                  src={slides[0].src}
                  alt={slides[0].alt || ''}
                  fill
                  sizes="(max-width: 768px) 100vw, 58vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute left-4 bottom-4 bg-navy-950/75 backdrop-blur-sm text-white rounded-full px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-gold-400" />
                  {slides.length} fotoğraf
                </div>
              </button>
              <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3">
                {slides.slice(1, 5).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setLightboxIdx(i + 1)
                      setLightboxOpen(true)
                    }}
                    className="relative aspect-square lg:aspect-[4/3] bg-navy-100 hover:opacity-95 group rounded-2xl overflow-hidden shadow-sm"
                  >
                    <Image
                      src={s.src}
                      alt={s.alt || ''}
                      fill
                      sizes="20vw"
                      className="object-cover"
                    />
                    {i === 3 && slides.length > 5 && (
                      <div className="absolute inset-0 bg-navy-950/75 backdrop-blur-[1px] flex flex-col items-center justify-center text-white font-bold text-lg">
                        <Camera className="w-6 h-6 text-gold-300 mb-1" />
                        +{slides.length - 5}
                      </div>
                    )}
                  </button>
                ))}
                {slides.length === 1 && (
                  <button
                    onClick={() => setLightboxOpen(true)}
                    className="hidden lg:flex col-span-2 aspect-[2/1] rounded-2xl bg-navy-100 items-center justify-center text-navy-500 text-sm"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Galeriyi Aç
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="lg:col-span-12 aspect-[16/9] rounded-3xl bg-gradient-to-br from-navy-200 to-navy-100 flex items-center justify-center">
              <Tag className="w-16 h-16 text-navy-400" />
            </div>
          )}
        </div>

        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={slides}
          index={lightboxIdx}
          on={{ view: ({ index }) => setLightboxIdx(index) }}
        />

        <BookingModal
          open={bookingOpen}
          onClose={() => setBookingOpen(false)}
          property={{
            id: property.id,
            title,
            reference_no: property.reference_no,
            district: property.district,
            category: property.category,
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Quick stats */}
            <div className="card p-5 md:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {property.bedrooms != null && (
                  <Stat icon={Bed} label={t('property.rooms')} value={formatNumber(property.bedrooms, locale)} />
                )}
                {property.bathrooms != null && (
                  <Stat icon={Bath} label={t('property.bathrooms')} value={formatNumber(property.bathrooms, locale)} />
                )}
                {property.area_m2 != null && (
                  <Stat icon={Maximize} label={t('property.area')} value={`${formatNumber(property.area_m2, locale)} m²`} />
                )}
                {property.lot_m2 != null && (
                  <Stat icon={Maximize} label={t('property.lot_area')} value={`${formatNumber(property.lot_m2, locale)} m²`} />
                )}
                {property.floor != null && (
                  <Stat icon={Layers} label="Bulunduğu Kat" value={`${property.floor}`} />
                )}
                {property.total_floors != null && (
                  <Stat icon={Home} label="Kat Sayısı" value={`${property.total_floors}`} />
                )}
                {property.building_age != null && (
                  <Stat icon={Calendar} label={t('property.building_age')} value={`${property.building_age}`} />
                )}
                {property.heating_type && (
                  <Stat icon={Flame} label={t('property.heating')} value={property.heating_type} />
                )}
                {propertyExtras.is_detached != null && (
                  <Stat icon={Home} label="Müstakil" value={propertyExtras.is_detached ? 'Evet' : 'Hayır'} />
                )}
                {propertyExtras.in_site != null && (
                  <Stat icon={ShieldCheck} label="Site İçinde" value={propertyExtras.in_site ? 'Evet' : 'Hayır'} />
                )}
                {propertyExtras.land_status && (
                  <Stat icon={FileText} label="Arsa Niteliği" value={propertyExtras.land_status} />
                )}
              </div>
            </div>

            {/* Admin selected features */}
            {features.length > 0 && (
              <div className="card p-5 md:p-6 border-gold-200 bg-gradient-to-br from-white to-gold-50/40">
                <h2 className="font-display text-xl md:text-2xl font-bold text-navy-950 mb-3 inline-flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-gold-500" />
                  Öne Çıkan Detaylar
                </h2>
                <div className="flex flex-wrap gap-2">
                  {features.map((f) => (
                    <span
                      key={f}
                      className="text-xs md:text-sm bg-white text-navy-800 px-3 py-1.5 rounded-full border border-gold-200 shadow-sm"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {(summaryText || parsedDescription.groups.length > 0) && (
              <div className="card p-5 md:p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="font-display text-xl md:text-2xl font-bold text-navy-950 inline-flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gold-500" />
                    {t('property.description')}
                  </h2>
                </div>

                {summaryText && (
                  <div className="prose prose-sm max-w-none text-navy-700 leading-relaxed whitespace-pre-line">
                    {summaryText}
                  </div>
                )}

                {parsedDescription.groups.length > 0 && (
                  <div className={`${summaryText ? 'mt-5 pt-5 border-t border-navy-100' : ''}`}>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-navy-500 mb-3">
                      Açıklamadan Gelen Ek Detaylar
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {parsedDescription.groups.slice(0, 8).map((group) => (
                        <details
                          key={group.title}
                          open={group.items.length <= 6}
                          className="group bg-navy-50/70 border border-navy-100 rounded-xl p-3"
                        >
                          <summary className="cursor-pointer list-none flex items-center justify-between gap-2 font-semibold text-navy-900">
                            <span>{group.title}</span>
                            <ChevronRight className="w-4 h-4 text-navy-400 transition-transform group-open:rotate-90" />
                          </summary>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {group.items.map((item) => (
                              <span
                                key={item}
                                className="text-xs bg-white border border-navy-100 text-navy-700 rounded-full px-2.5 py-1"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tapu / Kadastro — özellikle arsa & tarla için */}
            {(property.ada_no || property.parsel_no || property.pafta_no) && (
              <div className="card p-5 md:p-6">
                <h2 className="font-display text-xl md:text-2xl font-bold text-navy-950 mb-3">
                  {locale === 'en' ? 'Cadastral Information' : 'Tapu / Kadastro Bilgileri'}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {property.ada_no && (
                    <div className="bg-navy-50/60 rounded-lg p-3">
                      <div className="text-xs uppercase tracking-wider text-navy-500 mb-1">
                        {locale === 'en' ? 'Block (Ada)' : 'Ada'}
                      </div>
                      <div className="font-mono font-bold text-navy-950">{property.ada_no}</div>
                    </div>
                  )}
                  {property.parsel_no && (
                    <div className="bg-navy-50/60 rounded-lg p-3">
                      <div className="text-xs uppercase tracking-wider text-navy-500 mb-1">
                        {locale === 'en' ? 'Parcel (Parsel)' : 'Parsel'}
                      </div>
                      <div className="font-mono font-bold text-navy-950">{property.parsel_no}</div>
                    </div>
                  )}
                  {property.pafta_no && (
                    <div className="bg-navy-50/60 rounded-lg p-3">
                      <div className="text-xs uppercase tracking-wider text-navy-500 mb-1">
                        {locale === 'en' ? 'Sheet (Pafta)' : 'Pafta'}
                      </div>
                      <div className="font-mono font-bold text-navy-950">{property.pafta_no}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Map */}
            {property.lat && property.lng && (
              <div className="card overflow-hidden">
                <div className="p-5 pb-0">
                  <h2 className="font-display text-xl md:text-2xl font-bold text-navy-950 mb-3">
                    {t('property.location')}
                  </h2>
                </div>
                <iframe
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${property.lat},${property.lng}&zoom=15`}
                  width="100%"
                  height="380"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={title}
                />
              </div>
            )}
          </div>

          {/* Contact card sidebar */}
          <div className="lg:sticky lg:top-24 self-start space-y-4">
            <div className="card p-5 bg-navy-gradient text-white overflow-hidden relative">
              <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-gold-400/15" />
              <div className="text-xs uppercase tracking-wider text-gold-300 font-semibold mb-1">
                Hızlı Özet
              </div>
              <div className="font-display mb-3">
                {(() => {
                  const p = formatPriceParts(property.price, property.currency, locale)
                  if (!p.available) return <span className="text-2xl font-bold">{formatPrice(property.price, property.currency, locale)}</span>
                  return (
                    <span className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold tabular-nums">{p.amount}</span>
                      <span className="text-lg font-semibold text-gold-300">{p.suffix}</span>
                    </span>
                  )
                })()}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/10 rounded-xl p-3">
                  <div className="text-navy-200 mb-1">Referans</div>
                  <div className="font-mono font-bold">{property.reference_no}</div>
                </div>
                {primaryArea != null && (
                  <div className="bg-white/10 rounded-xl p-3">
                    <div className="text-navy-200 mb-1">Alan</div>
                    <div className="font-bold">{formatNumber(primaryArea, locale)} m²</div>
                  </div>
                )}
              </div>
            </div>
            <div className="card p-5">
              <h3 className="font-display text-lg font-bold text-navy-950 mb-3">
                {t('property.contact_agent')}
              </h3>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setBookingOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gold-gradient text-navy-950 font-bold py-3 px-4 rounded-xl shadow-md hover:brightness-105 transition"
                >
                  <CalendarCheck className="w-4 h-4" />
                  {locale === 'en' ? 'Schedule a viewing' : 'Yer Gösterme Randevusu'}
                </button>
                <a
                  href={`tel:${SITE_CONFIG.phoneRaw}`}
                  className="w-full inline-flex items-center justify-center gap-2 bg-navy-950 hover:bg-navy-900 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {SITE_CONFIG.phoneDisplay}
                </a>
                <a
                  href={`https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(
                    `Merhaba, ${SITE_CONFIG.url}/tr/emlak/${property.slug}/ — “${title}” (${property.reference_no}) ilanı için bilgi ve yer gösterme randevusu rica ediyorum.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#22c75d] text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
                <a
                  href={`mailto:${SITE_CONFIG.email}?subject=${encodeURIComponent(
                    `${property.reference_no} - ${title}`
                  )}`}
                  className="w-full inline-flex items-center justify-center gap-2 bg-white border-2 border-navy-200 hover:border-gold-400 text-navy-800 font-semibold py-3 px-4 rounded-xl transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {t('contact.email')}
                </a>
                <div className="pt-1">
                  <CompareButton
                    id={property.id}
                    slug={property.slug}
                    title={title}
                    cover={property.cover_image}
                    size="lg"
                  />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-navy-100 text-xs text-navy-500 space-y-1">
                <div>{SITE_CONFIG.name}</div>
                <div>{SITE_CONFIG.address.full}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar */}
        {similar.length > 0 && (
          <section className="mt-12 md:mt-16">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-navy-950 mb-5">
              {t('property.similar')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {similar.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: any
  label: string
  value: string
}) {
  return (
    <div className="text-center sm:text-left">
      <div className="flex items-center justify-center sm:justify-start gap-1.5 text-navy-500 text-xs uppercase tracking-wider mb-1">
        <Icon className="w-3.5 h-3.5" />
        <span>{label}</span>
      </div>
      <div className="font-display text-base md:text-lg font-bold text-navy-950">{value}</div>
    </div>
  )
}
