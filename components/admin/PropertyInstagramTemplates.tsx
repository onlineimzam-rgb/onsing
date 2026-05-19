'use client'

import { useCallback, useMemo, useState } from 'react'
import { Download, Loader2, ImageIcon, Smartphone, Square } from 'lucide-react'
import { SITE_CONFIG, type Currency } from '@/lib/config'
import type { PropertyImage } from '@/lib/db'

export type InstagramTemplateId =
  | 'magazine'
  | 'dream'
  | 'gold'
  | 'minimal'
  | 'split'
  | 'luxe'

const TEMPLATES: { id: InstagramTemplateId; label: string; hint: string }[] = [
  { id: 'magazine', label: 'Dergi (Real Estate)', hint: 'Hero foto + 3 mini foto + özellik listesi + iletişim çubuğu' },
  { id: 'dream', label: 'Hayalin Ev', hint: 'Krem zemin, eğri panel, mini fotolar ve adres' },
  { id: 'gold', label: 'Altın / Lacivert', hint: 'Kurumsal, vurgulu fiyat' },
  { id: 'minimal', label: 'Minimal', hint: 'Tam ekran foto, altta metin' },
  { id: 'split', label: 'Bölünmüş', hint: 'Yan panel + foto' },
  { id: 'luxe', label: 'Krem / Çerçeve', hint: 'Sade, şık çerçeve' },
]

const W_POST = 1080
const H_POST = 1080
const W_STORY = 1080
const H_STORY = 1920

const COLORS = {
  navy: '#0a1224',
  navy2: '#1e293b',
  gold: '#c9a227',
  goldLight: '#e8d48b',
  cream: '#faf8f5',
  white: '#ffffff',
  muted: '#94a3b8',
}

const TYPE_TR: Record<string, string> = {
  satilik: 'Satılık',
  kiralik: 'Kiralık',
  'gunluk-kiralik': 'Günlük Kiralık',
}

const CATEGORY_TR: Record<string, string> = {
  daire: 'Daire',
  villa: 'Villa',
  'mustakil-ev': 'Müstakil Ev',
  yazlik: 'Yazlık',
  rezidans: 'Rezidans',
  'is-yeri': 'İş Yeri',
  ofis: 'Ofis',
  dukkan: 'Dükkan',
  arsa: 'Arsa',
  tarla: 'Tarla',
  'bag-bahce': 'Bağ / Bahçe',
  'turistik-tesis': 'Turistik Tesis',
}

export type InstagramFormSlice = {
  type: string
  category: string
  title_tr: string
  price: number
  currency: string
  city: string
  district: string
  neighborhood: string
  bedrooms: string
  bathrooms: string
  area_m2: string
  lot_m2: string
  features: string[]
}

function formatMoney(price: number, currency: string): string {
  const cur = (currency === 'EUR' ? 'EUR' : 'TRY') as Currency
  const num = (price || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })
  const suffix = cur === 'EUR' ? '€' : 'TL'
  return `${num} ${suffix}`
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const ir = img.width / img.height
  const r = w / h
  let sw = img.width
  let sh = img.height
  let sx = 0
  let sy = 0
  if (ir > r) {
    sw = img.height * r
    sx = (img.width - sw) / 2
  } else {
    sh = img.width / r
    sy = (img.height - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ')
  if (!words[0]) return []
  const lines: string[] = []
  let line = words[0]
  for (let i = 1; i < words.length; i++) {
    const test = `${line} ${words[i]}`
    if (ctx.measureText(test).width <= maxWidth) line = test
    else {
      lines.push(line)
      line = words[i]
    }
  }
  lines.push(line)
  return lines
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

interface DrawContext {
  ctx: CanvasRenderingContext2D
  W: number
  H: number
  img: HTMLImageElement | null
  thumbs: (HTMLImageElement | null)[]
  title: string
  priceStr: string
  typeStr: string
  catStr: string
  loc: string
  detailLine: string
  featureLine: string
  features: string[]
  address: string
  website: string
  brand: string
  phone: string
  ig: string
}

function drawGradientFallback(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, '#1e3a5f')
  g.addColorStop(0.5, '#0a1224')
  g.addColorStop(1, '#3d2b1f')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
}

function drawImageInRect(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
  radius = 0
) {
  ctx.save()
  if (radius > 0) {
    drawRoundedRect(ctx, x, y, w, h, radius)
    ctx.clip()
  }
  if (img) drawCoverImage(ctx, img, x, y, w, h)
  else {
    ctx.translate(x, y)
    drawGradientFallback(ctx, w, h)
  }
  ctx.restore()
}

function drawCheck(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = Math.max(2, r * 0.35)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - r * 0.45, cy + r * 0.05)
  ctx.lineTo(cx - r * 0.1, cy + r * 0.4)
  ctx.lineTo(cx + r * 0.5, cy - r * 0.35)
  ctx.stroke()
}

function drawDot(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
}

function drawFeatureTable(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  items: string[],
  opts: {
    columns?: 1 | 2
    rowHeight?: number
    fontSize?: number
    title?: string
  } = {}
): number {
  const columns = opts.columns ?? 2
  const rowHeight = opts.rowHeight ?? 56
  const fontSize = opts.fontSize ?? 22
  const padX = 24
  const padY = 18
  const titleH = opts.title ? 44 : 0
  const rows = Math.ceil(items.length / columns)
  const bodyH = rows * rowHeight
  const totalH = titleH + bodyH + padY * 2

  ctx.fillStyle = '#ffffff'
  drawRoundedRect(ctx, x, y, w, totalH, 16)
  ctx.fill()
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 1.5
  drawRoundedRect(ctx, x, y, w, totalH, 16)
  ctx.stroke()

  let cy = y + padY
  if (opts.title) {
    ctx.fillStyle = COLORS.navy
    ctx.font = '800 22px "Segoe UI", Arial, sans-serif'
    ctx.fillText(opts.title, x + padX, cy + 22)
    ctx.fillStyle = COLORS.gold
    ctx.fillRect(x + padX, cy + 32, 56, 3)
    cy += titleH
  }

  const colWidth = (w - padX * 2) / columns
  for (let i = 0; i < items.length; i++) {
    const col = i % columns
    const row = Math.floor(i / columns)
    const cx0 = x + padX + col * colWidth
    const cy0 = cy + row * rowHeight

    if (row % 2 === 0) {
      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(x + 1, cy0, w - 2, rowHeight)
    }
    if (row > 0) {
      ctx.strokeStyle = '#eef2f7'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x + 12, cy0)
      ctx.lineTo(x + w - 12, cy0)
      ctx.stroke()
    }

    drawCheck(ctx, cx0 + 12, cy0 + rowHeight / 2, 11, COLORS.gold)
    ctx.fillStyle = COLORS.navy
    ctx.font = `600 ${fontSize}px "Segoe UI", Arial, sans-serif`
    ctx.fillText(items[i], cx0 + 36, cy0 + rowHeight / 2 + fontSize / 3)
  }

  return totalH
}

