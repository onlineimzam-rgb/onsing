import { NextResponse, type NextRequest } from 'next/server'
import { sql, type Property } from '@/lib/db'
import { isAuthorized } from '@/lib/auth'
import { slugify, generateReferenceNo } from '@/lib/format'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const properties = (await sql(
      `SELECT * FROM properties ORDER BY created_at DESC`
    )) as Property[]
    return NextResponse.json({ properties })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json()

    const {
      type,
      category,
      title_tr,
      title_en,
      description_tr,
      description_en,
      price = 0,
      currency = 'TRY',
      city,
      district,
      neighborhood,
      address,
      lat,
      lng,
      bedrooms,
      bathrooms,
      area_m2,
      lot_m2,
      building_age,
      floor,
      total_floors,
      heating_type,
      is_detached,
      in_site,
      land_status,
      owner_name,
      owner_phone,
      owner_email,
      owner_notes,
      features,
      is_featured = false,
      status = 'aktif',
      ada_no,
      parsel_no,
      pafta_no,
      external_url,
    } = body

    if (!type || !category || !title_tr) {
      return NextResponse.json(
        { error: 'type, category ve title_tr zorunludur' },
        { status: 400 }
      )
    }

    const reference_no = generateReferenceNo()
    let baseSlug = slugify(`${title_tr} ${reference_no}`)
    if (!baseSlug) baseSlug = reference_no.toLowerCase()
    let slug = baseSlug

    // slug çakışmasını önle
    let attempt = 0
    while (attempt < 5) {
      const existing = (await sql(`SELECT id FROM properties WHERE slug = $1`, [slug])) as any[]
      if (existing.length === 0) break
      attempt++
      slug = `${baseSlug}-${attempt}`
    }

    const inserted = (await sql(
      `INSERT INTO properties (
        reference_no, slug, type, category, status,
        title_tr, title_en, description_tr, description_en,
        price, currency, city, district, neighborhood, address, lat, lng,
        bedrooms, bathrooms, area_m2, lot_m2, building_age, floor, total_floors,
        heating_type, is_detached, in_site, land_status,
        owner_name, owner_phone, owner_email, owner_notes,
        features, is_featured,
        ada_no, parsel_no, pafta_no, external_url
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,
        $18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38
      ) RETURNING *`,
      [
        reference_no,
        slug,
        type,
        category,
        status,
        title_tr,
        title_en || title_tr,
        description_tr || null,
        description_en || null,
        price,
        currency,
        city || null,
        district || null,
        neighborhood || null,
        address || null,
        lat || null,
        lng || null,
        bedrooms || null,
        bathrooms || null,
        area_m2 || null,
        lot_m2 || null,
        building_age || null,
        floor || null,
        total_floors || null,
        heating_type || null,
        is_detached,
        in_site,
        land_status || null,
        owner_name || null,
        owner_phone || null,
        owner_email || null,
        owner_notes || null,
        Array.isArray(features) ? features : null,
        !!is_featured,
        ada_no || null,
        parsel_no || null,
        pafta_no || null,
        external_url || null,
      ]
    )) as Property[]

    return NextResponse.json({ property: inserted[0] })
  } catch (error) {
    console.error('Property create error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
