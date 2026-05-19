import { NextResponse, type NextRequest } from 'next/server'
import { ensureContractsSchema, sql, type Contract } from '@/lib/db'
import { isAuthorized } from '@/lib/auth'
import { buildContractText } from '@/lib/contracts/templates'
import type { ContractFormState, ContractType } from '@/lib/contracts/types'
import { sendContractCreatedNotification } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function makeTitle(form: ContractFormState): string {
  const parts: string[] = []
  if (form.customerName?.trim()) parts.push(form.customerName.trim())
  else if (form.ownerName?.trim()) parts.push(form.ownerName.trim())
  if (form.propertyAddress?.trim()) {
    const addr = form.propertyAddress.trim()
    parts.push(addr.length > 60 ? addr.slice(0, 60) + '…' : addr)
  } else if (form.mahalle?.trim()) {
    parts.push(form.mahalle.trim())
  }
  return parts.join(' · ') || 'Adsız sözleşme'
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await ensureContractsSchema()
    const url = new URL(req.url)
    const type = url.searchParams.get('type')
    const params: any[] = []
    const where: string[] = []
    if (type) {
      params.push(type)
      where.push(`c.contract_type = $${params.length}`)
    }
    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : ''

    const rows = (await sql(
      `SELECT c.id, c.contract_type, c.title, c.status, c.created_at, c.updated_at,
              c.form_snapshot,
              COUNT(s.id) FILTER (WHERE s.id IS NOT NULL) AS sessions_count,
              COUNT(s.id) FILTER (WHERE s.status = 'imzalandi') AS signed_count,
              COUNT(s.id) FILTER (WHERE s.status = 'bekliyor') AS pending_count
         FROM contracts c
         LEFT JOIN contract_sign_sessions s ON s.contract_id = c.id
         ${whereSQL}
         GROUP BY c.id
         ORDER BY c.created_at DESC
         LIMIT 200`,
      params
    )) as Array<
      Pick<Contract, 'id' | 'contract_type' | 'title' | 'status' | 'created_at' | 'updated_at' | 'form_snapshot'> & {
        sessions_count: string | number
        signed_count: string | number
        pending_count: string | number
      }
    >

    return NextResponse.json({
      contracts: rows.map((r) => ({
        id: r.id,
        contractType: r.contract_type,
        title: r.title,
        status: r.status,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        formSnapshot: r.form_snapshot,
        sessionsCount: Number(r.sessions_count) || 0,
        signedCount: Number(r.signed_count) || 0,
        pendingCount: Number(r.pending_count) || 0,
      })),
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await ensureContractsSchema()
    const body = await req.json()
    const form = body.form as ContractFormState
    if (!form?.contractType) {
      return NextResponse.json({ error: 'form.contractType zorunlu' }, { status: 400 })
    }
    const rendered = buildContractText(form)
    const title = makeTitle(form)

    const inserted = (await sql(
      `INSERT INTO contracts (contract_type, title, form_snapshot, rendered_text)
       VALUES ($1, $2, $3::jsonb, $4)
       RETURNING id, contract_type, title, status, created_at, updated_at`,
      [form.contractType as ContractType, title, JSON.stringify(form), rendered]
    )) as Array<Pick<Contract, 'id' | 'contract_type' | 'title' | 'status' | 'created_at' | 'updated_at'>>

    const row = inserted[0]
    if (!row) {
      return NextResponse.json({ error: 'Oluşturulamadı' }, { status: 500 })
    }

    sendContractCreatedNotification({
      contractId: row.id,
      contractType: row.contract_type,
      title: row.title,
      ownerName: form.ownerName || null,
      customerName: form.customerName || null,
      propertyAddress: form.propertyAddress || null,
    }).catch((err) => console.error('contract created mail err:', (err as Error).message))

    return NextResponse.json({
      success: true,
      contract: {
        id: row.id,
        contractType: row.contract_type,
        title: row.title,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    })
  } catch (e) {
    console.error('contracts POST:', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