function drawPostMagazine(d: DrawContext) {
  const {
    ctx, W, H, img, thumbs, title, priceStr, typeStr, catStr,
    features, address, website, brand, phone,
  } = d

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  const pad = 40

  ctx.fillStyle = COLORS.navy
  ctx.font = 'bold 30px "Segoe UI", Arial, sans-serif'
  ctx.fillText(brand, pad, 50)
  ctx.fillStyle = COLORS.gold
  ctx.fillRect(pad, 62, 56, 3)

  const chipText = `${typeStr.toUpperCase()} · ${catStr.toUpperCase()}`
  ctx.font = '700 18px "Segoe UI", Arial, sans-serif'
  const chipW = ctx.measureText(chipText).width + 28
  const chipH = 32
  const chipX = W - pad - chipW
  const chipY = 30
  ctx.fillStyle = COLORS.navy
  drawRoundedRect(ctx, chipX, chipY, chipW, chipH, 16)
  ctx.fill()
  ctx.fillStyle = COLORS.gold
  ctx.fillText(chipText, chipX + 14, chipY + 22)

  const heroX = pad
  const heroY = 90
  const heroW = W - pad * 2
  const heroH = 420
  drawImageInRect(ctx, img, heroX, heroY, heroW, heroH, 16)

  const priceBarY = heroY + heroH + 18
  const priceBarH = 70
  drawRoundedRect(ctx, heroX, priceBarY, heroW, priceBarH, 14)
  ctx.fillStyle = COLORS.navy
  ctx.fill()
  ctx.fillStyle = COLORS.gold
  ctx.fillRect(heroX, priceBarY, 8, priceBarH)
  ctx.fillStyle = COLORS.muted
  ctx.font = '600 16px "Segoe UI", Arial, sans-serif'
  ctx.fillText('FİYAT', heroX + 28, priceBarY + 26)
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 34px "Segoe UI", Arial, sans-serif'
  ctx.fillText(priceStr, heroX + 28, priceBarY + 56)
  ctx.fillStyle = COLORS.goldLight
  ctx.font = '600 18px "Segoe UI", Arial, sans-serif'
  const tagText = 'YATIRIM FIRSATI'
  const tagW = ctx.measureText(tagText).width
  ctx.fillText(tagText, heroX + heroW - tagW - 28, priceBarY + 44)

  const titleY = priceBarY + priceBarH + 38
  ctx.fillStyle = COLORS.navy
  ctx.font = '900 34px "Segoe UI", Arial, sans-serif'
  const tLines = wrapLines(ctx, title.toUpperCase(), heroW - 8)
  let ty = titleY
  for (const line of tLines.slice(0, 2)) {
    ctx.fillText(line, heroX, ty)
    ty += 42
  }

  const thumbY = ty + 24
  const thumbGap = 16
  const thumbW = (heroW - thumbGap * 2) / 3
  const thumbH = 130
  for (let i = 0; i < 3; i++) {
    const x = heroX + i * (thumbW + thumbGap)
    drawImageInRect(ctx, thumbs[i] || null, x, thumbY, thumbW, thumbH, 12)
  }

  const featY = thumbY + thumbH + 22
  const feats = (features.length ? features : ['Geniş kullanım', 'Konforlu yaşam']).slice(0, 4)
  drawFeatureTable(ctx, heroX, featY, heroW, feats, {
    columns: 2,
    rowHeight: 40,
    fontSize: 18,
    title: 'ÖZELLİKLER',
  })

  const barH = 90
  ctx.fillStyle = COLORS.navy
  ctx.fillRect(0, H - barH, W, barH)
  ctx.fillStyle = COLORS.gold
  ctx.fillRect(0, H - barH, W, 4)
  ctx.fillStyle = '#ffffff'
  ctx.font = '800 24px "Segoe UI", Arial, sans-serif'
  ctx.fillText(phone, pad, H - barH + 38)
  ctx.fillStyle = '#cbd5e1'
  ctx.font = '500 18px "Segoe UI", Arial, sans-serif'
  const addrLines = wrapLines(ctx, address, W * 0.55)
  ctx.fillText(addrLines[0] || '', pad, H - barH + 64)
  ctx.fillStyle = COLORS.gold
  ctx.font = '700 22px "Segoe UI", Arial, sans-serif'
  const wsW = ctx.measureText(website).width
  ctx.fillText(website, W - wsW - pad, H - barH + 38)
  ctx.fillStyle = '#cbd5e1'
  ctx.font = '500 16px "Segoe UI", Arial, sans-serif'
  ctx.fillText('VISIT OUR WEBSITE', W - ctx.measureText('VISIT OUR WEBSITE').width - pad, H - barH + 64)
}

