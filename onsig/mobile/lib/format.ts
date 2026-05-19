/**
 * Tiny date helpers tuned to the dashboard's "X dakika önce" / "Bugün 14:20"
 * presentation. Uses native `Intl.RelativeTimeFormat` (available on Hermes
 * since RN 0.74) so we don't need a third-party formatter.
 */

const rtf = new Intl.RelativeTimeFormat('tr-TR', { numeric: 'auto' })

export function relativeTime(iso: string | Date | null | undefined): string {
  if (!iso) return ''
  const date = typeof iso === 'string' ? new Date(iso) : iso
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
  const diffSec = Math.round((date.getTime() - Date.now()) / 1000)
  const abs = Math.abs(diffSec)

  if (abs < 60) return diffSec >= 0 ? 'Şimdi' : 'Şimdi'
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute')
  if (abs < 86_400) return rtf.format(Math.round(diffSec / 3600), 'hour')
  if (abs < 7 * 86_400) return rtf.format(Math.round(diffSec / 86_400), 'day')
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short' }).format(date)
}

export function shortDate(iso: string | Date | null | undefined): string {
  if (!iso) return '—'
  const date = typeof iso === 'string' ? new Date(iso) : iso
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

const dayShort = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']

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
