import { NextResponse, type NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { sendInquiryNotification } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, phone, email, subject, message, property_id } = body

    if (!name || !message) {
      return NextResponse.json({ error: 'name ve message zorunludur' }, { status: 400 })
    }
    if (!phone && !email) {
      return NextResponse.json(
        { error: 'En az telefon veya e-posta gereklidir' },
        { status: 400 }
      )
    }

    const inserted = (await sql(
      `INSERT INTO inquiries (name, phone, email, subject, message, property_id)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, created_at`,
      [name, phone || null, email || null, subject || null, message, property_id || null]
    )) as { id: number }[]

    let propertyRef: string | null = null
    let propertyTitle: string | null = null
    if (property_id) {
      const propRows = (await sql(
        `SELECT reference_no, title_tr FROM properties WHERE id = $1`,
        [property_id]
      )) as { reference_no: string; title_tr: string }[]
      if (propRows[0]) {
        propertyRef = propRows[0].reference_no
        propertyTitle = propRows[0].title_tr
      }
    }

    sendInquiryNotification({
      name, phone, email, subject, message,
      property_ref: propertyRef, property_title: propertyTitle,
    }).catch((e) => console.error('Inquiry mail err:', e.message))

    return NextResponse.json({ success: true, id: inserted[0]?.id })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
