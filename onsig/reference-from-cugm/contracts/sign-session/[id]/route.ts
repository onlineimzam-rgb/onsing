import { NextResponse, type NextRequest } from 'next/server'
import { ensureContractsSchema, sql, type ContractSignSession } from '@/lib/db'
import { isAuthorized } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = Number(params.id)
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: 'Geçersiz id' }, { status: 400 })
  }
  try {
    await ensureContractsSchema()
    const rows = (await sql(
      `SELECT id, token, contract_type, form_snapshot, rendered_text, status,
              signer_name, signer_tc, signer_email, signer_phone,
              signer_accepted_terms, signer_ip, signer_user_agent,
              signature_png, signed_at, created_at
         FROM contract_sign_sessions WHERE id = $1 LIMIT 1`,
      [id]
    )) as ContractSignSession[]

    if (rows.length === 0) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
    const row = rows[0]!
    const signatureDataUrl = row.signature_png
      ? row.signature_png.startsWith('data:')
        ? row.signature_png
        : `data:image/png;base64,${row.signature_png}`
      : null

    return NextResponse.json({
      session: {
        id: row.id,
        token: row.token,
        contractType: row.contract_type,
        formSnapshot: row.form_snapshot,
        renderedText: row.rendered_text,
        status: row.status,
        signerName: row.signer_name,
        signerTc: row.signer_tc,
        signerEmail: row.signer_email,
        signerPhone: row.signer_phone,
        signerAcceptedTerms: row.signer_accepted_terms,
        signerIp: row.signer_ip,
        signerUserAgent: row.signer_user_agent,
        signatureDataUrl,
        signedAt: row.signed_at,
        createdAt: row.created_at,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = Number(params.id)
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: 'Geçersiz id' }, { status: 400 })
  }
  try {
    await ensureContractsSchema()
    await sql(`DELETE FROM contract_sign_sessions WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
