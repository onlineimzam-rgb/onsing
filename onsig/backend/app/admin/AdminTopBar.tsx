'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Slash } from 'lucide-react'
import { StatusDot } from '@/components/admin/ui'

const TITLE_MAP: Record<string, string> = {
  admin: 'Overview',
  tenants: 'Tenants',
  contracts: 'Contracts',
  'sign-sessions': 'Sign sessions',
  billing: 'Billing',
  usage: 'Usage',
  risk: 'Risk monitor',
  audit: 'Audit log',
  support: 'Support',
  health: 'System health',
  'feature-flags': 'Feature flags',
}

function prettify(seg: string) {
  return TITLE_MAP[seg] ?? seg.replace(/-/g, ' ')
}

export function AdminTopBar({ environment }: { environment: string }) {
  const pathname = usePathname() ?? '/admin'
  const segments = pathname.split('/').filter(Boolean) // ['admin', 'tenants', ...]
  const now = useNow()

  return (
    <header className="sticky top-0 z-20 h-12 flex items-center justify-between gap-4 px-5 bg-[var(--a-bg-elev)]/85 backdrop-blur-md border-b border-[var(--a-line)]">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 min-w-0 text-[12px]">
        {segments.map((seg, i) => {
          const href = '/' + segments.slice(0, i + 1).join('/')
          const isLast = i === segments.length - 1
          return (
            <React.Fragment key={href}>
              {i > 0 && <Slash className="w-3 h-3 text-[var(--a-text-5)] -rotate-12" />}
              {isLast ? (
                <span className="font-semibold text-[var(--a-text-1)] capitalize truncate">
                  {prettify(seg)}
                </span>
              ) : (
                <Link
                  href={href}
                  className="text-[var(--a-text-4)] hover:text-[var(--a-text-2)] transition-colors capitalize"
                >
                  {prettify(seg)}
                </Link>
              )}
            </React.Fragment>
          )
        })}
      </nav>

      {/* Right strip */}
      <div className="flex items-center gap-3 text-[11px] shrink-0">
        <span className="hidden sm:inline-flex items-center gap-1.5 text-[var(--a-text-3)]">
          <StatusDot tone="success" pulse />
          <span className="font-semibold text-[var(--a-text-2)] num">all-systems-go</span>
        </span>
        <span className="hidden md:inline-flex px-1.5 h-[18px] items-center rounded-full bg-white/5 text-[10.5px] font-semibold uppercase tracking-widest text-[var(--a-text-3)]">
          {environment}
        </span>
        <span
          suppressHydrationWarning
          className="hidden md:inline text-[11px] font-mono text-[var(--a-text-4)] num"
        >
          {now ?? '\u00A0'}
        </span>
      </div>
    </header>
  )
}

/**
 * Client-only "now" — returns `null` until after mount, then updates every
 * second. Returning `null` on the server prevents the SSR/CSR hydration
 * mismatch that Date-based renders would otherwise produce.
 */
function useNow(): string | null {
  const [now, setNow] = React.useState<string | null>(null)
  React.useEffect(() => {
    setNow(fmt(new Date()))
    const id = setInterval(() => setNow(fmt(new Date())), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

function fmt(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} TR`
}
