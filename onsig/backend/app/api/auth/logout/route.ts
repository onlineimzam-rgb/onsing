/**
 * POST /api/auth/logout — clears auth cookies and writes audit entry.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { clearAuthCookies } from '@/lib/auth'
import { appendAudit } from '@/lib/audit'
import { getOptionalUser } from '@/lib/session'
import { getClientIp, getUserAgent } from '@/lib/ip'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await getOptionalUser()
  if (session) {
    await appendAudit({
      tenantId: session.tenantId,
      actorId: session.userId,
      entityKind: 'user',
      entityId: session.userId,
      eventType: 'auth.logout',
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
    })
  }
  clearAuthCookies()
  return NextResponse.json({ ok: true })
}
