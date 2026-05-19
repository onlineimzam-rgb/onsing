/**
 * Route helpers — session resolution for API handlers.
 *
 * Usage in route handlers:
 *
 *   const session = await requireUser()
 *   if (session instanceof NextResponse) return session
 *   // session.userId, session.tenantId, session.role available
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { eq } from 'drizzle-orm'
import { db, schema } from '@/db'
import { ACCESS_COOKIE, verifyAccess, type AccessTokenPayload } from './auth'

export type PlatformRole =
  | 'none'
  | 'super_admin'
  | 'support'
  | 'finance'
  | 'moderator'

export interface ResolvedSession {
  userId: number
  tenantId: number
  role: 'owner' | 'admin' | 'member'
  payload: AccessTokenPayload
}

export interface ResolvedAdminSession extends ResolvedSession {
  platformRole: Exclude<PlatformRole, 'none'>
  userName: string
  userEmail: string | null
}

export async function getOptionalUser(): Promise<ResolvedSession | null> {
  const token = cookies().get(ACCESS_COOKIE)?.value
  if (!token) return null
  const payload = await verifyAccess(token)
  if (!payload) return null
  return {
    userId: Number(payload.sub),
    tenantId: payload.tid,
    role: payload.role,
    payload,
  }
}

export async function requireUser(): Promise<ResolvedSession | NextResponse> {
  const s = await getOptionalUser()
  if (s) return s
  return NextResponse.json(
    { ok: false, error: { code: 'unauthenticated', message: 'Oturum gerekli.' } },
    { status: 401 }
  )
}

export async function requireRole(
  roles: Array<'owner' | 'admin' | 'member'>
): Promise<ResolvedSession | NextResponse> {
  const s = await requireUser()
  if (s instanceof NextResponse) return s
  if (!roles.includes(s.role)) {
    return NextResponse.json(
      { ok: false, error: { code: 'forbidden', message: 'Bu işlem için yetkiniz yok.' } },
      { status: 403 }
    )
  }
  return s
}

export async function loadUserAndTenant(userId: number) {
  const [user] = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      phone: schema.users.phone,
      emailVerifiedAt: schema.users.emailVerifiedAt,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1)
  return user || null
}

export async function loadTenant(tenantId: number) {
  const [tenant] = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.id, tenantId))
    .limit(1)
  return tenant || null
}

// ───────────────────────────────────────────────────────────────────────────
// Platform / SaaS admin helpers
//
// `users.platformRole` is fetched fresh from the DB on every check so that
// revoking admin privileges takes effect immediately (no stale JWT). The
// platform role lives outside of the tenant model.
// ───────────────────────────────────────────────────────────────────────────
export async function getOptionalAdmin(): Promise<ResolvedAdminSession | null> {
  const session = await getOptionalUser()
  if (!session) return null
  const [user] = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      platformRole: schema.users.platformRole,
    })
    .from(schema.users)
    .where(eq(schema.users.id, session.userId))
    .limit(1)
  if (!user || user.platformRole === 'none') return null
  return {
    ...session,
    platformRole: user.platformRole as Exclude<PlatformRole, 'none'>,
    userName: user.name,
    userEmail: user.email ?? null,
  }
}

export async function requireAdmin(
  roles: Array<Exclude<PlatformRole, 'none'>> = [
    'super_admin',
    'support',
    'finance',
    'moderator',
  ]
): Promise<ResolvedAdminSession | NextResponse> {
  const admin = await getOptionalAdmin()
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: { code: 'forbidden', message: 'Admin yetkisi gerekli.' } },
      { status: 403 }
    )
  }
  if (!roles.includes(admin.platformRole)) {
    return NextResponse.json(
      { ok: false, error: { code: 'forbidden', message: 'Bu işlem için yetkiniz yok.' } },
      { status: 403 }
    )
  }
  return admin
}

export async function requireSuperAdmin(): Promise<
  ResolvedAdminSession | NextResponse
> {
  return requireAdmin(['super_admin'])
}
