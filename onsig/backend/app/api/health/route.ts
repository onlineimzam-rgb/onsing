import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const startedAt = Date.now()
  let dbOk = false
  let dbError: string | null = null

  if (process.env.POSTGRES_URL) {
    try {
      await db.execute(sql`SELECT 1`)
      dbOk = true
    } catch (e) {
      dbError = (e as Error).message
    }
  } else {
    dbError = 'POSTGRES_URL not set'
  }

  return NextResponse.json({
    ok: true,
    service: 'onsig-backend',
    version: '0.1.0',
    env: process.env.NODE_ENV,
    db: { ok: dbOk, error: dbError },
    latencyMs: Date.now() - startedAt,
    now: new Date().toISOString(),
  })
}
