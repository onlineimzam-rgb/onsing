import { NextResponse, type NextRequest } from 'next/server'
import { put } from '@vercel/blob'
import { sql, type PropertyImage, type Property } from '@/lib/db'
import { isAuthorized } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Tek istekte birden çok görsel yükleme
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const propertyId = parseInt(params.id, 10)
  if (Number.isNaN(propertyId)) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 })
  }

  try {
    const propertyRows = (await sql(`SELECT * FROM properties WHERE id = $1`, [
      propertyId,
    ])) as Property[]
    if (propertyRows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    const altText = formData.get('alt') as string | null
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files' }, { status: 400 })
    }

    // Mevcut max display_order
    const orderRows = (await sql(
      `SELECT COALESCE(MAX(display_order), -1) AS max_order FROM property_images WHERE property_id = $1`,
      [propertyId]
    )) as { max_order: number }[]
    let nextOrder = (orderRows[0]?.max_order ?? -1) + 1

    const created: PropertyImage[] = []
    for (const file of files) {
      if (!(file instanceof File)) continue
      if (!file.type.startsWith('image/')) continue
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const blobName = `properties/${propertyRows[0].slug}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`
      const blob = await put(blobName, file, { access: 'public', addRandomSuffix: false })

      const inserted = (await sql(
        `INSERT INTO property_images (property_id, url, alt_text, display_order)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [propertyId, blob.url, altText || propertyRows[0].title_tr, nextOrder]
      )) as PropertyImage[]
      created.push(inserted[0])
      nextOrder++
    }

    // Eğer cover_image yoksa ilk yüklenen görseli cover yap
    if (!propertyRows[0].cover_image && created.length > 0) {
      await sql(
        `UPDATE properties SET cover_image = $1 WHERE id = $2`,
        [created[0].url, propertyId]
      )
    }

    return NextResponse.json({ images: created })
  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
