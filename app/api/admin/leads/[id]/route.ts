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
  const body = await req.json()
  await sql(
    `UPDATE leads SET
       status = COALESCE($1, status),
       crm_notes = COALESCE($2, crm_notes),
       crm_activity_summary = COALESCE($3, crm_activity_summary),
       message = COALESCE($4, message),
       location_note = COALESCE($5, location_note)
     WHERE id = $6`,
    [
      body.status ?? null,
      body.crm_notes !== undefined ? body.crm_notes : null,
      body.crm_activity_summary !== undefined ? body.crm_activity_summary : null,
      body.message !== undefined ? body.message : null,
      body.location_note !== undefined ? body.location_note : null,
      id,
    ]
  )
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = parseInt(params.id, 10)
  if (Number.isNaN(id)) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  await sql(`DELETE FROM leads WHERE id = $1`, [id])
  return NextResponse.json({ success: true })
}
