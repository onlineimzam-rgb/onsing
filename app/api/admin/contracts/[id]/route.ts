import { NextResponse, type NextRequest } from 'next/server'
import { ensureContractsSchema, sql, type Contract, type ContractSignSession } from '@/lib/db'
import { isAuthorized } from '@/lib/auth'
import { buildContractText } from '@/lib/contracts/templates'
import type { ContractFormState } from '@/lib/contracts/types'

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
    const cRows = (await sql(
      `SELECT id, contract_type, title, form_snapshot, rendered_text, status, created_at, updated_at
         FROM contracts WHERE id = $1 LIMIT 1`,
      [id]
    )) as Contract[]
    if (cRows.length === 0) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
    const contract = cRows[0]!

    const sRows = (await sql(
      `SELECT id, contract_id, role, token, contract_type, form_snapshot, status,
              signer_name, signer_tc, signer_email, signer_phone,
              signer_accepted_terms, signer_ip, signer_user_agent,
              signature_png, signed_at, created_at
         FROM contract_sign_sessions
        WHERE contract_id = $1
        ORDER BY created_at ASC`,
      [id]
    )) as ContractSignSession[]

    const sessions = sRows.map((row) => ({
      id: row.id,
      contractId: row.contract_id,
      role: row.role,
      token: row.token,
      status: row.status,
      signerName: row.signer_name,
      signerTc: row.signer_tc,
      signerEmail: row.signer_email,
      signerPhone: row.signer_phone,
      signerAcceptedTerms: row.signer_accepted_terms,
      signerIp: row.signer_ip,
      signerUserAgent: row.signer_user_agent,
      signatureDataUrl: row.signature_png
        ? row.signature_png.startsWith('data:')
          ? row.signature_png
          : `data:image/png;base64,${row.signature_png}`
        : null,
      signedAt: row.signed_at,
      createdAt: row.created_at,
    }))

    return NextResponse.json({
      contract: {
        id: contract.id,
        contractType: contract.contract_type,
        title: contract.title,
        formSnapshot: contract.form_snapshot as unknown as ContractFormState,
        renderedText: contract.rendered_text,
        status: contract.status,
        createdAt: contract.created_at,
        updatedAt: contract.updated_at,
        sessions,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = Number(params.id)
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: 'Geçersiz id' }, { status: 400 })
  }
  try {
    await ensureContractsSchema()
    const body = await req.json()
    const form = body.form as ContractFormState | undefined
    const title = typeof body.title === 'string' ? body.title.trim() : undefined
    const status = typeof body.status === 'string' ? body.status.trim() : undefined

    if (!form && !title && !status) {
      return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 })
    }

    if (form) {
      const rendered = buildContractText(form)
      await sql(
        `UPDATE contracts SET form_snapshot = $1::jsonb, rendered_text = $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = $3`,
        [JSON.stringify(form), rendered, id]
      )
    }
    if (typeof title === 'string') {
      await sql(`UPDATE contracts SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [
        title,
        id,
      ])
    }
    if (typeof status === 'string' && ['taslak', 'aktif', 'tamamlandi', 'iptal'].includes(status)) {
      await sql(`UPDATE contracts SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [
        status,
        id,
      ])
    }

    return NextResponse.json({ success: true })
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
    await sql(`DELETE FROM contract_sign_sessions WHERE contract_id = $1`, [id])
    await sql(`DELETE FROM contracts WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
