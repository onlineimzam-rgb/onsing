import { NextResponse, type NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { sendLeadNotification } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      intent, name, phone, email,
      property_type, category, district,
      budget_min, budget_max, currency = 'TRY',
      rooms, area_min, lot_min, total_floors,
      is_detached, in_site, land_status, location_note, message,
    } = body

    if (!intent || !name || !phone) {
      return NextResponse.json({ error: 'intent, name ve phone zorunludur' }, { status: 400 })
    }
    if (!['alici', 'satici', 'kiraci', 'kiralik-veren'].includes(intent)) {
      return NextResponse.json({ error: 'Geçersiz intent' }, { status: 400 })
    }

    const inserted = (await sql(
      `INSERT INTO leads (
        intent, name, phone, email, property_type, category, district,
        budget_min, budget_max, currency, rooms, area_min, lot_min, total_floors,
        is_detached, in_site, land_status, location_note, message
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      RETURNING id, created_at`,
      [
        intent, name, phone, email || null,
        property_type || null, category || null, district || null,
        budget_min ? Number(budget_min) : null,
        budget_max ? Number(budget_max) : null,
        currency, rooms || null,
        area_min ? Number(area_min) : null,
        lot_min ? Number(lot_min) : null,
        total_floors ? Number(total_floors) : null,
        is_detached === '' || is_detached == null ? null : is_detached === 'evet' || is_detached === true,
        in_site === '' || in_site == null ? null : in_site === 'evet' || in_site === true,
        land_status || null,
        location_note || null,
        message || null,
      ]
    )) as { id: number; created_at: Date }[]

    sendLeadNotification({
      intent, name, phone, email,
      property_type, category, district,
      budget_min, budget_max, currency, rooms, area_min, lot_min, total_floors,
      is_detached, in_site, land_status, location_note, message,
    }).catch((e) => console.error('Lead mail err:', e.message))

    return NextResponse.json({ success: true, id: inserted[0]?.id })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
