'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, Menu, X } from 'lucide-react'
import { cn } from '@/components/ui/onsig-design-system'

const LINKS = [
  { href: '/features', label: 'Özellikler' },
  { href: '/security', label: 'Güvenlik' },
  { href: '/industries', label: 'Sektörler' },
  { href: '/pricing', label: 'Fiyatlandırma' },
  { href: '/contact', label: 'İletişim' },
]

/**
 * Marketing navigation — transparent at the very top, frosts and shows a hairline
 * once the user scrolls. Inspired by Stripe / Linear marketing chrome.
 */
export function MarketingNav() {
  const pathname = usePathname() ?? ''
  const [scrolled, setScrolled] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  React.useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-40 transition-all duration-220 ease-emphasized',
          scrolled
            ? 'bg-paper/85 backdrop-blur-glass border-b border-divider'
            : 'bg-transparent border-b border-transparent'
        )}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          {/* Brand */}
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 group shrink-0"
            aria-label="OnSig anasayfa"
          >
            <span className="relative grid place-items-center w-8 h-8 rounded-lg bg-iris-hero text-white font-display font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_2px_4px_rgba(11,15,27,0.18)]">
              <span aria-hidden className="text-[13px] tracking-tightest">
                O
              </span>
              <span
                aria-hidden
                className="absolute inset-0 rounded-lg ring-1 ring-white/15"
              />
            </span>
            <span className="font-display text-[15px] font-bold tracking-tightest text-ink-12 group-hover:text-iris-11 transition-colors">
              OnSig
            </span>
          </Link>

          {/* Center nav */}
          <nav className="hidden lg:flex items-center gap-1 text-sm">
            {LINKS.map((l) => {
              const active = pathname.startsWith(l.href)
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    'relative px-3 py-1.5 rounded-md font-medium tracking-tight transition-colors duration-180',
                    active
                      ? 'text-ink-12'
                      : 'text-ink-8 hover:text-ink-12'
                  )}
                >
                  {l.label}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute left-3 right-3 -bottom-px h-px bg-iris-9"
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right CTAs */}
          <div className="hidden lg:flex items-center gap-1.5 shrink-0">
            <Link
              href="/login"
              className="inline-flex items-center h-9 px-3 rounded-md text-sm font-semibold text-ink-9 hover:text-ink-12 hover:bg-ink-2 transition-colors"
            >
              Giriş yap
            </Link>
            <Link href="/register" className="btn-primary">
              Ücretsiz başla
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            className="lg:hidden inline-grid place-items-center w-9 h-9 rounded-md text-ink-9 hover:text-ink-12 hover:bg-ink-2 transition-colors"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'}
            aria-expanded={open}
          >
            {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile menu sheet */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 top-16 z-30 bg-paper/95 backdrop-blur-glass animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <nav className="flex flex-col gap-1 px-5 py-6">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="px-3 py-3 rounded-md text-base font-semibold tracking-tight text-ink-12 hover:bg-ink-2"
              >
                {l.label}
              </Link>
            ))}
            <div className="h-px bg-divider my-3" />
            <Link
              href="/login"
              className="px-3 py-3 rounded-md text-base font-semibold text-ink-9 hover:bg-ink-2"
            >
              Giriş yap
            </Link>
            <Link
              href="/register"
              className="btn-primary btn-lg justify-center mt-2"
            >
              Ücretsiz başla
              <ArrowRight className="w-4 h-4" />
            </Link>
          </nav>
        </div>
      )}
    </>
  )
}
