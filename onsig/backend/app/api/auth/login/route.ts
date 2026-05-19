/**
 * POST /api/auth/login
 *
 * Body: { email, password }
 * On success: sets httpOnly access + refresh cookies, returns user/tenant info.
 *
 * NOTE: Generic error message on failure to avoid email enumeration.
 * Audit logs both successful and failed attempts (no password content).
 */

import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, schema } from '@/db'
import {
  setAuthCookies,
  signAccessToken,
  signRefreshToken,
  verifyPassword,
} from '@/lib/auth'
import { appendAudit } from '@/lib/audit'
import { getClientIp, getUserAgent } from '@/lib/ip'
import { getDefaultTenantId } from '@/lib/tenant'
import { nanoid } from 'nanoid'
import { rateLimitOrBlock } from '@/lib/rate-limit'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const Body = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
})

const GENERIC_FAIL = {
  ok: false,
  error: { code: 'invalid_credentials', message: 'E-posta veya şifre hatalı.' },
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const ua = getUserAgent(req)
  const reqId = req.headers.get('x-request-id') ?? '-'
  const log = logger.child({ requestId: reqId, route: '/api/auth/login' })

  // ─── Rate limit (per-IP, then per-email) ──────────────────────────────────
  const ipBlock = await rateLimitOrBlock({
    key: `login:ip:${ip}`,
    limit: env.RATE_LIMIT_LOGIN_PER_MIN,
    windowSec: 60,
  })
  if (ipBlock) {
    log.warn('login_rate_limited', { scope: 'ip', ip })
    return ipBlock
  }

  let body: z.infer<typeof Body>
  try {
    body = Body.parse(await req.json())
  } catch {
    return NextResponse.json(GENERIC_FAIL, { status: 400 })
  }

  const emailBlock = await rateLimitOrBlock({
    key: `login:email:${body.email}`,
    limit: env.RATE_LIMIT_LOGIN_PER_MIN,
    windowSec: 60,
  })
  if (emailBlock) {
    log.warn('login_rate_limited', { scope: 'email', email: body.email })
    return emailBlock
  }

  // ─── 1. Locate user ───────────────────────────────────────────────────────
  // We need the user row before we can look up memberships, so the early audit
  // log on bad credentials uses `getDefaultTenantId()` as a fallback bucket.
  const [user] = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      phone: schema.users.phone,
      passwordHash: schema.users.passwordHash,
    })
    .from(schema.users)
    .where(eq(schema.users.email, body.email))
    .limit(1)

  if (!user || !user.passwordHash) {
    await appendAudit({
      tenantId: await getDefaultTenantId(),
      actorId: null,
      entityKind: 'user',
      entityId: 0,
      eventType: 'auth.login_failed',
      metadata: { email: body.email, reason: 'no_user' },
      ip,
      userAgent: ua,
    })
    return NextResponse.json(GENERIC_FAIL, { status: 401 })
  }

  const ok = await verifyPassword(body.password, user.passwordHash)
  if (!ok) {
    await appendAudit({
      tenantId: await getDefaultTenantId(),
      actorId: user.id,
      entityKind: 'user',
      entityId: user.id,
      eventType: 'auth.login_failed',
      metadata: { email: body.email, reason: 'bad_password' },
      ip,
      userAgent: ua,
    })
    return NextResponse.json(GENERIC_FAIL, { status: 401 })
  }

  // ─── 2. Resolve active tenant from membership ─────────────────────────────
  // A user can own multiple workspaces. At login we pick the "best" one by
  // role rank (owner > admin > member), tie-breaker most recent membership.
  // The workspace-switcher UI (planned for v0.2) will let users hop between
  // memberships post-login.
  //
  // Orphan users (no memberships at all) fall back to the default tenant as
  // 'member' — keeps dev seeds and legacy single-tenant data accessible.
  const userMemberships = await db
    .select({
      tenantId: schema.memberships.tenantId,
      role: schema.memberships.role,
      createdAt: schema.memberships.createdAt,
    })
    .from(schema.memberships)
    .where(eq(schema.memberships.userId, user.id))

  type Role = 'owner' | 'admin' | 'member'
  const ROLE_RANK: Record<Role, number> = { owner: 3, admin: 2, member: 1 }

  let tenantId: number
  let role: Role

  if (userMemberships.length === 0) {
    tenantId = await getDefaultTenantId()
    role = 'member'
  } else {
    const sorted = [...userMemberships].sort((a, b) => {
      const ra = ROLE_RANK[(a.role as Role)] ?? 0
      const rb = ROLE_RANK[(b.role as Role)] ?? 0
      if (rb !== ra) return rb - ra
      const ta = a.createdAt ? new Date(a.createdAt as unknown as string).getTime() : 0
      const tb = b.createdAt ? new Date(b.createdAt as unknown as string).getTime() : 0
      return tb - ta
    })
    tenantId = sorted[0]!.tenantId
    role = (sorted[0]!.role as Role) ?? 'member'
  }

  const access = await signAccessToken({ sub: String(user.id), tid: tenantId, role })
  const refresh = await signRefreshToken({ sub: String(user.id), tid: tenantId, jti: nanoid(21) })
  setAuthCookies(access, refresh)

  // Surface tenant display info so mobile clients (which can't read httpOnly
  // cookies in JS) have everything they need from a single login round-trip.
  const [tenant] = await db
    .select({
      id: schema.tenants.id,
      name: schema.tenants.name,
      slug: schema.tenants.slug,
    })
    .from(schema.tenants)
    .where(eq(schema.tenants.id, tenantId))
    .limit(1)

  await appendAudit({
    tenantId,
    actorId: user.id,
    entityKind: 'user',
    entityId: user.id,
    eventType: 'auth.login',
    metadata: { email: user.email },
    ip,
    userAgent: ua,
  })

  return NextResponse.json({
    ok: true,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    tenant: {
      id: tenantId,
      name: tenant?.name ?? null,
      slug: tenant?.slug ?? null,
      role,
    },
    // For mobile clients — web ignores these and relies on httpOnly cookies.
    accessToken: access,
    refreshToken: refresh,
  })
}
