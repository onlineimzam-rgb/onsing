import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { findTemplateByKey } from '@shared/contracts'
import { getOptionalUser } from '@/lib/session'
import NewContractForm from '../NewContractForm'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { templateKey: string } }) {
  const t = findTemplateByKey(params.templateKey)
  return { title: `${t?.label ?? 'Yeni sözleşme'} · OnSig` }
}

export default async function NewContractFormPage({
  params,
}: {
  params: { templateKey: string }
}) {
  const session = await getOptionalUser()
  if (!session) redirect('/login')

  const template = findTemplateByKey(params.templateKey)
  if (!template) notFound()

  const isCustom = template.key === 'custom'

  return (
    <div>
      <Link
        href="/contracts/new"
        className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-brand font-semibold"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Şablon seçimine dön
      </Link>
      <div className="mt-2">
        <p className="text-xs uppercase tracking-wider text-ink-muted">Adım 2 / 2</p>
        <h1 className="font-display text-2xl font-bold tracking-tight mt-0.5">{template.label}</h1>
        <p className="text-sm text-ink-muted mt-1">
          {isCustom
            ? 'Başlığını ve metnini yaz, kaç imzacıya gidecek belirle. Hazır olduğunda kaydet ve imzaya gönder.'
            : 'Formu doldur, sözleşme metni otomatik üretilsin.'}
        </p>
      </div>

      <div className="mt-6">
        <NewContractForm
          initialTemplateKey={template.key}
          fixed
          templates={[{ ...template, roles: [...template.roles] }]}
        />
      </div>
    </div>
  )
}
