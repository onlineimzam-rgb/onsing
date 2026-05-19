'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Search,
  LayoutGrid,
  List as ListIcon,
  Plus,
  FileText,
  ArrowUpRight,
  Calendar,
  Filter,
} from 'lucide-react'
import {
  Card,
  Badge,
  EmptyState,
  cn,
  type BadgeTone,
} from '@/components/ui/onsig-design-system'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ContractRow {
  id: number
  sector: string
  templateKey: string
  templateLabel: string | null
  title: string | null
  status: string
  createdAt: string | Date
  updatedAt: string | Date
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_TONE: Record<string, BadgeTone> = {
  taslak: 'neutral',
  aktif: 'warning',
  tamamlandi: 'success',
  iptal: 'danger',
}
const STATUS_LABEL: Record<string, string> = {
  taslak: 'Taslak',
  aktif: 'Aktif',
  tamamlandi: 'Tamamlandı',
  iptal: 'İptal',
}
const TEMPLATE_LABEL: Record<string, string> = {
  kira: 'Kira',
  yetki: 'Yetki',
  'alim-satim': 'Alım-Satım',
  'yer-gosterme': 'Yer Gösterme',
  custom: 'Özel',
}

const TEMPLATE_ACCENT: Record<
  string,
  { gradient: string; iconBg: string; iconFg: string }
> = {
  kira: {
    gradient: 'from-iris-9/15 via-iris-9/0 to-transparent',
    iconBg: 'bg-iris-1',
    iconFg: 'text-iris-10',
  },
  yetki: {
    gradient: 'from-info/15 via-info/0 to-transparent',
    iconBg: 'bg-info-soft',
    iconFg: 'text-info-deep',
  },
  'alim-satim': {
    gradient: 'from-success/15 via-success/0 to-transparent',
    iconBg: 'bg-success-soft',
    iconFg: 'text-success-deep',
  },
  'yer-gosterme': {
    gradient: 'from-warning/15 via-warning/0 to-transparent',
    iconBg: 'bg-warning-soft',
    iconFg: 'text-warning-deep',
  },
  custom: {
    gradient: 'from-ink-12/10 via-ink-12/0 to-transparent',
    iconBg: 'bg-ink-2',
    iconFg: 'text-ink-10',
  },
}

type Filter = 'all' | 'taslak' | 'aktif' | 'tamamlandi' | 'iptal'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Tümü' },
  { id: 'taslak', label: 'Taslak' },
  { id: 'aktif', label: 'İmza bekliyor' },
  { id: 'tamamlandi', label: 'Tamamlandı' },
  { id: 'iptal', label: 'İptal' },
]

