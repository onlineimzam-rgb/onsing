import { NextResponse, type NextRequest } from 'next/server'
import { put } from '@vercel/blob'
import { sql, type BlogPost } from '@/lib/db'
import { isAuthorized } from '@/lib/auth'
import { slugify } from '@/lib/format'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const posts = (await sql(`SELECT * FROM blog_posts ORDER BY created_at DESC`)) as BlogPost[]
  return NextResponse.json({ posts })
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const ct = req.headers.get('content-type') || ''
    let body: any = {}
    let coverFile: File | null = null

    if (ct.includes('multipart/form-data')) {
      const fd = await req.formData()
      body = {
        title_tr: fd.get('title_tr'),
        title_en: fd.get('title_en'),
        excerpt_tr: fd.get('excerpt_tr'),
        excerpt_en: fd.get('excerpt_en'),
        content_tr: fd.get('content_tr'),
        content_en: fd.get('content_en'),
        tags: fd.get('tags'),
        is_published: fd.get('is_published') === 'true',
      }
      coverFile = fd.get('cover') as File | null
    } else {
      body = await req.json()
    }

    if (!body.title_tr || !body.content_tr) {
      return NextResponse.json({ error: 'title_tr ve content_tr zorunludur' }, { status: 400 })
    }

    let baseSlug = slugify(body.title_tr)
    if (!baseSlug) baseSlug = `yazi-${Date.now().toString(36)}`
    let slug = baseSlug
    let attempt = 0
    while (attempt < 5) {
      const existing = (await sql(`SELECT id FROM blog_posts WHERE slug = $1`, [slug])) as any[]
      if (existing.length === 0) break
      attempt++
      slug = `${baseSlug}-${attempt}`
    }

    let coverUrl: string | null = null
    if (coverFile && coverFile instanceof File && coverFile.size > 0) {
      const ext = (coverFile.name.split('.').pop() || 'jpg').toLowerCase()
      const blobName = `blog/${slug}-${Date.now()}.${ext}`
      const blob = await put(blobName, coverFile, { access: 'public', addRandomSuffix: false })
      coverUrl = blob.url
    }

    const tags = typeof body.tags === 'string'
      ? body.tags.split(',').map((s: string) => s.trim()).filter(Boolean)
      : Array.isArray(body.tags) ? body.tags : null

    const inserted = (await sql(
      `INSERT INTO blog_posts (
        slug, title_tr, title_en, excerpt_tr, excerpt_en, content_tr, content_en,
        cover_image, tags, is_published, published_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *`,
      [
        slug, body.title_tr, body.title_en || null,
        body.excerpt_tr || null, body.excerpt_en || null,
        body.content_tr, body.content_en || null,
        coverUrl, tags, !!body.is_published,
        body.is_published ? new Date() : null,
      ]
    )) as BlogPost[]

    return NextResponse.json({ post: inserted[0] })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
