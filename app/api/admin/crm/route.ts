import { NextResponse, type NextRequest } from 'next/server'
import { ensureCrmAndSalesSchema, sql } from '@/lib/db'
import { isAuthorized } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureCrmAndSalesSchema()

  const [leads, valuations, owners, contractParties] = await Promise.all([
    sql(`
      SELECT id, intent, name, phone, email, district, category, status, message, location_note,
             crm_notes, crm_activity_summary, created_at
        FROM leads
       ORDER BY created_at DESC
       LIMIT 200
    `),
    sql(`
      SELECT id, name, phone, email, district, property_type, status, notes, response_notes,
             crm_notes, created_at
        FROM valuation_requests
       ORDER BY created_at DESC
       LIMIT 200
    `),
    sql(`
      SELECT id, reference_no, title_tr, slug, owner_name, owner_phone, owner_email, owner_notes,
             status, district, city, price, currency, created_at
        FROM properties
       WHERE owner_name IS NOT NULL OR owner_phone IS NOT NULL OR owner_email IS NOT NULL
       ORDER BY created_at DESC
       LIMIT 200
    `),
    sql(`
      SELECT s.id AS session_id,
             s.signer_name AS name,
             s.signer_phone AS phone,
             s.signer_email AS email,
             s.role,
             s.status AS sign_status,
             s.signed_at,
             s.contract_id,
             s.contract_type,
             COALESCE(c.title, '') AS contract_title,
             c.status AS contract_status,
             s.created_at
        FROM contract_sign_sessions s
        LEFT JOIN contracts c ON c.id = s.contract_id
       WHERE (s.signer_name IS NOT NULL AND TRIM(s.signer_name) <> '')
          OR (s.signer_phone IS NOT NULL AND TRIM(s.signer_phone) <> '')
       ORDER BY s.created_at DESC
       LIMIT 200
    `),
  ])

  return NextResponse.json({ leads, valuations, owners, contractParties })
}
