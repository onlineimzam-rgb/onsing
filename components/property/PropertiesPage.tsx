'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Filter, X, Loader2, ArrowRight } from 'lucide-react'
import { useI18n } from '@/lib/i18n/I18nProvider'
import PropertyCard from './PropertyCard'
import type { Property } from '@/lib/db'

// Hızlı kategori chip'leri (en sık aranan kombinasyonlar)
const QUICK_FILTERS: Array<{ type: string; category: string; label: string; emoji: string }> = [
  { type: 'satilik', category: 'daire', label: 'Satılık Daire', emoji: '🏢' },
  { type: 'satilik', category: 'villa', label: 'Satılık Villa', emoji: '🏡' },
  { type: 'satilik', category: 'mustakil-ev', label: 'Müstakil Ev', emoji: '🏠' },
  { type: 'satilik', category: 'arsa', label: 'Satılık Arsa', emoji: '🌳' },
  { type: 'satilik', category: 'tarla', label: 'Satılık Tarla', emoji: '🌾' },
  { type: 'kiralik', category: 'daire', label: 'Kiralık Daire', emoji: '🔑' },
  { type: 'gunluk-kiralik', category: '', label: 'Günlük Kiralık', emoji: '🏖️' },
]

// Gruplandırma sırası (kategoriye göre)
const GROUP_ORDER = [
  ['satilik', 'daire'], ['satilik', 'villa'], ['satilik', 'mustakil-ev'],
  ['satilik', 'yazlik'], ['satilik', 'arsa'], ['satilik', 'tarla'],
  ['satilik', 'bag-bahce'], ['satilik', 'is-yeri'], ['satilik', 'ofis'],
  ['satilik', 'dukkan'], ['satilik', 'rezidans'], ['satilik', 'turistik-tesis'],
  ['kiralik', 'daire'], ['kiralik', 'villa'], ['kiralik', 'is-yeri'],
  ['kiralik', 'ofis'], ['kiralik', 'dukkan'],
  ['gunluk-kiralik', 'daire'], ['gunluk-kiralik', 'villa'], ['gunluk-kiralik', 'yazlik'],
] as const

interface Filters {
  type: string
  category: string
  district: string
  q: string
  min_price: string
  max_price: string
  min_area: string
  max_area: string
  min_lot: string
  max_lot: string
  bedrooms: string
  ada_no: string
  parsel_no: string
  sort: string
}

const DEFAULT_FILTERS: Filters = {
  type: '',
  category: '',
  district: '',
  q: '',
  min_price: '',
  max_price: '',
  min_area: '',
  max_area: '',
  min_lot: '',
  max_lot: '',
  bedrooms: '',
  ada_no: '',
  parsel_no: '',
  sort: '',
}

const SORT_OPTIONS = [
  { value: '', label: 'Önerilen' },
  { value: 'newest', label: 'En yeni' },
  { value: 'price_asc', label: 'Fiyat (artan)' },
  { value: 'price_desc', label: 'Fiyat (azalan)' },
  { value: 'area_desc', label: 'm² (büyük → küçük)' },
  { value: 'area_asc', label: 'm² (küçük → büyük)' },
]

const BEDROOM_OPTIONS = ['1', '2', '3', '4', '5+']

const DISTRICTS = ['Çandarlı', 'Dikili', 'Bademli', 'İzmir']

