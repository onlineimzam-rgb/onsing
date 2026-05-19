import { NextResponse, type NextRequest } from 'next/server'
import { sql, type Property } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const fetchCache = 'force-no-store'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const type = url.searchParams.get('type')
    const category = url.searchParams.get('category')
    const district = url.searchParams.get('district')
    const q = url.searchParams.get('q')?.trim()
    const featured = url.searchParams.get('featured')
    const minPrice = url.searchParams.get('min_price')
    const maxPrice = url.searchParams.get('max_price')
    const minArea = url.searchParams.get('min_area')
    const maxArea = url.searchParams.get('max_area')
    const minLot = url.searchParams.get('min_lot')
    const maxLot = url.searchParams.get('max_lot')
    const bedrooms = url.searchParams.get('bedrooms')
    const adaNo = url.searchParams.get('ada_no')?.trim()
    const parselNo = url.searchParams.get('parsel_no')?.trim()
    const ids = url.searchParams.get('ids')?.trim()
    const sort = url.searchParams.get('sort') || ''
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '24', 10), 60)
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0)

    const where: string[] = ["status = 'aktif'"]
    const params: any[] = []
    let i = 1

    if (type) {
      where.push(`type = $${i++}`)
      params.push(type)
    }
    if (category) {
      where.push(`category = $${i++}`)
      params.push(category)
    }
    if (district) {
      where.push(`district = $${i++}`)
      params.push(district)
    }
    if (featured === '1' || featured === 'true') {
      where.push(`is_featured = TRUE`)
    }
    if (minPrice) {
      where.push(`price >= $${i++}`)
      params.push(parseFloat(minPrice))
    }
    if (maxPrice) {
      where.push(`price <= $${i++}`)
      params.push(parseFloat(maxPrice))
    }
    if (minArea) {
      where.push(`area_m2 >= $${i++}`)
      params.push(parseInt(minArea, 10))
    }
    if (maxArea) {
      where.push(`area_m2 <= $${i++}`)
      params.push(parseInt(maxArea, 10))
    }
    if (minLot) {
      where.push(`lot_m2 >= $${i++}`)
      params.push(parseInt(minLot, 10))
    }
    if (maxLot) {
      where.push(`lot_m2 <= $${i++}`)
      params.push(parseInt(maxLot, 10))
    }
    if (bedrooms) {
      // "3+" gibi yazımları sayısal olarak "≥" şeklinde yorumla
      const m = /^(\d+)\+?$/.exec(bedrooms)
      if (m) {
        if (bedrooms.endsWith('+')) {
          where.push(`bedrooms >= $${i++}`)
        } else {
          where.push(`bedrooms = $${i++}`)
        }
        params.push(parseInt(m[1]!, 10))
      }
    }
    if (adaNo) {
      where.push(`ada_no = $${i++}`)
      params.push(adaNo)
    }
    if (parselNo) {
      where.push(`parsel_no = $${i++}`)
      params.push(parselNo)
    }
    if (ids) {
      const idsArr = ids
        .split(',')
        .map((x) => parseInt(x, 10))
        .filter((n) => Number.isFinite(n))
      if (idsArr.length > 0) {
        where.push(`id = ANY($${i++})`)
        params.push(idsArr)
      }
    }
    if (q) {
      where.push(
        `(title_tr ILIKE $${i} OR title_en ILIKE $${i} OR description_tr ILIKE $${i} OR district ILIKE $${i} OR neighborhood ILIKE $${i} OR reference_no ILIKE $${i})`
      )
      params.push(`%${q}%`)
      i++
    }

    const whereClause = where.join(' AND ')

    const orderClause = (() => {
      switch (sort) {
        case 'price_asc':
          return 'price ASC NULLS LAST, created_at DESC'
        case 'price_desc':
          return 'price DESC NULLS LAST, created_at DESC'
        case 'area_asc':
          return 'COALESCE(area_m2, lot_m2) ASC NULLS LAST, created_at DESC'
        case 'area_desc':
          return 'COALESCE(area_m2, lot_m2) DESC NULLS LAST, created_at DESC'
        case 'newest':
          return 'created_at DESC'
        default:
          return 'is_featured DESC, display_order ASC, created_at DESC'
      }
    })()

    const properties = (await sql(
      `SELECT id, reference_no, slug, type, category, status, title_tr, title_en,
              price, currency, city, district, neighborhood, lat, lng,
              bedrooms, bathrooms, area_m2, lot_m2, ada_no, parsel_no, pafta_no,
              is_detached, in_site, land_status, cover_image,
              is_featured, display_order, created_at
         FROM properties
        WHERE ${whereClause}
        ORDER BY ${orderClause}
        LIMIT ${limit} OFFSET ${offset}`,
      params
    )) as Partial<Property>[]

    const countRows = (await sql(
      `SELECT COUNT(*)::int AS total FROM properties WHERE ${whereClause}`,
      params
    )) as { total: number }[]

    return NextResponse.json(
      {
        properties,
        total: countRows[0]?.total || 0,
        limit,
        offset,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message, properties: [], total: 0 },
      { status: 500 }
    )
  }
}
