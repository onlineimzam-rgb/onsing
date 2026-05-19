import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  getOptionalUser,
  getOptionalAdmin,
  loadUserAndTenant,
  loadTenant,
} from '@/lib/session'
import { SidebarShell, MobileNav } from './Nav'
import { TopBar } from './TopBar'
import LogoutButton from './LogoutButton'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getOptionalUser()
  if (!session) redirect('/login')

  const [user, tenant, admin] = await Promise.all([
    loadUserAndTenant(session.userId),
    loadTenant(session.tenantId),
    getOptionalAdmin(),
  ])

  const plan = (tenant?.plan ?? 'free').toLowerCase()
  const isAdmin = !!admin

  return (
    <div className="min-h-screen flex">
      <SidebarShell
        tenantName={tenant?.name ?? ''}
        tenantPlan={plan}
        userName={user?.name ?? ''}
        userEmail={user?.email ?? ''}
        isAdmin={isAdmin}
      />

      {/* Mobile top strip */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between bg-paper/90 backdrop-blur-glass border-b border-divider px-4 h-14">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-iris-hero text-white grid place-items-center font-display font-bold text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
            O
          </span>
          <span className="font-display font-bold tracking-tightest text-ink-12">
            OnSig
          </span>
        </Link>
        <LogoutButton compact />
      </header>

      <div className="flex-1 flex flex-col min-w-0 lg:pr-3 lg:py-3 pt-14 lg:pt-3 pb-20 lg:pb-3">
        <div className="flex-1 flex flex-col min-w-0 bg-paper rounded-2xl border border-divider shadow-sm overflow-hidden">
          <TopBar isAdmin={isAdmin} />
          <main className="flex-1 overflow-y-auto">
            <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-6xl w-full mx-auto animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>

      <MobileNav />
    </div>
  )
}
