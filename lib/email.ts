import { Resend } from 'resend'
import { SITE_CONFIG } from './config'

const resendApiKey = process.env.RESEND_API_KEY
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'info@candarliuzmangm.com.tr'
const FROM = process.env.RESEND_FROM || 'Çandarlı Uzman GM <onboarding@resend.dev>'

const resend = resendApiKey ? new Resend(resendApiKey) : null

interface LeadInput {
  intent: string
  name: string
  phone: string
  email?: string | null
  property_type?: string | null
  category?: string | null
  district?: string | null
  budget_min?: number | string | null
  budget_max?: number | string | null
  currency?: string
  rooms?: string | null
  area_min?: number | string | null
  lot_min?: number | string | null
  total_floors?: number | string | null
  is_detached?: boolean | string | null
  in_site?: boolean | string | null
  land_status?: string | null
  location_note?: string | null
  message?: string | null
}

function yesNo(value: boolean | string | null | undefined) {
  if (value === true || value === 'evet') return 'Evet'
  if (value === false || value === 'hayir') return 'Hayır'
  return ''
}

export async function sendLeadNotification(lead: LeadInput) {
  if (!resend) return { skipped: true }
  const intentLabels: Record<string, string> = {
    alici: 'Alıcı (mülk arıyor)',
    satici: 'Satıcı (mülk satmak istiyor)',
    kiraci: 'Kiracı (kiralık arıyor)',
    'kiralik-veren': 'Kiralık veren',
  }
  const subject = `Yeni Talep: ${intentLabels[lead.intent] || lead.intent} — ${lead.name}`
  const html = `
    <div style="font-family:system-ui,Arial,sans-serif;max-width:600px;margin:0 auto;color:#0a1224">
      <div style="background:linear-gradient(135deg,#0a1224,#1c2a40);color:#fff;padding:24px;border-radius:12px 12px 0 0">
        <h2 style="margin:0 0 4px 0;font-size:20px">Yeni Müşteri Talebi</h2>
        <p style="margin:0;color:#ffd844;font-size:13px">${intentLabels[lead.intent] || lead.intent}</p>
      </div>
      <div style="background:#fff;border:1px solid #e5e7eb;border-top:0;padding:20px;border-radius:0 0 12px 12px">
        ${row('Ad Soyad', lead.name)}
        ${row('Telefon', `<a href="tel:${lead.phone}">${lead.phone}</a>`)}
        ${lead.email ? row('E-posta', `<a href="mailto:${lead.email}">${lead.email}</a>`) : ''}
        ${lead.property_type ? row('İlan Türü', lead.property_type) : ''}
        ${lead.category ? row('Mülk Tipi', lead.category) : ''}
        ${lead.district ? row('Bölge', lead.district) : ''}
        ${lead.budget_min || lead.budget_max ? row('Bütçe', `${lead.budget_min || '?'} - ${lead.budget_max || '?'} ${lead.currency || ''}`) : ''}
        ${lead.rooms ? row('Oda Sayısı', lead.rooms) : ''}
        ${lead.area_min ? row('Min m²', String(lead.area_min)) : ''}
        ${lead.lot_min ? row('Min Arsa m²', String(lead.lot_min)) : ''}
        ${lead.total_floors ? row('Kaç Katlı', String(lead.total_floors)) : ''}
        ${yesNo(lead.is_detached) ? row('Tam Müstakil', yesNo(lead.is_detached)) : ''}
        ${yesNo(lead.in_site) ? row('Site İçinde', yesNo(lead.in_site)) : ''}
        ${lead.land_status ? row('Arsa Niteliği', lead.land_status) : ''}
        ${lead.location_note ? row('Mevki / Konum Notu', lead.location_note) : ''}
        ${lead.message ? row('Mesaj', String(lead.message).replace(/\n/g, '<br>')) : ''}
      </div>
      <p style="color:#6b7280;font-size:12px;text-align:center;margin-top:16px">${SITE_CONFIG.name} · ${SITE_CONFIG.url}</p>
    </div>
  `
  return resend.emails.send({ from: FROM, to: ADMIN_EMAIL, subject, html, replyTo: lead.email || undefined })
}

interface ValuationInput {
  name: string
  phone: string
  email?: string | null
  address: string
  property_type?: string | null
  area_m2?: number | string | null
  lot_m2?: number | string | null
  year_built?: number | string | null
  rooms?: string | null
  notes?: string | null
  city?: string | null
  district?: string | null
  neighborhood?: string | null
  ada_no?: string | null
  parsel_no?: string | null
  pafta_no?: string | null
  parcel_query_url?: string | null
  manual_property_info?: string | null
  property_photos?: string[] | null
  documents?: string[] | null
}

