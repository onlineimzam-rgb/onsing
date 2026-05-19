/**
 * Dev-only: verifies the SHA-256 chain of `audit_logs` for the default tenant.
 *
 * Returns ok=true when every row's hash recomputes correctly and `hash_prev`
 * matches the previous row's `record_hash`. Production builds should 404 this.
 */

import { NextResponse } from 'next/server'
import { desc } from 'drizzle-orm'
import { db, schema } from '@/db'
import { verifyAuditChain } from '@/lib/audit'
import { getDefaultTenantId } from '@/lib/tenant'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'disabled in production' }, { status: 404 })
  }

  const tenantId = await getDefaultTenantId()
  const result = await verifyAuditChain(tenantId)

  const latest = await db
    .select({
      id: schema.auditLogs.id,
      eventType: schema.auditLogs.eventType,
      entityKind: schema.auditLogs.entityKind,
      entityId: schema.auditLogs.entityId,
      actorId: schema.auditLogs.actorId,
      ip: schema.auditLogs.ip,
      hashPrev: schema.auditLogs.hashPrev,
      recordHash: schema.auditLogs.recordHash,
      createdAt: schema.auditLogs.createdAt,
    })
    .from(schema.auditLogs)
    .orderBy(desc(schema.auditLogs.id))
    .limit(10)

  return NextResponse.json({
    ok: true,
    chain: result,
    latest,
  })
}
