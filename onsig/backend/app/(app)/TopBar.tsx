'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, ChevronRight, Terminal } from 'lucide-react'
import { Button, Badge } from '@/components/ui/onsig-design-system'

/**
 * TopBar — premium breadcrumb + primary action bar.
 *
 * Sits above the page content (inside the content-area card), provides a sense
 * of place and a single "always-available" primary action.
 */

const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  contracts: 'Sözleşmeler',
  new: 'Yeni',
  audit: 'Audit',
  settings: 'Ayarlar',
  team: 'Ekip',
  branches: 'Şubeler',
  billing: 'Plan',
  sign: 'İmza',
}

function prettify(segment: string): string {
  if (LABELS[segment]) return LABELS[segment]!
  // numeric id → "#42"
  if (/^\d+$/.test(segment)) return `#${segment}`
  return segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function TopBar({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname() ?? ''
  const segments = pathname.split('/').filter(Boolean)

  return (
    <header className="hidden lg:flex items-center justify-between gap-3 h-14 px-6 border-b border-divider bg-paper/80 backdrop-blur-glass sticky top-0 z-30">
      <nav aria-label="breadcrumb" className="min-w-0">
        <ol className="flex items-center gap-1 text-sm">
          {segments.length === 0 ? (
            <li className="text-ink-12 font-semibold">Dashboard</li>
          ) : (
            segments.map((seg, i) => {
              const href = '/' + segments.slice(0, i + 1).join('/')
              const last = i === segments.length - 1
              return (
                <React.Fragment key={href}>
                  {i > 0 && (
                    <ChevronRight className="w-3.5 h-3.5 text-ink-6 shrink-0" />
                  )}
                  <li className="min-w-0">
                    {last ? (
                      <span className="text-ink-12 font-semibold truncate">
                        {prettify(seg)}
                      </span>
                    ) : (
                      <Link
                        href={href}
                        className="text-ink-7 hover:text-ink-12 transition-colors truncate"
                      >
                        {prettify(seg)}
                      </Link>
                    )}
                  </li>
                </React.Fragment>
              )
            })
          )}
        </ol>
      </nav>

      <div className="flex items-center gap-2">
        {isAdmin && (
          <Link
            href="/admin"
            className="hidden md:inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-ink-12 text-paper text-xs font-semibold tracking-tight hover:bg-ink-11 transition-colors"
            title="Operator console"
          >
            <Terminal className="w-3.5 h-3.5" />
            Operator console
          </Link>
        )}
        <Link href="/contracts/new" className="shrink-0">
          <Button
            size="sm"
            variant="primary"
            leadingIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Yeni sözleşme
          </Button>
        </Link>
      </div>
    </header>
  )
}
