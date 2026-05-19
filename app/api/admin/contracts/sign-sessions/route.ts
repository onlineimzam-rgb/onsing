import { NextResponse, type NextRequest } from 'next/server'
import { ensureContractsSchema, sql, type ContractSignSession } from '@/lib/db'
import { isAuthorized } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await ensureContractsSchema()
    const sessions = (await sql(
      `SELECT id, token, contract_type, status, signer_name, signer_tc, signed_at, created_at
         FROM contract_sign_sessions
        ORDER BY created_at DESC
        LIMIT 150`
    )) as Pick<
      ContractSignSession,
      'id' | 'token' | 'contract_type' | 'status' | 'signer_name' | 'signer_tc' | 'signed_at' | 'created_at'
    >[]
    return NextResponse.json({ sessions })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
