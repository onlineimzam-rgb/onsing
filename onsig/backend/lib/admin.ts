/**
 * Server-side data loaders for the /admin surface.
 *
 * Every loader either runs against the live DB (read-only) or returns a
 * computed/aggregated view. All loaders should be cheap enough to call from
 * RSC pages — they are NOT cached at this layer (the page itself can opt into
 * ISR / revalidate when needed).
 */

import { and, count, desc, eq, gt, gte, isNull, lte, ne, or, sql } from 'drizzle-orm'
import { db, schema } from '@/db'

const PLAN_PRICE_TRY: Record<string, number> = {
  free: 0,
  pro: 699,
  business: 2499,
  enterprise: 0, // varies — set explicitly per subscription
}

export function planPriceTRY(plan: string, fallback = 0): number {
  return PLAN_PRICE_TRY[plan] ?? fallback
}

// ─────────────────────────────────────────────────────────────────────────
// Overview metrics
// ─────────────────────────────────────────────────────────────────────────

export interface PlatformOverview {
  tenants: { total: number; lastWeek: number; lastMonth: number }
  users: { total: number; activeLast30d: number }
  contracts: {
    total: number
    last30d: number
    signedLast30d: number
    pending: number
  }
  signSessions: { active: number; signedToday: number }
  mrrTRY: number
  arrTRY: number
  churnPct: number
  signaturesPerDay: { label: string; value: number }[]
  contractsPerDay: { label: string; value: number }[]
  planMix: { plan: string; count: number }[]
}

