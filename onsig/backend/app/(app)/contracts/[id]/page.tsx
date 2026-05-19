import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft, Download } from 'lucide-react'
import { eq } from 'drizzle-orm'
import { db, schema } from '@/db'
import { getOptionalUser, loadTenant } from '@/lib/session'
import { buildContextFromTenant, getContractById, mergeForm } from '@/lib/contracts'
import { buildContractText, contractTitle, findTemplate, ROLES_BY_TEMPLATE, isRealEstateKey, type RealEstateTemplateKey, type Sector } from '@shared/contracts'
import SignSessionPanel from './SignSessionPanel'
import ContractView from './ContractView'

export const dynamic = 'force-dynamic'

const STATUS_META: Record<string, { label: string; cls: string }> = {
  taslak: { label: 'Taslak', cls: 'bg-slate-100 text-slate-700' },
  aktif: { label: 'Aktif', cls: 'bg-amber-100 text-amber-700' },
  tamamlandi: { label: 'Tamamlandı', cls: 'bg-emerald-100 text-emerald-700' },
  iptal: { label: 'İptal', cls: 'bg-rose-100 text-rose-700' },
}

export default async function ContractDetailPage({ params }: { params: { id: string } }) {
  const session = await getOptionalUser()
  if (!session) redirect('/login')

  const id = Number(params.id)
  if (!Number.isFinite(id) || id <= 0) notFound()

  const contract = await getContractById(session.tenantId, id)
  if (!contract) notFound()

  const tenant = await loadTenant(session.tenantId)
  const ctx = buildContextFromTenant(tenant!)
  const form = mergeForm(contract.form, { templateKey: contract.templateKey as never })
  const body = buildContractText(form, ctx)

  const template = findTemplate(contract.sector as Sector, contract.templateKey)
  const allowedRoles = isRealEstateKey(contract.templateKey)
    ? [...ROLES_BY_TEMPLATE[contract.templateKey]]
    : (template?.roles ? [...template.roles] : [])

  const sessions = await db
    .select()
    .from(schema.signSessions)
    .where(eq(schema.signSessions.contractId, id))
    .orderBy(schema.signSessions.id)

  const statusMeta = STATUS_META[contract.status] ?? STATUS_META.taslak!

  return (
    <div>
      <Link href="/contracts" className="text-sm text-ink-muted hover:text-brand inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Sözleşmeler
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {contract.title || contractTitle(contract.templateKey as RealEstateTemplateKey)}
            </h1>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusMeta.cls}`}>
              {statusMeta.label}
            </span>
          </div>
          <p className="text-sm text-ink-muted mt-1">
            #{contract.id} · {template?.label ?? contract.templateKey} · {new Date(contract.createdAt).toLocaleString('tr-TR')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/contracts/${contract.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost"
          >
            <Download className="w-4 h-4" />
            PDF görüntüle
          </a>
          <a
            href={`/api/contracts/${contract.id}/pdf?force=1`}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost"
          >
            Yeniden üret
          </a>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ContractView templateKey={contract.templateKey} form={form} body={body} />
        </div>

        <SignSessionPanel
          contractId={contract.id}
          status={contract.status}
          allowedRoles={allowedRoles}
          initialSessions={sessions.map((s) => ({
            id: s.id,
            role: s.role,
            token: s.token,
            status: s.status,
            recipientName: s.recipientName,
            recipientEmail: s.recipientEmail,
            recipientPhone: s.recipientPhone,
            signedAt: s.signedAt ? s.signedAt.toISOString() : null,
            expiresAt: s.expiresAt ? s.expiresAt.toISOString() : null,
          }))}
        />
      </div>
    </div>
  )
}
