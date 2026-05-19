'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FileSignature,
  ScrollText,
  LayoutDashboard,
  Settings as SettingsIcon,
  CreditCard,
  History,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Sparkles,
  Search,
  Terminal,
} from 'lucide-react'
import { Avatar, Badge, cn, Shortcut } from '@/components/ui/onsig-design-system'

// ─────────────────────────────────────────────────────────────────────────────
// Navigation model
// ─────────────────────────────────────────────────────────────────────────────
interface NavLink {
  href: string
  icon: React.ReactNode
  label: string
  group: 'workspace' | 'system'
  hint?: string
  /** Match by prefix (default true). Set false for exact match. */
  prefix?: boolean
  badge?: string
}

const LINKS: NavLink[] = [
  {
    href: '/dashboard',
    icon: <LayoutDashboard className="w-[18px] h-[18px]" />,
    label: 'Dashboard',
    hint: 'Genel görünüm',
    group: 'workspace',
    prefix: false,
  },
  {
    href: '/contracts',
    icon: <ScrollText className="w-[18px] h-[18px]" />,
    label: 'Sözleşmeler',
    hint: 'Tüm dokümanlar',
    group: 'workspace',
  },
  {
    href: '/contracts/new',
    icon: <FileSignature className="w-[18px] h-[18px]" />,
    label: 'Yeni',
    hint: 'Sözleşme oluştur',
    group: 'workspace',
  },
  {
    href: '/audit',
    icon: <History className="w-[18px] h-[18px]" />,
    label: 'Audit zinciri',
    hint: 'İmza & denetim kayıtları',
    group: 'system',
  },
  {
    href: '/settings',
    icon: <SettingsIcon className="w-[18px] h-[18px]" />,
    label: 'Ayarlar',
    hint: 'Firma, ekip, şube',
    group: 'system',
  },
  {
    href: '/billing',
    icon: <CreditCard className="w-[18px] h-[18px]" />,
    label: 'Plan',
    hint: 'Abonelik & fatura',
    group: 'system',
  },
]

function isActive(pathname: string, link: NavLink): boolean {
  if (link.prefix === false) return pathname === link.href
  if (pathname === link.href) return true
  if (link.href === '/contracts')
    return pathname.startsWith('/contracts') && !pathname.startsWith('/contracts/new')
  return pathname.startsWith(link.href)
}

// ─────────────────────────────────────────────────────────────────────────────
// Public surface — sidebar shell
// ─────────────────────────────────────────────────────────────────────────────
export interface SidebarShellProps {
  tenantName: string
  tenantPlan: string
  userName: string
  userEmail: string
  isAdmin?: boolean
}

const STORAGE_KEY = 'onsig.sidebar.collapsed'

