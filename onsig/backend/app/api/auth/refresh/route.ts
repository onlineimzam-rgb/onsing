/**
 * POST /api/auth/refresh
 *
 * Reads refresh cookie, mints a new access (+ rotated refresh) and updates cookies.
 *
 * NOTE: Full refresh-token revocation list lives in v0.2 (lib/auth.ts to gain
 * a `revoked_jtis` table). For MVP, rotation alone provides short-lived attack window.
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { eq, and } from 'drizzle-orm'
import { db, schema } from '@/db'
import {
  REFRESH_COOKIE,
  setAuthCookies,
  signAccessToken,
  signRefreshToken,
  verifyRefresh,
} from '@/lib/auth'
import { nanoid } from 'nanoid'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST() {
  const token = cookies().get(REFRESH_COOKIE)?.value
  if (!token) {
    return NextResponse.json(
      { ok: false, error: { code: 'no_refresh_token', message: 'Refresh token bulunamadı.' } },
      { status: 401 }
    )
  }

  const payload = await verifyRefresh(token)
  if (!payload) {
    return NextResponse.json(
      { ok: false, error: { code: 'invalid_refresh', message: 'Refresh token geçersiz.' } },
      { status: 401 }
    )
  }

  const userId = Number(payload.sub)
  const tenantId = payload.tid

  const [membership] = await db
    .select({ role: schema.memberships.role })
    .from(schema.memberships)
    .where(
      and(eq(schema.memberships.userId, userId), eq(schema.memberships.tenantId, tenantId))
    )
    .limit(1)

  if (!membership) {
    return NextResponse.json(
      { ok: false, error: { code: 'no_membership', message: 'Aktif üyelik yok.' } },
      { status: 403 }
    )
  }

  const role = membership.role as 'owner' | 'admin' | 'member'

  const access = await signAccessToken({ sub: String(userId), tid: tenantId, role })
  const refresh = await signRefreshToken({ sub: String(userId), tid: tenantId, jti: nanoid(21) })
  setAuthCookies(access, refresh)

  return NextResponse.json({ ok: true, tenant: { id: tenantId, role } })
}
