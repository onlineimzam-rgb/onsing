import { NextResponse, type NextRequest } from 'next/server'
import * as cheerio from 'cheerio'
import { isAuthorized } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

// ============================================================
// Sahibinden.com → Site içi form alanları çevirici
// ============================================================
//
// Sahibinden ilan sayfalarında en güvenilir veri kaynakları:
//   1. Detay tablosu (.classifiedInfoList) — "Emlak Tipi", "m²", "Ada No" vb.
//   2. Başlık altı lokasyon — ".classifiedInfo h2 a" (İl / İlçe / Mahalle)
//   3. JS gömülü harita verisi — google.maps.LatLng(lat,lng) regex ile
// ============================================================

function normalizeKey(s: string): string {
  return s
    .toLocaleLowerCase('tr-TR')
    .replace(/\s+/g, ' ')
    .replace(/[:.]/g, '')
    .trim()
}

function mapCategoryFromEmlakTipi(raw: string): string | null {
  const r = raw.toLocaleLowerCase('tr-TR')
  if (/arsa/.test(r)) return 'arsa'
  if (/tarla/.test(r)) return 'tarla'
  if (/villa/.test(r)) return 'villa'
  if (/müstakil|mustakil/.test(r)) return 'mustakil-ev'
  if (/yazlık|yazlik/.test(r)) return 'yazlik'
  if (/rezidans/.test(r)) return 'rezidans'
  if (/ofis/.test(r)) return 'ofis'
  if (/dükkan|dukkan/.test(r)) return 'dukkan'
  if (/iş\s*yeri|isyeri|iş yeri/.test(r)) return 'is-yeri'
  if (/bağ|bag|bahçe|bahce/.test(r)) return 'bag-bahce'
  if (/turistik/.test(r)) return 'turistik-tesis'
  if (/daire|konut|residence/.test(r)) return 'daire'
  return null
}

function mapTypeFromEmlakTipi(raw: string): string {
  const r = raw.toLocaleLowerCase('tr-TR')
  if (/günlük|gunluk|daily/.test(r)) return 'gunluk-kiralik'
  if (/kiralık|kiralik|rent/.test(r)) return 'kiralik'
  return 'satilik'
}

function parseCurrency(text: string): { price: number | null; currency: 'TRY' | 'EUR' } {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  let currency: 'TRY' | 'EUR' = 'TRY'
  if (/€|EUR/i.test(cleaned)) currency = 'EUR'
  if (/£|GBP/i.test(cleaned)) currency = 'EUR' // sadeleştirme
  const numMatch = cleaned.match(/[\d.,]+/g)
  if (!numMatch) return { price: null, currency }
  // sahibinden formatı: "5.500.000 TL" → 5500000
  const num = numMatch.join('').replace(/\./g, '').replace(',', '.')
  const n = Number(num)
  return { price: Number.isFinite(n) ? Math.round(n) : null, currency }
}

function parseInteger(text: string | undefined | null): number | null {
  if (!text) return null
  const m = text.replace(/\./g, '').match(/-?\d+/)
  return m ? Number(m[0]) : null
}

function parseFloatish(text: string | undefined | null): number | null {
  if (!text) return null
  // "0.30", "6.50" → 0.30, 6.50
  const m = text.replace(',', '.').match(/-?\d+(?:\.\d+)?/)
  return m ? Number(m[0]) : null
}

function parseBedrooms(text: string): number | null {
  if (!text) return null
  const m = text.match(/(\d+)\s*\+/)
  if (m) return Number(m[1])
  if (/stüdyo|studyo|studio/i.test(text)) return 1
  return null
}

interface ImportedFields {
  type?: string
  category?: string | null
  title_tr?: string
  description_tr?: string
  price?: number
  currency?: 'TRY' | 'EUR'
  city?: string
  district?: string
  neighborhood?: string
  bedrooms?: number
  bathrooms?: number
  area_m2?: number
  lot_m2?: number
  building_age?: number
  floor?: number
  total_floors?: number
  heating_type?: string
  ada_no?: string
  parsel_no?: string
  pafta_no?: string
  features?: string[]
  lat?: number
  lng?: number
  images?: string[]
}

