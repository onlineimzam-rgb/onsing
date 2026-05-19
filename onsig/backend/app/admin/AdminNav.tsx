'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Activity,
  Building2,
  ChevronDown,
  CreditCard,
  Database,
  FileSignature,
  Flag,
  Gauge,
  LayoutGrid,
  LifeBuoy,
  ListChecks,
  LogOut,
  Receipt,
  ScrollText,
  Search,
  ShieldAlert,
  Terminal,
  Users,
  Zap,
} from 'lucide-react'
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  StatusDot,
  TooltipProvider,
  AdminAvatar,
} from '@/components/admin/ui'

const SECTIONS: {
  label: string
  items: { href: string; icon: React.ReactNode; label: string; badge?: string; prefix?: boolean }[]
}[] = [
  {
    label: 'Operations',
    items: [
      {
        href: '/admin',
        icon: <LayoutGrid className="w-[15px] h-[15px]" />,
        label: 'Overview',
        prefix: false,
      },
      {
        href: '/admin/tenants',
        icon: <Building2 className="w-[15px] h-[15px]" />,
        label: 'Tenants',
      },
      {
        href: '/admin/contracts',
        icon: <ScrollText className="w-[15px] h-[15px]" />,
        label: 'Contracts',
      },
      {
        href: '/admin/sign-sessions',
        icon: <FileSignature className="w-[15px] h-[15px]" />,
        label: 'Sign sessions',
      },
    ],
  },
  {
    label: 'Revenue',
    items: [
      {
        href: '/admin/billing',
        icon: <CreditCard className="w-[15px] h-[15px]" />,
        label: 'Billing',
      },
      {
        href: '/admin/usage',
        icon: <Gauge className="w-[15px] h-[15px]" />,
        label: 'Usage',
      },
    ],
  },
  {
    label: 'Trust & Safety',
    items: [
      {
        href: '/admin/risk',
        icon: <ShieldAlert className="w-[15px] h-[15px]" />,
        label: 'Risk monitor',
        badge: 'beta',
      },
      {
        href: '/admin/audit',
        icon: <ListChecks className="w-[15px] h-[15px]" />,
        label: 'Audit log',
      },
      {
        href: '/admin/support',
        icon: <LifeBuoy className="w-[15px] h-[15px]" />,
        label: 'Support',
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        href: '/admin/health',
        icon: <Activity className="w-[15px] h-[15px]" />,
        label: 'System health',
      },
      {
        href: '/admin/feature-flags',
        icon: <Flag className="w-[15px] h-[15px]" />,
        label: 'Feature flags',
      },
    ],
  },
]

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super admin',
  support: 'Support',
  finance: 'Finance',
  moderator: 'Moderator',
}

const ROLE_TONE: Record<string, string> = {
  super_admin: 'bg-[#15172A] text-[#B7B3FF] ring-[#3B3597]',
  support: 'bg-[#062539] text-[#7DD3FC] ring-[#0C4A6E]',
  finance: 'bg-[#06231F] text-[#5EEAD4] ring-[#134E4A]',
  moderator: 'bg-[#251703] text-[#FBBF24] ring-[#92400E]',
}