export async function getPlatformOverview(): Promise<PlatformOverview> {
  const now = new Date()
  const d7  = new Date(now.getTime() - 7 * 24 * 3600_000)
  const d30 = new Date(now.getTime() - 30 * 24 * 3600_000)
  const d60 = new Date(now.getTime() - 60 * 24 * 3600_000)
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)

  const [
    tenantTotalRow,
    tenantsLastWeekRow,
    tenantsLastMonthRow,
    usersTotalRow,
    usersActive30Row,
    contractsTotalRow,
    contracts30Row,
    contractsSigned30Row,
    contractsPendingRow,
    signActiveRow,
    signSignedTodayRow,
    subsActive,
    canceledLast30,
    canceledPrev30,
    signaturesDailyRaw,
    contractsDailyRaw,
    planMixRaw,
  ] = await Promise.all([
    db.select({ c: count() }).from(schema.tenants),
    db.select({ c: count() }).from(schema.tenants).where(gte(schema.tenants.createdAt, d7)),
    db.select({ c: count() }).from(schema.tenants).where(gte(schema.tenants.createdAt, d30)),
    db.select({ c: count() }).from(schema.users),
    db.select({ c: count() }).from(schema.users).where(gte(schema.users.lastLoginAt, d30)),
    db.select({ c: count() }).from(schema.contracts),
    db.select({ c: count() }).from(schema.contracts).where(gte(schema.contracts.createdAt, d30)),
    db
      .select({ c: count() })
      .from(schema.contracts)
      .where(and(gte(schema.contracts.createdAt, d30), eq(schema.contracts.status, 'tamamlandi'))),
    db.select({ c: count() }).from(schema.contracts).where(eq(schema.contracts.status, 'aktif')),
    db
      .select({ c: count() })
      .from(schema.signSessions)
      .where(eq(schema.signSessions.status, 'bekliyor')),
    db
      .select({ c: count() })
      .from(schema.signSessions)
      .where(and(eq(schema.signSessions.status, 'imzalandi'), gte(schema.signSessions.signedAt, startOfToday))),
    db
      .select({ plan: schema.subscriptions.plan, price: schema.subscriptions.pricePerMonth })
      .from(schema.subscriptions)
      .where(or(eq(schema.subscriptions.status, 'active'), eq(schema.subscriptions.status, 'trialing'))),
    db
      .select({ c: count() })
      .from(schema.subscriptions)
      .where(and(gte(schema.subscriptions.canceledAt, d30), eq(schema.subscriptions.status, 'canceled'))),
    db
      .select({ c: count() })
      .from(schema.subscriptions)
      .where(and(gte(schema.subscriptions.canceledAt, d60), lte(schema.subscriptions.canceledAt, d30))),
    db.execute<{ day: string; value: string }>(sql`
      SELECT to_char(date_trunc('day', signed_at), 'DD Mon') AS day,
             COUNT(*)::text AS value
      FROM sign_sessions
      WHERE signed_at IS NOT NULL AND signed_at >= ${d30.toISOString()}::timestamptz
      GROUP BY 1
      ORDER BY MIN(signed_at)
    `),
    db.execute<{ day: string; value: string }>(sql`
      SELECT to_char(date_trunc('day', created_at), 'DD Mon') AS day,
             COUNT(*)::text AS value
      FROM contracts
      WHERE created_at >= ${d30.toISOString()}::timestamptz
      GROUP BY 1
      ORDER BY MIN(created_at)
    `),
    db
      .select({ plan: schema.tenants.plan, c: count() })
      .from(schema.tenants)
      .groupBy(schema.tenants.plan),
  ])

  // MRR — sum of pricePerMonth from active/trialing subs.
  const mrrTRY = subsActive.reduce((sum, s) => sum + (s.price ?? 0), 0)

  const canceledN = canceledLast30[0]?.c ?? 0
  const baseline = (tenantTotalRow[0]?.c ?? 0) - canceledN || 1
  const churnPct = baseline > 0 ? (canceledN / baseline) * 100 : 0

  // Pad daily series with zeros for the 30-day window
  const signaturesPerDay = padDailySeries(d30, signaturesDailyRaw, 30)
  const contractsPerDay = padDailySeries(d30, contractsDailyRaw, 30)

  return {
    tenants: {
      total: tenantTotalRow[0]?.c ?? 0,
      lastWeek: tenantsLastWeekRow[0]?.c ?? 0,
      lastMonth: tenantsLastMonthRow[0]?.c ?? 0,
    },
    users: {
      total: usersTotalRow[0]?.c ?? 0,
      activeLast30d: usersActive30Row[0]?.c ?? 0,
    },
    contracts: {
      total: contractsTotalRow[0]?.c ?? 0,
      last30d: contracts30Row[0]?.c ?? 0,
      signedLast30d: contractsSigned30Row[0]?.c ?? 0,
      pending: contractsPendingRow[0]?.c ?? 0,
    },
    signSessions: {
      active: signActiveRow[0]?.c ?? 0,
      signedToday: signSignedTodayRow[0]?.c ?? 0,
    },
    mrrTRY,
    arrTRY: mrrTRY * 12,
    churnPct,
    signaturesPerDay,
    contractsPerDay,
    planMix: planMixRaw.map((row) => ({ plan: row.plan, count: row.c })),
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Tenant directory
// ─────────────────────────────────────────────────────────────────────────

export interface TenantListRow {
  id: number
  slug: string
  name: string
  plan: string
  createdAt: string
  contractsTotal: number
  contractsLast30d: number
  membersCount: number
  subscriptionStatus: string | null
  subscriptionPriceTRY: number
}

export async function listTenants(): Promise<TenantListRow[]> {
  const d30 = new Date(Date.now() - 30 * 24 * 3600_000)

  const rows = await db.execute<{
    id: number
    slug: string
    name: string
    plan: string
    created_at: Date
    contracts_total: string
    contracts_30: string
    members: string
    sub_status: string | null
    sub_price: string | null
  }>(sql`
    SELECT t.id, t.slug, t.name, t.plan, t.created_at,
           COALESCE((SELECT COUNT(*) FROM contracts c WHERE c.tenant_id = t.id), 0)::text AS contracts_total,
           COALESCE((SELECT COUNT(*) FROM contracts c WHERE c.tenant_id = t.id AND c.created_at >= ${d30.toISOString()}::timestamptz), 0)::text AS contracts_30,
           COALESCE((SELECT COUNT(*) FROM memberships m WHERE m.tenant_id = t.id), 0)::text AS members,
           (SELECT status FROM subscriptions s WHERE s.tenant_id = t.id ORDER BY s.created_at DESC LIMIT 1) AS sub_status,
           (SELECT price_per_month FROM subscriptions s WHERE s.tenant_id = t.id ORDER BY s.created_at DESC LIMIT 1)::text AS sub_price
    FROM tenants t
    ORDER BY t.created_at DESC
  `)

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    plan: r.plan,
    createdAt: typeof r.created_at === 'string' ? r.created_at : new Date(r.created_at).toISOString(),
    contractsTotal: Number(r.contracts_total),
    contractsLast30d: Number(r.contracts_30),
    membersCount: Number(r.members),
    subscriptionStatus: r.sub_status,
    subscriptionPriceTRY: Number(r.sub_price ?? planPriceTRY(r.plan)),
  }))
}

