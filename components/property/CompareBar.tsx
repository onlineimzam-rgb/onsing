'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Scale, X } from 'lucide-react'
import { useCompare } from '@/lib/compare/CompareProvider'
import { useI18n } from '@/lib/i18n/I18nProvider'

export default function CompareBar() {
  const { items, remove, clear } = useCompare()
  const { locale } = useI18n()

  if (items.length === 0) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[min(96vw,720px)] bg-navy-950 text-white rounded-2xl shadow-2xl border border-navy-700 p-3 md:p-4 flex items-center gap-3">
      <div className="flex items-center gap-2 text-gold-300 font-semibold text-sm shrink-0">
        <Scale className="w-4 h-4" />
        <span className="hidden sm:inline">
          {locale === 'en' ? 'Compare' : 'Karşılaştır'}
        </span>
        <span className="text-[10px] bg-gold-gradient text-navy-950 px-1.5 py-0.5 rounded-full font-bold">
          {items.length}/3
        </span>
      </div>
      <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
        {items.map((it) => (
          <div
            key={it.id}
            className="shrink-0 inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/15 rounded-xl pl-1 pr-2 py-1 text-xs"
          >
            <div className="relative w-7 h-7 rounded-lg overflow-hidden bg-navy-800">
              {it.cover ? (
                <Image src={it.cover} alt="" fill className="object-cover" />
              ) : null}
            </div>
            <span className="truncate max-w-[120px]" title={it.title}>
              {it.title}
            </span>
            <button
              type="button"
              onClick={() => remove(it.id)}
              className="text-white/70 hover:text-red-300"
              aria-label="kaldır"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={clear}
          className="text-xs text-white/70 hover:text-white px-2 py-1"
        >
          {locale === 'en' ? 'Clear' : 'Temizle'}
        </button>
        <Link
          href={`/${locale}/karsilastir/`}
          className={`text-xs font-bold px-3 py-2 rounded-xl ${
            items.length >= 2
              ? 'bg-gold-gradient text-navy-950'
              : 'bg-white/10 text-white/60 pointer-events-none'
          }`}
        >
          {locale === 'en' ? 'View comparison' : 'Karşılaştır'}
        </Link>
      </div>
    </div>
  )
}
