import { NextResponse, type NextRequest } from 'next/server'
import { ensureCrmAndSalesSchema, sql } from '@/lib/db'
import { isAuthorized } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureCrmAndSalesSchema()
  const rows = await sql(`
    SELECT t.*,
           p.title_tr AS property_title,
           p.reference_no AS property_reference_no,
           p.slug AS property_slug,
           c.contract_type AS contract_type,
           c.status AS contract_status,
           COALESCE(c.title, '') AS contract_title
      FROM sales_transactions t
      LEFT JOIN properties p ON p.id = t.property_id
      LEFT JOIN contracts c ON c.id = t.contract_id
     ORDER BY t.created_at DESC
     LIMIT 300
  `)
  return NextResponse.json({ transactions: rows })
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureCrmAndSalesSchema()
  const b = await req.json()
  const inserted = await sql(
    `INSERT INTO sales_transactions (
       property_id, contract_id, buyer_name, seller_name,
       sale_price, currency, commission_amount, commission_currency,
       invoice_issued, invoice_no, contract_signed_at, sale_completed_at, notes, stage
     ) VALUES (
       $1, $2, $3, $4,
       $5, COALESCE($6, 'TRY'), $7, COALESCE($8, 'TRY'),
       COALESCE($9, false), $10, $11, $12, $13, COALESCE($14, 'sozlesme')
     )
     RETURNING *`,
    [
      b.property_id ?? null,
      b.contract_id ?? null,
      b.buyer_name || null,
      b.seller_name || null,
      b.sale_price ?? null,
      b.currency || 'TRY',
      b.commission_amount ?? null,
      b.commission_currency || 'TRY',
      b.invoice_issued === true,
      b.invoice_no || null,
      b.contract_signed_at || null,
      b.sale_completed_at || null,
      b.notes || null,
      b.stage || null,
    ]
  )
  return NextResponse.json({ transaction: (inserted as any[])[0] })
}