export async function sendValuationNotification(v: ValuationInput) {
  if (!resend) return { skipped: true }
  const subject = `Mülk Değerleme Talebi — ${v.name}`
  const adaParsel = [
    v.ada_no ? `Ada: ${v.ada_no}` : null,
    v.parsel_no ? `Parsel: ${v.parsel_no}` : null,
    v.pafta_no ? `Pafta: ${v.pafta_no}` : null,
  ].filter(Boolean).join(' · ')
  const locParts = [v.neighborhood, v.district, v.city].filter(Boolean).join(', ')
  const html = `
    <div style="font-family:system-ui,Arial,sans-serif;max-width:600px;margin:0 auto;color:#0a1224">
      <div style="background:linear-gradient(135deg,#0a1224,#1c2a40);color:#fff;padding:24px;border-radius:12px 12px 0 0">
        <h2 style="margin:0 0 4px 0;font-size:20px">Yeni Değerleme Talebi</h2>
        <p style="margin:0;color:#ffd844;font-size:13px">Müşteri 48 saat içinde dönüş bekliyor</p>
      </div>
      <div style="background:#fff;border:1px solid #e5e7eb;border-top:0;padding:20px;border-radius:0 0 12px 12px">
        ${row('Ad Soyad', v.name)}
        ${row('Telefon', `<a href="tel:${v.phone}">${v.phone}</a>`)}
        ${v.email ? row('E-posta', `<a href="mailto:${v.email}">${v.email}</a>`) : ''}
        ${v.property_type ? row('Mülk Tipi', v.property_type) : ''}
        ${locParts ? row('Lokasyon', locParts) : ''}
        ${row('Adres', v.address)}
        ${adaParsel ? row('Tapu', adaParsel) : ''}
        ${
          v.parcel_query_url
            ? row('Parsel Sorgu', `<a href="${v.parcel_query_url}" style="color:#a07d1f;text-decoration:underline">Parsel sorgu linkini aç</a>`)
            : ''
        }
        ${v.area_m2 ? row('Net m²', String(v.area_m2)) : ''}
        ${v.lot_m2 ? row('Arsa m²', String(v.lot_m2)) : ''}
        ${v.year_built ? row('Yapım Yılı', String(v.year_built)) : ''}
        ${v.rooms ? row('Oda Sayısı', v.rooms) : ''}
        ${v.manual_property_info ? row('Manuel Gayrimenkul Bilgileri', String(v.manual_property_info).replace(/\n/g, '<br>')) : ''}
        ${v.notes ? row('Notlar', String(v.notes).replace(/\n/g, '<br>')) : ''}
        ${
          v.property_photos && v.property_photos.length
            ? row(
                'Gayrimenkul Fotoğrafları',
                v.property_photos
                  .map(
                    (u, i) =>
                      `<a href="${u}" style="color:#a07d1f;text-decoration:underline">Fotoğraf ${i + 1}</a>`
                  )
                  .join(' · ')
              )
            : ''
        }
        ${
          v.documents && v.documents.length
            ? row(
                'Belgeler',
                v.documents
                  .map(
                    (u, i) =>
                      `<a href="${u}" style="color:#a07d1f;text-decoration:underline">Belge ${i + 1}</a>`
                  )
                  .join(' · ')
              )
            : ''
        }
      </div>
      <p style="color:#6b7280;font-size:12px;text-align:center;margin-top:16px">${SITE_CONFIG.name} · ${SITE_CONFIG.url}</p>
    </div>
  `
  return resend.emails.send({ from: FROM, to: ADMIN_EMAIL, subject, html, replyTo: v.email || undefined })
}

interface InquiryInput {
  name: string
  phone?: string | null
  email?: string | null
  subject?: string | null
  message: string
  property_ref?: string | null
  property_title?: string | null
}