function drawPostDream(d: DrawContext) {
  const {
    ctx, W, H, img, thumbs, title, priceStr, typeStr, catStr,
    features, address, brand, phone, website,
  } = d

  ctx.fillStyle = COLORS.cream
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = COLORS.gold
  ctx.fillRect(0, 0, W, 6)
  ctx.fillRect(0, H - 6, W, 6)

  const pad = 50

  ctx.fillStyle = COLORS.navy
  ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif'
  const brandW = ctx.measureText(brand).width
  ctx.fillText(brand, (W - brandW) / 2, 60)
  ctx.fillStyle = COLORS.gold
  ctx.fillRect((W - 80) / 2, 74, 80, 3)

  const heroX = pad
  const heroY = 100
  const heroW = W - pad * 2
  const heroH = 440
  ctx.fillStyle = COLORS.gold
  drawRoundedRect(ctx, heroX - 6, heroY - 6, heroW + 12, heroH + 12, 16)
  ctx.fill()
  drawImageInRect(ctx, img, heroX, heroY, heroW, heroH, 12)

  const labelY = heroY + heroH + 30
  ctx.fillStyle = COLORS.gold
  ctx.font = '700 18px "Segoe UI", Arial, sans-serif'
  const lbl = `${typeStr.toUpperCase()} · ${catStr.toUpperCase()}`
  const lblW = ctx.measureText(lbl).width
  ctx.fillText(lbl, (W - lblW) / 2, labelY)

  ctx.fillStyle = COLORS.navy
  ctx.font = '900 38px "Segoe UI", Arial, sans-serif'
  const tLines = wrapLines(ctx, title.toUpperCase(), W - pad * 2 - 40)
  let ty = labelY + 44
  for (const line of tLines.slice(0, 2)) {
    const lw = ctx.measureText(line).width
    ctx.fillText(line, (W - lw) / 2, ty)
    ty += 46
  }

  ctx.fillStyle = COLORS.gold
  ctx.font = '900 44px "Segoe UI", Arial, sans-serif'
  const pw = ctx.measureText(priceStr).width
  ctx.fillText(priceStr, (W - pw) / 2, ty + 30)

  const thumbY = ty + 60
  const thumbGap = 18
  const thumbW = (W - pad * 2 - thumbGap * 2) / 3
  const thumbH = 130
  for (let i = 0; i < 3; i++) {
    const x = pad + i * (thumbW + thumbGap)
    ctx.fillStyle = COLORS.gold
    drawRoundedRect(ctx, x - 3, thumbY - 3, thumbW + 6, thumbH + 6, 14)
    ctx.fill()
    drawImageInRect(ctx, thumbs[i] || null, x, thumbY, thumbW, thumbH, 10)
  }

  const featY = thumbY + thumbH + 36
  const feats = (features.length ? features : ['Konforlu', 'Yatırımlık']).slice(0, 4)
  const colW = (W - pad * 2) / 2
  ctx.font = '600 20px "Segoe UI", Arial, sans-serif'
  for (let i = 0; i < feats.length; i++) {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = pad + col * colW
    const y = featY + row * 30
    drawDot(ctx, x + 6, y - 7, 5, COLORS.gold)
    ctx.fillStyle = COLORS.navy
    ctx.fillText(feats[i], x + 22, y)
  }

  const barH = 84
  ctx.fillStyle = COLORS.navy
  ctx.fillRect(0, H - barH - 6, W, barH)
  ctx.fillStyle = '#ffffff'
  ctx.font = '800 22px "Segoe UI", Arial, sans-serif'
  ctx.fillText(phone, pad, H - barH + 24)
  ctx.fillStyle = '#cbd5e1'
  ctx.font = '500 17px "Segoe UI", Arial, sans-serif'
  const addrLines = wrapLines(ctx, address, W * 0.55)
  ctx.fillText(addrLines[0] || '', pad, H - barH + 52)
  ctx.fillStyle = COLORS.gold
  ctx.font = '700 20px "Segoe UI", Arial, sans-serif'
  const wsW = ctx.measureText(website).width
  ctx.fillText(website, W - wsW - pad, H - barH + 36)
}

function drawStoryMagazine(d: DrawContext) {
  const {
    ctx, W, H, img, thumbs, title, priceStr, typeStr, catStr,
    features, address, website, brand, phone,
  } = d

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  const pad = 56

  ctx.fillStyle = COLORS.navy
  ctx.font = 'bold 44px "Segoe UI", Arial, sans-serif'
  ctx.fillText(brand, pad, 96)
  ctx.fillStyle = COLORS.gold
  ctx.fillRect(pad, 114, 80, 4)

  const chipText = `${typeStr.toUpperCase()} · ${catStr.toUpperCase()}`
  ctx.font = '800 22px "Segoe UI", Arial, sans-serif'
  const chipW = ctx.measureText(chipText).width + 36
  const chipH = 44
  const chipX = W - pad - chipW
  const chipY = 64
  ctx.fillStyle = COLORS.navy
  drawRoundedRect(ctx, chipX, chipY, chipW, chipH, 22)
  ctx.fill()
  ctx.fillStyle = COLORS.gold
  ctx.fillText(chipText, chipX + 18, chipY + 30)

  const heroX = pad
  const heroY = 170
  const heroW = W - pad * 2
  const heroH = 880
  drawImageInRect(ctx, img, heroX, heroY, heroW, heroH, 24)
  ctx.save()
  drawRoundedRect(ctx, heroX, heroY, heroW, heroH, 24)
  ctx.clip()
  const grad = ctx.createLinearGradient(0, heroY + heroH - 320, 0, heroY + heroH)
  grad.addColorStop(0, 'rgba(0,0,0,0)')
  grad.addColorStop(1, 'rgba(0,0,0,0.78)')
  ctx.fillStyle = grad
  ctx.fillRect(heroX, heroY + heroH - 320, heroW, 320)
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 60px "Segoe UI", Arial, sans-serif'
  const tLines = wrapLines(ctx, title.toUpperCase(), heroW - 80)
  const linesToShow = tLines.slice(0, 3)
  let ty = heroY + heroH - 60 - linesToShow.length * 64
  for (const line of linesToShow) {
    ctx.fillText(line, heroX + 40, ty)
    ty += 64
  }
  ctx.fillStyle = COLORS.gold
  ctx.fillRect(heroX + 40, ty - 24, 100, 5)
  ctx.restore()

  const priceBarY = heroY + heroH + 26
  const priceBarH = 110
  drawRoundedRect(ctx, heroX, priceBarY, heroW, priceBarH, 20)
  ctx.fillStyle = COLORS.navy
  ctx.fill()
  ctx.fillStyle = COLORS.gold
  ctx.fillRect(heroX, priceBarY, 10, priceBarH)
  ctx.fillStyle = '#94a3b8'
  ctx.font = '600 20px "Segoe UI", Arial, sans-serif'
  ctx.fillText('FİYAT', heroX + 36, priceBarY + 38)
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 52px "Segoe UI", Arial, sans-serif'
  ctx.fillText(priceStr, heroX + 36, priceBarY + 82)
  ctx.fillStyle = COLORS.goldLight
  ctx.font = '700 22px "Segoe UI", Arial, sans-serif'
  const tagText = 'YATIRIM FIRSATI'
  const tagW = ctx.measureText(tagText).width
  ctx.fillText(tagText, heroX + heroW - tagW - 36, priceBarY + 66)

  const thumbY = priceBarY + priceBarH + 26
  const thumbGap = 18
  const thumbW = (heroW - thumbGap * 2) / 3
  const thumbH = 230
  for (let i = 0; i < 3; i++) {
    const x = heroX + i * (thumbW + thumbGap)
    drawImageInRect(ctx, thumbs[i] || null, x, thumbY, thumbW, thumbH, 18)
  }

  const featY = thumbY + thumbH + 36
  const feats = (features.length ? features : ['Geniş kullanım', 'Konforlu yaşam']).slice(0, 6)
  drawFeatureTable(ctx, heroX, featY, heroW, feats, {
    columns: 2,
    rowHeight: 60,
    fontSize: 24,
    title: 'ÖZELLİKLER',
  })

  const barH = 170
  ctx.fillStyle = COLORS.navy
  ctx.fillRect(0, H - barH, W, barH)
  ctx.fillStyle = COLORS.gold
  ctx.fillRect(0, H - barH, W, 6)
  ctx.fillStyle = '#ffffff'
  ctx.font = '800 34px "Segoe UI", Arial, sans-serif'
  ctx.fillText(phone, pad, H - barH + 64)
  ctx.fillStyle = '#cbd5e1'
  ctx.font = '500 22px "Segoe UI", Arial, sans-serif'
  const addrLines = wrapLines(ctx, address, W - pad * 2)
  ctx.fillText(addrLines[0] || '', pad, H - barH + 100)
  ctx.fillStyle = COLORS.gold
  ctx.font = '700 24px "Segoe UI", Arial, sans-serif'
  ctx.fillText(website, pad, H - barH + 134)
}

