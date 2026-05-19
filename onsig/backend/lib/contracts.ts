/**
 * Contract orchestration — bridges DB schema with the shared contract engine.
 *
 * Routes call into this module rather than touching `db.ts` + `shared/contracts`
 * directly. This keeps validation, rendering, and audit hooks in one place.
 */

import { z } from 'zod'
import { and, desc, eq } from 'drizzle-orm'
import { db, schema } from '@/db'
import type { TenantSettings } from '@/db/schema'
import {
  buildContractText,
  EMPTY_CONTRACT_FORM,
  findTemplate,
  isRealEstateKey,
  type ContractFormState,
  type ContractRenderContext,
  type Sector,
} from '@shared/contracts'

// ---------------------------------------------------------------------------
// Form schema (loose for MVP — strings everywhere; renderer does sane fallbacks)
// ---------------------------------------------------------------------------
const FormSchema = z.record(z.string(), z.string()).optional()

export const CreateContractSchema = z.object({
  sector: z.enum(['real-estate', 'freelance', 'business', 'education', 'health', 'other'] as const),
  templateKey: z.string().min(1),
  title: z.string().trim().max(240).optional().nullable(),
  form: FormSchema,
  /** Optional branch (location) to attach the contract to. */
  branchId: z.number().int().positive().optional().nullable(),
})
export type CreateContractInput = z.infer<typeof CreateContractSchema>

export const UpdateContractSchema = z.object({
  title: z.string().trim().max(240).optional().nullable(),
  status: z.enum(['taslak', 'aktif', 'tamamlandi', 'iptal'] as const).optional(),
  form: FormSchema,
})
export type UpdateContractInput = z.infer<typeof UpdateContractSchema>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export interface BranchLike {
  name: string
  address: string | null
  city: string | null
  phone: string | null
  email: string | null
  licenseNo: string | null
}

export function buildContextFromTenant(
  t: { name: string; settings: TenantSettings | unknown },
  branch?: BranchLike | null
): ContractRenderContext {
  const s = (t.settings && typeof t.settings === 'object' ? (t.settings as TenantSettings) : {}) as TenantSettings

  // Branch (when supplied) overrides matching tenant-level fields. This keeps a
  // tenant-wide default behaviour while letting multi-branch ofisses customise
  // the broker block per contract.
  const tenantAddress = [s.address, s.city].filter(Boolean).join(', ')
  const branchAddress = branch ? [branch.address, branch.city].filter(Boolean).join(', ') : ''

  return {
    brokerName: branch?.name || t.name,
    brokerAddress: branchAddress || tenantAddress,
    brokerPhone: branch?.phone || s.phone || '',
    brokerEmail: branch?.email || s.email || s.brand?.senderEmail || '',
    brokerageLicenseNo: branch?.licenseNo || s.brokerageLicenseNo || '',
    competentCourt: s.competentCourt ?? 'İSTANBUL',
  }
}

export async function loadBranch(tenantId: number, branchId: number | null | undefined) {
  if (!branchId) return null
  const [row] = await db
    .select()
    .from(schema.branches)
    .where(and(eq(schema.branches.id, branchId), eq(schema.branches.tenantId, tenantId)))
    .limit(1)
  return row || null
}

export async function loadDefaultBranch(tenantId: number) {
  const [row] = await db
    .select()
    .from(schema.branches)
    .where(and(eq(schema.branches.tenantId, tenantId), eq(schema.branches.isDefault, true)))
    .limit(1)
  return row || null
}

export function mergeForm(
  current: unknown,
  patch?: Record<string, string> | Partial<ContractFormState>
): ContractFormState {
  const base = (current && typeof current === 'object' ? current : {}) as Partial<ContractFormState>
  return {
    ...EMPTY_CONTRACT_FORM,
    ...base,
    ...(patch || {}),
  } as ContractFormState
}