export async function sendInquiryNotification(i: InquiryInput) {
  if (!resend) return { skipped: true }
  const subject = `İletişim: ${i.subject || i.name}${i.property_ref ? ` (${i.property_ref})` : ''}`
  const html = `
    <div style="font-family:system-ui,Arial,sans-serif;max-width:600px;margin:0 auto;color:#0a1224">
      <div style="background:linear-gradient(135deg,#0a1224,#1c2a40);color:#fff;padding:24px;border-radius:12px 12px 0 0">
        <h2 style="margin:0;font-size:20px">Yeni İletişim Mesajı</h2>
        ${i.property_title ? `<p style="margin:6px 0 0 0;color:#ffd844;font-size:13px">${i.property_title}</p>` : ''}
      </div>
      <div style="background:#fff;border:1px solid #e5e7eb;border-top:0;padding:20px;border-radius:0 0 12px 12px">
        ${row('Ad Soyad', i.name)}
        ${i.phone ? row('Telefon', `<a href="tel:${i.phone}">${i.phone}</a>`) : ''}
        ${i.email ? row('E-posta', `<a href="mailto:${i.email}">${i.email}</a>`) : ''}
        ${i.subject ? row('Konu', i.subject) : ''}
        ${row('Mesaj', String(i.message).replace(/\n/g, '<br>'))}
      </div>
      <p style="color:#6b7280;font-size:12px;text-align:center;margin-top:16px">${SITE_CONFIG.name} · ${SITE_CONFIG.url}</p>
    </div>
  `
  return resend.emails.send({ from: FROM, to: ADMIN_EMAIL, subject, html, replyTo: i.email || undefined })
}

function row(label: string, value: string) {
  return `<div style="display:flex;gap:12px;padding:8px 0;border-bottom:1px solid #f3f4f6">
    <div style="min-width:120px;color:#6b7280;font-size:13px">${label}</div>
    <div style="flex:1;color:#0a1224;font-size:14px;font-weight:500">${value}</div>
  </div>`
}

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  kira: 'Kira Sözleşmesi',
  yetki: 'Yetki Sözleşmesi',
  'alim-satim': 'Gayrimenkul Satış Sözleşmesi',
  'yer-gosterme': 'Yer Gösterme Tutanağı ve Komisyon Sözleşmesi',
}

const ROLE_LABELS: Record<string, string> = {
  'kiraya-veren': 'Kiraya Veren',
  kefil: 'Kefil',
  kiraci: 'Kiracı',
  satici: 'Satıcı',
  alici: 'Alıcı',
  komisyoncu: 'Emlak Komisyoncusu',
  'mal-sahibi': 'Mal Sahibi',
  'yer-goren': 'Taşınmazı Gezen / Gören',
}

function escapeMailHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export interface ContractCreatedInput {
  contractId: number
  contractType: string
  title?: string | null
  ownerName?: string | null
  customerName?: string | null
  propertyAddress?: string | null
}

