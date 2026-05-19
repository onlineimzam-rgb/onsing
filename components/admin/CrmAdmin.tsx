'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Mail, Phone, UserRound, Building2, ScrollText } from 'lucide-react'
import { getAdminKey } from './AdminLogin'
import { CrmContactDetailModal, type CrmDetailKind, type CrmDetailRow } from './CrmContactDetailModal'

type CrmRow = CrmDetailRow

type CrmData = {
  leads: CrmRow[]
  valuations: CrmRow[]
  owners: CrmRow[]
  contractParties: CrmRow[]
}

export default function CrmAdmin({
  onOpenContract,
}: {
  onOpenContract?: (contractId: number) => void
} = {}) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<CrmData>({
    leads: [],
    valuations: [],
    owners: [],
    contractParties: [],
  })
  const [modal, setModal] = useState<{ open: boolean; kind: CrmDetailKind; row: CrmRow | null }>({
    open: false,
    kind: 'lead',
    row: null,
  })

  const loadCrm = useCallback(() => {
    const key = getAdminKey()
    if (!key) return
    setLoading(true)
    fetch('/api/admin/crm/', { headers: { 'x-admin-key': key } })
      .then((r) => r.json())
      .then((json) =>
        setData({
          leads: json.leads || [],
          valuations: json.valuations || [],
          owners: json.owners || [],
          contractParties: json.contractParties || [],
        })
      )
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadCrm()
  }, [loadCrm])

  const openDetail = (kind: CrmDetailKind, row: CrmRow) => {
    setModal({ open: true, kind, row })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gold-500" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <h3 className="font-display text-xl font-bold text-navy-950">Müşteri ve Portföy Sahibi Veritabanı</h3>
        <p className="text-sm text-navy-600 mt-1">
          Talepler, değerleme başvuruları, portföy sahipleri ve sözleşmelerde imza atan taraflar tek ekranda listelenir.
          İsimlere tıklayarak detay düzenleyebilir veya sözleşmeye geçebilirsiniz.
        </p>
      </div>

      <Section
        title="Sözleşme tarafları (imza oturumları)"
        icon={ScrollText}
        rows={data.contractParties}
        kind="contract"
        onRowClick={(row) => openDetail('contract', row)}
      />
      <Section
        title="Portföy Sahipleri"
        icon={Building2}
        rows={data.owners}
        kind="owner"
        onRowClick={(row) => openDetail('owner', row)}
      />
      <Section
        title="Müşteri Talepleri"
        icon={UserRound}
        rows={data.leads}
        kind="lead"
        onRowClick={(row) => openDetail('lead', row)}
      />
      <Section
        title="Değerleme Başvuruları"
        icon={UserRound}
        rows={data.valuations}
        kind="valuation"
        onRowClick={(row) => openDetail('valuation', row)}
      />

      <CrmContactDetailModal
        open={modal.open}
        kind={modal.kind}
        row={modal.row}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        onSaved={loadCrm}
        onOpenContract={
          onOpenContract
            ? (id) => {
                onOpenContract(id)
                setModal((m) => ({ ...m, open: false }))
              }
            : undefined
        }
      />
    </div>
  )
}