function drawStoryDream(d: DrawContext) {
  const {
    ctx, W, H, img, thumbs, title, priceStr, typeStr, catStr,
    features, address, brand, phone, website,
  } = d

  ctx.fillStyle = COLORS.cream
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = COLORS.gold
  ctx.fillRect(0, 0, W, 10)
  ctx.fillRect(0, H - 10, W, 10)

  const pad = 60

  ctx.fillStyle = COLORS.navy
  ctx.font = 'bold 40px "Segoe UI", Arial, sans-serif'
  const brandW = ctx.measureText(brand).width
  ctx.fillText(brand, (W - brandW) / 2, 100)
  ctx.fillStyle = COLORS.gold
  ctx.fillRect((W - 90) / 2, 116, 90, 4)

  ctx.fillStyle = COLORS.gold
  ctx.font = '700 22px "Segoe UI", Arial, sans-serif'
  const subTag = `${typeStr.toUpperCase()} · ${catStr.toUpperCase()}`
  const subW = ctx.measureText(subTag).width
  ctx.fillText(subTag, (W - subW) / 2, 156)

  const heroX = pad
  const heroY = 200
  const heroW = W - pad * 2
  const heroH = 880
  ctx.fillStyle = COLORS.gold
  drawRoundedRect(ctx, heroX - 8, heroY - 8, heroW + 16, heroH + 16, 24)
  ctx.fill()
  drawImageInRect(ctx, img, heroX, heroY, heroW, heroH, 18)

  const titleY = heroY + heroH + 60
  ctx.fillStyle = COLORS.navy
  ctx.font = '900 52px "Segoe UI", Arial, sans-serif'
  const tLines = wrapLines(ctx, title.toUpperCase(), W - pad * 2 - 40)
  let ty = titleY
  for (const line of tLines.slice(0, 2)) {
    const lw = ctx.measureText(line).width
    ctx.fillText(line, (W - lw) / 2, ty)
    ty += 60
  }

  ctx.fillStyle = COLORS.gold
  ctx.fillRect((W - 90) / 2, ty + 6, 90, 4)
  ctx.fillStyle = COLORS.navy
  ctx.font = '900 56px "Segoe UI", Arial, sans-serif'
  const pw = ctx.measureText(priceStr).width
  ctx.fillStyle = COLORS.gold
  ctx.fillText(priceStr, (W - pw) / 2, ty + 76)

  const thumbY = ty + 130
  const thumbGap = 20
  const thumbW = (W - pad * 2 - thumbGap * 2) / 3
  const thumbH = 220
  for (let i = 0; i < 3; i++) {
    const x = pad + i * (thumbW + thumbGap)
    ctx.fillStyle = COLORS.gold
    drawRoundedRect(ctx, x - 4, thumbY - 4, thumbW + 8, thumbH + 8, 18)
    ctx.fill()
    drawImageInRect(ctx, thumbs[i] || null, x, thumbY, thumbW, thumbH, 14)
  }

  const featY = thumbY + thumbH + 60
  const feats = (features.length ? features : ['Konforlu', 'Yatırımlık']).slice(0, 4)
  ctx.fillStyle = COLORS.navy
  ctx.font = '800 28px "Segoe UI", Arial, sans-serif'
  ctx.fillText('ÖZELLİKLER', pad, featY)
  ctx.fillStyle = COLORS.gold
  ctx.fillRect(pad, featY + 14, 70, 4)

  const colW = (W - pad * 2) / 2
  ctx.font = '600 26px "Segoe UI", Arial, sans-serif'
  for (let i = 0; i < feats.length; i++) {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = pad + col * colW
    const y = featY + 62 + row * 40
    drawDot(ctx, x + 8, y - 10, 7, COLORS.gold)
    ctx.fillStyle = COLORS.navy
    ctx.fillText(feats[i], x + 28, y)
  }

  const barH = 160
  ctx.fillStyle = COLORS.navy
  ctx.fillRect(0, H - barH - 10, W, barH)
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 34px "Segoe UI", Arial, sans-serif'
  ctx.fillText(phone, pad, H - barH + 46)
  ctx.fillStyle = '#cbd5e1'
  ctx.font = '500 22px "Segoe UI", Arial, sans-serif'
  const addrLines = wrapLines(ctx, address, W - pad * 2)
  ctx.fillText(addrLines[0] || '', pad, H - barH + 88)
  ctx.fillStyle = COLORS.gold
  ctx.font = '700 24px "Segoe UI", Arial, sans-serif'
  ctx.fillText(website, pad, H - barH + 124)
}

