import { NextResponse, type NextRequest } from 'next/server'
import { put } from '@vercel/blob'
import { isAuthorized } from '@/lib/auth'
import { getPublicSiteSettings, upsertSiteSetting } from '@/lib/settings'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const KEY_BY_KIND: Record<string, string> = {
  light: 'logo_light_url',
  dark: 'logo_dark_url',
  favicon: 'favicon_url',
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const settings = await getPublicSiteSettings()
  return NextResponse.json({ settings })
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const fd = await req.formData()
    const kind = String(fd.get('kind') || '').trim()
    const file = fd.get('file') as File | null
    const key = KEY_BY_KIND[kind]
    if (!key) return NextResponse.json({ error: 'Geçersiz logo türü' }, { status: 400 })
    if (!file || !(file instanceof File) || !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Geçerli bir görsel seçin' }, { status: 400 })
    }
    const ext = (file.name.split('.').pop() || 'png').toLowerCase()
    const blob = await put(`settings/${key}-${Date.now()}.${ext}`, file, {
      access: 'public',
      addRandomSuffix: false,
      contentType: file.type,
    })
    await upsertSiteSetting(key, blob.url)
    const settings = await getPublicSiteSettings()
    return NextResponse.json({ success: true, url: blob.url, settings })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const kind = String(body.kind || '').trim()
    const key = KEY_BY_KIND[kind]
    if (!key) return NextResponse.json({ error: 'Geçersiz logo türü' }, { status: 400 })
    await upsertSiteSetting(key, typeof body.url === 'string' && body.url.trim() ? body.url.trim() : null)
    const settings = await getPublicSiteSettings()
    return NextResponse.json({ success: true, settings })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
