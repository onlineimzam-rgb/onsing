import { NextResponse, type NextRequest } from 'next/server'
import { sql, type Property, type PropertyImage } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const propertyRows = (await sql(
      `SELECT * FROM properties WHERE slug = $1 LIMIT 1`,
      [params.slug]
    )) as Property[]

    if (propertyRows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const property = propertyRows[0]

    const images = (await sql(
      `SELECT * FROM property_images
        WHERE property_id = $1
        ORDER BY display_order ASC, id ASC`,
      [property.id]
    )) as PropertyImage[]

    // Görüntülenme sayısını artır (best-effort, hata olursa görmezden gel)
    sql(`UPDATE properties SET views = views + 1 WHERE id = $1`, [property.id]).catch(
      () => {}
    )

    // Benzer ilanlar (aynı kategori ve tip)
    const similar = (await sql(
      `SELECT id, reference_no, slug, type, category, title_tr, title_en, price, currency,
              district, neighborhood, bedrooms, area_m2, cover_image
         FROM properties
        WHERE status = 'aktif' AND id != $1 AND (category = $2 OR district = $3)
        ORDER BY (CASE WHEN category = $2 AND district = $3 THEN 0
                       WHEN category = $2 THEN 1
                       ELSE 2 END), created_at DESC
        LIMIT 4`,
      [property.id, property.category, property.district]
    )) as Partial<Property>[]

    return NextResponse.json({ property, images, similar })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
