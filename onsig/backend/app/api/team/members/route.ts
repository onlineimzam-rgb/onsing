/**
 * GET /api/team/members — list every user that belongs to the current tenant.
 */

import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db, schema } from '@/db'
import { requireUser } from '@/lib/session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const session = await requireUser()
  if (session instanceof NextResponse) return session

  const rows = await db
    .select({
      membershipId: schema.memberships.id,
      userId: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      phone: schema.users.phone,
      role: schema.memberships.role,
      createdAt: schema.memberships.createdAt,
    })
    .from(schema.memberships)
    .innerJoin(schema.users, eq(schema.users.id, schema.memberships.userId))
    .where(eq(schema.memberships.tenantId, session.tenantId))

  return NextResponse.json({ ok: true, members: rows, currentUserId: session.userId })
}
