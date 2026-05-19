import { NextResponse, type NextRequest } from 'next/server'
import { setupDatabase } from '@/lib/db'
import { isAuthorized, isSetupAuthorized } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  if (!isSetupAuthorized(req) && !isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    await setupDatabase()
    return NextResponse.json({ success: true, message: 'Veritabanı tabloları oluşturuldu.' })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
