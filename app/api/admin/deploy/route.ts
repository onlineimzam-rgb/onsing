import { NextResponse, type NextRequest } from 'next/server'
import { isAuthorized } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Vercel Deploy Hook ile production yeniden derlemesi tetikler.
 * Hook URL: Vercel → Project → Settings → Git → Deploy Hooks.
 * Ortam değişkeni: VERCEL_DEPLOY_HOOK_URL (tam https adresi).
 *
 * Not: Hook, bağlı Git dalındaki son commit'i deploy eder; push edilmemiş yerel değişiklikler canlıya çıkmaz.
 */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const hook = process.env.VERCEL_DEPLOY_HOOK_URL?.trim()
  if (!hook || !/^https:\/\//i.test(hook)) {
    return NextResponse.json(
      {
        error:
          'VERCEL_DEPLOY_HOOK_URL tanımlı değil veya geçersiz. Vercel panelinde Deploy Hook oluşturup bu env’yi ekleyin.',
      },
      { status: 500 }
    )
  }

  try {
    const res = await fetch(hook, {
      method: 'POST',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })
    const raw = await res.text()
    let vercel: unknown = raw
    try {
      vercel = JSON.parse(raw) as unknown
    } catch {
      /* metin yanıt */
    }

    if (!res.ok) {
      return NextResponse.json(
        {
          error: 'Deploy hook yanıtı başarısız',
          status: res.status,
          vercel,
        },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true, vercel })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
