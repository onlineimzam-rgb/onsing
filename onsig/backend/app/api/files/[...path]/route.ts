/**
 * GET /api/files/[...path]  — serve stored files (PDFs, signature PNGs).
 *
 * Local driver only. In production this is replaced by direct Blob URLs.
 * Path traversal is blocked by `lib/storage.ts:readBytes()`.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { readBytes } from '@/lib/storage'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: { path: string[] } }) {
  const rel = (params.path || []).join('/').replace(/\\/g, '/')
  if (!rel || rel.includes('..')) {
    return NextResponse.json({ ok: false, error: 'bad_path' }, { status: 400 })
  }

  const file = await readBytes(rel)
  if (!file) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })

  return new NextResponse(new Uint8Array(file.data), {
    status: 200,
    headers: {
      'Content-Type': file.contentType,
      'Cache-Control': 'private, max-age=60',
      'Content-Disposition': `inline; filename="${rel.split('/').pop()}"`,
    },
  })
}
