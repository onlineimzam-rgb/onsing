import { redirect } from 'next/navigation'
import { listContracts } from '@/lib/contracts'
import { getOptionalUser } from '@/lib/session'
import ContractsView from './ContractsView'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Sözleşmeler · OnSig' }

export default async function ContractsPage() {
  const session = await getOptionalUser()
  if (!session) redirect('/login')

  const items = await listContracts(session.tenantId)
  // Server timestamps are Date; serialise to ISO so the client can JSON-roundtrip.
  const serialised = items.map((c) => ({
    ...c,
    createdAt:
      c.createdAt instanceof Date
        ? c.createdAt.toISOString()
        : (c.createdAt as unknown as string),
    updatedAt:
      c.updatedAt instanceof Date
        ? c.updatedAt.toISOString()
        : (c.updatedAt as unknown as string),
  }))

  return <ContractsView items={serialised} />
}