function drawPostGold(d: DrawContext) {
  const { ctx, W, H, img, title, priceStr, typeStr, catStr, loc, detailLine, brand, phone, ig } = d
  const photoH = Math.round(H * 0.6)
  if (img) drawCoverImage(ctx, img, 0, 0, W, photoH)
  else drawGradientFallback(ctx, W, photoH)

  const g = ctx.createLinearGradient(0, photoH - 200, 0, photoH)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, 'rgba(0,0,0,0.6)')
  ctx.fillStyle = g
  ctx.fillRect(0, photoH - 200, W, 200)

  ctx.fillStyle = COLORS.gold
  drawRoundedRect(ctx, 28, 28, ctx.measureText(`${typeStr} · ${catStr}`).width + 36, 40, 20)
  ctx.fill()
  ctx.fillStyle = COLORS.navy
  ctx.font = '800 18px "Segoe UI", Arial, sans-serif'
  ctx.fillText(`${typeStr.toUpperCase()} · ${catStr.toUpperCase()}`, 46, 54)

  ctx.fillStyle = COLORS.navy
  ctx.fillRect(0, photoH, W, H - photoH)

  ctx.fillStyle = COLORS.gold
  ctx.fillRect(0, photoH, W, 5)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 38px "Segoe UI", Arial, sans-serif'
  const titleLines = wrapLines(ctx, title.toUpperCase(), W - 80)
  let ty = photoH + 60
  for (let i = 0; i < Math.min(titleLines.length, 2); i++) {
    ctx.fillText(titleLines[i], 40, ty)
    ty += 46
  }
  ctx.fillStyle = COLORS.gold
  ctx.fillRect(40, ty - 18, 60, 3)

  const priceY = ty + 30
  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 16px "Segoe UI", Arial, sans-serif'
  ctx.fillText('FİYAT', 40, priceY)
  ctx.fillStyle = COLORS.goldLight
  ctx.font = '900 50px "Segoe UI", Arial, sans-serif'
  ctx.fillText(priceStr, 40, priceY + 50)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '500 22px "Segoe UI", Arial, sans-serif'
  ctx.fillText(loc, 40, priceY + 96)
  if (detailLine) ctx.fillText(detailLine, 40, priceY + 126)

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 22px "Segoe UI", Arial, sans-serif'
  ctx.fillText(brand, 40, H - 52)
  ctx.fillStyle = COLORS.gold
  ctx.font = '600 20px "Segoe UI", Arial, sans-serif'
  ctx.fillText(`${phone}  ·  @${ig}`, 40, H - 24)
}

function drawPostMinimal(d: DrawContext) {
  const { ctx, W, H, img, title, priceStr, typeStr, catStr, loc, detailLine, brand, phone, website } = d
  if (img) drawCoverImage(ctx, img, 0, 0, W, H)
  else drawGradientFallback(ctx, W, H)

  const grad = ctx.createLinearGradient(0, H * 0.4, 0, H)
  grad.addColorStop(0, 'rgba(10,18,36,0)')
  grad.addColorStop(0.5, 'rgba(10,18,36,0.65)')
  grad.addColorStop(1, 'rgba(10,18,36,0.95)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = COLORS.gold
  const chip = `${typeStr.toUpperCase()} · ${catStr.toUpperCase()}`
  ctx.font = '800 18px "Segoe UI", Arial, sans-serif'
  const chipW = ctx.measureText(chip).width + 32
  drawRoundedRect(ctx, 36, 36, chipW, 40, 20)
  ctx.fill()
  ctx.fillStyle = COLORS.navy
  ctx.fillText(chip, 52, 62)

  const priceY = H - 250
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 56px "Segoe UI", Arial, sans-serif'
  ctx.fillText(priceStr, 48, priceY)
  ctx.fillStyle = COLORS.gold
  ctx.fillRect(48, priceY + 14, 70, 4)

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 34px "Segoe UI", Arial, sans-serif'
  const lines = wrapLines(ctx, title, W - 96)
  let y = priceY + 70
  for (const line of lines.slice(0, 2)) {
    ctx.fillText(line, 48, y)
    y += 42
  }

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '500 22px "Segoe UI", Arial, sans-serif'
  ctx.fillText(loc, 48, y + 14)
  if (detailLine) ctx.fillText(detailLine, 48, y + 44)

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 22px "Segoe UI", Arial, sans-serif'
  ctx.fillText(brand, 48, H - 50)
  ctx.fillStyle = COLORS.gold
  ctx.font = '600 20px "Segoe UI", Arial, sans-serif'
  ctx.fillText(`${phone} · ${website}`, 48, H - 22)
}

function drawPostSplit(d: DrawContext) {
  const { ctx, W, H, img, title, priceStr, typeStr, catStr, loc, detailLine, brand, phone, website } = d
  const split = 420
  ctx.fillStyle = COLORS.navy
  ctx.fillRect(0, 0, split, H)
  ctx.fillStyle = COLORS.gold
  ctx.fillRect(split - 5, 0, 5, H)

  if (img) drawCoverImage(ctx, img, split, 0, W - split, H)
  else {
    ctx.save()
    ctx.translate(split, 0)
    drawGradientFallback(ctx, W - split, H)
    ctx.restore()
  }

  ctx.fillStyle = COLORS.white
  ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif'
  ctx.fillText(brand, 32, 60)
  ctx.fillStyle = COLORS.gold
  ctx.fillRect(32, 72, 50, 3)

  ctx.fillStyle = COLORS.gold
  ctx.font = '700 18px "Segoe UI", Arial, sans-serif'
  ctx.fillText(`${typeStr.toUpperCase()} · ${catStr.toUpperCase()}`, 32, 130)

  ctx.fillStyle = COLORS.white
  ctx.font = '900 38px "Segoe UI", Arial, sans-serif'
  const lines = wrapLines(ctx, title.toUpperCase(), split - 64)
  let y = 180
  for (const line of lines.slice(0, 4)) {
    ctx.fillText(line, 32, y)
    y += 46
  }

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 16px "Segoe UI", Arial, sans-serif'
  ctx.fillText('FİYAT', 32, y + 30)
  ctx.fillStyle = COLORS.goldLight
  ctx.font = '900 40px "Segoe UI", Arial, sans-serif'
  ctx.fillText(priceStr, 32, y + 76)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '500 20px "Segoe UI", Arial, sans-serif'
  ctx.fillText(loc, 32, y + 120)
  if (detailLine) ctx.fillText(detailLine, 32, y + 148)

  ctx.fillStyle = COLORS.gold
  ctx.font = '700 20px "Segoe UI", Arial, sans-serif'
  ctx.fillText(phone, 32, H - 60)
  ctx.fillStyle = '#cbd5e1'
  ctx.font = '500 16px "Segoe UI", Arial, sans-serif'
  ctx.fillText(website, 32, H - 32)
}

function drawPostLuxe(d: DrawContext) {
  const { ctx, W, H, img, title, priceStr, typeStr, catStr, loc, detailLine, brand, phone, website } = d
  ctx.fillStyle = COLORS.cream
  ctx.fillRect(0, 0, W, H)

  const inset = 36
  const innerW = W - inset * 2
  const innerH = H - inset * 2
  ctx.strokeStyle = COLORS.gold
  ctx.lineWidth = 3
  drawRoundedRect(ctx, inset, inset, innerW, innerH, 16)
  ctx.stroke()

  ctx.fillStyle = COLORS.gold
  ctx.font = '700 16px "Segoe UI", Arial, sans-serif'
  const subtag = `${typeStr.toUpperCase()} · ${catStr.toUpperCase()}`
  const sw = ctx.measureText(subtag).width
  ctx.fillText(subtag, (W - sw) / 2, inset + 36)

  ctx.fillStyle = COLORS.navy
  ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif'
  const bw = ctx.measureText(brand).width
  ctx.fillText(brand, (W - bw) / 2, inset + 66)

  const photoY = inset + 90
  const photoH = Math.round(innerH * 0.5)
  const photoX = inset + 28
  const photoW = innerW - 56
  ctx.save()
  drawRoundedRect(ctx, photoX, photoY, photoW, photoH, 12)
  ctx.clip()
  if (img) drawCoverImage(ctx, img, photoX, photoY, photoW, photoH)
  else drawGradientFallback(ctx, photoW, photoH)
  ctx.restore()
  ctx.strokeStyle = COLORS.gold
  ctx.lineWidth = 2
  drawRoundedRect(ctx, photoX, photoY, photoW, photoH, 12)
  ctx.stroke()

  const textY = photoY + photoH + 38
  ctx.fillStyle = COLORS.navy
  ctx.font = '900 30px "Segoe UI", Arial, sans-serif'
  const lines = wrapLines(ctx, title.toUpperCase(), photoW)
  let y = textY
  for (const line of lines.slice(0, 2)) {
    const lw = ctx.measureText(line).width
    ctx.fillText(line, (W - lw) / 2, y)
    y += 38
  }

  ctx.fillStyle = COLORS.gold
  ctx.font = '900 42px "Segoe UI", Arial, sans-serif'
  const pw = ctx.measureText(priceStr).width
  ctx.fillText(priceStr, (W - pw) / 2, y + 36)

  ctx.fillStyle = COLORS.navy2
  ctx.font = '500 20px "Segoe UI", Arial, sans-serif'
  const lw = ctx.measureText(loc).width
  ctx.fillText(loc, (W - lw) / 2, y + 76)
  if (detailLine) {
    const dw = ctx.measureText(detailLine).width
    ctx.fillText(detailLine, (W - dw) / 2, y + 104)
  }

  ctx.fillStyle = COLORS.navy
  ctx.font = '700 20px "Segoe UI", Arial, sans-serif'
  const fw = ctx.measureText(`${phone} · ${website}`).width
  ctx.fillText(`${phone} · ${website}`, (W - fw) / 2, H - inset - 30)
}

function drawStoryGold(d: DrawContext) {
  const { ctx, W, H, img, title, priceStr, typeStr, catStr, loc, detailLine, brand, phone, website } = d
  const photoH = Math.round(H * 0.55)
  if (img) drawCoverImage(ctx, img, 0, 0, W, photoH)
  else drawGradientFallback(ctx, W, photoH)

  const g = ctx.createLinearGradient(0, photoH - 240, 0, photoH)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, 'rgba(0,0,0,0.7)')
  ctx.fillStyle = g
  ctx.fillRect(0, photoH - 240, W, 240)

  ctx.fillStyle = COLORS.gold
  ctx.font = '800 22px "Segoe UI", Arial, sans-serif'
  const chip = `${typeStr.toUpperCase()} · ${catStr.toUpperCase()}`
  const cw = ctx.measureText(chip).width + 36
  drawRoundedRect(ctx, 48, 60, cw, 48, 24)
  ctx.fill()
  ctx.fillStyle = COLORS.navy
  ctx.fillText(chip, 66, 92)

  ctx.fillStyle = COLORS.navy
  ctx.fillRect(0, photoH, W, H - photoH)
  ctx.fillStyle = COLORS.gold
  ctx.fillRect(0, photoH, W, 6)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 56px "Segoe UI", Arial, sans-serif'
  const titleLines = wrapLines(ctx, title.toUpperCase(), W - 80)
  let ty = photoH + 90
  for (const line of titleLines.slice(0, 3)) {
    ctx.fillText(line, 48, ty)
    ty += 64
  }
  ctx.fillStyle = COLORS.gold
  ctx.fillRect(48, ty - 28, 80, 4)

  const priceY = ty + 30
  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 20px "Segoe UI", Arial, sans-serif'
  ctx.fillText('FİYAT', 48, priceY)
  ctx.fillStyle = COLORS.goldLight
  ctx.font = '900 70px "Segoe UI", Arial, sans-serif'
  ctx.fillText(priceStr, 48, priceY + 64)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '500 26px "Segoe UI", Arial, sans-serif'
  ctx.fillText(loc, 48, priceY + 116)
  if (detailLine) ctx.fillText(detailLine, 48, priceY + 152)

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 28px "Segoe UI", Arial, sans-serif'
  ctx.fillText(brand, 48, H - 110)
  ctx.fillStyle = COLORS.gold
  ctx.font = '800 30px "Segoe UI", Arial, sans-serif'
  ctx.fillText(phone, 48, H - 70)
  ctx.fillStyle = '#cbd5e1'
  ctx.font = '500 22px "Segoe UI", Arial, sans-serif'
  ctx.fillText(website, 48, H - 36)
}

