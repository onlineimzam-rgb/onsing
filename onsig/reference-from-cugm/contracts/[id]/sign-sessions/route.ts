import crypto from 'crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { ensureContractsSchema, sql, type Contract } from '@/lib/db'
import { isAuthorized } from '@/lib/auth'
import { SITE_CONFIG } from '@/lib/config'
import type { ContractFormState } from '@/lib/contracts/types'
import { sendSignLinkCreatedNotification } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ROLE_WHITELIST = new Set([
  'kiraya-veren',
  'kefil',
  'kiraci',
  'satici',
  'alici',
  'komisyoncu',
  'mal-sahibi',
  'yer-goren',
])

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = Number(params.id)
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: 'Geçersiz id' }, { status: 400 })
  }
  try {
    await ensureContractsSchema()
    const body = await req.json()
    const role = typeof body.role === 'string' ? body.role.trim() : ''
    const recipientName = typeof body.recipientName === 'string' ? body.recipientName.trim() : ''

    if (!role || !ROLE_WHITELIST.has(role)) {
      return NextResponse.json({ error: 'Geçersiz rol' }, { status: 400 })
    }

    const cRows = (await sql(
      `SELECT id, contract_type, form_snapshot, rendered_text FROM contracts WHERE id = $1 LIMIT 1`,
      [id]
    )) as Array<Pick<Contract, 'id' | 'contract_type' | 'form_snapshot' | 'rendered_text'>>
    if (cRows.length === 0) {
      return NextResponse.json({ error: 'Sözleşme bulunamadı' }, { status: 404 })
    }
    const c = cRows[0]!

    const token = crypto.randomBytes(24).toString('hex')
    const formSnapshot = c.form_snapshot as unknown as ContractFormState

    await sql(
      `INSERT INTO contract_sign_sessions (contract_id, role, token, contract_type, form_snapshot, rendered_text)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
      [c.id, role, token, c.contract_type, JSON.stringify(formSnapshot), c.rendered_text]
    )

    await sql(
      `UPDATE contracts SET status = CASE WHEN status = 'taslak' THEN 'aktif' ELSE status END,
                            updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [c.id]
    )

    const base = SITE_CONFIG.url.replace(/\/$/, '')
    const signUrlTr = `${base}/tr/imza/${token}/`
    const signUrlEn = `${base}/en/imza/${token}/`

    sendSignLinkCreatedNotification({
      contractId: c.id,
      contractType: c.contract_type,
      role,
      signUrl: signUrlTr,
      recipientName: recipientName || null,
    }).catch((err) => console.error('sign link mail err:', (err as Error).message))

    return NextResponse.json({ success: true, token, signUrlTr, signUrlEn })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
