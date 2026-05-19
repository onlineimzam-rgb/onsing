/**
 * POST /api/auth/register
 *
 * Creates a new user, attaches them to the default tenant as `owner` (MVP),
 * issues access + refresh tokens via httpOnly cookies, and writes an audit log.
 *
 * Multi-tenant signup (separate workspaces) lands in v0.2.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { eq, inArray } from 'drizzle-orm'
import { db, schema } from '@/db'
import {
  hashPassword,
  setAuthCookies,
  signAccessToken,
  signRefreshToken,
} from '@/lib/auth'
import { appendAudit } from '@/lib/audit'
import { getClientIp, getUserAgent } from '@/lib/ip'
import { uniqueSlug } from '@/lib/slugify'
import { nanoid } from 'nanoid'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const Body = z.object({
  name: z.string().trim().min(2, 'Ad Soyad en az 2 karakter olmalı.').max(200),
  email: z.string().trim().toLowerCase().email('Geçerli bir e-posta girin.'),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(40)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalı.').max(200),
  /** Firma / kuruluş adı. Required for new-workspace signups, ignored when
   * `invite` is present (in that case we join the inviter's tenant). */
  companyName: z
    .string()
    .trim()
    .min(2, 'Firma adı en az 2 karakter olmalı.')
    .max(200)
    .optional()
    .nullable(),
  /** Optional invite token — when present, the new user joins the inviter's
   * tenant with the role saved on the invite. */
  invite: z.string().trim().min(8).max(96).optional().nullable(),
})

export async function POST(req: NextRequest) {
  let body: z.infer<typeof Body>
  try {
    body = Body.parse(await req.json())
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.errors[0]?.message : (e as Error).message
    return NextResponse.json(
      { ok: false, error: { code: 'invalid_input', message: msg || 'Geçersiz veri.' } },
      { status: 400 }
    )
  }

  // 1. Resolve target tenant + role.
  //    - With invite  → join the inviter's tenant
  //    - Without invite → create a brand-new tenant (firma) for this user
  let invite: typeof schema.teamInvites.$inferSelect | null = null
  if (body.invite) {
    const [row] = await db
      .select()
      .from(schema.teamInvites)
      .where(eq(schema.teamInvites.token, body.invite))
      .limit(1)
    if (!row) {
      return NextResponse.json(
        { ok: false, error: { code: 'invite_not_found', message: 'Davet bulunamadı.' } },
        { status: 404 }
      )
    }
    if (row.consumedAt) {
      return NextResponse.json(
        { ok: false, error: { code: 'invite_consumed', message: 'Bu davet daha önce kullanılmış.' } },
        { status: 410 }
      )
    }
    if (row.expiresAt && new Date(row.expiresAt) < new Date()) {
      return NextResponse.json(
        { ok: false, error: { code: 'invite_expired', message: 'Davetin süresi dolmuş.' } },
        { status: 410 }
      )
    }
    invite = row
  }

  // Self-serve signup REQUIRES a company name; we'd otherwise create
  // anonymous workspaces named after the slugify default ("workspace") which
  // is awful UX. With an invite the field is optional (the inviter's tenant
  // already exists).
  if (!invite && !body.companyName) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'company_required',
          message: 'Firma adı zorunludur (yeni hesap için).',
        },
      },
      { status: 400 }
    )
  }

  let tenantId: number
  if (invite) {
    tenantId = invite.tenantId
  } else {
    // Build a tenant for this signup. Slug must be unique across the table —
    // pull the candidate roots in one shot and let `uniqueSlug` suffix as
    // needed. Race conditions between concurrent identical company names
    // would still be caught by the DB unique index and bubble up as 500;
    // acceptable for now.
    const base = body.companyName!.trim()
    const root = base
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 32)
    const collisions = await db
      .select({ slug: schema.tenants.slug })
      .from(schema.tenants)
      .where(
        inArray(
          schema.tenants.slug,
          // Probe `root`, `root-2`, ..., `root-9`. Cheap pre-fetch keeps us
          // off the hot path for 99% of names while still racing the index.
          [root, ...Array.from({ length: 8 }, (_, i) => `${root}-${i + 2}`)]
        )
      )
    const existing = new Set(collisions.map((r) => r.slug))
    const slug = uniqueSlug(base, existing)

    const [created] = await db
      .insert(schema.tenants)
      .values({
        slug,
        name: base,
        plan: 'free',
        settings: { legalName: base, defaultLocale: 'tr' },
      })
      .returning({ id: schema.tenants.id })

    if (!created) {
      return NextResponse.json(
        { ok: false, error: { code: 'tenant_failed', message: 'Firma oluşturulamadı.' } },
        { status: 500 }
      )
    }
    tenantId = created.id

    // Give every new tenant a free trial subscription so the dashboard's
    // billing widget renders without empty-state spaghetti.
    const trialEnds = new Date()
    trialEnds.setUTCDate(trialEnds.getUTCDate() + 14)
    await db.insert(schema.subscriptions).values({
      tenantId,
      plan: 'free',
      status: 'trialing',
      pricePerMonth: 0,
      seats: 5,
      trialEndsAt: trialEnds,
      currentPeriodStart: new Date(),
      currentPeriodEnd: trialEnds,
    })
  }

  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, body.email))
    .limit(1)

  if (existing.length > 0) {
    return NextResponse.json(
      { ok: false, error: { code: 'email_taken', message: 'Bu e-posta zaten kayıtlı.' } },
      { status: 409 }
    )
  }

  const passwordHash = await hashPassword(body.password)

  const [user] = await db
    .insert(schema.users)
    .values({
      name: body.name,
      email: body.email,
      phone: body.phone,
      passwordHash,
    })
    .returning({ id: schema.users.id })

  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'create_failed', message: 'Kullanıcı oluşturulamadı.' } },
      { status: 500 }
    )
  }

  // Determine role:
  //   - invite present → role from invite
  //   - new-tenant signup → owner (they just created the workspace)
  const role: 'owner' | 'admin' | 'member' = invite
    ? (invite.role as 'owner' | 'admin' | 'member')
    : 'owner'

  await db.insert(schema.memberships).values({
    tenantId,
    userId: user.id,
    role,
  })

  if (invite) {
    await db
      .update(schema.teamInvites)
      .set({ consumedAt: new Date(), consumedByUserId: user.id })
      .where(eq(schema.teamInvites.id, invite.id))
  }

  const ip = getClientIp(req)
  const ua = getUserAgent(req)

  await appendAudit({
    tenantId,
    actorId: user.id,
    entityKind: 'user',
    entityId: user.id,
    eventType: 'user.registered',
    metadata: {
      role,
      email: body.email,
      viaInvite: invite ? invite.id : null,
    },
    ip,
    userAgent: ua,
  })

  const access = await signAccessToken({ sub: String(user.id), tid: tenantId, role })
  const refresh = await signRefreshToken({ sub: String(user.id), tid: tenantId, jti: nanoid(21) })
  setAuthCookies(access, refresh)

  return NextResponse.json({
    ok: true,
    user: { id: user.id, name: body.name, email: body.email, phone: body.phone },
    tenant: { id: tenantId, role },
  })
}