// Sahibinden CDN image URL deseni:
//   https://i0.shbdn.com/photos/72/68/24/x5_12737268247jh.jpg
//   https://i1.shbdn.com/photos/72/68/24/org_12737268247jh.avif
// <size>: x1 | x2 | x3 | x5 | org  · <ext>: jpg | jpeg | webp | avif
// Aynı resmin farklı boyutları aynı ID'yi paylaşır. x5_*.jpg en yüksek kalitedir.
const SHBDN_IMAGE_RE =
  /https?:\/\/i\d+\.shbdn\.com\/photos\/[\d/]+\/(?:x\d+|org)_\d+[a-z]*\.(?:jpe?g|webp|avif)/gi

function normalizeShbdnUrl(url: string): { id: string; jpgUrl: string } | null {
  // ID = `(?:x\d+|org)_` ile başlayan sayı
  const m = url.match(
    /(https?:\/\/i\d+\.shbdn\.com\/photos\/[\d/]+\/)(?:x\d+|org)_(\d+)([a-z]*)\.(jpe?g|webp|avif)/i
  )
  if (!m) return null
  const [, base, id, suffix] = m
  // Daima x5 + jpg kullan (en yüksek kalite + universal)
  return { id, jpgUrl: `${base}x5_${id}${suffix || ''}.jpg` }
}

function extractImagesFromHtml(html: string, $: cheerio.CheerioAPI): string[] {
  const seen = new Map<string, string>() // id → jpg URL
  const ordered: string[] = [] // ID sırası

  const addUrl = (raw: string | undefined | null) => {
    if (!raw) return
    // srcset birden fazla URL içerebilir: "url1 1x, url2 2x"
    raw.split(',').forEach((part) => {
      const u = part.trim().split(/\s+/)[0]
      const norm = normalizeShbdnUrl(u)
      if (norm && !seen.has(norm.id)) {
        seen.set(norm.id, norm.jpgUrl)
        ordered.push(norm.id)
      }
    })
  }

  // 1) <picture> içindeki <source srcset="..."> ve <img src/data-src=...>
  $('picture source, source').each((_, el) => addUrl($(el).attr('srcset')))
  $('img').each((_, el) => {
    addUrl($(el).attr('src'))
    addUrl($(el).attr('data-src'))
    addUrl($(el).attr('data-original'))
    addUrl($(el).attr('srcset'))
  })

  // 2) HTML metnindeki tüm shbdn URL'leri (regex fallback — bazen JS gömülü)
  const matches = html.match(SHBDN_IMAGE_RE) || []
  matches.forEach((m) => addUrl(m))

  return ordered.map((id) => seen.get(id)!).filter(Boolean)
}

const ARSA_KATEGORILERI = new Set(['arsa', 'tarla', 'bag-bahce'])

