import { NextResponse, type NextRequest } from 'next/server'
import { put, del } from '@vercel/blob'
import { sql, type BlogPost } from '@/lib/db'
import { isAuthorized } from '@/lib/auth'
import { slugify } from '@/lib/format'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = parseInt(params.id, 10)
  if (Number.isNaN(id)) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const rows = (await sql(`SELECT * FROM blog_posts WHERE id = $1`, [id])) as BlogPost[]
  if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ post: rows[0] })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = parseInt(params.id, 10)
  if (Number.isNaN(id)) return NextResponse.json({ error: 'invalid' }, { status: 400 })

  try {
    const existing = (await sql(`SELECT * FROM blog_posts WHERE id = $1`, [id])) as BlogPost[]
    if (existing.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const current = existing[0]

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
        remove_cover: fd.get('remove_cover') === 'true',
      }
      coverFile = fd.get('cover') as File | null
    } else {
      body = await req.json()
    }

    let slug = current.slug
    if (body.title_tr && body.title_tr !== current.title_tr) {
      let baseSlug = slugify(body.title_tr)
      if (baseSlug) {
        slug = baseSlug
        let attempt = 0
        while (attempt < 5) {
          const dup = (await sql(`SELECT id FROM blog_posts WHERE slug = $1 AND id != $2`, [slug, id])) as any[]
          if (dup.length === 0) break
          attempt++
          slug = `${baseSlug}-${attempt}`
        }
      }
    }

    let coverUrl: string | null | undefined = undefined
    if (body.remove_cover && current.cover_image) {
      try {
        if (current.cover_image.includes('blob.vercel-storage.com')) await del(current.cover_image)
      } catch {}
      coverUrl = null
    }
    if (coverFile && coverFile instanceof File && coverFile.size > 0) {
      // Eski varsa sil
      if (current.cover_image && current.cover_image.includes('blob.vercel-storage.com')) {
        try { await del(current.cover_image) } catch {}
      }
      const ext = (coverFile.name.split('.').pop() || 'jpg').toLowerCase()
      const blobName = `blog/${slug}-${Date.now()}.${ext}`
      const blob = await put(blobName, coverFile, { access: 'public', addRandomSuffix: false })
      coverUrl = blob.url
    }

    const tags = body.tags === undefined
      ? current.tags
      : (typeof body.tags === 'string'
          ? body.tags.split(',').map((s: string) => s.trim()).filter(Boolean)
          : Array.isArray(body.tags) ? body.tags : current.tags)

    const wasPublished = current.is_published
    const willPublish = body.is_published ?? wasPublished

    const updated = (await sql(
      `UPDATE blog_posts SET
        slug = $1,
        title_tr = COALESCE($2, title_tr),
        title_en = COALESCE($3, title_en),
        excerpt_tr = COALESCE($4, excerpt_tr),
        excerpt_en = COALESCE($5, excerpt_en),
        content_tr = COALESCE($6, content_tr),
        content_en = COALESCE($7, content_en),
        cover_image = $8,
        tags = $9,
        is_published = $10,
        published_at = $11,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $12 RETURNING *`,
      [
        slug,
        body.title_tr ?? null,
        body.title_en ?? null,
        body.excerpt_tr ?? null,
        body.excerpt_en ?? null,
        body.content_tr ?? null,
        body.content_en ?? null,
        coverUrl === undefined ? current.cover_image : coverUrl,
        tags,
        willPublish,
        willPublish && !wasPublished ? new Date() : current.published_at,
        id,
      ]
    )) as BlogPost[]

    return NextResponse.json({ post: updated[0] })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = parseInt(params.id, 10)
  if (Number.isNaN(id)) return NextResponse.json({ error: 'invalid' }, { status: 400 })

  try {
    const existing = (await sql(`SELECT cover_image FROM blog_posts WHERE id = $1`, [id])) as { cover_image: string | null }[]
    if (existing[0]?.cover_image && existing[0].cover_image.includes('blob.vercel-storage.com')) {
      try { await del(existing[0].cover_image) } catch {}
    }
    await sql(`DELETE FROM blog_posts WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
