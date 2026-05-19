import { NextResponse, type NextRequest } from 'next/server'
import { Resend } from 'resend'
import OpenAI from 'openai'
import { sql, type Lead, type Property } from '@/lib/db'
import { isAuthorized } from '@/lib/auth'
import { SITE_CONFIG } from '@/lib/config'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const resendApiKey = process.env.RESEND_API_KEY
const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const FROM = process.env.RESEND_FROM || `${SITE_CONFIG.name} <onboarding@resend.dev>`

function fmtPrice(price: number | null | undefined, currency: string | null | undefined) {
  if (!price) return '—'
  const num = Number(price).toLocaleString('tr-TR', { maximumFractionDigits: 0 })
  const suffix = currency === 'EUR' ? '€' : 'TL'
  return `${num} ${suffix}`
}

function escapeHtml(s: string) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

type PresentationProperty = any & {
  images?: string[]
  ai_comment?: string
}

function uniqueImages(p: any): string[] {
  return Array.from(
    new Set([...(Array.isArray(p.images) ? p.images : []), ...(Array.isArray(p.image_urls) ? p.image_urls : []), p.cover_image, p.image, p.image_url].filter(Boolean))
  ).slice(0, 4) as string[]
}

function propertySummaryRows(p: any) {
  return [
    ['Fiyat', fmtPrice(p.price, p.currency)],
    ['Konum', [p.neighborhood, p.district].filter(Boolean).join(' / ') || '—'],
    ['Alan', [p.area_m2 ? `${p.area_m2} m² net` : '', p.lot_m2 ? `${p.lot_m2} m² arsa` : ''].filter(Boolean).join(' · ') || '—'],
    ['Tapu', [p.ada_no ? `Ada ${p.ada_no}` : '', p.parsel_no ? `Parsel ${p.parsel_no}` : '', p.pafta_no ? `Pafta ${p.pafta_no}` : ''].filter(Boolean).join(' · ') || '—'],
    ['Nitelik', [p.type, p.category, p.land_status].filter(Boolean).join(' · ') || '—'],
  ]
}

function propertyCardHtml(p: PresentationProperty, locale = 'tr') {
  const url = p.slug ? `${SITE_CONFIG.url}/${locale}/emlak/${p.slug}/` : (p.external_url || p.url || '')
  const mapUrl = p.lat && p.lng ? `https://www.google.com/maps?q=${p.lat},${p.lng}` : ''
  const title = p.title_tr || p.title_en || p.title || `İlan ${p.reference_no || ''}`
  const images = uniqueImages(p)
  const summaryRows = propertySummaryRows(p)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:7px 9px;border-bottom:1px solid #edf2f7;color:#64748b;width:32%;font-size:12px">${escapeHtml(label)}</td><td style="padding:7px 9px;border-bottom:1px solid #edf2f7;font-weight:650;color:#0a1224;font-size:12px">${escapeHtml(value)}</td></tr>`
    )
    .join('')
  const meta = [
    p.bedrooms != null ? `${p.bedrooms} oda` : null,
    p.area_m2 != null ? `${p.area_m2} m²` : null,
    p.lot_m2 != null ? `${p.lot_m2} m² arsa` : null,
    p.land_status || null,
    p.district || null,
  ]
    .filter(Boolean)
    .join(' · ')
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:18px 0;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;background:#fff">
      <tr>
        <td valign="top" style="padding:16px">
          <div style="font-size:11px;color:#a07d1f;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:4px">
            ${(p.type || '').toUpperCase()} ${(p.category || '').toUpperCase()} · ${p.reference_no || ''}
          </div>
          <a href="${escapeHtml(url || '#')}" style="font-size:18px;font-weight:800;color:#0a1224;text-decoration:none;line-height:1.25;display:block;margin-bottom:6px">
            ${escapeHtml(title)}
          </a>
          ${meta ? `<div style="font-size:12px;color:#6b7280;margin-bottom:6px">${escapeHtml(meta)}</div>` : ''}
          ${
            images.length
              ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:12px 0 10px"><tr>${images
                  .map(
                    (img) =>
                      `<td width="25%" style="padding:2px"><img src="${escapeHtml(img)}" alt="" width="135" height="92" style="display:block;width:100%;height:92px;object-fit:cover;border-radius:10px;border:1px solid #e5e7eb"></td>`
                  )
                  .join('')}</tr></table>`
              : ''
          }
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin:10px 0">${summaryRows}</table>
          ${
            p.ai_comment
              ? `<div style="margin:12px 0;padding:12px 14px;border-left:4px solid #facc15;background:#fffbeb;color:#422006;border-radius:8px;font-size:13px;line-height:1.55"><strong>AI destekli yorum:</strong><br>${escapeHtml(p.ai_comment)}</div>`
              : ''
          }
          ${url ? `<a href="${escapeHtml(url)}" style="display:inline-block;margin-top:8px;padding:6px 12px;background:#0a1224;color:#ffd844;font-size:12px;font-weight:600;text-decoration:none;border-radius:6px">
            İlanı Görüntüle →
          </a>` : ''}
          ${
            mapUrl
              ? `<a href="${mapUrl}" style="display:inline-block;margin-top:8px;margin-left:6px;padding:6px 12px;background:#f3f4f6;color:#0a1224;font-size:12px;font-weight:600;text-decoration:none;border-radius:6px">Haritada Aç</a>`
              : ''
          }
        </td>
      </tr>
    </table>
  `
}

