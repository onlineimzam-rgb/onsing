'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n/I18nProvider'
import { locales, type Locale } from '@/lib/i18n/config'
import { Globe } from 'lucide-react'

export default function LanguageSwitcher() {
  const { locale } = useI18n()
  const pathname = usePathname()
  const router = useRouter()

  const switchTo = (next: Locale) => {
    if (next === locale) return
    const segments = pathname.split('/')
    if (locales.includes(segments[1] as Locale)) {
      segments[1] = next
    } else {
      segments.splice(1, 0, next)
    }
    router.push(segments.join('/') || '/')
  }

  return (
    <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-1.5 py-1">
      <Globe className="w-3.5 h-3.5 text-white/70 ml-1" />
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => switchTo(l)}
          className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full transition-colors ${
            locale === l
              ? 'bg-gold-400 text-navy-950'
              : 'text-white/80 hover:text-white'
          }`}
          aria-label={`Switch to ${l.toUpperCase()}`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
