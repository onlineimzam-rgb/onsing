'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Loader2, Scale, X } from 'lucide-react'
import { useCompare } from '@/lib/compare/CompareProvider'
import { useI18n } from '@/lib/i18n/I18nProvider'
import { formatPrice, formatNumber } from '@/lib/format'
import type { Property } from '@/lib/db'

type Row = { key: string; label: (locale: 'tr' | 'en') => string; value: (p: Property, locale: 'tr' | 'en') => string }

const ROWS: Row[] = [
  {
    key: 'type',
    label: (l) => (l === 'en' ? 'Type' : 'Tür'),
    value: (p) => `${p.type || '-'} · ${p.category || ''}`.trim(),
  },
  {
    key: 'price',
    label: (l) => (l === 'en' ? 'Price' : 'Fiyat'),
    value: (p, l) => formatPrice(p.price, p.currency, l),
  },
  {
    key: 'ppm2',
    label: () => 'm² Fiyatı',
    value: (p, l) => (p.price_per_m2 ? formatPrice(p.price_per_m2, p.currency, l) : '-'),
  },
  {
    key: 'district',
    label: (l) => (l === 'en' ? 'Location' : 'Konum'),
    value: (p) => [p.neighborhood, p.district, p.city].filter(Boolean).join(', '),
  },
  { key: 'bedrooms', label: () => 'Oda', value: (p, l) => (p.bedrooms != null ? formatNumber(p.bedrooms, l) : '-') },
  { key: 'bathrooms', label: () => 'Banyo', value: (p, l) => (p.bathrooms != null ? formatNumber(p.bathrooms, l) : '-') },
  {
    key: 'area_m2',
    label: () => 'Brüt m²',
    value: (p, l) => (p.area_m2 != null ? `${formatNumber(p.area_m2, l)} m²` : '-'),
  },
  {
    key: 'lot_m2',
    label: () => 'Arsa m²',
    value: (p, l) => (p.lot_m2 != null ? `${formatNumber(p.lot_m2, l)} m²` : '-'),
  },
  { key: 'floor', label: () => 'Kat', value: (p) => (p.floor != null ? String(p.floor) : '-') },
  { key: 'total_floors', label: () => 'Bina kat', value: (p) => (p.total_floors != null ? String(p.total_floors) : '-') },
  { key: 'heating', label: () => 'Isıtma', value: (p) => p.heating_type || '-' },
  { key: 'building_age', label: () => 'Bina yaşı', value: (p) => (p.building_age != null ? String(p.building_age) : '-') },
  { key: 'ada', label: () => 'Ada / Parsel', value: (p) => [p.ada_no, p.parsel_no].filter(Boolean).join(' / ') || '-' },
  { key: 'ref', label: () => 'Referans', value: (p) => p.reference_no || '-' },
]

export default function ComparePage() {
  const { locale } = useI18n()
  const { items, remove, clear } = useCompare()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (items.length === 0) {
      setProperties([])
      return
    }
    setLoading(true)
    const ids = items.map((x) => x.id).join(',')
    fetch(`/api/properties/?ids=${ids}&limit=10`)
      .then((r) => r.json())
      .then((d) => setProperties((d.properties as Property[]) || []))
      .catch(() => setProperties([]))
      .finally(() => setLoading(false))
  }, [items])

  return (
    <div className="pt-20 md:pt-24 pb-16 container-custom">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <Link
          href={`/${locale}/emlak/`}
          className="inline-flex items-center gap-2 text-navy-600 hover:text-gold-600 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {locale === 'en' ? 'Back to listings' : 'İlanlara dön'}
        </Link>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-navy-950 inline-flex items-center gap-2">
          <Scale className="w-6 h-6 text-gold-600" />
          {locale === 'en' ? 'Compare' : 'Karşılaştırma'}{' '}
          <span className="text-navy-400 text-base font-medium">({items.length})</span>
        </h1>
        {items.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="text-sm text-navy-700 hover:text-red-600 inline-flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            {locale === 'en' ? 'Clear all' : 'Hepsini temizle'}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-navy-600 mb-4">
            {locale === 'en'
              ? 'Add at least 2 listings to compare side by side.'
              : 'Karşılaştırmak için ilan listelerinden en az 2 ilan ekleyin.'}
          </p>
          <Link href={`/${locale}/emlak/`} className="btn-primary inline-flex items-center gap-1">
            {locale === 'en' ? 'Browse listings' : 'İlanları gez'}
          </Link>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-gold-500" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="text-left text-xs uppercase tracking-wider text-navy-500 font-semibold sticky left-0 bg-white z-10 p-3 w-40">
                  &nbsp;
                </th>
                {properties.map((p) => (
                  <th key={p.id} className="p-3 align-top min-w-[260px]">
                    <div className="card overflow-hidden">
                      <Link href={`/${locale}/emlak/${p.slug}/`} className="block relative aspect-[4/3] bg-navy-100">
                        {p.cover_image ? (
                          <Image src={p.cover_image} alt={p.title_tr || ''} fill className="object-cover" />
                        ) : null}
                      </Link>
                      <div className="p-3">
                        <h3 className="font-display text-sm md:text-base font-bold text-navy-950 mb-1 line-clamp-2">
                          {(locale === 'en' && p.title_en) || p.title_tr}
                        </h3>
                        <button
                          type="button"
                          onClick={() => remove(p.id)}
                          className="text-[11px] inline-flex items-center gap-1 text-red-700 hover:text-red-800"
                        >
                          <X className="w-3 h-3" />
                          {locale === 'en' ? 'Remove' : 'Kaldır'}
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, ri) => (
                <tr key={row.key} className={ri % 2 === 0 ? 'bg-navy-50/40' : ''}>
                  <td className="text-xs uppercase tracking-wider text-navy-500 font-semibold sticky left-0 bg-inherit p-3">
                    {row.label(locale)}
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-3 text-navy-900 font-medium">
                      {row.value(p, locale)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
