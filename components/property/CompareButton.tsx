'use client'

import { Scale, Check } from 'lucide-react'
import { useCompare } from '@/lib/compare/CompareProvider'
import { useI18n } from '@/lib/i18n/I18nProvider'

export default function CompareButton({
  id,
  slug,
  title,
  cover,
  size = 'sm',
}: {
  id: number
  slug: string
  title: string
  cover?: string | null
  size?: 'sm' | 'lg'
}) {
  const { locale } = useI18n()
  const { has, add, remove, items, max } = useCompare()
  const active = has(id)
  const disabled = !active && items.length >= max

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (active) {
      remove(id)
    } else {
      const ok = add({ id, slug, title, cover: cover || null })
      if (!ok) alert(locale === 'en' ? `Up to ${max} items can be compared.` : `En fazla ${max} ilan karşılaştırılır.`)
    }
  }

  const base =
    size === 'lg'
      ? 'px-4 py-2.5 text-sm rounded-xl'
      : 'px-2.5 py-1.5 text-xs rounded-lg'

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      className={`${base} inline-flex items-center gap-1 font-semibold transition-colors ${
        active
          ? 'bg-emerald-500 text-white'
          : disabled
            ? 'bg-navy-100 text-navy-400 cursor-not-allowed'
            : 'bg-white border border-navy-200 hover:border-gold-400 text-navy-800'
      }`}
      title={
        active
          ? locale === 'en'
            ? 'Remove from comparison'
            : 'Karşılaştırmadan çıkar'
          : locale === 'en'
            ? 'Add to compare'
            : 'Karşılaştırmaya ekle'
      }
    >
      {active ? <Check className="w-3.5 h-3.5" /> : <Scale className="w-3.5 h-3.5" />}
      {size === 'lg'
        ? active
          ? locale === 'en'
            ? 'Added'
            : 'Eklendi'
          : locale === 'en'
            ? 'Compare'
            : 'Karşılaştır'
        : null}
    </button>
  )
}
