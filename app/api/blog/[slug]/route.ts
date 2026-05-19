import { NextResponse, type NextRequest } from 'next/server'
import { sql, type BlogPost } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const rows = (await sql(
      `SELECT * FROM blog_posts WHERE slug = $1 AND is_published = TRUE LIMIT 1`,
      [params.slug]
    )) as BlogPost[]
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const post = rows[0]
    sql(`UPDATE blog_posts SET views = views + 1 WHERE id = $1`, [post.id]).catch(() => {})

    const related = (await sql(
      `SELECT id, slug, title_tr, title_en, excerpt_tr, excerpt_en, cover_image, published_at
         FROM blog_posts
        WHERE is_published = TRUE AND id != $1
        ORDER BY published_at DESC
        LIMIT 3`,
      [post.id]
    )) as Partial<BlogPost>[]

    return NextResponse.json({ post, related })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
