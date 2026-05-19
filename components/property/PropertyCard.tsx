'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Bed, Bath, Maximize, Tag } from 'lucide-react'
import { useI18n } from '@/lib/i18n/I18nProvider'
import { formatPriceParts, formatNumber } from '@/lib/format'
import type { Property } from '@/lib/db'
import CompareButton from './CompareButton'

const ARSA_KATEGORILERI = new Set(['arsa', 'tarla', 'bag-bahce'])

export default function PropertyCard({ property }: { property: Partial<Property> }) {
  const { t, locale } = useI18n()
  const title = locale === 'en' && property.title_en ? property.title_en : property.title_tr
  const location = [property.neighborhood, property.district].filter(Boolean).join(', ')
  const isArsa = ARSA_KATEGORILERI.has(property.category || '')

  // Birleşik etiket: "SATILIK ARSA", "SATILIK DAİRE", "KİRALIK VİLLA" vb.
  const typeLabel = property.type ? (t(`property_type.${property.type}` as any) as string) : ''
  const catLabel = property.category ? (t(`property_category.${property.category}` as any) as string) : ''
  const combinedLabel = [typeLabel, catLabel].filter(Boolean).join(' ').trim()

  return (
    <Link
      href={`/${locale}/emlak/${property.slug}/`}
      className="card group overflow-hidden flex flex-col hover:shadow-2xl hover:-translate-y-1 transition-all"
    >
      <div className="relative aspect-[4/3] bg-navy-100 overflow-hidden">
        {property.cover_image ? (
          <Image
            src={property.cover_image}
            alt={title || 'Property'}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-navy-100 to-navy-200">
            <Tag className="w-12 h-12 text-navy-400" />
          </div>
        )}

        {/* type + category birleşik badge */}
        <span className="absolute top-3 left-3 bg-gold-gradient text-navy-950 text-[11px] md:text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md max-w-[80%] truncate">
          {combinedLabel || typeLabel}
        </span>

        {property.is_featured && (
          <span className="absolute top-3 right-3 bg-navy-950 text-gold-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-gold-500/40">
            ★ {locale === 'en' ? 'Featured' : 'Öne Çıkan'}
          </span>
        )}

        {/* Karşılaştırma toggle */}
        <div className={`absolute ${property.is_featured ? 'top-12' : 'top-3'} right-3 z-10`}>
          <CompareButton
            id={property.id as number}
            slug={property.slug as string}
            title={(locale === 'en' && property.title_en) || property.title_tr || ''}
            cover={property.cover_image || null}
          />
        </div>

        {/* price overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-navy-950/95 via-navy-950/70 to-transparent">
          {(() => {
            const parts = formatPriceParts(
              property.price as number,
              property.currency as any,
              locale
            )
            if (!parts.available) {
              return (
                <div className="font-display text-xl md:text-2xl font-bold text-white tracking-wide">
                  {locale === 'en' ? 'Price on request' : 'Fiyat sorunuz'}
                </div>
              )
            }
            return (
              <div className="font-display text-white tracking-wide flex items-baseline gap-1.5">
                <span className="text-xl md:text-2xl font-bold tabular-nums">{parts.amount}</span>
                <span className="text-sm md:text-base font-semibold text-gold-300">{parts.suffix}</span>
              </div>
            )
          })()}
          {property.reference_no && (
            <div className="text-[10px] text-white/70 uppercase tracking-wider mt-0.5">
              {t('property.ref')}: {property.reference_no}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-display text-base md:text-lg font-bold text-navy-950 mb-1 line-clamp-2 group-hover:text-gold-700 transition-colors">
          {title}
        </h3>
        {location && (
          <div className="flex items-center gap-1.5 text-xs text-navy-600 mb-3">
            <MapPin className="w-3.5 h-3.5 text-gold-500" />
            <span className="truncate">{location}</span>
          </div>
        )}
        <div className="mt-auto pt-3 border-t border-navy-100 flex flex-wrap items-center gap-3 text-xs text-navy-700">
          {!isArsa && property.bedrooms != null && (
            <span className="inline-flex items-center gap-1">
              <Bed className="w-3.5 h-3.5 text-navy-500" />
              {formatNumber(property.bedrooms, locale)}
            </span>
          )}
          {!isArsa && property.bathrooms != null && (
            <span className="inline-flex items-center gap-1">
              <Bath className="w-3.5 h-3.5 text-navy-500" />
              {formatNumber(property.bathrooms, locale)}
            </span>
          )}
          {/* Konutlarda area_m2, arsalarda lot_m2 öncelikli; eski kayıtlarda fallback */}
          {(() => {
            const m2 = isArsa
              ? property.lot_m2 ?? property.area_m2
              : property.area_m2 ?? property.lot_m2
            return m2 != null ? (
              <span className="inline-flex items-center gap-1">
                <Maximize className="w-3.5 h-3.5 text-navy-500" />
                {formatNumber(m2 as number, locale)} m²
              </span>
            ) : null
          })()}
          {isArsa && property.ada_no && property.parsel_no && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-gold-50 border border-gold-200 text-gold-800 px-1.5 py-0.5 rounded">
              {property.ada_no}/{property.parsel_no}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
