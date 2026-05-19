/**
 * One-shot bootstrap endpoint — ensures the default tenant row exists.
 *
 * SAFETY: idempotent; can be called repeatedly. Guarded by a shared bootstrap
 * secret in production; in development it's open.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { eq, count } from 'drizzle-orm'
import { db, schema } from '@/db'
import { getDefaultTenantId } from '@/lib/tenant'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const secret = req.headers.get('x-bootstrap-secret')
    if (!secret || secret !== process.env.JWT_SECRET) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }
  }

  const tenantId = await getDefaultTenantId()

  const [tenantRow] = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.id, tenantId))
    .limit(1)

  const [userCount] = await db.select({ c: count() }).from(schema.users)
  const [contractCount] = await db.select({ c: count() }).from(schema.contracts)
  const [auditCount] = await db.select({ c: count() }).from(schema.auditLogs)

  return NextResponse.json({
    ok: true,
    defaultTenant: tenantRow,
    counts: {
      users: Number(userCount?.c ?? 0),
      contracts: Number(contractCount?.c ?? 0),
      auditLogs: Number(auditCount?.c ?? 0),
    },
  })
}

export async function GET(req: NextRequest) {
  return POST(req)
}
