import { NextResponse, type NextRequest } from 'next/server'
import { put } from '@vercel/blob'
import { sql } from '@/lib/db'
import { sendValuationNotification } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// 10 MB / dosya, en fazla 5 dosya
const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_FILES = 5
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
])

function slugForFile(name: string) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .toLowerCase()
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''

    let payload: Record<string, any> = {}
    let documents: string[] = []
    let propertyPhotos: string[] = []

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      for (const [k, v] of form.entries()) {
        if (k === 'documents' || k === 'property_photos') continue
        if (typeof v === 'string') payload[k] = v
      }

      const files = form.getAll('documents').filter((f) => f instanceof File) as File[]
      const photos = form.getAll('property_photos').filter((f) => f instanceof File) as File[]
      if (files.length > MAX_FILES || photos.length > MAX_FILES) {
        return NextResponse.json(
          { error: `En fazla ${MAX_FILES} dosya yükleyebilirsiniz` },
          { status: 400 }
        )
      }

      const blobToken = process.env.BLOB_READ_WRITE_TOKEN
      const uploadFiles = async (uploadFiles: File[], folder: string, imagesOnly = false) => {
        const urls: string[] = []
        for (const file of uploadFiles) {
        if (!file.size) continue
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`${file.name} dosyası 10 MB sınırını aşıyor`)
        }
        if (imagesOnly && !file.type.startsWith('image/')) {
          throw new Error(`${file.name}: Gayrimenkul fotoğrafı için sadece görsel yüklenebilir`)
        }
        if (file.type && !ALLOWED_TYPES.has(file.type)) {
          throw new Error(`${file.name}: ${file.type} desteklenmiyor (JPG/PNG/WEBP/PDF)`)
        }
        const safeName = slugForFile(file.name || 'belge')
        const blobPath = `${folder}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}-${safeName}`
        const uploaded = await put(blobPath, file, {
          access: 'public',
          token: blobToken,
        })
        urls.push(uploaded.url)
        }
        return urls
      }

      try {
        documents = await uploadFiles(files, 'valuations/documents')
        propertyPhotos = await uploadFiles(photos, 'valuations/photos', true)
      } catch (e) {
        return NextResponse.json(
          { error: (e as Error).message },
          { status: 400 }
        )
      }
    } else {
      payload = await req.json()
      if (Array.isArray(payload.documents)) {
        documents = payload.documents.filter((u: any) => typeof u === 'string')
      }
      if (Array.isArray(payload.property_photos)) {
        propertyPhotos = payload.property_photos.filter((u: any) => typeof u === 'string')
      }
    }

    if (documents.length === 0) {
      return NextResponse.json(
        { error: 'Tapu, web tapu belgesi veya mülk sahipliğini gösteren belge zorunludur' },
        { status: 400 }
      )
    }

    const {
      name, phone, email, address, property_type,
      area_m2, lot_m2, year_built, rooms, notes,
      city, district, neighborhood,
      ada_no, parsel_no, pafta_no, parcel_query_url, manual_property_info,
    } = payload

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Ad ve telefon zorunludur' },
        { status: 400 }
      )
    }

    const fullAddress =
      address ||
      [neighborhood, district, city].filter(Boolean).join(', ') ||
      'Belirtilmedi'

    const inserted = (await sql(
      `INSERT INTO valuation_requests (
        name, phone, email, address, property_type,
        area_m2, lot_m2, year_built, rooms, notes,
        city, district, neighborhood, ada_no, parsel_no, pafta_no,
        parcel_query_url, manual_property_info, property_photos, documents
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
      RETURNING id, created_at`,
      [
        name, phone, email || null, fullAddress, property_type || null,
        area_m2 ? Number(area_m2) : null,
        lot_m2 ? Number(lot_m2) : null,
        year_built ? Number(year_built) : null,
        rooms || null, notes || null,
        city || null, district || null, neighborhood || null,
        ada_no || null, parsel_no || null, pafta_no || null,
        parcel_query_url || null,
        manual_property_info || null,
        propertyPhotos.length ? propertyPhotos : null,
        documents.length ? documents : null,
      ]
    )) as { id: number; created_at: Date }[]

    sendValuationNotification({
      name, phone, email, address: fullAddress, property_type,
      area_m2, lot_m2, year_built, rooms, notes,
      city, district, neighborhood, ada_no, parsel_no, pafta_no,
      parcel_query_url, manual_property_info, property_photos: propertyPhotos, documents,
    }).catch((e) => console.error('Valuation mail err:', e.message))

    return NextResponse.json({
      success: true,
      id: inserted[0]?.id,
      uploaded: documents.length,
    })
  } catch (error) {
    console.error('Valuation POST error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