export async function sendContractCreatedNotification(c: ContractCreatedInput) {
  if (!resend) return { skipped: true }
  const typeLabel = CONTRACT_TYPE_LABELS[c.contractType] || c.contractType
  const subject = `Yeni Sözleşme: ${typeLabel}${c.title ? ` — ${c.title}` : ''}`
  const html = `
    <div style="font-family:system-ui,Arial,sans-serif;max-width:600px;margin:0 auto;color:#0a1224">
      <div style="background:linear-gradient(135deg,#0a1224,#1c2a40);color:#fff;padding:24px;border-radius:12px 12px 0 0">
        <h2 style="margin:0;font-size:20px">Yeni Sözleşme Oluşturuldu</h2>
        <p style="margin:6px 0 0 0;color:#ffd844;font-size:13px">${escapeMailHtml(typeLabel)}</p>
      </div>
      <div style="background:#fff;border:1px solid #e5e7eb;border-top:0;padding:20px;border-radius:0 0 12px 12px">
        ${row('Sözleşme No', `#${c.contractId}`)}
        ${c.title ? row('Başlık', escapeMailHtml(c.title)) : ''}
        ${c.ownerName ? row('Mal Sahibi / Kiraya Veren / Satıcı', escapeMailHtml(c.ownerName)) : ''}
        ${c.customerName ? row('Kiracı / Alıcı / Müşteri', escapeMailHtml(c.customerName)) : ''}
        ${c.propertyAddress ? row('Taşınmaz Adresi', escapeMailHtml(c.propertyAddress)) : ''}
      </div>
      <p style="color:#6b7280;font-size:12px;text-align:center;margin-top:16px">${SITE_CONFIG.name} · ${SITE_CONFIG.url}</p>
    </div>
  `
  return resend.emails.send({ from: FROM, to: ADMIN_EMAIL, subject, html })
}

export interface SignLinkCreatedInput {
  contractId: number
  contractType: string
  role: string
  signUrl: string
  recipientName?: string | null
}

export async function sendSignLinkCreatedNotification(s: SignLinkCreatedInput) {
  if (!resend) return { skipped: true }
  const typeLabel = CONTRACT_TYPE_LABELS[s.contractType] || s.contractType
  const roleLabel = ROLE_LABELS[s.role] || s.role
  const subject = `İmza Linki Oluşturuldu — ${roleLabel} (${typeLabel})`
  const html = `
    <div style="font-family:system-ui,Arial,sans-serif;max-width:600px;margin:0 auto;color:#0a1224">
      <div style="background:linear-gradient(135deg,#0a1224,#1c2a40);color:#fff;padding:24px;border-radius:12px 12px 0 0">
        <h2 style="margin:0;font-size:20px">Yeni İmza Linki</h2>
        <p style="margin:6px 0 0 0;color:#ffd844;font-size:13px">${escapeMailHtml(typeLabel)} · ${escapeMailHtml(roleLabel)}</p>
      </div>
      <div style="background:#fff;border:1px solid #e5e7eb;border-top:0;padding:20px;border-radius:0 0 12px 12px">
        ${row('Sözleşme No', `#${s.contractId}`)}
        ${row('Taraf (Rol)', escapeMailHtml(roleLabel))}
        ${s.recipientName ? row('Müşteri', escapeMailHtml(s.recipientName)) : ''}
        ${row('İmza Linki', `<a href="${s.signUrl}" style="color:#a07d1f;text-decoration:underline">${escapeMailHtml(s.signUrl)}</a>`)}
        <p style="font-size:12px;color:#6b7280;margin-top:12px">
          Bu link müşteriye iletildiğinde, kişi metni inceleyip imza atabilir. İmza tamamlanınca ayrıca bildirim gelir.
        </p>
      </div>
      <p style="color:#6b7280;font-size:12px;text-align:center;margin-top:16px">${SITE_CONFIG.name} · ${SITE_CONFIG.url}</p>
    </div>
  `
  return resend.emails.send({ from: FROM, to: ADMIN_EMAIL, subject, html })
}

export interface ContractSignedInput {
  contractId: number
  contractType: string
  role: string
  signerName: string
  signerTc?: string | null
  signerEmail?: string | null
  signerPhone?: string | null
  signedAt: Date | string
}

export async function sendContractSignedNotification(s: ContractSignedInput) {
  if (!resend) return { skipped: true }
  const typeLabel = CONTRACT_TYPE_LABELS[s.contractType] || s.contractType
  const roleLabel = ROLE_LABELS[s.role] || s.role
  const subject = `İmza Tamamlandı — ${s.signerName} (${roleLabel})`
  const signedAtStr = new Date(s.signedAt).toLocaleString('tr-TR')
  const html = `
    <div style="font-family:system-ui,Arial,sans-serif;max-width:600px;margin:0 auto;color:#0a1224">
      <div style="background:linear-gradient(135deg,#0a1224,#1c2a40);color:#fff;padding:24px;border-radius:12px 12px 0 0">
        <h2 style="margin:0;font-size:20px">Sözleşme İmzalandı</h2>
        <p style="margin:6px 0 0 0;color:#ffd844;font-size:13px">${escapeMailHtml(typeLabel)} · ${escapeMailHtml(roleLabel)}</p>
      </div>
      <div style="background:#fff;border:1px solid #e5e7eb;border-top:0;padding:20px;border-radius:0 0 12px 12px">
        ${row('Sözleşme No', `#${s.contractId}`)}
        ${row('İmzalayan', escapeMailHtml(s.signerName))}
        ${row('Rol', escapeMailHtml(roleLabel))}
        ${s.signerTc ? row('T.C.', escapeMailHtml(s.signerTc)) : ''}
        ${s.signerPhone ? row('Telefon', `<a href="tel:${escapeMailHtml(s.signerPhone)}">${escapeMailHtml(s.signerPhone)}</a>`) : ''}
        ${s.signerEmail ? row('E-posta', `<a href="mailto:${escapeMailHtml(s.signerEmail)}">${escapeMailHtml(s.signerEmail)}</a>`) : ''}
        ${row('Tarih', signedAtStr)}
      </div>
      <p style="color:#6b7280;font-size:12px;text-align:center;margin-top:16px">${SITE_CONFIG.name} · ${SITE_CONFIG.url}</p>
    </div>
  `
  return resend.emails.send({ from: FROM, to: ADMIN_EMAIL, subject, html })
}