export function validateTemplate(sector: Sector, key: string): { ok: true } | { ok: false; message: string } {
  const t = findTemplate(sector, key)
  if (!t) return { ok: false, message: `Şablon bulunamadı: ${sector}/${key}` }
  if (sector === 'real-estate' && !isRealEstateKey(key)) {
    return { ok: false, message: 'Geçersiz emlak şablonu.' }
  }
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------
export interface ContractListItem {
  id: number
  sector: string
  templateKey: string
  templateLabel: string | null
  title: string | null
  status: string
  createdAt: Date
  updatedAt: Date
}

export async function listContracts(tenantId: number): Promise<ContractListItem[]> {
  const rows = await db
    .select({
      id: schema.contracts.id,
      sector: schema.contracts.sector,
      templateKey: schema.contracts.templateKey,
      title: schema.contracts.title,
      status: schema.contracts.status,
      createdAt: schema.contracts.createdAt,
      updatedAt: schema.contracts.updatedAt,
    })
    .from(schema.contracts)
    .where(eq(schema.contracts.tenantId, tenantId))
    .orderBy(desc(schema.contracts.createdAt))
    .limit(500)

  return rows.map((r) => ({
    ...r,
    templateLabel: findTemplate(r.sector as Sector, r.templateKey)?.label ?? null,
  }))
}

export async function getContractById(tenantId: number, id: number) {
  const [row] = await db
    .select()
    .from(schema.contracts)
    .where(and(eq(schema.contracts.id, id), eq(schema.contracts.tenantId, tenantId)))
    .limit(1)
  return row || null
}

export function renderForContract(row: {
  templateKey: string
  form: unknown
}, tenant: { name: string; settings: unknown }): { text: string } {
  const form = mergeForm(row.form as Partial<ContractFormState>, { templateKey: row.templateKey as ContractFormState['templateKey'] })
  const ctx = buildContextFromTenant(tenant)
  return { text: buildContractText(form, ctx) }
}

// ---------------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------------
export interface DashboardStats {
  contracts: {
    total: number
    byStatus: Record<string, number>
    byTemplate: Record<string, number>
    thisMonth: number
  }
  signSessions: {
    pending: number
    completed: number
    cancelled: number
    completedThisMonth: number
  }
  /** Most recent contracts (id+title+createdAt+status) — capped at 5. */
  recentContracts: Array<{
    id: number
    title: string | null
    templateKey: string
    status: string
    createdAt: Date
  }>
}

function startOfThisMonth(): Date {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * The latest N sign sessions that are still pending (or just sent).
 * Joined with contracts so the UI can render the contract title inline.
 */
export interface PendingSignatureRow {
  sessionId: number
  contractId: number
  contractTitle: string | null
  templateKey: string
  role: string
  recipientName: string | null
  recipientEmail: string | null
  recipientPhone: string | null
  status: string
  createdAt: Date
  expiresAt: Date | null
}

export async function getPendingSignatures(
  tenantId: number,
  limit = 6
): Promise<PendingSignatureRow[]> {
  const rows = await db
    .select({
      sessionId: schema.signSessions.id,
      contractId: schema.signSessions.contractId,
      contractTitle: schema.contracts.title,
      templateKey: schema.contracts.templateKey,
      role: schema.signSessions.role,
      recipientName: schema.signSessions.recipientName,
      recipientEmail: schema.signSessions.recipientEmail,
      recipientPhone: schema.signSessions.recipientPhone,
      status: schema.signSessions.status,
      createdAt: schema.signSessions.createdAt,
      expiresAt: schema.signSessions.expiresAt,
    })
    .from(schema.signSessions)
    .innerJoin(
      schema.contracts,
      eq(schema.contracts.id, schema.signSessions.contractId)
    )
    .where(
      and(
        eq(schema.signSessions.tenantId, tenantId),
        eq(schema.signSessions.status, 'bekliyor')
      )
    )
    .orderBy(desc(schema.signSessions.id))
    .limit(limit)

  return rows.map((r) => ({
    sessionId: r.sessionId,
    contractId: r.contractId,
    contractTitle: r.contractTitle ?? null,
    templateKey: r.templateKey,
    role: r.role,
    recipientName: r.recipientName,
    recipientEmail: r.recipientEmail,
    recipientPhone: r.recipientPhone,
    status: r.status,
    createdAt: r.createdAt as Date,
    expiresAt: (r.expiresAt as Date | null) ?? null,
  }))
}

/**
 * Returns daily contract-created counts for the last `days` days, oldest first.
 * Used to power dashboard sparklines without pulling a chart library.
 */
export async function getDailyContractCounts(
  tenantId: number,
  days = 14
): Promise<number[]> {
  const since = new Date()
  since.setHours(0, 0, 0, 0)
  since.setDate(since.getDate() - (days - 1))

  const rows = await db
    .select({ createdAt: schema.contracts.createdAt })
    .from(schema.contracts)
    .where(eq(schema.contracts.tenantId, tenantId))

  const buckets = Array<number>(days).fill(0)
  for (const r of rows) {
    const d = new Date(r.createdAt as Date)
    d.setHours(0, 0, 0, 0)
    const diff = Math.floor((d.getTime() - since.getTime()) / 86400000)
    if (diff >= 0 && diff < days) buckets[diff]! += 1
  }
  return buckets
}

export async function getDashboardStats(tenantId: number): Promise<DashboardStats> {
  const monthStart = startOfThisMonth()

  const cRows = await db
    .select({
      id: schema.contracts.id,
      title: schema.contracts.title,
      templateKey: schema.contracts.templateKey,
      status: schema.contracts.status,
      createdAt: schema.contracts.createdAt,
    })
    .from(schema.contracts)
    .where(eq(schema.contracts.tenantId, tenantId))
    .orderBy(desc(schema.contracts.createdAt))

  const byStatus: Record<string, number> = {}
  const byTemplate: Record<string, number> = {}
  let thisMonth = 0
  for (const r of cRows) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1
    byTemplate[r.templateKey] = (byTemplate[r.templateKey] ?? 0) + 1
    if (new Date(r.createdAt) >= monthStart) thisMonth += 1
  }

  const sRows = await db
    .select({
      status: schema.signSessions.status,
      signedAt: schema.signSessions.signedAt,
    })
    .from(schema.signSessions)
    .where(eq(schema.signSessions.tenantId, tenantId))

  let pending = 0
  let completed = 0
  let cancelled = 0
  let completedThisMonth = 0
  for (const r of sRows) {
    if (r.status === 'bekliyor') pending += 1
    else if (r.status === 'imzalandi') {
      completed += 1
      if (r.signedAt && new Date(r.signedAt) >= monthStart) completedThisMonth += 1
    } else if (r.status === 'iptal' || r.status === 'expired') cancelled += 1
  }

  return {
    contracts: { total: cRows.length, byStatus, byTemplate, thisMonth },
    signSessions: { pending, completed, cancelled, completedThisMonth },
    recentContracts: cRows.slice(0, 5).map((r) => ({
      id: r.id,
      title: r.title,
      templateKey: r.templateKey,
      status: r.status,
      createdAt: r.createdAt as Date,
    })),
  }
}
