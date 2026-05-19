import { NextResponse, type NextRequest } from 'next/server'
import { sql, type BlogPost } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 50)
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0)
    const tag = url.searchParams.get('tag')

    const where: string[] = ['is_published = TRUE', 'published_at IS NOT NULL']
    const params: any[] = []
    let i = 1
    if (tag) {
      where.push(`$${i++} = ANY(tags)`)
      params.push(tag)
    }
    const whereClause = where.join(' AND ')

    const posts = (await sql(
      `SELECT id, slug, title_tr, title_en, excerpt_tr, excerpt_en,
              cover_image, tags, author, published_at, views
         FROM blog_posts
        WHERE ${whereClause}
        ORDER BY published_at DESC
        LIMIT ${limit} OFFSET ${offset}`,
      params
    )) as Partial<BlogPost>[]

    const countRows = (await sql(
      `SELECT COUNT(*)::int AS total FROM blog_posts WHERE ${whereClause}`,
      params
    )) as { total: number }[]

    return NextResponse.json({ posts, total: countRows[0]?.total || 0 })
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message, posts: [], total: 0 },
      { status: 500 }
    )
  }
}
