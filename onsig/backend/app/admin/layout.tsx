import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getOptionalAdmin } from '@/lib/session'
import { AdminSidebar, AdminMobileBar } from './AdminNav'
import { AdminTopBar } from './AdminTopBar'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { default: 'Operator console', template: '%s · OnSig Ops' },
  robots: { index: false, follow: false },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await getOptionalAdmin()
  if (!admin) redirect('/login?next=/admin')

  const environment = (process.env.NODE_ENV === 'production'
    ? process.env.VERCEL_ENV ?? 'prod'
    : 'dev'
  ).toUpperCase()

  return (
    <div className="admin-shell min-h-screen">
      <AdminSidebar
        userName={admin.userName}
        userEmail={admin.userEmail}
        platformRole={admin.platformRole}
      />
      <AdminMobileBar />

      <div className="lg:pl-[232px] pt-12 lg:pt-0 min-h-screen flex flex-col">
        <AdminTopBar environment={environment} />
        <main className="flex-1 px-5 lg:px-8 py-6 lg:py-8">
          <div className="max-w-[1400px] mx-auto animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  )
}