function extractFromHtml(html: string): ImportedFields {
  const $ = cheerio.load(html)
  const fields: ImportedFields = {}

  // ---------- 1) Başlık ----------
  const titleRaw =
    $('.classifiedDetailTitle h1').first().text().trim() ||
    $('h1.classifiedTitle').first().text().trim() ||
    $('h1').first().text().trim() ||
    $('meta[property="og:title"]').attr('content')?.trim() ||
    ''
  if (titleRaw) fields.title_tr = titleRaw

  // ---------- 2) Fiyat ----------
  const priceCandidates = [
    $('.classifiedInfo .classified-price-wrapper').first().text(),
    $('.classifiedInfo h3').first().text(),
    $('.classified-price-wrapper').first().text(),
    $('.priceContainer .price').first().text(),
    $('h3:contains("TL")').first().text(),
    $('h3:contains("EUR")').first().text(),
    $('h3:contains("€")').first().text(),
    $('div[class*="price" i]').first().text(),
  ]
  for (const c of priceCandidates) {
    if (!c) continue
    const parsed = parseCurrency(c)
    if (parsed.price && parsed.price > 1000) {
      fields.price = parsed.price
      fields.currency = parsed.currency
      break
    }
  }

  // ---------- 3) Detay attribute tablosu ----------
  // sahibinden'in çeşitli template'lerinde liste formatları:
  //   <li><strong>Emlak Tipi</strong><span>Satılık Arsa</span></li>
  //   <li>Emlak Tipi <span>Satılık Arsa</span></li>
  //   <li class="..."><strong>...</strong>: <span>...</span></li>
  const attrs = new Map<string, string>()
  const liSelectors = [
    '.classifiedInfoList li',
    'ul.classifiedInfoList li',
    '.uiBoxBody li',
    '.classifiedDetailListInfo li',
    '.classifiedDetailWrapper li',
    'ul li:has(strong + span)',
    'tr',
  ]
  for (const sel of liSelectors) {
    $(sel).each((_, el) => {
      let label = $(el).find('strong, th, .l').first().text().trim()
      let value =
        $(el).find('span, td, .v').first().text().trim() ||
        $(el).clone().children('strong, th, .l').remove().end().text().trim()
      if (!label || !value) return
      // bazen "Emlak Tipi : Satılık Arsa" şeklinde label içinde olur
      label = label.replace(/[:：]\s*$/, '')
      const k = normalizeKey(label)
      const v = value.replace(/\s+/g, ' ').trim()
      if (k && v && !attrs.has(k)) attrs.set(k, v)
    })
  }

  const get = (...keys: string[]) => {
    for (const k of keys) {
      const v = attrs.get(normalizeKey(k))
      if (v) return v
    }
    return ''
  }

  // ---------- 4) Emlak Tipi → kategori + tür (en güvenilir kaynak) ----------
  const emlakTipi = get('emlak tipi', 'kategori', 'kategori adı')
  if (emlakTipi) {
    fields.type = mapTypeFromEmlakTipi(emlakTipi)
    const cat = mapCategoryFromEmlakTipi(emlakTipi)
    if (cat) fields.category = cat
  }

  // Yedek: breadcrumb'a düş
  if (!fields.type || !fields.category) {
    const breadcrumbs: string[] = []
    $(
      '#breadCrumb a, .breadCrumb a, ul.breadCrumb li a, nav[aria-label="breadcrumb"] a'
    ).each((_, el) => {
      const t = $(el).text().trim()
      if (t) breadcrumbs.push(t)
    })
    if (!fields.type) fields.type = mapTypeFromEmlakTipi(breadcrumbs.join(' '))
    if (!fields.category) {
      for (const b of breadcrumbs) {
        const c = mapCategoryFromEmlakTipi(b)
        if (c) {
          fields.category = c
          break
        }
      }
    }
  }

  // ---------- 5) Lokasyon: başlık altı "İl / İlçe / Mahalle" ----------
  // Ekran görüntülerinde: "İzmir / Dikili / Çandarlı Mh."
  const locParts: string[] = []
  $(
    '.classifiedInfo h2 a, .classifiedInfo h2 .longTitle a, .classifiedInfo .classifiedInfo-h2 a, .classifiedTitle + h2 a, h2.classifiedTitle a'
  ).each((_, el) => {
    const t = $(el).text().trim()
    if (t && t.length < 60 && !locParts.includes(t)) locParts.push(t)
  })

  // Eğer h2'de bulamadıysak breadcrumb'ın son 3 elementine bak
  if (locParts.length < 3) {
    const breadcrumbs: string[] = []
    $('#breadCrumb a, .breadCrumb a, ul.breadCrumb li a').each((_, el) => {
      const t = $(el).text().trim()
      if (t) breadcrumbs.push(t)
    })
    if (breadcrumbs.length >= 3) {
      const tail = breadcrumbs.slice(-3)
      for (const t of tail) {
        if (!locParts.includes(t)) locParts.push(t)
      }
    }
  }

  // Mahalle ekinde "Mh." / "Mah." varsa temizle
  const cleanLoc = (s: string) =>
    s.replace(/\s*Mh\.?$/i, '').replace(/\s*Mah\.?$/i, '').trim()

  if (locParts.length >= 3) {
    fields.city = cleanLoc(locParts[locParts.length - 3])
    fields.district = cleanLoc(locParts[locParts.length - 2])
    fields.neighborhood = cleanLoc(locParts[locParts.length - 1])
  } else if (locParts.length === 2) {
    fields.city = cleanLoc(locParts[0])
    fields.district = cleanLoc(locParts[1])
  } else if (locParts.length === 1) {
    fields.city = cleanLoc(locParts[0])
  }

  // ---------- 6) Lat/Lng — JS gömülü harita verisi ----------
  const latLngPatterns: RegExp[] = [
    /google\.maps\.LatLng\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/i,
    /"latitude"\s*:\s*(-?\d+(?:\.\d+)?)\s*,\s*"longitude"\s*:\s*(-?\d+(?:\.\d+)?)/i,
    /'latitude'\s*:\s*'(-?\d+(?:\.\d+)?)'\s*,\s*'longitude'\s*:\s*'(-?\d+(?:\.\d+)?)'/i,
    /data-lat=["'](-?\d+(?:\.\d+)?)["']\s+data-(?:lng|lon)=["'](-?\d+(?:\.\d+)?)["']/i,
    /MAP_CONFIG\s*=\s*[^}]*?lat["']?\s*[:=]\s*(-?\d+(?:\.\d+)?)[^}]*?(?:lng|lon|long)["']?\s*[:=]\s*(-?\d+(?:\.\d+)?)/i,
    /center:\s*\{\s*lat:\s*(-?\d+(?:\.\d+)?)\s*,\s*lng:\s*(-?\d+(?:\.\d+)?)\s*\}/i,
    // mapContainer iframe src: ...&q=38.93,26.93 ya da ...!2d26.93!3d38.93 (Google Embed)
    /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
  ]
  for (const re of latLngPatterns) {
    const m = html.match(re)
    if (m) {
      const a = Number(m[1])
      const b = Number(m[2])
      if (Number.isFinite(a) && Number.isFinite(b)) {
        // Google Embed `!2d{lng}!3d{lat}` ise sırayı tersine çevir
        if (re.source.includes('!2d')) {
          fields.lng = a
          fields.lat = b
        } else {
          fields.lat = a
          fields.lng = b
        }
        break
      }
    }
  }
  // Google Maps embed iframe source: !2d{lng}!3d{lat}
  if (fields.lat == null) {
    const embed = html.match(/!2d(-?\d+\.\d+)!3d(-?\d+\.\d+)/)
    if (embed) {
      fields.lng = Number(embed[1])
      fields.lat = Number(embed[2])
    }
  }

  // ---------- 7) m² mantığı (kategoriye göre) ----------
  const m2Genel = get('m²', 'metrekare', 'metrekare alanı')
  const m2Brut = get('m² brüt', 'metrekare brüt', 'm2 brüt', 'brüt m²', 'm²(brüt)', 'metrekare (brüt)')
  const m2Net = get('m² net', 'metrekare net', 'm2 net', 'net m²', 'm²(net)', 'metrekare (net)')
  const arsaM2 = get('m² arsa', 'arsa alanı', 'arsa m²', 'metrekare arsa', 'arsa metrekaresi')

  if (ARSA_KATEGORILERI.has(fields.category || '')) {
    // Arsa / tarla → tek metrekare alanı vardır, lot_m2'ye yaz
    fields.lot_m2 =
      parseInteger(arsaM2) ?? parseInteger(m2Genel) ?? parseInteger(m2Brut) ?? undefined
    fields.area_m2 = undefined
  } else {
    // Konut → net öncelikli
    fields.area_m2 =
      parseInteger(m2Net) ?? parseInteger(m2Brut) ?? parseInteger(m2Genel) ?? undefined
    if (arsaM2) {
      fields.lot_m2 = parseInteger(arsaM2) ?? undefined
    }
  }

  // ---------- 8) Konut detayları ----------
  const oda = get('oda sayısı', 'oda + salon sayısı', 'oda+salon')
  const banyo = get('banyo sayısı', 'banyo')
  const bina = get('bina yaşı', 'binanın yaşı', 'yaşı')
  const kat = get('bulunduğu kat', 'kat', 'bulundugu kat')
  const toplamKat = get('kat sayısı', 'toplam kat')
  const isit = get('ısıtma', 'ısıtma tipi', 'isitma')

  if (oda) {
    const b = parseBedrooms(oda)
    if (b !== null) fields.bedrooms = b
  }
  if (banyo) {
    const b = parseInteger(banyo)
    if (b !== null) fields.bathrooms = b
  }
  if (bina) {
    if (/^\s*sıfır|^\s*0/i.test(bina)) fields.building_age = 0
    else {
      const n = parseInteger(bina)
      if (n !== null) fields.building_age = n
    }
  }
  if (kat) {
    const n = parseInteger(kat)
    if (n !== null) fields.floor = n
  }
  if (toplamKat) {
    const n = parseInteger(toplamKat)
    if (n !== null) fields.total_floors = n
  }
  if (isit && !/belirtilmemiş/i.test(isit)) fields.heating_type = isit

  // ---------- 9) Tapu / Kadastro (özellikle arsa için) ----------
  const ada = get('ada no', 'ada', 'ada no.')
  const parsel = get('parsel no', 'parsel', 'parsel no.')
  const pafta = get('pafta no', 'pafta')
  if (ada && !/belirtilmemiş/i.test(ada)) fields.ada_no = ada.replace(/[^\dA-Za-z\-/]/g, '').trim() || undefined
  if (parsel && !/belirtilmemiş/i.test(parsel)) fields.parsel_no = parsel.replace(/[^\dA-Za-z\-/]/g, '').trim() || undefined
  if (pafta && !/belirtilmemiş/i.test(pafta)) fields.pafta_no = pafta.trim() || undefined

  // ---------- 10) Açıklama ----------
  const descParts: string[] = []
  $('#classifiedDescription, .classifiedDescription, [itemprop="description"]').each((_, el) => {
    $(el).find('br').replaceWith('\n')
    const ps = $(el).find('p')
    if (ps.length > 0) {
      ps.each((__, p) => {
        const t = $(p).text().trim()
        if (t) descParts.push(t)
      })
    } else {
      const t = $(el).text().trim()
      if (t) descParts.push(t)
    }
  })
  let description = descParts.filter(Boolean).join('\n\n').trim()
  if (description) {
    description = description.replace(/\n{3,}/g, '\n\n')
    fields.description_tr = description
  }

  // ---------- 11) Özellikler ----------
  const featuresSet = new Set<string>()
  // Sahibinden'ın "İlan Özellikleri" bölümündeki seçili maddeler
  $('.classifiedFeatures li.selected, .houseFeatures li.selected, .classified-features li.selected').each(
    (_, el) => {
      const t = $(el).text().trim().replace(/\s+/g, ' ')
      if (t && t.length < 50) featuresSet.add(t)
    }
  )

  // Detay tablosundaki bool tarzı alanlar
  const bools: Array<[string, string, string?]> = [
    ['krediye uygun', 'Krediye Uygun'],
    ['krediye uygunluk', 'Krediye Uygun'],
    ['site içerisinde', 'Site İçinde'],
    ['asansör', 'Asansör'],
    ['otopark', 'Otopark'],
    ['eşyalı', 'Eşyalı'],
    ['balkon', 'Balkon'],
    ['takas', 'Takas Olur', 'evet'],
  ]
  for (const [key, label, valueMatch] of bools) {
    const v = get(key)
    if (!v) continue
    const positive = /var|evet|uygun|açık otopark|kapalı otopark/i.test(v)
    if (positive && !/yok|hayır|hayir/i.test(v)) {
      // takas için değer "evet" gerekiyor
      if (valueMatch && !new RegExp(valueMatch, 'i').test(v)) continue
      featuresSet.add(label)
    }
  }

  const tapu = get('tapu durumu', 'tapu')
  if (tapu && !/belirtilmemiş/i.test(tapu)) featuresSet.add(`Tapu: ${tapu}`)

  const imar = get('imar durumu', 'imar')
  if (imar && !/belirtilmemiş/i.test(imar)) featuresSet.add(`İmar: ${imar}`)

  const kaks = get('kaks (emsal)', 'kaks emsal', 'kaks', 'emsal')
  if (kaks && !/belirtilmemiş/i.test(kaks)) {
    const k = parseFloatish(kaks)
    if (k !== null) featuresSet.add(`Kaks (Emsal): ${k}`)
  }
  const gabari = get('gabari', 'maks. yapı yüksekliği')
  if (gabari && !/belirtilmemiş/i.test(gabari)) {
    featuresSet.add(`Gabari: ${gabari}`)
  }

  if (featuresSet.size > 0) {
    fields.features = Array.from(featuresSet).slice(0, 30)
  }

  // ---------- 12) Görseller (sahibinden CDN: i0.shbdn.com/photos/.../x5_<id>jh.jpg) ----------
  const images = extractImagesFromHtml(html, $)
  if (images.length > 0) {
    fields.images = images
  }

  return fields
}

// ============================================================
// Network: birden fazla strateji ile sahibinden HTML'i alma
// ============================================================
function buildBrowserHeaders(): Record<string, string> {
  return {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.7,en;q=0.6',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    'Sec-Ch-Ua': '"Google Chrome";v="124", "Chromium";v="124", "Not-A.Brand";v="99"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
  }
}

function isCaptcha(html: string): boolean {
  return (
    html.includes('Are you human') ||
    html.toLowerCase().includes('px-captcha') ||
    html.toLowerCase().includes('perimeterx') ||
    html.toLowerCase().includes('captcha-container') ||
    html.length < 5000
  )
}

async function tryFetch(
  url: string,
  extraHeaders: Record<string, string> = {}
): Promise<{ ok: boolean; html?: string; status?: number }> {
  const headers: Record<string, string> = { ...buildBrowserHeaders(), ...extraHeaders }
  const res = await fetch(url, { headers, redirect: 'follow' })
  if (!res.ok) return { ok: false, status: res.status }
  const html = await res.text()
  if (isCaptcha(html)) return { ok: false, status: 403, html }
  return { ok: true, html }
}

async function fetchSahibindenHtml(url: string) {
  const direct = await tryFetch(url, {
    Referer: 'https://www.google.com/',
    'Sec-Fetch-Site': 'cross-site',
  }).catch(() => null)
  if (direct?.ok) return direct

  const mobileUrl = url.replace(/:\/\/(www\.)?sahibinden\.com/, '://m.sahibinden.com')
  const mobile = await tryFetch(mobileUrl, {
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    Referer: 'https://m.sahibinden.com/',
  }).catch(() => null)
  if (mobile?.ok) return mobile

  return { ok: false, status: direct?.status || mobile?.status || 403 }
}

// ============================================================
// Endpoint
// ============================================================
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const url: string | undefined = body.url
    const pastedHtml: string | undefined = body.html

    let html: string | null = null

    if (pastedHtml && pastedHtml.length > 1000) {
      html = pastedHtml
    } else if (url) {
      if (!/sahibinden\.com\/ilan\//i.test(url)) {
        return NextResponse.json(
          {
            error:
              'Geçerli bir sahibinden.com ilan linki olmalı (örn. https://www.sahibinden.com/ilan/...)',
          },
          { status: 400 }
        )
      }
      const fetched = await fetchSahibindenHtml(url)
      if (!fetched.ok) {
        return NextResponse.json(
          {
            error:
              `Sahibinden bot koruması engelliyor (HTTP ${fetched.status}). ` +
              `Çözüm: İlan sayfasını tarayıcıda açın → sağ tık "Sayfa kaynağını görüntüle" (Ctrl+U) → ` +
              `Ctrl+A, Ctrl+C ile tüm metni kopyalayın → aşağıdaki "Sayfa kaynağını yapıştır" alanına yapıştırın.`,
            blockedByBot: true,
          },
          { status: 502 }
        )
      }
      html = fetched.html!
    } else {
      return NextResponse.json(
        { error: 'url veya html parametresi zorunlu' },
        { status: 400 }
      )
    }

    const fields = extractFromHtml(html)
    const fieldCount = Object.values(fields).filter(
      (v) => v !== undefined && v !== '' && v !== null && !(Array.isArray(v) && v.length === 0)
    ).length

    if (fieldCount === 0) {
      return NextResponse.json(
        {
          error:
            'HTML içeriğinden bilgi çıkarılamadı. Sahibinden ilan sayfasının tam kaynağını kopyaladığınızdan emin olun.',
        },
        { status: 422 }
      )
    }

    return NextResponse.json({ fields, fieldCount })
  } catch (error) {
    console.error('sahibinden import error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
