/**
 * GET /api/me — returns the current session's user + tenant info.
 */

import { NextResponse } from 'next/server'
import { loadTenant, loadUserAndTenant, requireUser } from '@/lib/session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const session = await requireUser()
  if (session instanceof NextResponse) return session

  const user = await loadUserAndTenant(session.userId)
  const tenant = await loadTenant(session.tenantId)

  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'user_missing', message: 'Kullanıcı silinmiş.' } },
      { status: 401 }
    )
  }

  return NextResponse.json({
    ok: true,
    user,
    tenant: tenant
      ? {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          plan: tenant.plan,
          settings: tenant.settings,
        }
      : null,
    role: session.role,
  })
}
