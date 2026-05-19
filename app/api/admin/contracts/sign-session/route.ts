import crypto from 'crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { ensureContractsSchema, sql, type Contract } from '@/lib/db'
import { isAuthorized } from '@/lib/auth'
import { SITE_CONFIG } from '@/lib/config'
import { buildContractText } from '@/lib/contracts/templates'
import { defaultSignerRoleForType } from '@/lib/contracts/render'
import type { ContractFormState } from '@/lib/contracts/types'
import {
  sendContractCreatedNotification,
  sendSignLinkCreatedNotification,
} from '@/lib/email'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Geriye uyumlu tek-adımda imza linki oluşturma.
 * Yeni sistemde önce /api/admin/contracts ile sözleşme oluşturulup
 * /api/admin/contracts/[id]/sign-sessions ile imza linki eklenir.
 * Bu endpoint, eski "tek tıkla link" akışı için aynısını yapar.
 */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await ensureContractsSchema()
    const body = await req.json()
    const form = body.form as ContractFormState
    const roleOverride = typeof body.role === 'string' ? body.role.trim() : ''
    if (!form?.contractType) {
      return NextResponse.json({ error: 'form.contractType zorunlu' }, { status: 400 })
    }

    const rendered = buildContractText(form)
    const role = roleOverride || defaultSignerRoleForType(form.contractType)
    const token = crypto.randomBytes(24).toString('hex')

    const title =
      [form.customerName?.trim(), form.propertyAddress?.trim()].filter(Boolean).join(' · ') ||
      null

    const insertedContract = (await sql(
      `INSERT INTO contracts (contract_type, title, form_snapshot, rendered_text, status)
       VALUES ($1, $2, $3::jsonb, $4, 'aktif')
       RETURNING id, contract_type, title`,
      [form.contractType, title, JSON.stringify(form), rendered]
    )) as Array<Pick<Contract, 'id' | 'contract_type' | 'title'>>

    const c = insertedContract[0]
    if (!c) {
      return NextResponse.json({ error: 'Sözleşme oluşturulamadı' }, { status: 500 })
    }

    await sql(
      `INSERT INTO contract_sign_sessions (contract_id, role, token, contract_type, form_snapshot, rendered_text)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
      [c.id, role, token, form.contractType, JSON.stringify(form), rendered]
    )

    const base = SITE_CONFIG.url.replace(/\/$/, '')
    const signUrlTr = `${base}/tr/imza/${token}/`
    const signUrlEn = `${base}/en/imza/${token}/`

    sendContractCreatedNotification({
      contractId: c.id,
      contractType: c.contract_type,
      title: c.title,
      ownerName: form.ownerName || null,
      customerName: form.customerName || null,
      propertyAddress: form.propertyAddress || null,
    }).catch((err) => console.error('contract created mail err:', (err as Error).message))

    sendSignLinkCreatedNotification({
      contractId: c.id,
      contractType: c.contract_type,
      role,
      signUrl: signUrlTr,
      recipientName: form.customerName || null,
    }).catch((err) => console.error('sign link mail err:', (err as Error).message))

    return NextResponse.json({
      success: true,
      token,
      signUrlTr,
      signUrlEn,
      contractId: c.id,
    })
  } catch (e) {
    console.error('sign-session POST:', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
