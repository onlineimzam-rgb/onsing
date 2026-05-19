import { NextResponse, type NextRequest } from 'next/server'
import { ensureValuationsSchema, sql, type ValuationRequest } from '@/lib/db'
import { isAuthorized } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureValuationsSchema()
  const requests = (await sql(
    `SELECT * FROM valuation_requests ORDER BY created_at DESC LIMIT 200`
  )) as ValuationRequest[]
  return NextResponse.json({ requests })
}
