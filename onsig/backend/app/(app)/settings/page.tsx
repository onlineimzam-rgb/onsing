import { redirect } from 'next/navigation'
import { getOptionalUser, loadTenant, loadUserAndTenant } from '@/lib/session'
import type { TenantSettings } from '@/db/schema'
import SettingsForm from './SettingsForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Ayarlar · OnSig' }

export default async function SettingsPage() {
  const session = await getOptionalUser()
  if (!session) redirect('/login')

  const [tenant, user] = await Promise.all([
    loadTenant(session.tenantId),
    loadUserAndTenant(session.userId),
  ])
  if (!tenant) redirect('/login')

  const settings = (tenant.settings ?? {}) as TenantSettings

  return (
    <SettingsForm
      tenant={{
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        settings,
      }}
      user={{
        id: user?.id ?? session.userId,
        name: user?.name ?? '',
        email: user?.email ?? '',
        phone: user?.phone ?? '',
      }}
    />
  )
}
