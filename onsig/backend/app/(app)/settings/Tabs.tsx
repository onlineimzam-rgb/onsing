'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/settings', label: 'Firma' },
  { href: '/settings/branches', label: 'Şubeler' },
  { href: '/settings/team', label: 'Ekip' },
]

export function SettingsTabs() {
  const pathname = usePathname() ?? ''
  return (
    <div className="border-b border-slate-200 mb-6 flex gap-1 overflow-x-auto">
      {TABS.map((t) => {
        const active = pathname === t.href
        return (
          <Link
            key={t.href}
            href={t.href}
            className={[
              'px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition',
              active
                ? 'border-brand text-brand-deep'
                : 'border-transparent text-ink-muted hover:text-brand',
            ].join(' ')}
          >
            {t.label}
          </Link>
        )
      })}
    </div>
  )
}