function Section({
  title,
  icon: Icon,
  rows,
  kind,
  onRowClick,
}: {
  title: string
  icon: typeof Building2
  rows: CrmRow[]
  kind: 'owner' | 'lead' | 'valuation' | 'contract'
  onRowClick: (row: CrmRow) => void
}) {
  const columns =
    kind === 'owner'
      ? ['Ad Soyad', 'Telefon', 'E-posta', 'Portföy', 'Durum', 'Not', 'Tarih', 'İşlem']
      : kind === 'contract'
        ? ['Ad Soyad', 'Telefon', 'E-posta', 'Sözleşme', 'Rol', 'İmza', 'Tarih', 'İşlem']
        : ['Ad Soyad', 'Telefon', 'E-posta', 'Kaynak', 'Bölge', 'Durum', 'Tarih', 'İşlem']

  return (
    <section className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5 text-gold-500" />
        <h4 className="font-display text-lg font-bold text-navy-950">{title}</h4>
        <span className="text-xs bg-navy-50 text-navy-600 px-2 py-0.5 rounded-full">{rows.length}</span>
      </div>
      {rows.length === 0 ? (
        <div className="text-sm text-navy-500 border border-dashed border-navy-200 rounded-lg p-5 text-center">
          Kayıt bulunamadı.
        </div>
      ) : (
        <div className="overflow-x-auto border border-navy-100 rounded-xl">
          <table className="min-w-[920px] w-full text-sm">
            <thead className="bg-navy-50 text-navy-700">
              <tr>
                {columns.map((c) => (
                  <th key={c} className="text-left px-3 py-2 font-semibold whitespace-nowrap">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100 bg-white">
              {rows.map((row) => {
                const name =
                  kind === 'owner' ? String(row.owner_name || '') : String(row.name || '')
                const phone = kind === 'owner' ? String(row.owner_phone || '') : String(row.phone || '')
                const email = kind === 'owner' ? String(row.owner_email || '') : String(row.email || '')
                const source =
                  kind === 'owner'
                    ? `${String(row.reference_no || '')} ${String(row.title_tr || '')}`.trim()
                    : kind === 'lead'
                      ? [row.intent, row.category].filter(Boolean).join(' / ')
                      : kind === 'contract'
                        ? [String(row.contract_title || ''), contractTypeTr(String(row.contract_type || ''))]
                            .filter(Boolean)
                            .join(' · ')
                        : `Değerleme / ${String(row.property_type || '-')}`
                const roleCell = kind === 'contract' ? roleTr(String(row.role || '')) : null
                const signCell = kind === 'contract' ? signStatusTr(String(row.sign_status || '')) : null
                return (
                  <tr key={`${kind}-${row.id}-${kind === 'contract' ? row.session_id : ''}`} className="hover:bg-gold-50/40">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onRowClick(row)}
                        className="font-semibold text-navy-950 text-left hover:text-gold-800 underline decoration-gold-300 decoration-1 underline-offset-2"
                      >
                        {name || 'İsimsiz kayıt'}
                      </button>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {phone ? (
                        <a
                          href={`tel:${phone}`}
                          className="inline-flex items-center gap-1 text-navy-700 hover:text-gold-700"
                        >
                          <Phone className="w-3 h-3 text-gold-500" /> {phone}
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {email ? (
                        <a
                          href={`mailto:${email}`}
                          className="inline-flex items-center gap-1 text-navy-700 hover:text-gold-700"
                        >
                          <Mail className="w-3 h-3 text-gold-500" /> {email}
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-3 py-2 text-navy-700 max-w-[260px] truncate" title={source}>
                      {source || '-'}
                    </td>
                    {kind === 'owner' ? (
                      <td className="px-3 py-2 uppercase text-xs font-semibold text-navy-600 whitespace-nowrap">
                        {String(row.status || '-')}
                      </td>
                    ) : kind === 'contract' ? (
                      <td className="px-3 py-2 text-navy-700 whitespace-nowrap text-xs">{roleCell || '-'}</td>
                    ) : (
                      <td className="px-3 py-2 text-navy-700 whitespace-nowrap">{String(row.district || '-')}</td>
                    )}
                    {kind === 'owner' ? (
                      <td className="px-3 py-2 text-navy-600 max-w-[260px] truncate" title={String(row.owner_notes || '')}>
                        {String(row.owner_notes || '-')}
                      </td>
                    ) : kind === 'contract' ? (
                      <td className="px-3 py-2 uppercase text-xs font-semibold text-navy-600 whitespace-nowrap">
                        {signCell || '-'}
                      </td>
                    ) : (
                      <td className="px-3 py-2 uppercase text-xs font-semibold text-navy-600 whitespace-nowrap">
                        {String(row.status || '-')}
                      </td>
                    )}
                    <td className="px-3 py-2 text-navy-500 whitespace-nowrap">
                      {row.created_at ? new Date(String(row.created_at)).toLocaleDateString('tr-TR') : '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {phone && (
                          <a
                            href={`tel:${phone}`}
                            className="text-xs px-2 py-1 rounded bg-gold-100 text-gold-800 font-semibold"
                          >
                            Ara
                          </a>
                        )}
                        {email && (
                          <a
                            href={`mailto:${email}`}
                            className="text-xs px-2 py-1 rounded bg-navy-100 text-navy-700 font-semibold"
                          >
                            Mail
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => onRowClick(row)}
                          className="text-xs px-2 py-1 rounded border border-navy-200 text-navy-800 font-semibold"
                        >
                          Detay
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function signStatusTr(s: string) {
  if (s === 'imzalandi') return 'İmzalandı'
  if (s === 'bekliyor') return 'Bekliyor'
  if (s === 'iptal') return 'İptal'
  return s || '—'
}

function roleTr(role: string) {
  const m: Record<string, string> = {
    'kiraya-veren': 'Kiraya veren',
    kefil: 'Kefil',
    kiraci: 'Kiracı',
    satici: 'Satıcı',
    alici: 'Alıcı',
    komisyoncu: 'Komisyoncu',
    'mal-sahibi': 'Mal sahibi',
    'yer-goren': 'Yer gören',
  }
  return m[role] || role || '—'
}

function contractTypeTr(t: string) {
  const m: Record<string, string> = {
    kira: 'Kira',
    yetki: 'Yetki',
    'alim-satim': 'Satış',
    'yer-gosterme': 'Yer gösterme',
  }
  return m[t] || t
}