export function AdminSidebar({
  userName,
  userEmail,
  platformRole,
}: {
  userName: string
  userEmail: string | null
  platformRole: string
}) {
  const pathname = usePathname() ?? '/admin'

  return (
    <TooltipProvider>
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 z-30 w-[232px] flex-col bg-[var(--a-bg-elev)] border-r border-[var(--a-line)]">
        {/* Brand strip */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-[var(--a-line)]">
          <Link href="/admin" className="flex items-center gap-2.5 group min-w-0">
            <span className="relative grid place-items-center w-7 h-7 rounded-md bg-gradient-to-br from-[#3B33C0] to-[#0B0F1B] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] ring-1 ring-white/10">
              <Terminal className="w-3.5 h-3.5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-bold tracking-tightest text-[var(--a-text-1)] leading-none">
                OnSig
              </span>
              <span className="block mt-0.5 text-[9.5px] uppercase tracking-[0.14em] font-semibold text-[var(--a-text-4)] leading-none">
                Operator console
              </span>
            </span>
          </Link>
        </div>

        {/* Search stub */}
        <div className="px-3 pt-3 pb-2">
          <button
            type="button"
            className="w-full flex items-center gap-2 h-7 px-2.5 rounded-md bg-[#0F1424] ring-1 ring-[var(--a-line)] text-[12px] text-[var(--a-text-4)] hover:text-[var(--a-text-2)] hover:ring-[var(--a-line-2)] transition-colors"
          >
            <Search className="w-3 h-3" />
            <span>Komut ara</span>
            <span className="ml-auto inline-flex items-center gap-0.5">
              <kbd className="px-1 h-[14px] rounded-[3px] bg-white/[0.06] text-[9.5px] font-mono text-[var(--a-text-3)] grid place-items-center">
                ⌘
              </kbd>
              <kbd className="px-1 h-[14px] rounded-[3px] bg-white/[0.06] text-[9.5px] font-mono text-[var(--a-text-3)] grid place-items-center">
                K
              </kbd>
            </span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 pt-2 pb-3 space-y-4">
          {SECTIONS.map((section) => (
            <div key={section.label}>
              <div className="px-2.5 pb-1 text-[9.5px] uppercase tracking-[0.14em] font-semibold text-[var(--a-text-5)]">
                {section.label}
              </div>
              <ul className="space-y-0.5">
                {section.items.map((it) => {
                  const active =
                    it.prefix === false
                      ? pathname === it.href
                      : pathname === it.href || pathname.startsWith(it.href + '/')
                  return (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        className={cn(
                          'group flex items-center gap-2.5 h-7 px-2.5 rounded-md text-[12.5px] tracking-tight',
                          'transition-colors duration-120',
                          active
                            ? 'bg-white/[0.05] text-[var(--a-text-1)]'
                            : 'text-[var(--a-text-3)] hover:text-[var(--a-text-1)] hover:bg-white/[0.03]'
                        )}
                      >
                        <span
                          className={cn(
                            'shrink-0 transition-colors',
                            active ? 'text-[var(--a-accent)]' : 'text-[var(--a-text-4)] group-hover:text-[var(--a-text-2)]'
                          )}
                        >
                          {it.icon}
                        </span>
                        <span className="flex-1 truncate">{it.label}</span>
                        {it.badge && (
                          <span className="px-1 h-[14px] grid place-items-center rounded-full text-[9px] font-bold uppercase tracking-widest bg-[#1B1A4F] text-[#B7B3FF] ring-1 ring-[#3B3597]">
                            {it.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="px-2 py-2 border-t border-[var(--a-line)]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-white/[0.03] transition-colors text-left"
              >
                <AdminAvatar name={userName || '?'} size={28} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] font-semibold text-[var(--a-text-1)] truncate leading-tight">
                    {userName || 'Operator'}
                  </span>
                  <span className="block text-[11px] text-[var(--a-text-4)] truncate leading-tight">
                    {userEmail ?? ''}
                  </span>
                </span>
                <ChevronDown className="w-3 h-3 text-[var(--a-text-4)] shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[240px]" sideOffset={8} align="end">
              <DropdownMenuLabel>Hesap</DropdownMenuLabel>
              <div className="px-2.5 pb-2 flex items-center gap-2">
                <AdminAvatar name={userName || '?'} size={32} />
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold text-[var(--a-text-1)] truncate">
                    {userName || 'Operator'}
                  </div>
                  <span
                    className={cn(
                      'mt-0.5 inline-flex items-center gap-1 px-1.5 h-[18px] rounded-full text-[10.5px] font-semibold ring-1',
                      ROLE_TONE[platformRole] ?? ROLE_TONE.super_admin
                    )}
                  >
                    <StatusDot tone="success" />
                    {ROLE_LABEL[platformRole] ?? platformRole}
                  </span>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem icon={<Zap className="w-3 h-3" />}>
                <Link href="/dashboard" className="block w-full">
                  Customer app&apos;e dön
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem icon={<Database className="w-3 h-3" />}>
                Drizzle Studio
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                icon={<LogOut className="w-3 h-3" />}
                destructive
                onSelect={() => {
                  fetch('/api/auth/logout', { method: 'POST' }).then(() => {
                    window.location.href = '/login'
                  })
                }}
              >
                Çıkış yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </TooltipProvider>
  )
}

// ── Mobile drawer top strip ────────────────────────────────────────────────
export function AdminMobileBar() {
  return (
    <header className="lg:hidden fixed inset-x-0 top-0 z-30 h-12 flex items-center justify-between px-4 bg-[var(--a-bg-elev)] border-b border-[var(--a-line)]">
      <Link href="/admin" className="flex items-center gap-2">
        <span className="grid place-items-center w-6 h-6 rounded-md bg-gradient-to-br from-[#3B33C0] to-[#0B0F1B] text-white ring-1 ring-white/10">
          <Terminal className="w-3 h-3" />
        </span>
        <span className="text-[12px] font-bold text-[var(--a-text-1)]">OnSig Ops</span>
      </Link>
      <span className="text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[var(--a-text-4)]">
        Operator console
      </span>
    </header>
  )
}