export default function PropertiesPage() {
  const { t, locale } = useI18n()
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [properties, setProperties] = useState<Partial<Property>[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    setFilters({
      type: params.get('type') || '',
      category: params.get('category') || '',
      district: params.get('district') || '',
      q: params.get('q') || '',
      min_price: params.get('min_price') || '',
      max_price: params.get('max_price') || '',
      min_area: params.get('min_area') || '',
      max_area: params.get('max_area') || '',
      min_lot: params.get('min_lot') || '',
      max_lot: params.get('max_lot') || '',
      bedrooms: params.get('bedrooms') || '',
      ada_no: params.get('ada_no') || '',
      parsel_no: params.get('parsel_no') || '',
      sort: params.get('sort') || '',
    })
  }, [])

  const queryString = useMemo(() => {
    const sp = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => {
      if (v) sp.set(k, v)
    })
    return sp.toString()
  }, [filters])

  // URL'i tarayıcıda güncelle (paylaşılabilir link)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const newUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ''}`
    window.history.replaceState(null, '', newUrl)
  }, [queryString])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    fetch(`/api/properties/?${queryString}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setProperties(data.properties || [])
        setTotal(data.total || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [queryString])

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => setFilters(DEFAULT_FILTERS)

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  // Hiçbir filtre yokken kategoriye göre gruplandır
  const grouped = useMemo(() => {
    if (activeFilterCount > 0) return null
    const groups = new Map<string, { type: string; category: string; items: Partial<Property>[] }>()
    for (const p of properties) {
      const tp = p.type || ''
      const cat = p.category || ''
      const key = `${tp}|${cat}`
      if (!groups.has(key)) groups.set(key, { type: tp, category: cat, items: [] })
      groups.get(key)!.items.push(p)
    }
    // Sıralama: GROUP_ORDER'a göre, listede olmayanlar sona
    const ordered: Array<{ type: string; category: string; items: Partial<Property>[] }> = []
    for (const [t, c] of GROUP_ORDER) {
      const k = `${t}|${c}`
      if (groups.has(k)) {
        ordered.push(groups.get(k)!)
        groups.delete(k)
      }
    }
    for (const g of groups.values()) ordered.push(g)
    return ordered.filter((g) => g.items.length > 0)
  }, [properties, activeFilterCount])

  const setQuickFilter = (type: string, category: string) => {
    setFilters((prev) => ({ ...prev, type, category }))
  }

  const isQuickActive = (type: string, category: string) =>
    filters.type === type && filters.category === category

  return (
    <div className="pt-20 md:pt-24 pb-16 bg-navy-50/30 min-h-screen">
      {/* Header */}
      <div className="bg-navy-gradient text-white py-10 md:py-14 mb-6 md:mb-8">
        <div className="container-custom">
          <p className="text-gold-400 uppercase tracking-[0.25em] text-xs md:text-sm font-semibold mb-2">
            {t('nav.properties')}
          </p>
          <h1 className="font-display text-3xl md:text-5xl font-bold">
            {t('hero.title_pre')} {t('hero.title_highlight')}
          </h1>
        </div>
      </div>

      <div className="container-custom">
        {/* Hızlı kategori chip'leri */}
        <div className="mb-4 -mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 min-w-max">
            <button
              onClick={clearFilters}
              className={`whitespace-nowrap inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all ${
                activeFilterCount === 0
                  ? 'bg-navy-950 text-gold-400 shadow-md'
                  : 'bg-white border border-navy-200 text-navy-700 hover:border-gold-400'
              }`}
            >
              <span>{locale === 'en' ? 'All' : 'Tümü'}</span>
            </button>
            {QUICK_FILTERS.map((q) => {
              const active = isQuickActive(q.type, q.category)
              return (
                <button
                  key={`${q.type}-${q.category}`}
                  onClick={() => setQuickFilter(q.type, q.category)}
                  className={`whitespace-nowrap inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all ${
                    active
                      ? 'bg-gold-gradient text-navy-950 shadow-md'
                      : 'bg-white border border-navy-200 text-navy-700 hover:border-gold-400'
                  }`}
                >
                  <span>{q.emoji}</span>
                  <span>{q.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Search & filter bar */}
        <div className="card p-3 md:p-4 mb-6 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 sticky top-20 z-30 bg-white/95 backdrop-blur-md">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
            <input
              value={filters.q}
              onChange={(e) => updateFilter('q', e.target.value)}
              placeholder={t('hero.search_placeholder')}
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-navy-200 text-sm bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-200 outline-none"
            />
          </div>
          <select
            value={filters.type}
            onChange={(e) => updateFilter('type', e.target.value)}
            className="md:col-span-2 px-3 py-2.5 rounded-xl border border-navy-200 text-sm bg-white"
          >
            <option value="">{t('hero.filter_type')}</option>
            <option value="satilik">{t('property_type.satilik')}</option>
            <option value="kiralik">{t('property_type.kiralik')}</option>
            <option value="gunluk-kiralik">{t('property_type.gunluk-kiralik')}</option>
          </select>
          <select
            value={filters.category}
            onChange={(e) => updateFilter('category', e.target.value)}
            className="md:col-span-2 px-3 py-2.5 rounded-xl border border-navy-200 text-sm bg-white"
          >
            <option value="">{t('hero.filter_category')}</option>
            {[
              'daire', 'villa', 'mustakil-ev', 'yazlik', 'rezidans',
              'is-yeri', 'ofis', 'dukkan', 'arsa', 'tarla', 'bag-bahce', 'turistik-tesis',
            ].map((c) => (
              <option key={c} value={c}>
                {t(`property_category.${c}` as any)}
              </option>
            ))}
          </select>
          <select
            value={filters.district}
            onChange={(e) => updateFilter('district', e.target.value)}
            className="md:col-span-2 px-3 py-2.5 rounded-xl border border-navy-200 text-sm bg-white"
          >
            <option value="">{t('hero.filter_district')}</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowFilters((v) => !v)}
            className="md:col-span-1 inline-flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl border border-navy-200 bg-white text-navy-700 hover:bg-navy-50 text-sm font-medium relative"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden md:inline">{t('common.filter')}</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gold-500 text-navy-950 text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {showFilters && (
            <div className="md:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-2 pt-3 border-t border-navy-100 mt-1">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-navy-500 font-semibold">
                  {t('lead_form.budget_min')}
                </label>
                <input
                  type="number"
                  placeholder="₺"
                  value={filters.min_price}
                  onChange={(e) => updateFilter('min_price', e.target.value)}
                  className="w-full mt-0.5 px-3 py-2 rounded-lg border border-navy-200 text-sm bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-navy-500 font-semibold">
                  {t('lead_form.budget_max')}
                </label>
                <input
                  type="number"
                  placeholder="₺"
                  value={filters.max_price}
                  onChange={(e) => updateFilter('max_price', e.target.value)}
                  className="w-full mt-0.5 px-3 py-2 rounded-lg border border-navy-200 text-sm bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-navy-500 font-semibold">
                  m² (min)
                </label>
                <input
                  type="number"
                  placeholder="m²"
                  value={filters.min_area}
                  onChange={(e) => updateFilter('min_area', e.target.value)}
                  className="w-full mt-0.5 px-3 py-2 rounded-lg border border-navy-200 text-sm bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-navy-500 font-semibold">
                  m² (max)
                </label>
                <input
                  type="number"
                  placeholder="m²"
                  value={filters.max_area}
                  onChange={(e) => updateFilter('max_area', e.target.value)}
                  className="w-full mt-0.5 px-3 py-2 rounded-lg border border-navy-200 text-sm bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-navy-500 font-semibold">
                  Arsa m² (min)
                </label>
                <input
                  type="number"
                  placeholder="m²"
                  value={filters.min_lot}
                  onChange={(e) => updateFilter('min_lot', e.target.value)}
                  className="w-full mt-0.5 px-3 py-2 rounded-lg border border-navy-200 text-sm bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-navy-500 font-semibold">
                  Arsa m² (max)
                </label>
                <input
                  type="number"
                  placeholder="m²"
                  value={filters.max_lot}
                  onChange={(e) => updateFilter('max_lot', e.target.value)}
                  className="w-full mt-0.5 px-3 py-2 rounded-lg border border-navy-200 text-sm bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-navy-500 font-semibold">
                  Oda
                </label>
                <select
                  value={filters.bedrooms}
                  onChange={(e) => updateFilter('bedrooms', e.target.value)}
                  className="w-full mt-0.5 px-3 py-2 rounded-lg border border-navy-200 text-sm bg-white"
                >
                  <option value="">Tümü</option>
                  {BEDROOM_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b}+ oda
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-navy-500 font-semibold">
                  Sıralama
                </label>
                <select
                  value={filters.sort}
                  onChange={(e) => updateFilter('sort', e.target.value)}
                  className="w-full mt-0.5 px-3 py-2 rounded-lg border border-navy-200 text-sm bg-white"
                >
                  {SORT_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-navy-500 font-semibold">
                  Ada no
                </label>
                <input
                  placeholder="örn: 123"
                  value={filters.ada_no}
                  onChange={(e) => updateFilter('ada_no', e.target.value)}
                  className="w-full mt-0.5 px-3 py-2 rounded-lg border border-navy-200 text-sm bg-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-navy-500 font-semibold">
                  Parsel no
                </label>
                <input
                  placeholder="örn: 45"
                  value={filters.parsel_no}
                  onChange={(e) => updateFilter('parsel_no', e.target.value)}
                  className="w-full mt-0.5 px-3 py-2 rounded-lg border border-navy-200 text-sm bg-white font-mono"
                />
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="md:col-span-2 inline-flex items-center justify-center gap-1 text-sm text-navy-600 hover:text-gold-600 self-end pb-2"
                >
                  <X className="w-4 h-4" />
                  {t('common.clear')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4 px-1 text-sm text-navy-600">
          <div>
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> {t('common.loading')}
              </span>
            ) : (
              <span>{t('property.results_count', { count: total })}</span>
            )}
          </div>
        </div>

        {/* Grid */}
        {!loading && properties.length === 0 ? (
          <div className="card p-10 text-center text-navy-600">
            {t('property.no_results')}
          </div>
        ) : grouped ? (
          /* Filtre yokken kategoriye göre gruplandırılmış görünüm */
          <div className="space-y-10 md:space-y-12">
            {grouped.map((g) => {
              const typeLabel = (t(`property_type.${g.type}` as any) as string) || g.type
              const catLabel = g.category
                ? ((t(`property_category.${g.category}` as any) as string) || g.category)
                : ''
              const sectionTitle = [typeLabel, catLabel].filter(Boolean).join(' ').trim()
              return (
                <section key={`${g.type}-${g.category}`}>
                  <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
                    <div>
                      <p className="text-gold-600 uppercase tracking-[0.18em] text-[11px] font-bold mb-1">
                        {typeLabel}
                      </p>
                      <h2 className="font-display text-2xl md:text-3xl font-bold text-navy-950">
                        {sectionTitle}{' '}
                        <span className="text-navy-400 text-base font-medium">({g.items.length})</span>
                      </h2>
                    </div>
                    {g.items.length >= 3 && (
                      <button
                        onClick={() => setQuickFilter(g.type, g.category)}
                        className="text-sm text-navy-700 hover:text-gold-700 inline-flex items-center gap-1 font-semibold"
                      >
                        {locale === 'en' ? 'View all' : 'Tümünü Gör'}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                    {g.items.slice(0, 6).map((p) => (
                      <PropertyCard key={p.id} property={p} />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        ) : (
          /* Filtre aktifken düz grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
