import { NextResponse, type NextRequest } from 'next/server'
import { isAuthorized } from '@/lib/auth'
import { createValuationDraft } from '@/lib/ai/valuation'
import { ensureValuationsSchema, sql, type ValuationRequest } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = parseInt(params.id, 10)
  if (Number.isNaN(id)) return NextResponse.json({ error: 'invalid' }, { status: 400 })

  try {
    await ensureValuationsSchema()
    const rows = (await sql(`SELECT * FROM valuation_requests WHERE id = $1`, [id])) as ValuationRequest[]
    const request = rows[0]
    if (!request) return NextResponse.json({ error: 'Değerleme talebi bulunamadı' }, { status: 404 })

    const draft = await createValuationDraft(request)
    const updated = (await sql(
      `UPDATE valuation_requests SET
         ai_draft = $1::jsonb,
         value_min = COALESCE($2, value_min),
         value_max = COALESCE($3, value_max),
         unit_price_min = COALESCE($4, unit_price_min),
         unit_price_max = COALESCE($5, unit_price_max),
         marketing_time = COALESCE(NULLIF($6, ''), marketing_time),
         market_position = COALESCE(NULLIF($7, ''), market_position),
         methodology = COALESCE(NULLIF($8, ''), methodology),
         expert_opinion = COALESCE(NULLIF($9, ''), expert_opinion),
         report_status = 'ai-taslak'
       WHERE id = $10
       RETURNING *`,
      [
        JSON.stringify(draft),
        draft.value_min,
        draft.value_max,
        draft.unit_price_min,
        draft.unit_price_max,
        draft.marketing_time,
        draft.market_position,
        draft.methodology,
        draft.expert_opinion || draft.report_text,
        id,
      ]
    )) as ValuationRequest[]

    return NextResponse.json({ draft, request: updated[0] })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
