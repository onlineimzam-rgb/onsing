import { NextResponse, type NextRequest } from 'next/server'
import { ensureCrmAndSalesSchema, ensureContractsSchema, sql, type Contract } from '@/lib/db'
import { isAuthorized } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function parseMoneyToNumber(input: unknown): number | null {
  const s = String(input || '').replace(/\s|TL|TRY|EUR|€|₺/gi, '').trim()
  if (!s) return null
  const normalized = s.replace(/\./g, '').replace(/,/g, '.')
  const n = Number(normalized)
  return Number.isFinite(n) && n > 0 ? n : null
}

function parseTrDateToIso(input: unknown): string | null {
  const s = String(input || '').trim()
  if (!s) return null
  const iso = /^\d{4}-\d{2}-\d{2}/.exec(s)
  if (iso) return s.slice(0, 10)
  const m = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(s)
  if (m) {
    const d = m[1]!.padStart(2, '0')
    const mo = m[2]!.padStart(2, '0')
    return `${m[3]}-${mo}-${d}`
  }
  return null
}

/**
 * Bir sözleşme detayından İş (sales_transactions) kaydı oluşturur.
 * Form snapshot'tan alıcı / satıcı / satış bedeli / sözleşme tarihi otomatik gelir.
 * Aynı sözleşmeye bağlı kayıt varsa onu döndürür (tekrar oluşturmaz).
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const contractId = parseInt(params.id, 10)
  if (Number.isNaN(contractId) || contractId <= 0) {
    return NextResponse.json({ error: 'invalid contract id' }, { status: 400 })
  }
  try {
    await ensureContractsSchema()
    await ensureCrmAndSalesSchema()

    const cRows = (await sql(
      `SELECT id, contract_type, title, form_snapshot, status FROM contracts WHERE id = $1 LIMIT 1`,
      [contractId]
    )) as Contract[]
    if (cRows.length === 0) return NextResponse.json({ error: 'Sözleşme bulunamadı' }, { status: 404 })
    const c = cRows[0]!

    const existing = (await sql(
      `SELECT * FROM sales_transactions WHERE contract_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [contractId]
    )) as any[]
    if (existing.length > 0) {
      return NextResponse.json({ transaction: existing[0], reused: true })
    }

    const snap = (c.form_snapshot || {}) as Record<string, unknown>
    const isSale = c.contract_type === 'alim-satim'

    const buyer = isSale ? String(snap.customerName || '').trim() || null : null
    const seller = isSale ? String(snap.ownerName || '').trim() || null : null
    const salePrice = isSale ? parseMoneyToNumber(snap.salePrice) : null
    const signedAt = parseTrDateToIso(snap.contractDate)

    const inserted = await sql(
      `INSERT INTO sales_transactions (
         contract_id, buyer_name, seller_name,
         sale_price, currency, commission_currency,
         contract_signed_at, notes, stage
       ) VALUES (
         $1, $2, $3,
         $4, 'TRY', 'TRY',
         $5, $6, 'sozlesme'
       )
       RETURNING *`,
      [
        contractId,
        buyer,
        seller,
        salePrice,
        signedAt,
        `Sözleşme #${contractId} (${c.title || 'Adsız'}) üzerinden oluşturuldu`,
      ]
    )

    return NextResponse.json({ transaction: (inserted as any[])[0], reused: false })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
