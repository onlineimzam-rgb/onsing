import { listGlobalContracts } from '@/lib/admin'
import { ContractsTable } from './ContractsTable'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Contracts' }

export default async function AdminContractsPage() {
  const contracts = await listGlobalContracts(500)
  const rows = contracts.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    title: c.title,
  }))
  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[var(--a-text-4)]">
          Operations · Contracts
        </div>
        <h1 className="mt-1 font-display text-[22px] tracking-tightest text-[var(--a-text-1)]">
          Tüm sözleşmeler
        </h1>
        <p className="mt-1 text-[12.5px] text-[var(--a-text-3)] max-w-md">
          Tüm tenant&apos;lardan akan sözleşme akışı. Son 500 kayıt gösterilir.
        </p>
      </div>
      <ContractsTable rows={rows} />
    </div>
  )
}
