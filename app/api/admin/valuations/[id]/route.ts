import { NextResponse, type NextRequest } from 'next/server'
import { ensureValuationsSchema, sql, type ValuationRequest } from '@/lib/db'
import { isAuthorized } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = parseInt(params.id, 10)
  if (Number.isNaN(id)) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  await ensureValuationsSchema()
  const body = await req.json()
  const updated = (await sql(
    `UPDATE valuation_requests SET
       status = COALESCE($1, status),
       estimated_value = COALESCE($2, estimated_value),
       estimated_currency = COALESCE($3, estimated_currency),
       response_notes = COALESCE($4, response_notes),
       value_min = COALESCE($5, value_min),
       value_max = COALESCE($6, value_max),
       unit_price_min = COALESCE($7, unit_price_min),
       unit_price_max = COALESCE($8, unit_price_max),
       marketing_time = COALESCE($9, marketing_time),
       market_position = COALESCE($10, market_position),
       methodology = COALESCE($11, methodology),
       expert_opinion = COALESCE($12, expert_opinion),
       comparables = COALESCE($13::jsonb, comparables),
       ai_draft = COALESCE($14::jsonb, ai_draft),
       report_status = COALESCE($15, report_status),
       crm_notes = COALESCE($16, crm_notes)
     WHERE id = $17
     RETURNING *`,
    [
      body.status ?? null,
      body.estimated_value ?? null,
      body.estimated_currency ?? null,
      body.response_notes ?? null,
      body.value_min ?? null,
      body.value_max ?? null,
      body.unit_price_min ?? null,
      body.unit_price_max ?? null,
      body.marketing_time ?? null,
      body.market_position ?? null,
      body.methodology ?? null,
      body.expert_opinion ?? null,
      body.comparables === undefined ? null : JSON.stringify(body.comparables),
      body.ai_draft === undefined ? null : JSON.stringify(body.ai_draft),
      body.report_status ?? null,
      body.crm_notes !== undefined ? body.crm_notes : null,
      id,
    ]
  )) as ValuationRequest[]
  return NextResponse.json({ success: true, request: updated[0] })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = parseInt(params.id, 10)
  if (Number.isNaN(id)) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  await sql(`DELETE FROM valuation_requests WHERE id = $1`, [id])
  return NextResponse.json({ success: true })
}
