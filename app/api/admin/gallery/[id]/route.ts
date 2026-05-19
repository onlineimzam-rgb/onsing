import { NextResponse, type NextRequest } from 'next/server'
import { del } from '@vercel/blob'
import { sql } from '@/lib/db'
import { isAuthorized } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = parseInt(params.id, 10)
  if (Number.isNaN(id)) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const rows = (await sql(`SELECT url FROM gallery_images WHERE id = $1`, [id])) as { url: string }[]
  if (rows[0]?.url && rows[0].url.includes('blob.vercel-storage.com')) {
    try { await del(rows[0].url) } catch {}
  }
  await sql(`DELETE FROM gallery_images WHERE id = $1`, [id])
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = parseInt(params.id, 10)
  if (Number.isNaN(id)) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const body = await req.json()
  await sql(
    `UPDATE gallery_images SET
      category = COALESCE($1, category),
      title = COALESCE($2, title),
      alt_text = COALESCE($3, alt_text),
      display_order = COALESCE($4, display_order)
     WHERE id = $5`,
    [body.category ?? null, body.title ?? null, body.alt_text ?? null,
     typeof body.display_order === 'number' ? body.display_order : null, id]
  )
  return NextResponse.json({ success: true })
}
