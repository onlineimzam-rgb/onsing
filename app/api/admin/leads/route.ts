import { NextResponse, type NextRequest } from 'next/server'
import { sql, type Lead } from '@/lib/db'
import { isAuthorized } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const leads = (await sql(`SELECT * FROM leads ORDER BY created_at DESC LIMIT 200`)) as Lead[]
  return NextResponse.json({ leads })
}