interface SendBody {
  subject?: string
  body?: string
  propertyIds?: number[]
  manualProperties?: any[]
  channel?: 'email' | 'whatsapp_only' // whatsapp_only = mail atma, sadece logla
}

async function buildAiComments(lead: Lead, cards: PresentationProperty[]) {
  if (!process.env.OPENAI_API_KEY || cards.length === 0) return {}
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Gayrimenkul müşterisine gönderilecek profesyonel, kısa ve temkinli portföy sunumu yorumları yaz. Kesin yatırım/tapu/imar garantisi verme. Sadece JSON döndür.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            lead: {
              intent: lead.intent,
              district: lead.district,
              category: lead.category,
              budget_min: lead.budget_min,
              budget_max: lead.budget_max,
              rooms: lead.rooms,
              area_min: lead.area_min,
              lot_min: lead.lot_min,
              message: lead.message,
            },
            properties: cards.map((p, i) => ({
              idx: i,
              title: p.title_tr || p.title,
              price: p.price,
              currency: p.currency,
              district: p.district,
              neighborhood: p.neighborhood,
              area_m2: p.area_m2,
              lot_m2: p.lot_m2,
              category: p.category,
              land_status: p.land_status,
              ada_no: p.ada_no,
              parsel_no: p.parsel_no,
            })),
            expected:
              'JSON: {"intro":"2-3 cümlelik genel sunum yorumu","comments":{"0":"ilan yorumu","1":"ilan yorumu"}}. Her yorum 1-2 cümle olsun.',
          }),
        },
      ],
    })
    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}') as {
      intro?: string
      comments?: Record<string, string>
    }
    return parsed
  } catch (e) {
    console.error('Lead AI presentation error:', (e as Error).message)
    return {}
  }
}

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = parseInt(ctx.params.id, 10)
    if (!id) return NextResponse.json({ error: 'Geçersiz id' }, { status: 400 })

    const body = (await req.json()) as SendBody
    const subject = (body.subject || '').trim() || `${SITE_CONFIG.name} — Sizin için seçtiklerimiz`
    const userBody = (body.body || '').trim()
    const propertyIds = Array.isArray(body.propertyIds)
      ? body.propertyIds.filter((n: any) => Number.isFinite(Number(n))).map((n: any) => Number(n))
      : []
    const manualProperties = Array.isArray(body.manualProperties)
      ? body.manualProperties
          .filter((p) => p && typeof p === 'object')
          .map((p, idx) => ({
            reference_no: p.reference_no || `MANUEL-${idx + 1}`,
            title_tr: String(p.title_tr || p.title || 'Manuel Portföy Önerisi').trim(),
            type: p.type || '',
            category: p.category || '',
            price: Number(p.price || 0) || null,
            currency: p.currency || 'TRY',
            district: p.district || '',
            neighborhood: p.neighborhood || '',
            bedrooms: p.bedrooms ? Number(p.bedrooms) : null,
            area_m2: p.area_m2 ? Number(p.area_m2) : null,
            lot_m2: p.lot_m2 ? Number(p.lot_m2) : null,
            land_status: p.land_status || '',
            ada_no: p.ada_no || '',
            parsel_no: p.parsel_no || '',
            pafta_no: p.pafta_no || '',
            cover_image: p.cover_image || p.image || '',
            image_urls: Array.isArray(p.image_urls)
              ? p.image_urls.filter((u: any) => typeof u === 'string')
              : Array.isArray(p.images)
                ? p.images.filter((u: any) => typeof u === 'string')
                : [],
            external_url: p.external_url || p.url || '',
          }))
      : []
    const channel = body.channel || 'email'

    const leadRows = (await sql(`SELECT * FROM leads WHERE id = $1`, [id])) as Lead[]
    if (!leadRows.length) {
      return NextResponse.json({ error: 'Talep bulunamadı' }, { status: 404 })
    }
    const lead = leadRows[0]

    let properties: Partial<Property>[] = []
    if (propertyIds.length > 0) {
      const placeholders = propertyIds.map((_, i) => `$${i + 1}`).join(',')
      properties = (await sql(
        `SELECT id, reference_no, slug, type, category, title_tr, title_en,
                price, currency, district, neighborhood, bedrooms, area_m2, lot_m2,
                lat, lng, ada_no, parsel_no, pafta_no, is_detached, in_site, land_status,
                cover_image
           FROM properties
          WHERE id IN (${placeholders})
          ORDER BY id DESC`,
        propertyIds as any[]
      )) as Partial<Property>[]
      const imageRows = (await sql(
        `SELECT property_id, url FROM property_images
          WHERE property_id IN (${placeholders})
          ORDER BY display_order ASC, id ASC`,
        propertyIds as any[]
      )) as { property_id: number; url: string }[]
      const imagesByProperty = new Map<number, string[]>()
      for (const row of imageRows) {
        const arr = imagesByProperty.get(row.property_id) || []
        if (arr.length < 4) arr.push(row.url)
        imagesByProperty.set(row.property_id, arr)
      }
      properties = properties.map((p) => ({
        ...p,
        images: imagesByProperty.get(Number(p.id)) || [],
      }))
    }

    if (channel === 'whatsapp_only') {
      return NextResponse.json({
        success: true,
        mailed: false,
        lead: { name: lead.name, phone: lead.phone, email: lead.email },
        properties,
        manualProperties,
      })
    }

    if (!lead.email) {
      return NextResponse.json(
        { error: 'Bu müşterinin e-posta adresi yok. WhatsApp seçeneğini kullanın.' },
        { status: 400 }
      )
    }
    if (!resendApiKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY tanımlı değil' }, { status: 500 })
    }

    const resend = new Resend(resendApiKey)
    const cards = [...properties, ...manualProperties] as PresentationProperty[]
    const ai = (await buildAiComments(lead, cards)) as {
      intro?: string
      comments?: Record<string, string>
    }
    const enrichedCards = cards.map((p, idx) => ({
      ...p,
      ai_comment: ai.comments?.[String(idx)] || '',
    }))
    const cardsHtml = enrichedCards.map((p) => propertyCardHtml(p)).join('\n')
    const bodyHtml = userBody
      ? userBody
          .split('\n')
          .map((line) => `<p style="margin:0 0 10px 0">${escapeHtml(line) || '&nbsp;'}</p>`)
          .join('')
      : ''

    const html = `
      <div style="font-family:system-ui,Arial,sans-serif;max-width:640px;margin:0 auto;color:#0a1224;background:#fafafa;padding:24px">
        <div style="background:linear-gradient(135deg,#0a1224,#1c2a40);color:#fff;padding:24px;border-radius:12px 12px 0 0">
          <div style="font-size:11px;color:#ffd844;letter-spacing:2px;text-transform:uppercase;font-weight:700;margin-bottom:4px">
            ${SITE_CONFIG.name}
          </div>
          <h2 style="margin:0;font-size:20px;font-weight:700">Sayın ${escapeHtml(lead.name)},</h2>
        </div>
        <div style="background:#fff;border:1px solid #e5e7eb;border-top:0;padding:22px;border-radius:0 0 12px 12px">
          ${bodyHtml || '<p style="margin:0 0 10px 0">Talebiniz doğrultusunda sizin için hazırladığımız portföy sunumunu aşağıda bulabilirsiniz.</p>'}
          ${
            ai.intro
              ? `<div style="margin:14px 0;padding:14px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;color:#334155;font-size:13px;line-height:1.6"><strong>AI destekli genel değerlendirme:</strong><br>${escapeHtml(ai.intro)}</div>`
              : ''
          }
          ${cardsHtml ? `<hr style="border:0;border-top:1px solid #e5e7eb;margin:16px 0"><div style="font-size:12px;color:#a07d1f;letter-spacing:1px;text-transform:uppercase;font-weight:700;margin:12px 0 6px">Portföy Sunumu (${cards.length})</div>${cardsHtml}` : ''}
          <hr style="border:0;border-top:1px solid #e5e7eb;margin:18px 0">
          <p style="font-size:13px;color:#6b7280;margin:0">
            Daha fazla bilgi veya yerinde inceleme için bana ulaşabilirsiniz:<br>
            📞 <a href="tel:${SITE_CONFIG.phoneRaw}" style="color:#a07d1f;text-decoration:none">${SITE_CONFIG.phoneDisplay}</a>
            &nbsp;·&nbsp;
            💬 <a href="https://wa.me/${SITE_CONFIG.whatsappNumber}" style="color:#a07d1f;text-decoration:none">WhatsApp</a>
          </p>
        </div>
        <p style="color:#9ca3af;font-size:11px;text-align:center;margin-top:16px">
          ${SITE_CONFIG.name} · <a href="${SITE_CONFIG.url}" style="color:#9ca3af">${SITE_CONFIG.domain}</a>
        </p>
      </div>
    `

    // BCC ile aynı email'e duplicate gitmesin
    const sendOpts: any = {
      from: FROM,
      to: lead.email,
      subject,
      html,
    }
    if (ADMIN_EMAIL && ADMIN_EMAIL.toLowerCase() !== lead.email.toLowerCase()) {
      sendOpts.bcc = [ADMIN_EMAIL]
    }
    if (ADMIN_EMAIL) sendOpts.replyTo = ADMIN_EMAIL

    const result = await resend.emails.send(sendOpts)
    if ((result as any)?.error) {
      console.error('Resend error:', (result as any).error)
      return NextResponse.json(
        { error: (result as any).error?.message || 'Mail gönderilemedi (Resend)' },
        { status: 500 }
      )
    }

    await sql(
      `UPDATE leads SET status = 'iletisimde' WHERE id = $1 AND status = 'yeni'`,
      [id]
    )

    return NextResponse.json({
      success: true,
      mailed: true,
      to: lead.email,
      messageId: (result as any)?.data?.id || null,
      properties: cards.length,
    })
  } catch (e: any) {
    console.error('send-message route error:', e?.stack || e)
    return NextResponse.json(
      { error: e?.message || String(e) || 'Bilinmeyen hata' },
      { status: 500 }
    )
  }
}
