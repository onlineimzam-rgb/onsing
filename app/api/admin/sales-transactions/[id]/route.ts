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
    `UPDATE sales_transactions SET
       property_id = COALESCE($1, property_id),
       contract_id = COALESCE($2, contract_id),
       buyer_name = COALESCE($3, buyer_name),
       seller_name = COALESCE($4, seller_name),
       sale_price = COALESCE($5, sale_price),
       currency = COALESCE($6, currency),
       commission_amount = COALESCE($7, commission_amount),
       commission_currency = COALESCE($8, commission_currency),
       invoice_issued = COALESCE($9, invoice_issued),
       invoice_no = COALESCE($10, invoice_no),
       contract_signed_at = COALESCE($11, contract_signed_at),
       sale_completed_at = COALESCE($12, sale_completed_at),
       notes = COALESCE($13, notes),
       stage = COALESCE($14, stage),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $15
     RETURNING *`,
    [
      b.property_id !== undefined ? b.property_id : null,
      b.contract_id !== undefined ? b.contract_id : null,
      b.buyer_name !== undefined ? b.buyer_name : null,
      b.seller_name !== undefined ? b.seller_name : null,
      b.sale_price !== undefined ? b.sale_price : null,
      b.currency !== undefined ? b.currency : null,
      b.commission_amount !== undefined ? b.commission_amount : null,
      b.commission_currency !== undefined ? b.commission_currency : null,
      b.invoice_issued !== undefined ? b.invoice_issued : null,
      b.invoice_no !== undefined ? b.invoice_no : null,
      b.contract_signed_at !== undefined ? b.contract_signed_at : null,
      b.sale_completed_at !== undefined ? b.sale_completed_at : null,
      b.notes !== undefined ? b.notes : null,
      b.stage !== undefined ? b.stage : null,
      id,
    ]
  )
  const arr = rows as any[]
  if (!arr.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ transaction: arr[0] })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = parseInt(params.id, 10)
  if (Number.isNaN(id)) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  await ensureCrmAndSalesSchema()
  await sql(`DELETE FROM sales_transactions WHERE id = $1`, [id])
  return NextResponse.json({ success: true })
}
