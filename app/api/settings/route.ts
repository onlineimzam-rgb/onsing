import { NextResponse } from 'next/server'
import { getPublicSiteSettings } from '@/lib/settings'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const settings = await getPublicSiteSettings()
  return NextResponse.json({ settings })
}
