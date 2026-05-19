import { NextResponse, type NextRequest } from 'next/server'
import { put } from '@vercel/blob'
import { sql, type GalleryImage } from '@/lib/db'
import { isAuthorized } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const images = (await sql(
    `SELECT * FROM gallery_images ORDER BY display_order ASC, id DESC`
  )) as GalleryImage[]
  return NextResponse.json({ images })
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const fd = await req.formData()
    const files = fd.getAll('files') as File[]
    const category = (fd.get('category') as string) || null
    const title = (fd.get('title') as string) || null

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files' }, { status: 400 })
    }

    const orderRows = (await sql(
      `SELECT COALESCE(MAX(display_order), -1) AS max_order FROM gallery_images`
    )) as { max_order: number }[]
    let nextOrder = (orderRows[0]?.max_order ?? -1) + 1

    const created: GalleryImage[] = []
    for (const file of files) {
      if (!(file instanceof File)) continue
      if (!file.type.startsWith('image/')) continue
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const blobName = `gallery/${category || 'genel'}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const blob = await put(blobName, file, { access: 'public', addRandomSuffix: false })
      const inserted = (await sql(
        `INSERT INTO gallery_images (url, category, title, alt_text, display_order)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [blob.url, category, title, title, nextOrder]
      )) as GalleryImage[]
      created.push(inserted[0])
      nextOrder++
    }
    return NextResponse.json({ images: created })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
