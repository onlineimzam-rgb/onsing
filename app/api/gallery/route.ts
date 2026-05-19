import { NextResponse, type NextRequest } from 'next/server'
import { sql, type GalleryImage } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const category = url.searchParams.get('category')
    const where: string[] = []
    const params: any[] = []
    let i = 1
    if (category) {
      where.push(`category = $${i++}`)
      params.push(category)
    }
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : ''
    const images = (await sql(
      `SELECT * FROM gallery_images ${whereClause}
        ORDER BY display_order ASC, id DESC LIMIT 200`,
      params
    )) as GalleryImage[]
    return NextResponse.json({ images })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message, images: [] }, { status: 500 })
  }
}
