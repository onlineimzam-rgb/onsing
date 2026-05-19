import { NextResponse, type NextRequest } from 'next/server'
import { put } from '@vercel/blob'
import { sql, type Property, type PropertyImage } from '@/lib/db'
import { isAuthorized } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
// Çok sayıda görsel olabilir (örn. sahibinden 31 fotoğraf)
export const maxDuration = 60

const MAX_IMAGES = 60

function browserHeaders(): Record<string, string> {
  return {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.7,en;q=0.6',
    Referer: 'https://www.sahibinden.com/',
  }
}

function extFromUrl(url: string, fallback = 'jpg'): string {
  const m = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/)
  if (!m) return fallback
  const ext = m[1].toLowerCase()
  if (['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(ext)) return ext
  return fallback
}

function contentTypeFor(ext: string): string {
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'avif') return 'image/avif'
  return 'image/jpeg'
}

interface ImportBody {
  urls?: string[]
  // İndekslerin listesi verilirse sadece o görsellerin URL'lerini al
  indices?: number[]
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const propertyId = parseInt(params.id, 10)
  if (Number.isNaN(propertyId)) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 })
  }

  try {
    const propertyRows = (await sql(
      `SELECT id, slug, title_tr, cover_image FROM properties WHERE id = $1`,
      [propertyId]
    )) as Pick<Property, 'id' | 'slug' | 'title_tr' | 'cover_image'>[]
    if (propertyRows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }
    const property = propertyRows[0]

    const body = (await req.json()) as ImportBody
    let urls = Array.isArray(body.urls) ? body.urls : []
    urls = urls.filter((u) => typeof u === 'string' && /^https?:\/\//i.test(u))
    if (Array.isArray(body.indices) && body.indices.length > 0) {
      const indexSet = new Set(body.indices)
      urls = urls.filter((_, i) => indexSet.has(i))
    }
    if (urls.length === 0) {
      return NextResponse.json({ error: 'urls listesi boş' }, { status: 400 })
    }
    if (urls.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: `En fazla ${MAX_IMAGES} görsel içe aktarılabilir` },
        { status: 400 }
      )
    }

    const orderRows = (await sql(
      `SELECT COALESCE(MAX(display_order), -1) AS max_order FROM property_images WHERE property_id = $1`,
      [propertyId]
    )) as { max_order: number }[]
    let nextOrder = (orderRows[0]?.max_order ?? -1) + 1

    const created: PropertyImage[] = []
    const failed: Array<{ url: string; reason: string }> = []

    for (const url of urls) {
      try {
        const resp = await fetch(url, { headers: browserHeaders(), redirect: 'follow' })
        if (!resp.ok) {
          failed.push({ url, reason: `HTTP ${resp.status}` })
          continue
        }
        const ext = extFromUrl(url, 'jpg')
        const buf = Buffer.from(await resp.arrayBuffer())
        if (buf.byteLength < 1024) {
          failed.push({ url, reason: 'Dosya çok küçük' })
          continue
        }

        const blobName = `properties/${property.slug}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${ext}`
        const blob = await put(blobName, buf, {
          access: 'public',
          addRandomSuffix: false,
          contentType: contentTypeFor(ext),
        })

        const inserted = (await sql(
          `INSERT INTO property_images (property_id, url, alt_text, display_order)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [propertyId, blob.url, property.title_tr, nextOrder]
        )) as PropertyImage[]
        created.push(inserted[0])
        nextOrder++
      } catch (e: any) {
        failed.push({ url, reason: e?.message || String(e) })
      }
    }

    // İlk yüklenen görseli cover_image yap (henüz yoksa)
    if (!property.cover_image && created.length > 0) {
      await sql(`UPDATE properties SET cover_image = $1 WHERE id = $2`, [
        created[0].url,
        propertyId,
      ])
    }

    return NextResponse.json({
      success: true,
      uploaded: created.length,
      failedCount: failed.length,
      failed: failed.slice(0, 10), // çok uzun olmasın
      images: created,
    })
  } catch (e: any) {
    console.error('import-images route error:', e?.stack || e)
    return NextResponse.json({ error: e?.message || 'Hata' }, { status: 500 })
  }
}