function fmtDate(d: Date | string): string {
  try {
    return new Date(d).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return String(d)
  }
}
function fmtRelative(d: Date | string): string {
  const date = new Date(d)
  const diff = Date.now() - date.getTime()
  const min = Math.round(diff / 60000)
  if (min < 60) return `${Math.max(1, min)} dk önce`
  const h = Math.round(min / 60)
  if (h < 24) return `${h} sa önce`
  const days = Math.round(h / 24)
  if (days < 7) return `${days} gün önce`
  return fmtDate(d)
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function ContractsView({ items }: { items: ContractRow[] }) {
  const [view, setView] = React.useState<'grid' | 'list'>('grid')
  const [filter, setFilter] = React.useState<Filter>('all')
  const [query, setQuery] = React.useState('')

  const counts = React.useMemo(() => {
    const c: Record<string, number> = { all: items.length }
    for (const it of items) c[it.status] = (c[it.status] ?? 0) + 1
    return c
  }, [items])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((it) => {
      if (filter !== 'all' && it.status !== filter) return false
      if (!q) return true
      const hay = [
        it.title ?? '',
        TEMPLATE_LABEL[it.templateKey] ?? it.templateKey,
        it.templateLabel ?? '',
        String(it.id),
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [items, filter, query])

  return (
    <div className="space-y-4">
      {/* ── Header strip ─────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="section-overline">Çalışma alanı</p>
          <h1 className="font-display text-2xl font-bold tracking-tightest text-ink-12 mt-1">
            Sözleşmeler
          </h1>
          <p className="text-sm text-ink-7 mt-1 num">
            <span className="font-semibold text-ink-12">{items.length}</span>{' '}
            kayıt
            {filter !== 'all' && (
              <>
                {' '}
                · <span className="text-ink-12 font-semibold">
                  {filtered.length}
                </span>{' '}
                filtrelendi
              </>
            )}
          </p>
        </div>
        <Link href="/contracts/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          Yeni sözleşme
        </Link>
      </div>

      {/* ── Toolbar: search + tabs + view toggle ────────────────────────── */}
      <Card padding="none" className="!p-0">
        <div className="flex items-center gap-2 flex-wrap p-2.5 border-b border-divider">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-7 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Başlık, şablon veya #id ara…"
              className="w-full h-9 pl-8 pr-3 rounded-md bg-ink-2 text-sm text-ink-12 placeholder:text-ink-7 focus:outline-none focus:bg-paper focus:shadow-glow transition-all"
            />
          </div>

          {/* View toggle */}
          <div className="inline-flex p-0.5 rounded-md bg-ink-2">
            <button
              type="button"
              onClick={() => setView('grid')}
              aria-label="Izgara"
              className={cn(
                'w-7 h-7 rounded grid place-items-center text-ink-7 transition-all',
                view === 'grid' && 'bg-paper text-ink-12 shadow-xs'
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              aria-label="Liste"
              className={cn(
                'w-7 h-7 rounded grid place-items-center text-ink-7 transition-all',
                view === 'list' && 'bg-paper text-ink-12 shadow-xs'
              )}
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1.5 px-2.5 py-2 overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-ink-7 shrink-0" />
          {FILTERS.map((f) => {
            const active = filter === f.id
            const count = counts[f.id] ?? 0
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all',
                  active
                    ? 'bg-ink-12 text-paper shadow-xs'
                    : 'text-ink-9 hover:bg-ink-2 hover:text-ink-12'
                )}
              >
                {f.label}
                <span
                  className={cn(
                    'inline-grid place-items-center min-w-[18px] h-4 px-1 rounded text-[10px] num',
                    active ? 'bg-white/15' : 'bg-ink-3 text-ink-7'
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* ── Results ──────────────────────────────────────────────────────── */}
      {items.length === 0 ? (
        <EmptyState
          icon={<FileText />}
          title="Henüz sözleşme yok"
          description="İlk sözleşmeni oluştur, imza akışını başlat ve audit zincirini canlandır."
          action={
            <Link href="/contracts/new" className="btn-primary">
              <Plus className="w-4 h-4" />
              İlk sözleşmeyi oluştur
            </Link>
          }
          pattern
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Eşleşen sözleşme bulunamadı"
          description="Arama terimini değiştir ya da filtreleri sıfırla."
          action={
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setQuery('')
                setFilter('all')
              }}
            >
              Filtreleri sıfırla
            </button>
          }
        />
      ) : view === 'grid' ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((c) => (
            <ContractTile key={c.id} item={c} />
          ))}
        </div>
      ) : (
        <Card padding="none" className="!p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink-2 text-2xs uppercase tracking-[0.16em] text-ink-7">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold w-14">#</th>
                <th className="px-4 py-2.5 text-left font-semibold">Başlık</th>
                <th className="px-4 py-2.5 text-left font-semibold">Şablon</th>
                <th className="px-4 py-2.5 text-left font-semibold">Durum</th>
                <th className="px-4 py-2.5 text-right font-semibold">Tarih</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {filtered.map((c) => {
                const accent =
                  TEMPLATE_ACCENT[c.templateKey] ?? TEMPLATE_ACCENT.custom!
                return (
                  <tr
                    key={c.id}
                    className="group hover:bg-ink-1 transition-colors"
                  >
                    <td className="px-4 py-2.5 font-mono text-xs text-ink-7 num">
                      <Link href={`/contracts/${c.id}`}>#{c.id}</Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/contracts/${c.id}`}
                        className="font-semibold text-ink-12 hover:text-iris-10 transition-colors line-clamp-1"
                      >
                        {c.title ||
                          c.templateLabel ||
                          TEMPLATE_LABEL[c.templateKey] ||
                          'Başlıksız'}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 text-2xs font-semibold tracking-tight',
                          accent.iconFg
                        )}
                      >
                        <span
                          className={cn(
                            'inline-block w-1.5 h-1.5 rounded-full',
                            accent.iconFg.replace('text-', 'bg-')
                          )}
                        />
                        {TEMPLATE_LABEL[c.templateKey] ?? c.templateKey}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge
                        tone={STATUS_TONE[c.status] ?? 'neutral'}
                        size="sm"
                        dot
                      >
                        {STATUS_LABEL[c.status] ?? c.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right text-2xs text-ink-7 whitespace-nowrap num">
                      {fmtRelative(c.createdAt)}
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      <Link
                        href={`/contracts/${c.id}`}
                        className="inline-grid place-items-center w-7 h-7 rounded text-ink-7 group-hover:text-ink-12 group-hover:bg-ink-3 transition-all"
                        aria-label="Aç"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}

// ─── Tile ────────────────────────────────────────────────────────────────────
function ContractTile({ item }: { item: ContractRow }) {
  const accent = TEMPLATE_ACCENT[item.templateKey] ?? TEMPLATE_ACCENT.custom!
  const tone = STATUS_TONE[item.status] ?? 'neutral'
  return (
    <Link
      href={`/contracts/${item.id}`}
      className="group relative overflow-hidden rounded-card border border-divider bg-paper shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-divider-strong transition-all duration-220 ease-emphasized animate-fade-in"
    >
      {/* Top accent gradient */}
      <div
        aria-hidden
        className={cn(
          'absolute inset-x-0 top-0 h-24 bg-gradient-to-b pointer-events-none opacity-80',
          accent.gradient
        )}
      />
      {/* Side strip color */}
      <div
        aria-hidden
        className={cn(
          'absolute left-0 top-0 bottom-0 w-0.5 transition-all duration-220',
          'opacity-0 group-hover:opacity-100',
          accent.iconFg.replace('text-', 'bg-')
        )}
      />

      <div className="relative p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div
            className={cn(
              'w-9 h-9 rounded-md grid place-items-center shrink-0 ring-1 ring-inset ring-divider',
              accent.iconBg,
              accent.iconFg
            )}
          >
            <FileText className="w-4 h-4" />
          </div>
          <Badge tone={tone} size="sm" dot>
            {STATUS_LABEL[item.status] ?? item.status}
          </Badge>
        </div>

        <p className="text-2xs uppercase tracking-[0.16em] font-semibold text-ink-7">
          {TEMPLATE_LABEL[item.templateKey] ?? item.templateKey}
          <span className="ml-2 text-ink-6 font-mono normal-case tracking-normal">
            #{item.id}
          </span>
        </p>

        <h3 className="font-display text-base font-semibold tracking-tightest text-ink-12 mt-1.5 leading-snug line-clamp-2 group-hover:text-iris-10 transition-colors">
          {item.title ||
            item.templateLabel ||
            'Başlıksız sözleşme'}
        </h3>

        {/* Metadata footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-divider">
          <span className="inline-flex items-center gap-1.5 text-2xs text-ink-7 num">
            <Calendar className="w-3 h-3" />
            {fmtRelative(item.createdAt)}
          </span>
          <ArrowUpRight className="w-3.5 h-3.5 text-ink-6 group-hover:text-iris-10 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-220" />
        </div>
      </div>
    </Link>
  )
}
