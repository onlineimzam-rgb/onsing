import { NextResponse, type NextRequest } from 'next/server'
import { ensureContractsSchema, sql } from '@/lib/db'
import { contractTitle } from '@/lib/contracts/templates'
import type { ContractType } from '@/lib/contracts/types'
import { sendContractSignedNotification } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_SIG_LEN = 900_000

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  try {
    await ensureContractsSchema()
    const token = params.token?.trim()
    if (!token || token.length > 80) {
      return NextResponse.json({ error: 'Geçersiz bağlantı' }, { status: 400 })
    }

    const rows = (await sql(
      `SELECT contract_type, rendered_text, form_snapshot, status, signer_name, signed_at, signature_png
         FROM contract_sign_sessions WHERE token = $1 LIMIT 1`,
      [token]
    )) as {
      contract_type: string
      rendered_text: string
      form_snapshot: Record<string, unknown> | null
      status: string
      signer_name: string | null
      signed_at: Date | null
      signature_png: string | null
    }[]

    if (rows.length === 0) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

    const row = rows[0]!
    const title = contractTitle(row.contract_type as ContractType)
    const signatureDataUrl = row.signature_png?.startsWith('data:')
      ? row.signature_png
      : row.signature_png
        ? `data:image/png;base64,${row.signature_png}`
        : null

    return NextResponse.json({
      ok: true,
      status: row.status,
      title,
      contractType: row.contract_type,
      body: row.rendered_text,
      formSnapshot: row.form_snapshot ?? null,
      signerName: row.signer_name,
      signedAt: row.signed_at,
      signatureDataUrl,
    })
  } catch (e) {
    console.error('contracts/sign GET:', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    await ensureContractsSchema()
    const token = params.token?.trim()
    if (!token || token.length > 80) {
      return NextResponse.json({ error: 'Geçersiz bağlantı' }, { status: 400 })
    }

    const body = await req.json()
    const signerName = String(body.signerName || '').trim()
    const signerTc = String(body.signerTc || '').trim()
    const signerEmail = String(body.signerEmail || '').trim() || null
    const signerPhone = String(body.signerPhone || '').trim() || null
    let signaturePng = String(body.signaturePng || '').trim()
    const acceptedTerms = Boolean(body.acceptedTerms)

    if (!acceptedTerms) {
      return NextResponse.json({ error: 'Metni okuduğunuzu onaylamanız gerekir' }, { status: 400 })
    }
    if (signerName.length < 3) {
      return NextResponse.json({ error: 'Ad Soyad en az 3 karakter olmalıdır' }, { status: 400 })
    }
    if (!signaturePng) {
      return NextResponse.json({ error: 'İmza alanı boş olamaz' }, { status: 400 })
    }
    if (signaturePng.length > MAX_SIG_LEN) {
      return NextResponse.json({ error: 'İmza görseli çok büyük' }, { status: 400 })
    }

    if (signaturePng.startsWith('data:image')) {
      const parts = signaturePng.split(',')
      signaturePng = parts.length > 1 ? parts[1]! : signaturePng
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      ''
    const ua = req.headers.get('user-agent') || ''

    const exists = (await sql(`SELECT id, status FROM contract_sign_sessions WHERE token = $1`, [
      token,
    ])) as { id: number; status: string }[]

    if (exists.length === 0) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
    if (exists[0].status !== 'bekliyor') {
      return NextResponse.json({ error: 'Bu belge zaten imzalanmış veya kapalı' }, { status: 409 })
    }

    const updated = (await sql(
      `UPDATE contract_sign_sessions SET
        status = 'imzalandi',
        signer_name = $1,
        signer_tc = $2,
        signer_email = $3,
        signer_phone = $4,
        signature_png = $5,
        signer_accepted_terms = TRUE,
        signer_ip = $6,
        signer_user_agent = $7,
        signed_at = CURRENT_TIMESTAMP
       WHERE token = $8 AND status = 'bekliyor'
       RETURNING id, contract_id, role, contract_type, signed_at`,
      [signerName, signerTc || null, signerEmail, signerPhone, signaturePng, ip, ua, token]
    )) as Array<{
      id: number
      contract_id: number | null
      role: string | null
      contract_type: string
      signed_at: Date
    }>

    const updatedRow = updated[0]
    if (!updatedRow) {
      return NextResponse.json({ error: 'Bu belge zaten imzalanmış' }, { status: 409 })
    }

    // Parent contract status'u güncelle: tüm imza oturumları imzalanmışsa "tamamlandi"
    if (updatedRow.contract_id) {
      try {
        const pending = (await sql(
          `SELECT COUNT(*)::int AS cnt FROM contract_sign_sessions
            WHERE contract_id = $1 AND status = 'bekliyor'`,
          [updatedRow.contract_id]
        )) as Array<{ cnt: number }>
        const pendingCount = Number(pending[0]?.cnt || 0)
        if (pendingCount === 0) {
          await sql(
            `UPDATE contracts SET status = 'tamamlandi', updated_at = CURRENT_TIMESTAMP
              WHERE id = $1`,
            [updatedRow.contract_id]
          )
        } else {
          await sql(
            `UPDATE contracts SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [updatedRow.contract_id]
          )
        }
      } catch (e) {
        console.error('parent contract update err:', (e as Error).message)
      }
    }

    sendContractSignedNotification({
      contractId: updatedRow.contract_id || 0,
      contractType: updatedRow.contract_type,
      role: updatedRow.role || '',
      signerName,
      signerTc: signerTc || null,
      signerEmail,
      signerPhone,
      signedAt: updatedRow.signed_at,
    }).catch((err) => console.error('contract signed mail err:', (err as Error).message))

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('contracts/sign POST:', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
