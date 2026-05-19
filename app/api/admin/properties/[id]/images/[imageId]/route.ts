import { NextResponse, type NextRequest } from 'next/server'
import { del } from '@vercel/blob'
import { sql } from '@/lib/db'
import { isAuthorized } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const propertyId = parseInt(params.id, 10)
  const imageId = parseInt(params.imageId, 10)
  if (Number.isNaN(propertyId) || Number.isNaN(imageId)) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 })
  }

  try {
    const rows = (await sql(
      `SELECT url FROM property_images WHERE id = $1 AND property_id = $2`,
      [imageId, propertyId]
    )) as { url: string }[]
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (rows[0].url.includes('blob.vercel-storage.com')) {
      try {
        await del(rows[0].url)
      } catch {}
    }
    await sql(`DELETE FROM property_images WHERE id = $1`, [imageId])

    // Eğer silinen, cover_image olarak işaretliyse, kalan ilkini cover yap
    const cover = (await sql(`SELECT cover_image FROM properties WHERE id = $1`, [
      propertyId,
    ])) as { cover_image: string | null }[]
    if (cover[0]?.cover_image === rows[0].url) {
      const next = (await sql(
        `SELECT url FROM property_images WHERE property_id = $1 ORDER BY display_order ASC, id ASC LIMIT 1`,
        [propertyId]
      )) as { url: string }[]
      await sql(
        `UPDATE properties SET cover_image = $1 WHERE id = $2`,
        [next[0]?.url ?? null, propertyId]
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const propertyId = parseInt(params.id, 10)
  const imageId = parseInt(params.imageId, 10)
  if (Number.isNaN(propertyId) || Number.isNaN(imageId)) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 })
  }
  try {
    const body = await req.json()
    if (typeof body.display_order === 'number') {
      await sql(
        `UPDATE property_images SET display_order = $1 WHERE id = $2 AND property_id = $3`,
        [body.display_order, imageId, propertyId]
      )
    }
    if (body.set_cover === true) {
      const rows = (await sql(`SELECT url FROM property_images WHERE id = $1 AND property_id = $2`, [
        imageId,
        propertyId,
      ])) as { url: string }[]
      if (rows.length > 0) {
        await sql(`UPDATE properties SET cover_image = $1 WHERE id = $2`, [
          rows[0].url,
          propertyId,
        ])
      }
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