export function SidebarShell({
  tenantName,
  tenantPlan,
  userName,
  userEmail,
  isAdmin,
}: SidebarShellProps) {
  const [collapsed, setCollapsed] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored === '1') setCollapsed(true)
    } catch {
      /* ignore */
    }
    setMounted(true)
  }, [])

  const toggle = React.useCallback(() => {
    setCollapsed((c) => {
      const next = !c
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const pathname = usePathname() ?? ''
  const workspace = LINKS.filter((l) => l.group === 'workspace')
  const system = LINKS.filter((l) => l.group === 'system')

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col shrink-0 sticky top-0 self-start h-screen py-3 pl-3 pr-0',
        'transition-[width] duration-320 ease-emphasized',
        collapsed ? 'w-[72px]' : 'w-[264px]',
        // Prevent transition flash on first paint
        !mounted && 'transition-none'
      )}
    >
      <div className="flex-1 flex flex-col bg-paper rounded-2xl shadow-sidebar border border-divider overflow-hidden">
        {/* Brand */}
        <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 min-w-0 group"
          >
            <span className="relative grid place-items-center w-9 h-9 rounded-xl bg-iris-hero text-white font-display font-bold shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_2px_6px_rgba(11,15,27,0.3)]">
              <span aria-hidden className="text-[15px] tracking-tightest">
                O
              </span>
              <span
                aria-hidden
                className="absolute inset-0 rounded-xl ring-1 ring-white/15"
              />
            </span>
            {!collapsed && (
              <div className="min-w-0">
                <p className="font-display text-[15px] font-bold tracking-tightest text-ink-12 leading-none">
                  OnSig
                </p>
                <p className="text-2xs text-ink-7 mt-1 leading-none truncate uppercase tracking-[0.16em]">
                  Legal · Sign · Audit
                </p>
              </div>
            )}
          </Link>
          {!collapsed && (
            <button
              type="button"
              onClick={toggle}
              aria-label="Kenar çubuğunu daralt"
              className="w-7 h-7 grid place-items-center rounded-md text-ink-7 hover:text-ink-12 hover:bg-ink-2 transition-colors"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search stub / command palette */}
        <div className="px-3 pb-2">
          {collapsed ? (
            <button
              type="button"
              aria-label="Komut paleti"
              className="w-full h-9 grid place-items-center rounded-md text-ink-7 hover:text-ink-12 hover:bg-ink-2 transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              className="group w-full h-9 px-2.5 inline-flex items-center gap-2 rounded-md bg-ink-2 text-ink-8 hover:text-ink-12 hover:bg-ink-3 transition-colors text-xs"
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate flex-1 text-left">Sözleşme ara…</span>
              <Shortcut keys={['⌘', 'K']} className="opacity-70" />
            </button>
          )}
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto px-2 pb-2 space-y-4">
          <NavGroup
            label="Çalışma alanı"
            collapsed={collapsed}
            items={workspace}
            pathname={pathname}
          />
          <NavGroup
            label="Sistem"
            collapsed={collapsed}
            items={system}
            pathname={pathname}
          />
        </nav>

        {/* Footer: tenant + user */}
        <div className="border-t border-divider px-2 py-2 space-y-2">
          {/* Operator console shortcut (super admin et al) */}
          {isAdmin && (
            <Link
              href="/admin"
              aria-label="Operator console"
              className={cn(
                'group flex items-center gap-2 rounded-md transition-colors',
                'bg-ink-12 text-paper hover:bg-ink-11',
                collapsed
                  ? 'justify-center h-9'
                  : 'px-2 py-1.5 text-xs font-semibold tracking-tight'
              )}
            >
              <Terminal className="w-3.5 h-3.5 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">Operator console</span>
                  <span className="text-2xs uppercase tracking-[0.14em] font-bold opacity-70">
                    Ops
                  </span>
                </>
              )}
            </Link>
          )}

          {/* Tenant card */}
          {!collapsed ? (
            <Link
              href="/settings"
              className="block px-2 py-2 rounded-md hover:bg-ink-2 transition-colors group"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-2xs uppercase tracking-[0.16em] font-semibold text-ink-7">
                  Firma
                </p>
                <Badge tone="iris" size="xs">
                  {tenantPlan.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm font-semibold text-ink-12 truncate mt-0.5">
                {tenantName || '—'}
              </p>
              <p className="text-2xs text-ink-7 truncate mt-0.5">
                Plan ayarları için tıkla
              </p>
            </Link>
          ) : (
            <Link
              href="/settings"
              aria-label={`Firma: ${tenantName}`}
              className="grid place-items-center w-full h-9 rounded-md text-ink-7 hover:text-ink-12 hover:bg-ink-2"
            >
              <Sparkles className="w-4 h-4" />
            </Link>
          )}

          {/* User row */}
          {!collapsed ? (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-ink-2 transition-colors">
              <Avatar name={userName || userEmail || 'OnSig'} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-ink-12 truncate leading-tight">
                  {userName || '—'}
                </p>
                <p className="text-2xs text-ink-7 truncate leading-tight">
                  {userEmail}
                </p>
              </div>
              <LogoutInlineButton collapsed={false} />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 py-1.5">
              <Avatar name={userName || userEmail || 'OnSig'} size="sm" />
              <LogoutInlineButton collapsed />
            </div>
          )}

          {/* Collapse toggle when in collapsed state */}
          {collapsed && (
            <button
              type="button"
              onClick={toggle}
              aria-label="Kenar çubuğunu aç"
              className="w-full h-8 grid place-items-center rounded-md text-ink-7 hover:text-ink-12 hover:bg-ink-2 transition-colors"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Nav group
// ─────────────────────────────────────────────────────────────────────────────
function NavGroup({
  label,
  items,
  pathname,
  collapsed,
}: {
  label: string
  items: NavLink[]
  pathname: string
  collapsed: boolean
}) {
  return (
    <div>
      {!collapsed && (
        <p className="px-2 pt-2 pb-1 text-2xs uppercase tracking-[0.16em] font-semibold text-ink-7">
          {label}
        </p>
      )}
      <ul className="space-y-0.5">
        {items.map((l) => {
          const active = isActive(pathname, l)
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                className={cn(
                  'group relative flex items-center gap-2.5 h-9 px-2 rounded-md text-sm font-medium tracking-tight transition-all duration-180 ease-emphasized',
                  active
                    ? 'bg-ink-12 text-paper shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(11,15,27,0.18)]'
                    : 'text-ink-9 hover:bg-ink-2 hover:text-ink-12',
                  collapsed && 'justify-center px-0'
                )}
                title={collapsed ? l.label : undefined}
              >
                <span
                  className={cn(
                    'shrink-0 grid place-items-center transition-transform duration-180 ease-emphasized',
                    !active && 'group-hover:scale-[1.08]'
                  )}
                >
                  {l.icon}
                </span>
                {!collapsed && (
                  <>
                    <span className="truncate flex-1">{l.label}</span>
                    {l.badge && (
                      <Badge tone={active ? 'ink' : 'iris'} size="xs">
                        {l.badge}
                      </Badge>
                    )}
                  </>
                )}
                {/* Tooltip when collapsed */}
                {collapsed && (
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-md bg-ink-12 text-paper text-xs font-medium px-2 py-1.5 shadow-md opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-180"
                  >
                    {l.label}
                    {l.hint && (
                      <span className="ml-1.5 text-ink-6">· {l.hint}</span>
                    )}
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Logout button (inline, sidebar foot)
// ─────────────────────────────────────────────────────────────────────────────
function LogoutInlineButton({ collapsed }: { collapsed: boolean }) {
  const [pending, setPending] = React.useState(false)
  return (
    <button
      type="button"
      aria-label="Çıkış yap"
      title="Çıkış"
      onClick={async () => {
        if (pending) return
        setPending(true)
        try {
          await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
        } catch {
          /* ignore */
        }
        window.location.href = '/login'
      }}
      className={cn(
        'shrink-0 grid place-items-center w-7 h-7 rounded-md',
        'text-ink-7 hover:text-danger-deep hover:bg-danger-soft transition-colors',
        collapsed && 'w-9 h-9'
      )}
    >
      <LogOut className="w-3.5 h-3.5" />
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile nav — slim bottom tab bar with floating accent
// ─────────────────────────────────────────────────────────────────────────────
export function MobileNav() {
  const pathname = usePathname() ?? ''
  const items: NavLink[] = [
    LINKS[0]!,
    LINKS[1]!,
    LINKS[2]!,
    LINKS[4]!,
    LINKS[5]!,
  ]
  return (
    <nav
      className="lg:hidden fixed bottom-3 left-3 right-3 z-40 rounded-2xl bg-ink-12 text-paper shadow-pop ring-1 ring-white/10"
      aria-label="Ana menü"
    >
      <ul className="flex">
        {items.map((l) => {
          const active = isActive(pathname, l)
          return (
            <li key={l.href} className="flex-1">
              <Link
                href={l.href}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1 py-2.5 text-2xs font-medium transition-colors duration-180',
                  active ? 'text-paper' : 'text-ink-6 hover:text-paper'
                )}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-iris-7"
                  />
                )}
                <span className="grid place-items-center w-5 h-5">{l.icon}</span>
                <span>{l.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Backwards-compat exports (kept so existing imports keep compiling)
// ─────────────────────────────────────────────────────────────────────────────
export function Nav() {
  return null
}