export async function getTenantDetail(tenantId: number) {
  const [tenant] = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.id, tenantId))
    .limit(1)
  if (!tenant) return null

  const [members, contractsAgg, signAgg, branches, subscription, recentInvoices, owners] =
    await Promise.all([
      db
        .select({
          membershipId: schema.memberships.id,
          role: schema.memberships.role,
          createdAt: schema.memberships.createdAt,
          userId: schema.users.id,
          name: schema.users.name,
          email: schema.users.email,
          lastLoginAt: schema.users.lastLoginAt,
        })
        .from(schema.memberships)
        .innerJoin(schema.users, eq(schema.users.id, schema.memberships.userId))
        .where(eq(schema.memberships.tenantId, tenantId))
        .orderBy(desc(schema.memberships.createdAt))
        .limit(50),
      db
        .select({
          total: count(),
        })
        .from(schema.contracts)
        .where(eq(schema.contracts.tenantId, tenantId)),
      db
        .select({ total: count() })
        .from(schema.signSessions)
        .where(eq(schema.signSessions.tenantId, tenantId)),
      db
        .select()
        .from(schema.branches)
        .where(eq(schema.branches.tenantId, tenantId))
        .orderBy(desc(schema.branches.createdAt)),
      db
        .select()
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.tenantId, tenantId))
        .orderBy(desc(schema.subscriptions.createdAt))
        .limit(1),
      db
        .select()
        .from(schema.invoices)
        .where(eq(schema.invoices.tenantId, tenantId))
        .orderBy(desc(schema.invoices.issuedAt))
        .limit(8),
      db
        .select({ count: count() })
        .from(schema.memberships)
        .where(and(eq(schema.memberships.tenantId, tenantId), eq(schema.memberships.role, 'owner'))),
    ])

  return {
    tenant,
    members,
    branches,
    contractsTotal: contractsAgg[0]?.total ?? 0,
    signSessionsTotal: signAgg[0]?.total ?? 0,
    subscription: subscription[0] ?? null,
    recentInvoices,
    ownerCount: owners[0]?.count ?? 0,
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Global contract / sign-session loaders (cross-tenant)
// ─────────────────────────────────────────────────────────────────────────

export interface GlobalContractRow {
  id: number
  tenantId: number
  tenantName: string
  templateKey: string
  status: string
  title: string | null
  createdAt: Date
}

export async function listGlobalContracts(limit = 200): Promise<GlobalContractRow[]> {
  const rows = await db
    .select({
      id: schema.contracts.id,
      tenantId: schema.contracts.tenantId,
      tenantName: schema.tenants.name,
      templateKey: schema.contracts.templateKey,
      status: schema.contracts.status,
      title: schema.contracts.title,
      createdAt: schema.contracts.createdAt,
    })
    .from(schema.contracts)
    .innerJoin(schema.tenants, eq(schema.tenants.id, schema.contracts.tenantId))
    .orderBy(desc(schema.contracts.createdAt))
    .limit(limit)
  return rows
}

export interface GlobalSignSessionRow {
  id: number
  tenantId: number
  tenantName: string
  contractId: number
  contractTitle: string | null
  role: string
  status: string
  recipientName: string | null
  signedAt: Date | null
  expiresAt: Date | null
  createdAt: Date
}

export async function listGlobalSignSessions(limit = 200): Promise<GlobalSignSessionRow[]> {
  const rows = await db
    .select({
      id: schema.signSessions.id,
      tenantId: schema.signSessions.tenantId,
      tenantName: schema.tenants.name,
      contractId: schema.signSessions.contractId,
      contractTitle: schema.contracts.title,
      role: schema.signSessions.role,
      status: schema.signSessions.status,
      recipientName: schema.signSessions.recipientName,
      signedAt: schema.signSessions.signedAt,
      expiresAt: schema.signSessions.expiresAt,
      createdAt: schema.signSessions.createdAt,
    })
    .from(schema.signSessions)
    .innerJoin(schema.tenants, eq(schema.tenants.id, schema.signSessions.tenantId))
    .leftJoin(schema.contracts, eq(schema.contracts.id, schema.signSessions.contractId))
    .orderBy(desc(schema.signSessions.createdAt))
    .limit(limit)
  return rows
}

// ─────────────────────────────────────────────────────────────────────────
// Audit log (global, across all tenants)
// ─────────────────────────────────────────────────────────────────────────

export async function listGlobalAudit(limit = 300) {
  const rows = await db
    .select({
      id: schema.auditLogs.id,
      tenantId: schema.auditLogs.tenantId,
      tenantName: schema.tenants.name,
      actorId: schema.auditLogs.actorId,
      entityKind: schema.auditLogs.entityKind,
      entityId: schema.auditLogs.entityId,
      eventType: schema.auditLogs.eventType,
      ip: schema.auditLogs.ip,
      recordHash: schema.auditLogs.recordHash,
      createdAt: schema.auditLogs.createdAt,
    })
    .from(schema.auditLogs)
    .leftJoin(schema.tenants, eq(schema.tenants.id, schema.auditLogs.tenantId))
    .orderBy(desc(schema.auditLogs.id))
    .limit(limit)
  return rows
}

// ─────────────────────────────────────────────────────────────────────────
// Billing
// ─────────────────────────────────────────────────────────────────────────

export async function getBillingOverview() {
  const [activeSubs, allInvoices, pastDue] = await Promise.all([
    db
      .select({ plan: schema.subscriptions.plan, price: schema.subscriptions.pricePerMonth, status: schema.subscriptions.status })
      .from(schema.subscriptions),
    db
      .select({
        id: schema.invoices.id,
        tenantId: schema.invoices.tenantId,
        tenantName: schema.tenants.name,
        number: schema.invoices.number,
        status: schema.invoices.status,
        total: schema.invoices.total,
        tax: schema.invoices.tax,
        issuedAt: schema.invoices.issuedAt,
        dueAt: schema.invoices.dueAt,
        paidAt: schema.invoices.paidAt,
      })
      .from(schema.invoices)
      .leftJoin(schema.tenants, eq(schema.tenants.id, schema.invoices.tenantId))
      .orderBy(desc(schema.invoices.issuedAt))
      .limit(40),
    db
      .select({ c: count() })
      .from(schema.invoices)
      .where(eq(schema.invoices.status, 'past_due')),
  ])

  const mrr = activeSubs
    .filter((s) => s.status === 'active' || s.status === 'trialing')
    .reduce((sum, s) => sum + (s.price ?? 0), 0)

  const planBreakdown = new Map<string, { count: number; mrr: number }>()
  for (const s of activeSubs) {
    if (s.status !== 'active' && s.status !== 'trialing') continue
    const entry = planBreakdown.get(s.plan) ?? { count: 0, mrr: 0 }
    entry.count += 1
    entry.mrr += s.price ?? 0
    planBreakdown.set(s.plan, entry)
  }

  return {
    mrr,
    arr: mrr * 12,
    pastDueCount: pastDue[0]?.c ?? 0,
    invoices: allInvoices,
    planBreakdown: Array.from(planBreakdown.entries()).map(([plan, v]) => ({
      plan,
      ...v,
    })),
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Risk events
// ─────────────────────────────────────────────────────────────────────────

export async function listRiskEvents(limit = 150) {
  return db
    .select({
      id: schema.riskEvents.id,
      tenantId: schema.riskEvents.tenantId,
      tenantName: schema.tenants.name,
      kind: schema.riskEvents.kind,
      severity: schema.riskEvents.severity,
      description: schema.riskEvents.description,
      ip: schema.riskEvents.ip,
      resolvedAt: schema.riskEvents.resolvedAt,
      createdAt: schema.riskEvents.createdAt,
    })
    .from(schema.riskEvents)
    .leftJoin(schema.tenants, eq(schema.tenants.id, schema.riskEvents.tenantId))
    .orderBy(desc(schema.riskEvents.id))
    .limit(limit)
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

function padDailySeries(
  start: Date,
  rows: Array<{ day: string; value: string }>,
  days: number
): { label: string; value: number }[] {
  const map = new Map<string, number>()
  for (const r of rows) map.set(r.day, Number(r.value))
  const out: { label: string; value: number }[] = []
  const startOfDay = new Date(start)
  startOfDay.setHours(0, 0, 0, 0)
  for (let i = 0; i < days; i++) {
    const d = new Date(startOfDay.getTime() + i * 24 * 3600_000)
    const label = formatDayLabel(d)
    out.push({ label, value: map.get(label) ?? 0 })
  }
  return out
}

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
function formatDayLabel(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]}`
}

export function fmtTRY(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function fmtNumber(n: number): string {
  return new Intl.NumberFormat('tr-TR').format(n)
}
