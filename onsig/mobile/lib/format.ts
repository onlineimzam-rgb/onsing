/**
 * Tiny date helpers tuned to the dashboard's "X dakika önce" / "20 May 2026"
 * presentation.
 *
 * NOTE: We deliberately avoid `Intl.RelativeTimeFormat` and `Intl.DateTimeFormat`
 * here. Hermes on Android (Expo SDK 54) does not ship those constructors, so
 * referencing them at module-load time crashes the bundle with
 * `Cannot read property 'prototype' of undefined`. Manual Turkish strings are
 * trivially small and easier to debug than wiring a polyfill.
 */

const monthShort = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
] as const

const dayShort = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'] as const

function toDate(input: string | Date | null | undefined): Date | null {
  if (!input) return null
  const d = typeof input === 'string' ? new Date(input) : input
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null
  return d
}

export function relativeTime(input: string | Date | null | undefined): string {
  const date = toDate(input)
  if (!date) return ''

  const diffSec = Math.round((date.getTime() - Date.now()) / 1000)
  const abs = Math.abs(diffSec)
  const past = diffSec < 0

  if (abs < 45) return 'şimdi'

  if (abs < 3600) {
    const m = Math.round(abs / 60)
    return past ? `${m} dk önce` : `${m} dk sonra`
  }
  if (abs < 86_400) {
    const h = Math.round(abs / 3600)
    return past ? `${h} sa önce` : `${h} sa sonra`
  }
  if (abs < 7 * 86_400) {
    const d = Math.round(abs / 86_400)
    return past ? `${d} gün önce` : `${d} gün sonra`
  }
  return shortDate(date)
}

export function shortDate(input: string | Date | null | undefined): string {
  const date = toDate(input)
  if (!date) return '—'
  const day = String(date.getDate()).padStart(2, '0')
  const month = monthShort[date.getMonth()]
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}

/** Returns the last 7 day-short labels ending today, e.g. `['Çar','Per',...,'Sal']`. */
export function weekdayLabels(): string[] {
  const now = new Date()
  const out: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000)
    out.push(dayShort[d.getDay()]!)
  }
  return out
}
