/**
 * Audit log — chain-of-records (ADR-001 audit trail).
 *
 * Each record stores `record_hash = SHA-256(canonical(record) || hash_prev)`.
 * Tampering with any past row breaks the chain at that point, which is trivially
 * detectable. We expose `appendAudit()` for callers and `verifyAuditChain()` for
 * the verification portal.
 */

import { createHash } from 'crypto'
import { and, desc, eq } from 'drizzle-orm'
import { db, schema } from '@/db'
import type { NewAuditLog } from '@/db/schema'

export type EntityKind = 'contract' | 'sign_session' | 'document' | 'user' | 'tenant'

export interface AppendAuditInput {
  tenantId: number
  actorId?: number | null
  entityKind: EntityKind
  entityId: number
  eventType: string
  metadata?: Record<string, unknown>
  ip?: string | null
  userAgent?: string | null
  geo?: { lat: string; lng: string } | null
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value ?? null)
  if (Array.isArray(value)) return '[' + value.map(canonicalize).join(',') + ']'
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalize(obj[k])).join(',') + '}'
}

function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

export async function appendAudit(input: AppendAuditInput): Promise<{ id: number; recordHash: string }> {
  const prev = await db
    .select({ recordHash: schema.auditLogs.recordHash })
    .from(schema.auditLogs)
    .where(eq(schema.auditLogs.tenantId, input.tenantId))
    .orderBy(desc(schema.auditLogs.id))
    .limit(1)

  const hashPrev = prev[0]?.recordHash ?? null

  const record: Omit<NewAuditLog, 'id' | 'createdAt' | 'recordHash'> = {
    tenantId: input.tenantId,
    actorId: input.actorId ?? null,
    entityKind: input.entityKind,
    entityId: input.entityId,
    eventType: input.eventType,
    metadata: input.metadata ?? {},
    ip: input.ip ?? null,
    userAgent: input.userAgent ?? null,
    geoLat: input.geo?.lat ?? null,
    geoLng: input.geo?.lng ?? null,
    hashPrev,
  }

  const recordHash = sha256Hex(canonicalize(record) + '|' + (hashPrev ?? ''))

  const [inserted] = await db
    .insert(schema.auditLogs)
    .values({ ...record, recordHash })
    .returning({ id: schema.auditLogs.id, recordHash: schema.auditLogs.recordHash })

  return { id: inserted!.id, recordHash: inserted!.recordHash }
}

// ---------------------------------------------------------------------------
// Recent activity (read-side)
// ---------------------------------------------------------------------------
export interface RecentAuditRow {
  id: number
  entityKind: string
  entityId: number
  eventType: string
  metadata: Record<string, unknown>
  createdAt: Date
}

export async function listRecentAudit(tenantId: number, limit = 8): Promise<RecentAuditRow[]> {
  const rows = await db
    .select({
      id: schema.auditLogs.id,
      entityKind: schema.auditLogs.entityKind,
      entityId: schema.auditLogs.entityId,
      eventType: schema.auditLogs.eventType,
      metadata: schema.auditLogs.metadata,
      createdAt: schema.auditLogs.createdAt,
    })
    .from(schema.auditLogs)
    .where(eq(schema.auditLogs.tenantId, tenantId))
    .orderBy(desc(schema.auditLogs.id))
    .limit(limit)

  return rows.map((r) => ({
    ...r,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    createdAt: r.createdAt as Date,
  }))
}

export interface VerifyChainResult {
  ok: boolean
  count: number
  brokenAt: number | null
}

export async function verifyAuditChain(
  tenantId: number,
  entity?: { kind: EntityKind; id: number }
): Promise<VerifyChainResult> {
  const rows = await db
    .select()
    .from(schema.auditLogs)
    .where(
      entity
        ? and(
            eq(schema.auditLogs.tenantId, tenantId),
            eq(schema.auditLogs.entityKind, entity.kind),
            eq(schema.auditLogs.entityId, entity.id)
          )
        : eq(schema.auditLogs.tenantId, tenantId)
    )
    .orderBy(schema.auditLogs.id)

  let prevHash: string | null = null
  for (const row of rows) {
    const { id, recordHash, createdAt, ...rest } = row
    const recomputed = sha256Hex(canonicalize(rest) + '|' + (rest.hashPrev ?? ''))
    if (recomputed !== recordHash || rest.hashPrev !== prevHash) {
      void id
      void createdAt
      return { ok: false, count: rows.length, brokenAt: row.id }
    }
    prevHash = recordHash
  }
  return { ok: true, count: rows.length, brokenAt: null }
}
