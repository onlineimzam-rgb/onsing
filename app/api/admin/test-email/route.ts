import { NextResponse, type NextRequest } from 'next/server'
import { Resend } from 'resend'
import { isAuthorized } from '@/lib/auth'
import { SITE_CONFIG } from '@/lib/config'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const apiKey = process.env.RESEND_API_KEY
  const adminEmail = process.env.ADMIN_EMAIL
  const from = process.env.RESEND_FROM || 'Candarli Uzman GM <onboarding@resend.dev>'

  if (!apiKey) {
    return NextResponse.json(
      { error: 'RESEND_API_KEY tanımlı değil' },
      { status: 500 }
    )
  }
  if (!adminEmail) {
    return NextResponse.json(
      { error: 'ADMIN_EMAIL tanımlı değil' },
      { status: 500 }
    )
  }

  try {
    const resend = new Resend(apiKey)
    const result = await resend.emails.send({
      from,
      to: adminEmail,
      subject: `[Test] ${SITE_CONFIG.name} — Mail bildirim sistemi çalışıyor`,
      html: `
        <div style="font-family:system-ui,Arial,sans-serif;max-width:540px;margin:0 auto;color:#0a1224">
          <div style="background:linear-gradient(135deg,#0a1224,#1c2a40);color:#fff;padding:24px;border-radius:12px 12px 0 0">
            <h2 style="margin:0;font-size:22px">✓ Mail Bildirim Sistemi Aktif</h2>
            <p style="margin:6px 0 0 0;color:#ffd844;font-size:13px">${SITE_CONFIG.name}</p>
          </div>
          <div style="background:#fff;border:1px solid #e5e7eb;border-top:0;padding:24px;border-radius:0 0 12px 12px">
            <p>Bu bir test bildirimidir. Aşağıdaki olaylar bundan sonra otomatik olarak mailinize gelecek:</p>
            <ul style="color:#374151;line-height:1.8">
              <li>Yeni mülk değerleme talebi</li>
              <li>Yeni alıcı / satıcı talebi (portföy toplama formu)</li>
              <li>Yeni iletişim formu mesajı</li>
              <li>Bir mülk hakkında bilgi talebi</li>
            </ul>
            <p style="color:#6b7280;font-size:13px;margin-top:20px">
              Mail alıcısı: <strong>${adminEmail}</strong><br>
              Gönderici: <strong>${from}</strong>
            </p>
          </div>
        </div>
      `,
    })

    if ((result as any).error) {
      return NextResponse.json(
        { error: (result as any).error.message || 'Resend hatası', details: (result as any).error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      sent_to: adminEmail,
      from,
      message_id: (result as any).data?.id,
    })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
