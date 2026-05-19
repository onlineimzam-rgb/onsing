import { NextResponse, type NextRequest } from 'next/server'
import { ensureCrmAndSalesSchema, sql } from '@/lib/db'
import { isAuthorized } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureCrmAndSalesSchema()
  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const where: string[] = []
  const params: any[] = []
  if (status) {
    params.push(status)
    where.push(`status = $${params.length}`)
  }
  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const rows = await sql(
    `SELECT * FROM crm_tasks ${whereSQL}
      ORDER BY status ASC, (due_at IS NULL), due_at ASC, created_at DESC
      LIMIT 300`,
    params
  )
  return NextResponse.json({ tasks: rows })
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureCrmAndSalesSchema()
  const b = await req.json()
  if (!b.title || !String(b.title).trim()) {
    return NextResponse.json({ error: 'Başlık zorunludur' }, { status: 400 })
  }
  const inserted = await sql(
    `INSERT INTO crm_tasks (
       title, description, due_at, status, priority,
       related_kind, related_id, related_label, assignee
     ) VALUES (
       $1, $2, $3, COALESCE($4, 'acik'), COALESCE($5, 'normal'),
       COALESCE($6, 'genel'), $7, $8, $9
     )
     RETURNING *`,
    [
      String(b.title).trim(),
      b.description || null,
      b.due_at || null,
      b.status || null,
      b.priority || null,
      b.related_kind || null,
      b.related_id ?? null,
      b.related_label || null,
      b.assignee || null,
    ]
  )
  return NextResponse.json({ task: (inserted as any[])[0] })
}
