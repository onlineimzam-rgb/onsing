import { NextResponse, type NextRequest } from 'next/server'
import { ensureCrmAndSalesSchema, sql } from '@/lib/db'
import { isAuthorized } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = parseInt(params.id, 10)
  if (Number.isNaN(id)) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  await ensureCrmAndSalesSchema()
  const b = await req.json()
  const rows = await sql(
    `UPDATE crm_tasks SET
       title = COALESCE($1, title),
       description = COALESCE($2, description),
       due_at = COALESCE($3, due_at),
       status = COALESCE($4, status),
       priority = COALESCE($5, priority),
       related_kind = COALESCE($6, related_kind),
       related_id = COALESCE($7, related_id),
       related_label = COALESCE($8, related_label),
       assignee = COALESCE($9, assignee),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $10
     RETURNING *`,
    [
      b.title !== undefined ? b.title : null,
      b.description !== undefined ? b.description : null,
      b.due_at !== undefined ? b.due_at : null,
      b.status !== undefined ? b.status : null,
      b.priority !== undefined ? b.priority : null,
      b.related_kind !== undefined ? b.related_kind : null,
      b.related_id !== undefined ? b.related_id : null,
      b.related_label !== undefined ? b.related_label : null,
      b.assignee !== undefined ? b.assignee : null,
      id,
    ]
  )
  const arr = rows as any[]
  if (!arr.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ task: arr[0] })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = parseInt(params.id, 10)
  if (Number.isNaN(id)) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  await ensureCrmAndSalesSchema()
  await sql(`DELETE FROM crm_tasks WHERE id = $1`, [id])
  return NextResponse.json({ success: true })
}
