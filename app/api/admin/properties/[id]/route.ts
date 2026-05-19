import { NextResponse, type NextRequest } from 'next/server'
import { sql, type Property, type PropertyImage } from '@/lib/db'
import { isAuthorized } from '@/lib/auth'
import { del } from '@vercel/blob'
import { slugify } from '@/lib/format'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const id = parseInt(params.id, 10)
  if (Number.isNaN(id)) return NextResponse.json({ error: 'invalid id' }, { status: 400 })

  const rows = (await sql(`SELECT * FROM properties WHERE id = $1`, [id])) as Property[]
  if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const images = (await sql(
    `SELECT * FROM property_images WHERE property_id = $1 ORDER BY display_order ASC, id ASC`,
    [id]
  )) as PropertyImage[]
  return NextResponse.json({ property: rows[0], images })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const id = parseInt(params.id, 10)
  if (Number.isNaN(id)) return NextResponse.json({ error: 'invalid id' }, { status: 400 })

  try {
    const body = await req.json()

    // Mevcut kaydı al (slug üretmek için)
    const existing = (await sql(`SELECT * FROM properties WHERE id = $1`, [id])) as Property[]
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const current = existing[0]

    let slug = current.slug
    if (body.title_tr && body.title_tr !== current.title_tr) {
      let baseSlug = slugify(`${body.title_tr} ${current.reference_no}`)
      if (!baseSlug) baseSlug = current.reference_no.toLowerCase()
      slug = baseSlug
      let attempt = 0
      while (attempt < 5) {
        const existsRows = (await sql(
          `SELECT id FROM properties WHERE slug = $1 AND id != $2`,
          [slug, id]
        )) as any[]
        if (existsRows.length === 0) break
        attempt++
        slug = `${baseSlug}-${attempt}`
      }
    }

    const updated = (await sql(
      `UPDATE properties SET
        type = COALESCE($1, type),
        category = COALESCE($2, category),
        status = COALESCE($3, status),
        title_tr = COALESCE($4, title_tr),
        title_en = COALESCE($5, title_en),
        description_tr = COALESCE($6, description_tr),
        description_en = COALESCE($7, description_en),
        price = COALESCE($8, price),
        currency = COALESCE($9, currency),
        city = COALESCE($10, city),
        district = COALESCE($11, district),
        neighborhood = COALESCE($12, neighborhood),
        address = COALESCE($13, address),
        lat = COALESCE($14, lat),
        lng = COALESCE($15, lng),
        bedrooms = COALESCE($16, bedrooms),
        bathrooms = COALESCE($17, bathrooms),
        area_m2 = COALESCE($18, area_m2),
        lot_m2 = COALESCE($19, lot_m2),
        building_age = COALESCE($20, building_age),
        floor = COALESCE($21, floor),
        total_floors = COALESCE($22, total_floors),
        heating_type = COALESCE($23, heating_type),
        is_detached = $24,
        in_site = $25,
        land_status = COALESCE($26, land_status),
        owner_name = $27,
        owner_phone = $28,
        owner_email = $29,
        owner_notes = $30,
        features = COALESCE($31, features),
        is_featured = COALESCE($32, is_featured),
        ada_no = COALESCE($35, ada_no),
        parsel_no = COALESCE($36, parsel_no),
        pafta_no = COALESCE($37, pafta_no),
        external_url = COALESCE($38, external_url),
        slug = $33,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $34
       RETURNING *`,
      [
        body.type ?? null,
        body.category ?? null,
        body.status ?? null,
        body.title_tr ?? null,
        body.title_en ?? null,
        body.description_tr ?? null,
        body.description_en ?? null,
        body.price ?? null,
        body.currency ?? null,
        body.city ?? null,
        body.district ?? null,
        body.neighborhood ?? null,
        body.address ?? null,
        body.lat ?? null,
        body.lng ?? null,
        body.bedrooms ?? null,
        body.bathrooms ?? null,
        body.area_m2 ?? null,
        body.lot_m2 ?? null,
        body.building_age ?? null,
        body.floor ?? null,
        body.total_floors ?? null,
        body.heating_type ?? null,
        body.is_detached ?? null,
        body.in_site ?? null,
        body.land_status ?? null,
        body.owner_name ?? null,
        body.owner_phone ?? null,
        body.owner_email ?? null,
        body.owner_notes ?? null,
        Array.isArray(body.features) ? body.features : null,
        body.is_featured ?? null,
        slug,
        id,
        body.ada_no ?? null,
        body.parsel_no ?? null,
        body.pafta_no ?? null,
        body.external_url ?? null,
      ]
    )) as Property[]
    return NextResponse.json({ property: updated[0] })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

/** Sadece portföy sahibi / CRM alanları — tam form göndermeden güncelleme */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const id = parseInt(params.id, 10)
  if (Number.isNaN(id)) return NextResponse.json({ error: 'invalid id' }, { status: 400 })
  try {
    const body = await req.json()
    const rows = (await sql(
      `UPDATE properties SET
         owner_name = COALESCE($1, owner_name),
         owner_phone = COALESCE($2, owner_phone),
         owner_email = COALESCE($3, owner_email),
         owner_notes = COALESCE($4, owner_notes),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, owner_name, owner_phone, owner_email, owner_notes, reference_no, title_tr, slug`,
      [
        body.owner_name !== undefined ? body.owner_name : null,
        body.owner_phone !== undefined ? body.owner_phone : null,
        body.owner_email !== undefined ? body.owner_email : null,
        body.owner_notes !== undefined ? body.owner_notes : null,
        id,
      ]
    )) as Property[]
    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ property: rows[0] })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const id = parseInt(params.id, 10)
  if (Number.isNaN(id)) return NextResponse.json({ error: 'invalid id' }, { status: 400 })

  try {
    // Önce blob görsellerini sil
    const images = (await sql(
      `SELECT url FROM property_images WHERE property_id = $1`,
      [id]
    )) as { url: string }[]
    for (const img of images) {
      try {
        if (img.url.includes('blob.vercel-storage.com')) {
          await del(img.url)
        }
      } catch {}
    }
    const propRows = (await sql(`SELECT cover_image FROM properties WHERE id = $1`, [id])) as {
      cover_image: string | null
    }[]
    if (propRows[0]?.cover_image && propRows[0].cover_image.includes('blob.vercel-storage.com')) {
      try {
        await del(propRows[0].cover_image)
      } catch {}
    }
    await sql(`DELETE FROM properties WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