function drawStoryMinimal(d: DrawContext) {
  const { ctx, W, H, img, title, priceStr, typeStr, catStr, loc, detailLine, brand, phone, website } = d
  if (img) drawCoverImage(ctx, img, 0, 0, W, H)
  else drawGradientFallback(ctx, W, H)

  const grad = ctx.createLinearGradient(0, H * 0.55, 0, H)
  grad.addColorStop(0, 'rgba(10,18,36,0)')
  grad.addColorStop(0.4, 'rgba(10,18,36,0.6)')
  grad.addColorStop(1, 'rgba(10,18,36,0.96)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = COLORS.gold
  const chip = `${typeStr.toUpperCase()} · ${catStr.toUpperCase()}`
  ctx.font = '800 22px "Segoe UI", Arial, sans-serif'
  const cw = ctx.measureText(chip).width + 36
  drawRoundedRect(ctx, 48, 64, cw, 50, 25)
  ctx.fill()
  ctx.fillStyle = COLORS.navy
  ctx.fillText(chip, 66, 96)

  const priceY = H * 0.6
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 76px "Segoe UI", Arial, sans-serif'
  ctx.fillText(priceStr, 48, priceY)
  ctx.fillStyle = COLORS.gold
  ctx.fillRect(48, priceY + 16, 90, 5)

  ctx.fillStyle = '#ffffff'
  ctx.font = '800 44px "Segoe UI", Arial, sans-serif'
  const lines = wrapLines(ctx, title.toUpperCase(), W - 96)
  let y = priceY + 80
  for (const line of lines.slice(0, 3)) {
    ctx.fillText(line, 48, y)
    y += 50
  }

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '500 26px "Segoe UI", Arial, sans-serif'
  ctx.fillText(loc, 48, y + 22)
  if (detailLine) ctx.fillText(detailLine, 48, y + 58)

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 28px "Segoe UI", Arial, sans-serif'
  ctx.fillText(brand, 48, H - 110)
  ctx.fillStyle = COLORS.gold
  ctx.font = '800 28px "Segoe UI", Arial, sans-serif'
  ctx.fillText(phone, 48, H - 72)
  ctx.fillStyle = '#cbd5e1'
  ctx.font = '500 22px "Segoe UI", Arial, sans-serif'
  ctx.fillText(website, 48, H - 38)
}

function drawStorySplit(d: DrawContext) {
  const { ctx, W, H, img, title, priceStr, typeStr, catStr, loc, detailLine, brand, phone, website } = d
  const mid = Math.round(H * 0.55)
  if (img) drawCoverImage(ctx, img, 0, 0, W, mid)
  else drawGradientFallback(ctx, W, mid)

  ctx.fillStyle = COLORS.gold
  ctx.fillRect(0, mid - 6, W, 6)

  ctx.fillStyle = COLORS.navy
  ctx.fillRect(0, mid, W, H - mid)

  ctx.fillStyle = COLORS.gold
  ctx.font = '800 22px "Segoe UI", Arial, sans-serif'
  ctx.fillText(`${typeStr.toUpperCase()} · ${catStr.toUpperCase()}`, 48, mid + 64)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 50px "Segoe UI", Arial, sans-serif'
  let y = mid + 124
  for (const line of wrapLines(ctx, title.toUpperCase(), W - 96).slice(0, 3)) {
    ctx.fillText(line, 48, y)
    y += 58
  }
  ctx.fillStyle = COLORS.gold
  ctx.fillRect(48, y - 28, 70, 4)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 20px "Segoe UI", Arial, sans-serif'
  ctx.fillText('FİYAT', 48, y + 30)
  ctx.fillStyle = COLORS.goldLight
  ctx.font = '900 64px "Segoe UI", Arial, sans-serif'
  ctx.fillText(priceStr, 48, y + 90)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '500 26px "Segoe UI", Arial, sans-serif'
  let y2 = y + 140
  ctx.fillText(loc, 48, y2)
  y2 += 34
  if (detailLine) ctx.fillText(detailLine, 48, y2)

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 26px "Segoe UI", Arial, sans-serif'
  ctx.fillText(brand, 48, H - 110)
  ctx.fillStyle = COLORS.gold
  ctx.font = '800 28px "Segoe UI", Arial, sans-serif'
  ctx.fillText(phone, 48, H - 72)
  ctx.fillStyle = '#cbd5e1'
  ctx.font = '500 22px "Segoe UI", Arial, sans-serif'
  ctx.fillText(website, 48, H - 36)
}

function drawStoryLuxe(d: DrawContext) {
  const { ctx, W, H, img, title, priceStr, typeStr, catStr, loc, detailLine, brand, phone, website } = d
  ctx.fillStyle = COLORS.cream
  ctx.fillRect(0, 0, W, H)

  const inset = 36
  ctx.strokeStyle = COLORS.gold
  ctx.lineWidth = 4
  drawRoundedRect(ctx, inset, inset, W - inset * 2, H - inset * 2, 22)
  ctx.stroke()

  ctx.fillStyle = COLORS.gold
  ctx.font = '700 22px "Segoe UI", Arial, sans-serif'
  const subtag = `${typeStr.toUpperCase()} · ${catStr.toUpperCase()}`
  const sw = ctx.measureText(subtag).width
  ctx.fillText(subtag, (W - sw) / 2, inset + 60)

  ctx.fillStyle = COLORS.navy
  ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif'
  const bw = ctx.measureText(brand).width
  ctx.fillText(brand, (W - bw) / 2, inset + 110)
  ctx.fillStyle = COLORS.gold
  ctx.fillRect((W - 80) / 2, inset + 124, 80, 4)

  const px = inset + 36
  const py = inset + 170
  const pw = W - px * 2 + inset * 2
  const ph = Math.round(H * 0.42)
  ctx.fillStyle = COLORS.gold
  drawRoundedRect(ctx, px - 6, py - 6, pw + 12, ph + 12, 18)
  ctx.fill()
  ctx.save()
  drawRoundedRect(ctx, px, py, pw, ph, 14)
  ctx.clip()
  if (img) drawCoverImage(ctx, img, px, py, pw, ph)
  else drawGradientFallback(ctx, pw, ph)
  ctx.restore()

  let y = py + ph + 60
  ctx.fillStyle = COLORS.navy
  ctx.font = '900 44px "Segoe UI", Arial, sans-serif'
  for (const line of wrapLines(ctx, title.toUpperCase(), pw).slice(0, 2)) {
    const lw = ctx.measureText(line).width
    ctx.fillText(line, (W - lw) / 2, y)
    y += 54
  }

  ctx.fillStyle = COLORS.gold
  ctx.font = '900 60px "Segoe UI", Arial, sans-serif'
  const pw2 = ctx.measureText(priceStr).width
  ctx.fillText(priceStr, (W - pw2) / 2, y + 40)

  ctx.fillStyle = COLORS.navy2
  ctx.font = '500 24px "Segoe UI", Arial, sans-serif'
  y += 90
  const lw = ctx.measureText(loc).width
  ctx.fillText(loc, (W - lw) / 2, y)
  if (detailLine) {
    const dw = ctx.measureText(detailLine).width
    ctx.fillText(detailLine, (W - dw) / 2, y + 34)
  }

  ctx.fillStyle = COLORS.navy
  ctx.font = '700 26px "Segoe UI", Arial, sans-serif'
  const ph2 = ctx.measureText(phone).width
  ctx.fillText(phone, (W - ph2) / 2, H - inset - 74)
  ctx.fillStyle = COLORS.gold
  ctx.font = '600 22px "Segoe UI", Arial, sans-serif'
  const ww = ctx.measureText(website).width
  ctx.fillText(website, (W - ww) / 2, H - inset - 40)
}

function renderCanvas(
  format: 'post' | 'story',
  template: InstagramTemplateId,
  d: Omit<DrawContext, 'ctx' | 'W' | 'H'>
): HTMLCanvasElement {
  const W = format === 'post' ? W_POST : W_STORY
  const H = format === 'post' ? H_POST : H_STORY
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const full: DrawContext = { ...d, ctx, W, H }

  if (format === 'post') {
    switch (template) {
      case 'magazine':
        drawPostMagazine(full)
        break
      case 'dream':
        drawPostDream(full)
        break
      case 'gold':
        drawPostGold(full)
        break
      case 'minimal':
        drawPostMinimal(full)
        break
      case 'split':
        drawPostSplit(full)
        break
      case 'luxe':
        drawPostLuxe(full)
        break
      default:
        drawPostMagazine(full)
    }
  } else {
    switch (template) {
      case 'magazine':
        drawStoryMagazine(full)
        break
      case 'dream':
        drawStoryDream(full)
        break
      case 'gold':
        drawStoryGold(full)
        break
      case 'minimal':
        drawStoryMinimal(full)
        break
      case 'split':
        drawStorySplit(full)
        break
      case 'luxe':
        drawStoryLuxe(full)
        break
      default:
        drawStoryMagazine(full)
    }
  }
  return canvas
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob(
    (blob) => {
      if (!blob) return
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      URL.revokeObjectURL(a.href)
    },
    'image/jpeg',
    0.92
  )
}

interface Props {
  form: InstagramFormSlice
  images: PropertyImage[]
  coverUrl: string | null
  slug?: string | null
}

export default function PropertyInstagramTemplates({ form, images, coverUrl, slug }: Props) {
  const [template, setTemplate] = useState<InstagramTemplateId>('magazine')
  const [busy, setBusy] = useState<'post' | 'story' | null>(null)

  const sortedImages = useMemo(
    () => [...images].sort((a, b) => a.display_order - b.display_order),
    [images]
  )

  const imageUrl = useMemo(() => {
    if (coverUrl) return coverUrl
    return sortedImages[0]?.url || null
  }, [coverUrl, sortedImages])

  const thumbUrls = useMemo(() => {
    const urls: string[] = []
    for (const im of sortedImages) {
      if (im.url === imageUrl) continue
      urls.push(im.url)
      if (urls.length >= 3) break
    }
    if (urls.length === 0 && imageUrl) urls.push(imageUrl)
    return urls
  }, [sortedImages, imageUrl])

  const meta = useMemo(() => {
    const title = (form.title_tr || 'İlan başlığı').trim() || 'İlan başlığı'
    const priceStr = formatMoney(Number(form.price) || 0, form.currency || 'TRY')
    const typeStr = TYPE_TR[form.type] || form.type
    const catStr = CATEGORY_TR[form.category] || form.category
    const locParts = [form.neighborhood, form.district, form.city].filter(Boolean)
    const loc = locParts.join(', ') || 'Konum'
    const bits: string[] = []
    if (form.bedrooms) bits.push(`${form.bedrooms}+1`)
    if (form.bathrooms) bits.push(`${form.bathrooms} banyo`)
    if (form.area_m2) bits.push(`${form.area_m2} m²`)
    if (form.lot_m2) bits.push(`Arsa ${form.lot_m2} m²`)
    const detailLine = bits.join(' · ')
    const features = [
      ...bits,
      ...(form.features || []),
    ].filter(Boolean).slice(0, 6)
    const featureLine = (form.features || []).slice(0, 5).join(' · ')
    const address = loc
    const website = SITE_CONFIG.domain
    return {
      title,
      priceStr,
      typeStr,
      catStr,
      loc,
      detailLine,
      featureLine,
      features,
      address,
      website,
      brand: SITE_CONFIG.shortName,
      phone: SITE_CONFIG.phoneDisplay,
      ig: SITE_CONFIG.social.instagramHandle,
    }
  }, [form])

  const runExport = useCallback(
    async (format: 'post' | 'story') => {
      setBusy(format)
      try {
        const img = imageUrl ? await loadImage(imageUrl) : null
        const thumbs = await Promise.all(thumbUrls.map((u) => loadImage(u)))
        while (thumbs.length < 3) thumbs.push(thumbs[thumbs.length - 1] || img)
        const canvas = renderCanvas(format, template, { img, thumbs, ...meta })
        const slugPart = (slug || 'ilan').replace(/[^\w\u00C0-\u024f-]+/gi, '-').slice(0, 40)
        const name = `instagram-${format}-${template}-${slugPart}.jpg`
        downloadCanvas(canvas, name)
      } finally {
        setBusy(null)
      }
    },
    [imageUrl, thumbUrls, meta, slug, template]
  )

  const hasImage = Boolean(imageUrl)

  return (
    <section className="card p-5 border border-gold-200/60 bg-gradient-to-br from-gold-50/40 to-white">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display text-lg font-bold text-navy-950 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-gold-600" />
            Instagram görseli
          </h3>
          <p className="text-sm text-navy-600 mt-1 max-w-2xl">
            Gönderi (1080×1080) ve story (1080×1920) için JPG üretin; şablon seçip indirin. Instagram’a
            doğrudan yayın için Meta iş hesabı, Facebook Sayfası bağlantısı ve geliştirici uygulaması
            (Graph API) gerekir; isterseniz bir sonraki adımda bunu ayrıca tasarlayabiliriz.
          </p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs font-semibold text-navy-700 uppercase tracking-wide mb-2">Şablon</p>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemplate(t.id)}
              className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                template === t.id
                  ? 'bg-gold-gradient text-navy-950 border-gold-500 shadow-sm'
                  : 'bg-white border-navy-200 text-navy-700 hover:border-gold-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-navy-500 mt-1">
          {TEMPLATES.find((x) => x.id === template)?.hint}
        </p>
      </div>

      {!hasImage && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
          Henüz kapak/görsel yok; şablon arka planı degrade ile oluşturulur. En iyi sonuç için en az bir
          fotoğraf yükleyin.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => runExport('post')}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-950 text-white text-sm font-semibold hover:bg-navy-900 disabled:opacity-60"
        >
          {busy === 'post' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Square className="w-4 h-4" />
          )}
          Gönderi JPG (1080×1080)
        </button>
        <button
          type="button"
          onClick={() => runExport('story')}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-500 text-navy-950 text-sm font-semibold hover:bg-gold-400 disabled:opacity-60"
        >
          {busy === 'story' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Smartphone className="w-4 h-4" />
          )}
          Story JPG (1080×1920)
        </button>
      </div>

      <p className="text-[11px] text-navy-500 mt-3 flex items-center gap-1">
        <Download className="w-3.5 h-3.5 shrink-0" />
        İndirdikten sonra Instagram uygulamasından galeriden paylaşabilirsiniz. Harici görsellerde CORS
        engeli varsa arka plan kullanılır; portföydeki yüklenmiş görseller genelde sorunsuzdur.
      </p>
    </section>
  )
}
