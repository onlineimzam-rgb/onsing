/**
 * GET /api/dashboard/summary
 *
 * Single round-trip the mobile (and a future web) dashboard uses to render
 * "Komuta Merkezi": current counters, a 7-day signed-contract sparkline, the
 * most recent activity, and the contracts that need attention.
 *
 * Everything is scoped to the caller's tenant. We keep this hand-rolled (no
 * generic /api/contracts/stats yet) so the shape is tuned to exactly what the
 * Stitch dashboard mockup consumes.
 */

import { NextResponse } from 'next/server'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'

import { db, schema } from '@/db'
import { requireUser } from '@/lib/session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface FeedItem {
  id: number
  kind: 'signed' | 'sent' | 'viewed'
  actor: string | null
  contractId: number
  contractTitle: string
  at: string
}

interface CriticalAction {
  contractId: number
  title: string
  recipientName: string | null
  severity: 'high' | 'medium' | 'low'
  createdAt: string
}

export async function GET() {
  const session = await requireUser()
  if (session instanceof NextResponse) return session

  const tenantId = session.tenantId
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // ─── 1. Headline counters ───────────────────────────────────────────────
  const [pendingRow] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(schema.contracts)
    .where(
      and(
        eq(schema.contracts.tenantId, tenantId),
        sql`${schema.contracts.status} in ('taslak','aktif')`
      )
    )

  const [completedRow] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(schema.contracts)
    .where(
      and(
        eq(schema.contracts.tenantId, tenantId),
        eq(schema.contracts.status, 'tamamlandi')
      )
    )

  const [pendingNewRow] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(schema.contracts)
    .where(
      and(
        eq(schema.contracts.tenantId, tenantId),
        sql`${schema.contracts.status} in ('taslak','aktif')`,
        sql`${schema.contracts.createdAt} >= ${sevenDaysAgo}`
      )
    )

  // ─── 2. Weekly histogram (signed contracts per day, Mon..Sun pattern) ───
  // Postgres `date_trunc` is used to bucket; we then pad missing days with 0
  // so the front-end can chart 7 bars reliably regardless of activity.
  const weeklyRows = await db.execute<{ day: string; c: number }>(sql`
    SELECT to_char(date_trunc('day', signed_at), 'YYYY-MM-DD') AS day,
           count(*)::int AS c
    FROM sign_sessions
    WHERE tenant_id = ${tenantId}
      AND status = 'imzalandi'
      AND signed_at >= ${sevenDaysAgo.toISOString()}
    GROUP BY 1
    ORDER BY 1
  `)

  const weekly: number[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    const row = (weeklyRows as unknown as Array<{ day: string; c: number }>).find(
      (r) => r.day === key
    )
    weekly.push(row ? row.c : 0)
  }
  const weeklyTotal = weekly.reduce((a, b) => a + b, 0)

  // ─── 3. Live activity feed (last 5 events, sign_sessions + creations) ───
  // Pulled straight from sign_sessions so we get signer name + contract title
  // in a single join, no audit-log post-processing required.
  const recentSessions = await db.execute<{
    id: number
    status: string
    signed_at: string | null
    created_at: string
    recipient_name: string | null
    contract_id: number
    contract_title: string | null
  }>(sql`
    SELECT ss.id,
           ss.status,
           ss.signed_at,
           ss.created_at,
           ss.recipient_name,
           c.id AS contract_id,
           c.title AS contract_title
    FROM sign_sessions ss
    JOIN contracts c ON c.id = ss.contract_id
    WHERE ss.tenant_id = ${tenantId}
    ORDER BY COALESCE(ss.signed_at, ss.created_at) DESC
    LIMIT 5
  `)

  const liveFeed: FeedItem[] = (recentSessions as unknown as Array<{
    id: number
    status: string
    signed_at: string | null
    created_at: string
    recipient_name: string | null
    contract_id: number
    contract_title: string | null
  }>).map((r) => ({
    id: r.id,
    kind:
      r.status === 'imzalandi'
        ? 'signed'
        : r.status === 'bekliyor'
          ? 'sent'
          : 'viewed',
    actor: r.recipient_name,
    contractId: r.contract_id,
    contractTitle: r.contract_title || 'Sözleşme',
    at: (r.signed_at || r.created_at) as unknown as string,
  }))

  // ─── 4. Critical actions (active contracts w/ pending sign sessions) ────
  // Severity rank: contracts older than 3 days → high, 1-3 days → medium,
  // otherwise → low. Once "deadline" is added to sign_sessions we'll switch
  // this to compute against that instead of contract age.
  const criticalRaw = await db.execute<{
    contract_id: number
    title: string | null
    recipient_name: string | null
    created_at: string
    age_days: number
  }>(sql`
    SELECT DISTINCT ON (c.id)
           c.id AS contract_id,
           c.title,
           ss.recipient_name,
           ss.created_at,
           EXTRACT(EPOCH FROM (now() - ss.created_at)) / 86400 AS age_days
    FROM contracts c
    JOIN sign_sessions ss ON ss.contract_id = c.id
    WHERE c.tenant_id = ${tenantId}
      AND c.status IN ('taslak','aktif')
      AND ss.status = 'bekliyor'
    ORDER BY c.id, ss.created_at ASC
    LIMIT 8
  `)

  const criticalActions: CriticalAction[] = (criticalRaw as unknown as Array<{
    contract_id: number
    title: string | null
    recipient_name: string | null
    created_at: string
    age_days: number
  }>).map((r) => ({
    contractId: r.contract_id,
    title: r.title || 'Sözleşme',
    recipientName: r.recipient_name,
    severity: r.age_days >= 3 ? 'high' : r.age_days >= 1 ? 'medium' : 'low',
    createdAt: r.created_at as unknown as string,
  }))

  return NextResponse.json({
    ok: true,
    stats: {
      pending: pendingRow?.c ?? 0,
      completed: completedRow?.c ?? 0,
      pendingNew: pendingNewRow?.c ?? 0,
      weekly,
      weeklyCompleted: weeklyTotal,
    },
    liveFeed,
    criticalActions,
    // Echo the resolved tenant + caller for the greeting card. The mobile
    // already has `user.fullName` in its SecureStore, but exposing it here
    // means a future password-change or rename is reflected on next refresh
    // without forcing a logout.
    me: await loadMe(session.userId, session.tenantId),
  })
}

async function loadMe(userId: number, tenantId: number) {
  const [user] = await db
    .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1)
  const [tenant] = await db
    .select({
      id: schema.tenants.id,
      name: schema.tenants.name,
      slug: schema.tenants.slug,
    })
    .from(schema.tenants)
    .where(eq(schema.tenants.id, tenantId))
    .limit(1)
  return {
    user: user
      ? { id: user.id, name: user.name, email: user.email }
      : null,
    tenant: tenant
      ? { id: tenant.id, name: tenant.name, slug: tenant.slug }
      : null,
  }
}

// inArray is exported just so it can be referenced from future ramps (e.g.
// filtered listFeedByType). Silences the unused-import warning for now.
void inArray
