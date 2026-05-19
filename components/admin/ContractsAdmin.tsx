'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Building2,
  Copy,
  Eye,
  FileText,
  Handshake,
  Key,
  Link2,
  Loader2,
  MapPin,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import {
  CONTRACT_TYPES,
  EMPTY_CONTRACT_FORM,
  contractTitle,
  defaultSignerRoleForType,
  renderContractHtml,
  type ContractFormState,
  type ContractType,
  type SignerKey,
} from '@/lib/contracts'
import { SITE_CONFIG } from '@/lib/config'
import { getAdminKey } from './AdminLogin'

// =============================================================================
// Tipler / sabitler
// =============================================================================

type ContractListItem = {
  id: number
  contractType: ContractType
  title: string | null
  status: 'taslak' | 'aktif' | 'tamamlandi' | 'iptal'
  createdAt: string
  updatedAt: string
  formSnapshot: ContractFormState
  sessionsCount: number
  signedCount: number
  pendingCount: number
}

type SessionItem = {
  id: number
  contractId: number | null
  role: SignerKey | null
  token: string
  status: 'bekliyor' | 'imzalandi' | 'iptal'
  signerName: string | null
  signerTc: string | null
  signerEmail: string | null
  signerPhone: string | null
  signerAcceptedTerms: boolean | null
  signerIp: string | null
  signerUserAgent: string | null
  signatureDataUrl: string | null
  signedAt: string | null
  createdAt: string
}

type ContractDetail = {
  id: number
  contractType: ContractType
  title: string | null
  formSnapshot: ContractFormState
  renderedText: string
  status: ContractListItem['status']
  createdAt: string
  updatedAt: string
  sessions: SessionItem[]
}

const CONTRACT_TYPE_META: Record<
  ContractType,
  { label: string; short: string; description: string; Icon: typeof Building2 }
> = {
  kira: {
    label: 'Kira Sözleşmesi',
    short: 'Kira',
    description: 'Kiraya veren ile kiracı arasındaki standart kira akdi.',
    Icon: Key,
  },
  yetki: {
    label: 'Yetki Sözleşmesi',
    short: 'Yetki',
    description: 'Mal sahibi tarafından ofise verilen satış / kiralama yetkisi.',
    Icon: FileText,
  },
  'alim-satim': {
    label: 'Gayrimenkul Satış Sözleşmesi',
    short: 'Satış',
    description: 'Alıcı, satıcı ve komisyoncu arasında gayrimenkul satış sözleşmesi.',
    Icon: Handshake,
  },
  'yer-gosterme': {
    label: 'Yer Gösterme',
    short: 'Yer Gösterme',
    description: 'Gezdirilen taşınmazlar için kayıt + komisyon koşulları.',
    Icon: MapPin,
  },
}

const STATUS_META: Record<ContractListItem['status'], { text: string; cls: string }> = {
  taslak: { text: 'Taslak', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  aktif: { text: 'Aktif', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  tamamlandi: { text: 'Tamamlandı', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  iptal: { text: 'İptal', cls: 'bg-red-100 text-red-800 border-red-200' },
}

const SESSION_STATUS_META: Record<SessionItem['status'], { text: string; cls: string }> = {
  bekliyor: { text: 'Bekliyor', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  imzalandi: { text: 'İmzalandı', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  iptal: { text: 'İptal', cls: 'bg-red-100 text-red-800 border-red-200' },
}

const ROLE_OPTIONS_BY_TYPE: Record<ContractType, { value: SignerKey; label: string }[]> = {
  kira: [
    { value: 'kiraya-veren', label: 'Kiraya Veren' },
    { value: 'kiraci', label: 'Kiracı' },
    { value: 'kefil', label: 'Kefil' },
  ],
  yetki: [
    { value: 'mal-sahibi', label: 'Mal Sahibi' },
    { value: 'komisyoncu', label: 'Emlak Komisyoncusu' },
  ],
  'alim-satim': [
    { value: 'satici', label: 'Satıcı' },
    { value: 'alici', label: 'Alıcı' },
    { value: 'komisyoncu', label: 'Emlak Komisyoncusu' },
  ],
  'yer-gosterme': [
    { value: 'yer-goren', label: 'Taşınmazı Gezen / Gören' },
    { value: 'komisyoncu', label: 'Emlak Komisyoncusu' },
  ],
}

const ROLE_LABEL: Record<string, string> = {
  'kiraya-veren': 'Kiraya Veren',
  kefil: 'Kefil',
  kiraci: 'Kiracı',
  satici: 'Satıcı',
  alici: 'Alıcı',
  komisyoncu: 'Emlak Komisyoncusu',
  'mal-sahibi': 'Mal Sahibi',
  'yer-goren': 'Taşınmazı Gezen',
}

// =============================================================================
// Yardımcılar
// =============================================================================

function printHtml(html: string) {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.style.visibility = 'hidden'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) {
    iframe.remove()
    return
  }
  doc.open()
  doc.write(html)
  doc.close()

  const cleanup = () => {
    setTimeout(() => {
      try {
        iframe.parentNode?.removeChild(iframe)
      } catch {
        /* noop */
      }
    }, 1500)
  }

  const onLoad = () => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch {
      /* noop */
    } finally {
      cleanup()
    }
  }

  if (iframe.contentWindow?.document.readyState === 'complete') {
    setTimeout(onLoad, 200)
  } else {
    iframe.addEventListener('load', onLoad)
  }
}

function buildSignaturesArray(detail: ContractDetail) {
  return detail.sessions
    .filter((s) => s.status === 'imzalandi' && s.signatureDataUrl && s.role)
    .map((s) => ({
      role: s.role as SignerKey,
      dataUrl: s.signatureDataUrl!,
      signedName: s.signerName,
      signedAt: s.signedAt,
    }))
}

// =============================================================================
// Ana bileşen
// =============================================================================

type View =
  | { kind: 'hub' }
  | { kind: 'editor'; contractType: ContractType; contractId?: number }
  | { kind: 'detail'; contractId: number }

export default function ContractsAdmin({
  openDetailContractId,
  onConsumedOpenDetail,
  onCreatedSale,
}: {
  openDetailContractId?: number | null
  onConsumedOpenDetail?: () => void
  onCreatedSale?: (contractId: number) => void
} = {}) {
  const [view, setView] = useState<View>({ kind: 'hub' })
  const [contracts, setContracts] = useState<ContractListItem[]>([])
  const [listLoading, setListLoading] = useState(true)

  const adminKey = (typeof window !== 'undefined' ? getAdminKey() : '') || ''

  useEffect(() => {
    if (openDetailContractId != null && openDetailContractId > 0) {
      setView({ kind: 'detail', contractId: openDetailContractId })
      onConsumedOpenDetail?.()
    }
  }, [openDetailContractId, onConsumedOpenDetail])

  const loadContracts = useCallback(async () => {
    const key = getAdminKey()
    if (!key) return
    setListLoading(true)
    try {
      const res = await fetch('/api/admin/contracts/', { headers: { 'x-admin-key': key } })
      const data = await res.json()
      setContracts((data.contracts || []) as ContractListItem[])
    } catch {
      setContracts([])
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => {
    loadContracts()
  }, [loadContracts])

  return (
    <div className="space-y-6">
      {view.kind === 'hub' && (
        <ContractsHub
          contracts={contracts}
          loading={listLoading}
          onSelectType={(type) => setView({ kind: 'editor', contractType: type })}
          onOpenDetail={(id) => setView({ kind: 'detail', contractId: id })}
          onReload={loadContracts}
        />
      )}
      {view.kind === 'editor' && (
        <ContractEditor
          contractType={view.contractType}
          contractId={view.contractId}
          adminKey={adminKey}
          onBack={() => setView({ kind: 'hub' })}
          onSaved={async (newId) => {
            await loadContracts()
            setView({ kind: 'detail', contractId: newId })
          }}
        />
      )}
      {view.kind === 'detail' && (
        <ContractDetailView
          contractId={view.contractId}
          adminKey={adminKey}
          onBack={async () => {
            await loadContracts()
            setView({ kind: 'hub' })
          }}
          onCreatedSale={onCreatedSale}
        />
      )}
    </div>
  )
}

// =============================================================================
// Hub: tür kutucukları + sözleşme listeleri
// =============================================================================

function ContractsHub({
  contracts,
  loading,
  onSelectType,
  onOpenDetail,
  onReload,
}: {
  contracts: ContractListItem[]
  loading: boolean
  onSelectType: (t: ContractType) => void
  onOpenDetail: (id: number) => void
  onReload: () => void
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ContractListItem['status']>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | ContractType>('all')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return contracts.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      if (typeFilter !== 'all' && c.contractType !== typeFilter) return false
      if (!q) return true
      const f = c.formSnapshot || ({} as ContractFormState)
      const blob = [
        c.title || '',
        f.ownerName || '',
        f.customerName || '',
        f.propertyAddress || '',
        f.mahalle || '',
        c.contractType,
      ]
        .join(' ')
        .toLowerCase()
      return blob.includes(q)
    })
  }, [contracts, search, statusFilter, typeFilter])

  return (
    <>
      <div className="card p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-display text-xl font-bold text-navy-950 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gold-500" />
              Sözleşmeler
            </h3>
            <p className="text-sm text-navy-600 mt-1">
              Aşağıdan bir sözleşme türü seçerek yeni belge oluşturabilirsiniz. Hazırlanan her
              sözleşme altında ilgili tarafların imza oturumlarını yönetebilirsiniz.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CONTRACT_TYPES.map((t) => {
          const meta = CONTRACT_TYPE_META[t.id]
          const count = contracts.filter((c) => c.contractType === t.id).length
          const Icon = meta.Icon
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectType(t.id)}
              className="group relative text-left card p-5 hover:shadow-lg hover:-translate-y-0.5 transition border-2 border-transparent hover:border-gold-300"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-gold-gradient text-navy-950 flex items-center justify-center shadow-gold">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10.5px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-navy-50 text-navy-700">
                  {count} kayıt
                </span>
              </div>
              <h4 className="font-display text-base font-bold text-navy-950 mt-3">
                {meta.label}
              </h4>
              <p className="text-xs text-navy-500 mt-1">{meta.description}</p>
              <div className="text-xs text-gold-700 font-semibold mt-3 inline-flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />
                Yeni {meta.short.toLowerCase()} oluştur
              </div>
            </button>
          )
        })}
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h4 className="font-display text-lg font-bold text-navy-950">
              Daha önce oluşturulan sözleşmeler
            </h4>
            <p className="text-xs text-navy-500 mt-1">
              Her sözleşme altında ilgili imza oturumlarını detayda görebilir, yeni imza linki
              ekleyebilir veya yazdırabilirsiniz.
            </p>
          </div>
          <button
            type="button"
            onClick={onReload}
            className="text-xs px-3 py-1.5 rounded-lg border border-navy-200 hover:bg-navy-50"
          >
            Yenile
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2">
          <label className="relative block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
            <input
              className="input pl-9 text-sm"
              placeholder="Başlık, taraf, adres ara…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            className="input text-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          >
            <option value="all">Tüm türler</option>
            {CONTRACT_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {CONTRACT_TYPE_META[t.id].short}
              </option>
            ))}
          </select>
          <select
            className="input text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          >
            <option value="all">Tüm durumlar</option>
            <option value="taslak">Taslak</option>
            <option value="aktif">Aktif</option>
            <option value="tamamlandi">Tamamlandı</option>
            <option value="iptal">İptal</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-gold-500" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-navy-500 text-center py-8">
            Henüz sözleşme yok. Yukarıdan tür seçerek yeni bir tane oluşturabilirsiniz.
          </p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((c) => {
              const statusBadge = STATUS_META[c.status]
              const meta = CONTRACT_TYPE_META[c.contractType]
              const Icon = meta.Icon
              const partyName = c.formSnapshot?.customerName || c.formSnapshot?.ownerName || '—'
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onOpenDetail(c.id)}
                    className="w-full text-left border border-navy-100 rounded-xl p-3 md:p-4 hover:border-gold-300 hover:bg-gold-50/30 transition flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10.5px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-navy-50 text-navy-700 border border-navy-200">
                          {meta.short}
                        </span>
                        <span
                          className={`text-[10.5px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${statusBadge.cls}`}
                        >
                          {statusBadge.text}
                        </span>
                        <span className="text-xs text-navy-500">#{c.id}</span>
                      </div>
                      <div className="font-semibold text-navy-950 text-sm md:text-base mt-1 truncate">
                        {c.title || partyName}
                      </div>
                      <div className="text-xs text-navy-500 mt-0.5 truncate">
                        {c.formSnapshot?.propertyAddress || '—'}
                      </div>
                    </div>
                    <div className="hidden md:flex flex-col items-end gap-1 text-xs">
                      <span className="text-navy-500">
                        {new Date(c.createdAt).toLocaleDateString('tr-TR')}
                      </span>
                      <span className="text-navy-700 font-medium">
                        {c.signedCount}/{c.sessionsCount} imza
                      </span>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </>
  )
}

// =============================================================================
// Editör: yeni / mevcut sözleşmeyi düzenle
// =============================================================================

function ContractEditor({
  contractType,
  contractId,
  adminKey,
  onBack,
  onSaved,
}: {
  contractType: ContractType
  contractId?: number
  adminKey: string
  onBack: () => void
  onSaved: (id: number) => Promise<void> | void
}) {
  const [form, setForm] = useState<ContractFormState>({
    ...EMPTY_CONTRACT_FORM,
    contractType,
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // Mevcut sözleşmeyi yükle
  useEffect(() => {
    if (!contractId || !adminKey) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/contracts/${contractId}/`, {
          headers: { 'x-admin-key': adminKey },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Yüklenemedi')
        if (!cancelled) setForm(data.contract.formSnapshot as ContractFormState)
      } catch (e) {
        if (!cancelled) setErr((e as Error).message)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [contractId, adminKey])

  const update = <K extends keyof ContractFormState>(key: K, val: ContractFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }))
  }
  const reset = () => setForm({ ...EMPTY_CONTRACT_FORM, contractType })

  const previewHtml = useMemo(() => renderContractHtml(form), [form])
  const meta = CONTRACT_TYPE_META[contractType]

  const printContract = () => printHtml(renderContractHtml(form, { standalone: true }))

  const saveContract = async () => {
    setSaving(true)
    setErr(null)
    try {
      let id = contractId
      if (id) {
        const res = await fetch(`/api/admin/contracts/${id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
          body: JSON.stringify({ form }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Güncellenemedi')
      } else {
        const res = await fetch('/api/admin/contracts/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
          body: JSON.stringify({ form }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Oluşturulamadı')
        id = data.contract?.id
      }
      if (id) await onSaved(id)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  // Tür bazlı taraf etiketleri
  const ownerBlockLabel: Record<ContractType, string | null> = {
    kira: 'Kiraya Veren',
    yetki: 'Mal Sahibi',
    'alim-satim': 'Satıcı',
    'yer-gosterme': null, // mal sahibi gerekmez
  }
  const customerBlockLabel: Record<ContractType, string | null> = {
    kira: 'Kiracı',
    yetki: null, // ikinci taraf yok
    'alim-satim': 'Alıcı',
    'yer-gosterme': 'Yer Gören / Müşteri',
  }
  const showAdaParsel = contractType === 'yetki' || contractType === 'alim-satim'
  const showMahalleSokak = contractType === 'kira'

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm text-navy-700 hover:text-navy-950 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Sözleşmeler
        </button>
        <h3 className="font-display text-xl font-bold text-navy-950">
          {contractId ? 'Sözleşmeyi düzenle' : 'Yeni'} · {meta.label}
        </h3>
        <div />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="space-y-4">
          <section className="card p-5 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <SmallField label="Yetkili mahkeme (ihtilâf)">
                <input
                  className="input text-sm"
                  value={form.competentCourt}
                  onChange={(e) => update('competentCourt', e.target.value)}
                />
              </SmallField>
              <SmallField label="Yetki belgesi / Oda sicil no">
                <input
                  className="input text-sm"
                  value={form.brokerageLicenseNo}
                  onChange={(e) => update('brokerageLicenseNo', e.target.value)}
                />
              </SmallField>
              <SmallField label="Sözleşme / işlem tarihi">
                <input
                  type="date"
                  className="input text-sm"
                  value={form.contractDate}
                  onChange={(e) => update('contractDate', e.target.value)}
                />
              </SmallField>
            </div>
          </section>

          {ownerBlockLabel[contractType] && (
            <section className="card p-5 space-y-3">
              <h4 className="font-semibold text-navy-950 text-sm">
                {ownerBlockLabel[contractType]}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SmallField label="Ad Soyad / Ünvan">
                  <input
                    className="input text-sm"
                    value={form.ownerName}
                    onChange={(e) => update('ownerName', e.target.value)}
                  />
                </SmallField>
                <SmallField label="T.C. / Vergi No">
                  <input
                    className="input text-sm"
                    value={form.ownerTc}
                    onChange={(e) => update('ownerTc', e.target.value)}
                  />
                </SmallField>
                <SmallField label="Telefon">
                  <input
                    className="input text-sm"
                    value={form.ownerPhone}
                    onChange={(e) => update('ownerPhone', e.target.value)}
                  />
                </SmallField>
                <SmallField label="İkamet / Ev adresi">
                  <input
                    className="input text-sm"
                    value={form.ownerHomeAddress}
                    onChange={(e) => update('ownerHomeAddress', e.target.value)}
                  />
                </SmallField>
                {(contractType === 'yetki' || contractType === 'alim-satim') && (
                  <SmallField label="İş adresi" className="md:col-span-2">
                    <input
                      className="input text-sm"
                      value={form.ownerWorkAddress}
                      onChange={(e) => update('ownerWorkAddress', e.target.value)}
                    />
                  </SmallField>
                )}
              </div>
            </section>
          )}

          {customerBlockLabel[contractType] && (
            <section className="card p-5 space-y-3">
              <h4 className="font-semibold text-navy-950 text-sm">
                {customerBlockLabel[contractType]}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SmallField label="Ad Soyad">
                  <input
                    className="input text-sm"
                    value={form.customerName}
                    onChange={(e) => update('customerName', e.target.value)}
                  />
                </SmallField>
                <SmallField label="T.C. Kimlik No">
                  <input
                    className="input text-sm"
                    value={form.customerTc}
                    onChange={(e) => update('customerTc', e.target.value)}
                  />
                </SmallField>
                <SmallField label="Telefon">
                  <input
                    className="input text-sm"
                    value={form.customerPhone}
                    onChange={(e) => update('customerPhone', e.target.value)}
                  />
                </SmallField>
                <SmallField label="İkamet / Ev adresi">
                  <input
                    className="input text-sm"
                    value={form.customerHomeAddress}
                    onChange={(e) => update('customerHomeAddress', e.target.value)}
                  />
                </SmallField>
                {contractType !== 'yer-gosterme' && (
                  <SmallField label="İş adresi" className="md:col-span-2">
                    <input
                      className="input text-sm"
                      value={form.customerWorkAddress}
                      onChange={(e) => update('customerWorkAddress', e.target.value)}
                    />
                  </SmallField>
                )}
              </div>
            </section>
          )}

          <section className="card p-5 space-y-3">
            <h4 className="font-semibold text-navy-950 text-sm">Gayrimenkul</h4>
            <SmallField label="Tam adres">
              <input
                className="input text-sm"
                value={form.propertyAddress}
                onChange={(e) => update('propertyAddress', e.target.value)}
              />
            </SmallField>
            {contractType !== 'alim-satim' && (
              <SmallField label="Cinsi / özet (tapu niteliği, m², oda vb.)">
                <textarea
                  className="input text-sm min-h-[72px]"
                  value={form.propertyInfo}
                  onChange={(e) => update('propertyInfo', e.target.value)}
                />
              </SmallField>
            )}
            {(showMahalleSokak || showAdaParsel) && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {showMahalleSokak && (
                  <>
                    <SmallField label="Mahalle">
                      <input
                        className="input text-sm"
                        value={form.mahalle}
                        onChange={(e) => update('mahalle', e.target.value)}
                      />
                    </SmallField>
                    <SmallField label="Sokak ve no">
                      <input
                        className="input text-sm"
                        value={form.sokakVeNo}
                        onChange={(e) => update('sokakVeNo', e.target.value)}
                      />
                    </SmallField>
                    <SmallField label="Daire / blok">
                      <input
                        className="input text-sm"
                        value={form.daireBlok}
                        onChange={(e) => update('daireBlok', e.target.value)}
                      />
                    </SmallField>
                    <SmallField label="Kiralananın cinsi">
                      <input
                        className="input text-sm"
                        value={form.kiralananCinsi}
                        onChange={(e) => update('kiralananCinsi', e.target.value)}
                      />
                    </SmallField>
                  </>
                )}
                {showAdaParsel && (
                  <>
                    <SmallField label="Ada">
                      <input
                        className="input text-sm"
                        value={form.adaNo}
                        onChange={(e) => update('adaNo', e.target.value)}
                      />
                    </SmallField>
                    <SmallField label="Pafta">
                      <input
                        className="input text-sm"
                        value={form.paftaNo}
                        onChange={(e) => update('paftaNo', e.target.value)}
                      />
                    </SmallField>
                    <SmallField label="Parsel">
                      <input
                        className="input text-sm"
                        value={form.parselNo}
                        onChange={(e) => update('parselNo', e.target.value)}
                      />
                    </SmallField>
                  </>
                )}
              </div>
            )}
          </section>

          {contractType === 'kira' && (
            <section className="card p-5 space-y-3 border-gold-200 bg-gold-50/30">
              <h4 className="font-semibold text-navy-950 text-sm">Kira ek alanları</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SmallField label="Demirbaş beyanı">
                  <textarea
                    className="input text-sm min-h-[56px]"
                    value={form.demirbasBeyani}
                    onChange={(e) => update('demirbasBeyani', e.target.value)}
                  />
                </SmallField>
                <SmallField label="Kiralananın şimdiki durumu">
                  <textarea
                    className="input text-sm min-h-[56px]"
                    value={form.kiralananDurumu}
                    onChange={(e) => update('kiralananDurumu', e.target.value)}
                  />
                </SmallField>
                <SmallField label="Kullanım amacı">
                  <input
                    className="input text-sm"
                    value={form.kullanimAmaci}
                    onChange={(e) => update('kullanimAmaci', e.target.value)}
                  />
                </SmallField>
                <SmallField label="Kira süresi (yıl)">
                  <input
                    className="input text-sm"
                    value={form.kiraYili}
                    onChange={(e) => update('kiraYili', e.target.value)}
                  />
                </SmallField>
                <SmallField label="Kira başlangıç">
                  <input
                    type="date"
                    className="input text-sm"
                    value={form.leaseStartDate}
                    onChange={(e) => update('leaseStartDate', e.target.value)}
                  />
                </SmallField>
                <SmallField label="Kira bitiş (varsa)">
                  <input
                    type="date"
                    className="input text-sm"
                    value={form.leaseEndDate}
                    onChange={(e) => update('leaseEndDate', e.target.value)}
                  />
                </SmallField>
                <SmallField label="Ödeme şekli">
                  <input
                    className="input text-sm"
                    value={form.paymentMethod}
                    onChange={(e) => update('paymentMethod', e.target.value)}
                  />
                </SmallField>
                <SmallField label="Ayın kaçına kadar ödeme">
                  <input
                    className="input text-sm"
                    value={form.paymentDayOfMonth}
                    onChange={(e) => update('paymentDayOfMonth', e.target.value)}
                  />
                </SmallField>
                <SmallField label="Aylık kira">
                  <input
                    className="input text-sm"
                    value={form.monthlyRent}
                    onChange={(e) => update('monthlyRent', e.target.value)}
                  />
                </SmallField>
                <SmallField label="Yıllık kira">
                  <input
                    className="input text-sm"
                    value={form.yearlyRent}
                    onChange={(e) => update('yearlyRent', e.target.value)}
                  />
                </SmallField>
                <SmallField label="Peşinat">
                  <input
                    className="input text-sm"
                    value={form.advanceLandlord}
                    onChange={(e) => update('advanceLandlord', e.target.value)}
                  />
                </SmallField>
                <SmallField label="Depozito">
                  <input
                    className="input text-sm"
                    value={form.depositAmount}
                    onChange={(e) => update('depositAmount', e.target.value)}
                  />
                </SmallField>
                <SmallField label="Artış oranı %">
                  <input
                    className="input text-sm"
                    value={form.rentIncreasePercent}
                    onChange={(e) => update('rentIncreasePercent', e.target.value)}
                  />
                </SmallField>
                <SmallField label="Madde sayısı">
                  <input
                    className="input text-sm"
                    value={form.contractArticleCount}
                    onChange={(e) => update('contractArticleCount', e.target.value)}
                  />
                </SmallField>
                <SmallField label="Nüsha sayısı">
                  <input
                    className="input text-sm"
                    value={form.contractCopyCount}
                    onChange={(e) => update('contractCopyCount', e.target.value)}
                  />
                </SmallField>
                <SmallField label="Kefil adı">
                  <input
                    className="input text-sm"
                    value={form.kefilName}
                    onChange={(e) => update('kefilName', e.target.value)}
                  />
                </SmallField>
              </div>
            </section>
          )}

          {contractType === 'yetki' && (
            <section className="card p-5 space-y-3 border-gold-200 bg-gold-50/30">
              <h4 className="font-semibold text-navy-950 text-sm">Yetki sözleşmesi alanları</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SmallField label="Yetki konusu">
                  <input
                    className="input text-sm"
                    value={form.purposeSaleRent}
                    onChange={(e) => update('purposeSaleRent', e.target.value)}
                  />
                </SmallField>
                <SmallField label="Doğrudan işlem cezası / komisyon">
                  <input
                    className="input text-sm"
                    value={form.directDealPenalty}
                    onChange={(e) => update('directDealPenalty', e.target.value)}
                  />
                </SmallField>
                <SmallField label="Vazgeçme cezası TL">
                  <input
                    className="input text-sm"
                    value={form.withdrawalPenaltyAmount}
                    onChange={(e) => update('withdrawalPenaltyAmount', e.target.value)}
                  />
                </SmallField>
                <SmallField label="Yetki başlangıç">
                  <input
                    type="date"
                    className="input text-sm"
                    value={form.authorityStartDate}
                    onChange={(e) => update('authorityStartDate', e.target.value)}
                  />
                </SmallField>
                <SmallField label="Yetki bitiş">
                  <input
                    type="date"
                    className="input text-sm"
                    value={form.authorityEndDate}
                    onChange={(e) => update('authorityEndDate', e.target.value)}
                  />
                </SmallField>
                <SmallField label="Süre açıklaması">
                  <input
                    className="input text-sm"
                    value={form.authorityYears}
                    onChange={(e) => update('authorityYears', e.target.value)}
                    placeholder="Örn: 1 yıl"
                  />
                </SmallField>
                <SmallField label="Nüsha adedi">
                  <input
                    className="input text-sm"
                    value={form.authorityCopies}
                    onChange={(e) => update('authorityCopies', e.target.value)}
                  />
                </SmallField>
                <SmallField label="Asgari talep fiyatı">
                  <input
                    className="input text-sm"
                    value={form.minAskPrice}
                    onChange={(e) => update('minAskPrice', e.target.value)}
                  />
                </SmallField>
                <SmallField label="Azami talep fiyatı">
                  <input
                    className="input text-sm"
                    value={form.maxAskPrice}
                    onChange={(e) => update('maxAskPrice', e.target.value)}
                  />
                </SmallField>
              </div>
            </section>
          )}

          {contractType === 'alim-satim' && (
            <section className="card p-5 space-y-3 border-gold-200 bg-gold-50/30">
              <h4 className="font-semibold text-navy-950 text-sm">Gayrimenkul satış alanları</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SmallField label="Cinsi" className="md:col-span-2">
                  <input
                    className="input text-sm"
                    value={form.propertyInfo}
                    onChange={(e) => update('propertyInfo', e.target.value)}
                    placeholder="Örn: Arsa, tarla, daire, müstakil ev"
                  />
                </SmallField>
                <SmallField label="Satış bedeli">
                  <input
                    className="input text-sm"
                    value={form.salePrice}
                    onChange={(e) => update('salePrice', e.target.value)}
                  />
                </SmallField>
                <SmallField label="Kapora">
                  <input
                    className="input text-sm"
                    value={form.buyerAdvanceToSeller}
                    onChange={(e) => update('buyerAdvanceToSeller', e.target.value)}
                  />
                </SmallField>
                <SmallField label="Satıcı komisyon %">
                  <input
                    className="input text-sm"
                    value={form.commissionSellerPct}
                    onChange={(e) => update('commissionSellerPct', e.target.value)}
                  />
                </SmallField>
                <SmallField label="Alıcı komisyon %">
                  <input
                    className="input text-sm"
                    value={form.commissionBuyerPct}
                    onChange={(e) => update('commissionBuyerPct', e.target.value)}
                  />
                </SmallField>
              </div>
            </section>
          )}

          {contractType === 'yer-gosterme' && (
            <section className="card p-5 space-y-3 border-gold-200 bg-gold-50/30">
              <h4 className="font-semibold text-navy-950 text-sm">Yer gösterme alanları</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SmallField label="Komisyon % (satış)">
                  <input
                    className="input text-sm"
                    value={form.commissionPctSale}
                    onChange={(e) => update('commissionPctSale', e.target.value)}
                  />
                </SmallField>
                <SmallField label="1 aylık kira bedeli karşılığı">
                  <input
                    className="input text-sm"
                    value={form.commissionRentEquivalent}
                    onChange={(e) => update('commissionRentEquivalent', e.target.value)}
                  />
                </SmallField>
                <SmallField label="Nüsha">
                  <input
                    className="input text-sm"
                    value={form.yerGostermeCopies}
                    onChange={(e) => update('yerGostermeCopies', e.target.value)}
                  />
                </SmallField>
                <SmallField
                  label="Görülen taşınmazlar (adres / fiyat liste)"
                  className="md:col-span-2"
                >
                  <textarea
                    className="input text-sm min-h-[100px]"
                    value={form.shownPropertiesList}
                    onChange={(e) => update('shownPropertiesList', e.target.value)}
                    placeholder={`1) ... adres ... — ... TL\n2) ...`}
                  />
                </SmallField>
              </div>
            </section>
          )}

          <section className="card p-5 space-y-3">
            <SmallField label="Özel şartlar / Hususi şartlar">
              <textarea
                className="input text-sm min-h-[100px]"
                value={form.specialTerms}
                onChange={(e) => update('specialTerms', e.target.value)}
              />
            </SmallField>

            {err && <p className="text-xs text-red-600">{err}</p>}

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={saveContract}
                disabled={saving}
                className="btn-primary inline-flex items-center gap-1 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {contractId ? 'Değişiklikleri kaydet' : 'Sözleşmeyi kaydet'}
              </button>
              <button
                type="button"
                onClick={printContract}
                className="btn-ghost border-2 border-navy-200"
              >
                <Printer className="w-4 h-4" />
                Yazdır / PDF
              </button>
              {!contractId && (
                <button
                  type="button"
                  onClick={reset}
                  className="btn-ghost border-2 border-navy-200"
                >
                  <RotateCcw className="w-4 h-4" />
                  Temizle
                </button>
              )}
            </div>

            <p className="text-[11px] text-navy-500">
              Kaydedildikten sonra detay ekranında imza linkleri ekleyebilir, taraflara
              gönderebilir ve imzalı sözleşmeyi yazdırabilirsiniz.
            </p>
          </section>
        </div>

        <section className="card p-5 flex flex-col min-h-[640px]">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <h4 className="font-display text-lg font-bold text-navy-950">{meta.label}</h4>
            <button
              type="button"
              onClick={printContract}
              className="text-xs px-3 py-2 rounded-xl bg-gold-100 text-gold-800 font-semibold inline-flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              Yazdır
            </button>
          </div>
          <div
            className="flex-1 bg-white border border-navy-100 rounded-xl p-4 overflow-y-auto max-h-[calc(100vh-220px)]"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </section>
      </div>
    </>
  )
}

// =============================================================================
// Detay: sözleşme + imzalar
// =============================================================================

function ContractDetailView({
  contractId,
  adminKey,
  onBack,
  onCreatedSale,
}: {
  contractId: number
  adminKey: string
  onBack: () => void
  onCreatedSale?: (contractId: number) => void
}) {
  const [detail, setDetail] = useState<ContractDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [creatingRole, setCreatingRole] = useState<SignerKey | ''>('')
  const [busyAdd, setBusyAdd] = useState(false)
  const [lastSignUrl, setLastSignUrl] = useState<string | null>(null)
  const [copyOk, setCopyOk] = useState(false)
  const [editing, setEditing] = useState(false)
  const [creatingSale, setCreatingSale] = useState(false)

  const createSaleFromContract = async () => {
    if (!detail) return
    setCreatingSale(true)
    setErr(null)
    try {
      const res = await fetch(`/api/admin/sales-transactions/from-contract/${detail.id}/`, {
        method: 'POST',
        headers: { 'x-admin-key': adminKey },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Oluşturulamadı')
      const reused = data.reused
      alert(
        reused
          ? `Bu sözleşmeye bağlı iş kaydı zaten vardı; İşler sekmesinde gösteriliyor.`
          : `İş kaydı oluşturuldu. İşler sekmesinde fiyatı, komisyonu ve süreci tamamlayabilirsiniz.`
      )
      onCreatedSale?.(detail.id)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setCreatingSale(false)
    }
  }

  const load = useCallback(async () => {
    if (!adminKey) return
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch(`/api/admin/contracts/${contractId}/`, {
        headers: { 'x-admin-key': adminKey },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Yüklenemedi')
      setDetail(data.contract as ContractDetail)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [contractId, adminKey])

  useEffect(() => {
    load()
  }, [load])

  const html = useMemo(() => {
    if (!detail) return ''
    return renderContractHtml(detail.formSnapshot, {
      signatures: buildSignaturesArray(detail),
    })
  }, [detail])

  const print = () => {
    if (!detail) return
    const standalone = renderContractHtml(detail.formSnapshot, {
      standalone: true,
      signatures: buildSignaturesArray(detail),
    })
    printHtml(standalone)
  }

  const roleOptions: { value: SignerKey; label: string }[] = useMemo(() => {
    if (!detail) return []
    return ROLE_OPTIONS_BY_TYPE[detail.contractType] || []
  }, [detail])

  useEffect(() => {
    if (detail && !creatingRole && roleOptions.length > 0) {
      const defaultRole = defaultSignerRoleForType(detail.contractType)
      setCreatingRole(defaultRole)
    }
  }, [detail, creatingRole, roleOptions])

  const addSignSession = async () => {
    if (!detail || !creatingRole) return
    setBusyAdd(true)
    setErr(null)
    setLastSignUrl(null)
    setCopyOk(false)
    try {
      const res = await fetch(`/api/admin/contracts/${detail.id}/sign-sessions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({
          role: creatingRole,
          recipientName:
            creatingRole === 'kiraci' || creatingRole === 'alici' || creatingRole === 'yer-goren'
              ? detail.formSnapshot.customerName
              : detail.formSnapshot.ownerName,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Oluşturulamadı')
      setLastSignUrl(data.signUrlTr || null)
      await load()
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusyAdd(false)
    }
  }

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setLastSignUrl(url)
      setCopyOk(true)
      window.setTimeout(() => setCopyOk(false), 2200)
    } catch {
      setErr('Kopyalanamadı; linki elle seçin.')
    }
  }

  const deleteSession = async (id: number) => {
    if (!confirm('Bu imza oturumu silinsin mi?')) return
    try {
      const res = await fetch(`/api/admin/contracts/sign-session/${id}/`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Silinemedi')
      await load()
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const deleteContract = async () => {
    if (!detail) return
    if (!confirm('Sözleşme tüm imza oturumlarıyla birlikte silinsin mi?')) return
    try {
      const res = await fetch(`/api/admin/contracts/${detail.id}/`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Silinemedi')
      await onBack()
    } catch (e) {
      alert((e as Error).message)
    }
  }

  if (loading && !detail) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-7 h-7 animate-spin text-gold-500" />
      </div>
    )
  }
  if (err && !detail) {
    return (
      <div className="card p-5">
        <p className="text-red-600">{err}</p>
        <button onClick={onBack} className="mt-3 text-sm text-gold-700 underline">
          Geri dön
        </button>
      </div>
    )
  }
  if (!detail) return null

  if (editing) {
    return (
      <ContractEditor
        contractType={detail.contractType}
        contractId={detail.id}
        adminKey={adminKey}
        onBack={() => setEditing(false)}
        onSaved={async () => {
          setEditing(false)
          await load()
        }}
      />
    )
  }

  const statusBadge = STATUS_META[detail.status]

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm text-navy-700 hover:text-navy-950 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Sözleşmeler
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs px-3 py-2 rounded-xl border border-navy-200 hover:bg-navy-50 inline-flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" />
            Düzenle
          </button>
          {detail.contractType === 'alim-satim' && (
            <button
              type="button"
              onClick={createSaleFromContract}
              disabled={creatingSale}
              className="text-xs px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 inline-flex items-center gap-1 font-semibold disabled:opacity-50"
              title="Bu sözleşmeden İşler sekmesine bir satış kaydı oluştur"
            >
              {creatingSale ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Handshake className="w-3.5 h-3.5" />}
              İş kaydı oluştur
            </button>
          )}
          <button
            type="button"
            onClick={print}
            className="btn-primary text-sm py-2 inline-flex items-center gap-1"
          >
            <Printer className="w-4 h-4" />
            Yazdır / PDF
          </button>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h3 className="font-display text-xl font-bold text-navy-950">
              {contractTitle(detail.contractType)}
            </h3>
            <p className="text-sm text-navy-600 mt-0.5 flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10.5px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${statusBadge.cls}`}
              >
                {statusBadge.text}
              </span>
              <span className="text-navy-500 text-xs">#{detail.id}</span>
              <span className="text-navy-500 text-xs">
                Oluşturma: {new Date(detail.createdAt).toLocaleString('tr-TR')}
              </span>
            </p>
            {detail.title && <p className="text-sm text-navy-700 mt-1">{detail.title}</p>}
          </div>
          <button
            type="button"
            onClick={deleteContract}
            className="text-xs inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Sözleşmeyi sil
          </button>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h4 className="font-display text-lg font-bold text-navy-950">İmza süreçleri</h4>
          <span className="text-xs text-navy-500">
            {detail.sessions.filter((s) => s.status === 'imzalandi').length}/
            {detail.sessions.length} imza tamamlandı
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-2 items-end border border-navy-100 bg-navy-50/30 rounded-xl p-3">
          <SmallField label="Yeni imza için taraf">
            <select
              className="input text-sm"
              value={creatingRole}
              onChange={(e) => setCreatingRole(e.target.value as SignerKey)}
            >
              {roleOptions.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </SmallField>
          <div className="text-xs text-navy-600 self-center">
            Yeni link bu tarafın imzalaması için oluşturulur ve gönderilebilir.
          </div>
          <button
            type="button"
            onClick={addSignSession}
            disabled={busyAdd || !creatingRole}
            className="btn-primary text-sm py-2 inline-flex items-center gap-1 disabled:opacity-50"
          >
            {busyAdd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
            İmza linki oluştur
          </button>
        </div>

        {lastSignUrl && (
          <div className="flex items-center gap-2 flex-wrap bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-sm">
            <span className="text-emerald-800 text-xs font-semibold">Son oluşturulan link:</span>
            <input
              readOnly
              value={lastSignUrl}
              className="input text-xs font-mono flex-1 min-w-[200px]"
              onFocus={(e) => e.target.select()}
            />
            <button
              type="button"
              onClick={() => copyLink(lastSignUrl)}
              className="text-xs px-3 py-1.5 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 inline-flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              {copyOk ? 'Kopyalandı' : 'Kopyala'}
            </button>
          </div>
        )}

        {err && <p className="text-xs text-red-600">{err}</p>}

        {detail.sessions.length === 0 ? (
          <p className="text-sm text-navy-500 py-4 text-center">
            Henüz imza oturumu yok. Yukarıdan bir taraf seçip ilk imza linkini oluşturun.
          </p>
        ) : (
          <ul className="space-y-2">
            {detail.sessions.map((s) => {
              const sBadge = SESSION_STATUS_META[s.status]
              const roleLabel = (s.role && ROLE_LABEL[s.role]) || s.role || '—'
              const url = `${SITE_CONFIG.url.replace(/\/$/, '')}/tr/imza/${s.token}/`
              return (
                <li
                  key={s.id}
                  className="border border-navy-100 rounded-xl p-3 md:p-4 hover:bg-navy-50/30"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10.5px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${sBadge.cls}`}
                        >
                          {sBadge.text}
                        </span>
                        <span className="text-xs font-semibold text-navy-700">{roleLabel}</span>
                      </div>
                      <div className="text-sm text-navy-900 mt-1">
                        {s.signerName ? (
                          <>
                            <span className="font-semibold">{s.signerName}</span>
                            {s.signerTc && (
                              <span className="text-navy-500 text-xs ml-2">
                                T.C. {s.signerTc}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-navy-500 italic text-sm">
                            Beklemede — link gönderildiğinde imzalanır.
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-navy-500 mt-1">
                        Link gönderim: {new Date(s.createdAt).toLocaleString('tr-TR')}
                        {s.signedAt && (
                          <>
                            {' · İmza: '}
                            {new Date(s.signedAt).toLocaleString('tr-TR')}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {s.status === 'bekliyor' && (
                        <button
                          type="button"
                          onClick={() => copyLink(url)}
                          className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-gold-300 bg-gold-50 hover:bg-gold-100 text-gold-800 font-semibold"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Linki kopyala
                        </button>
                      )}
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-navy-200 hover:bg-navy-50"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Aç
                      </a>
                      <button
                        type="button"
                        onClick={() => deleteSession(s.id)}
                        className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Sil
                      </button>
                    </div>
                  </div>

                  {s.signatureDataUrl && (
                    <div className="mt-3 flex items-center gap-3 flex-wrap">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={s.signatureDataUrl}
                        alt={`${roleLabel} imzası`}
                        className="max-h-16 border border-navy-200 rounded bg-white p-1"
                      />
                      {s.signerEmail && (
                        <span className="text-xs text-navy-500">{s.signerEmail}</span>
                      )}
                      {s.signerPhone && (
                        <span className="text-xs text-navy-500">{s.signerPhone}</span>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="card p-5 flex flex-col">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <h4 className="font-display text-lg font-bold text-navy-950">
            Sözleşme önizleme (imzalarla birlikte)
          </h4>
          <button
            type="button"
            onClick={print}
            className="text-xs px-3 py-2 rounded-xl bg-gold-100 text-gold-800 font-semibold inline-flex items-center gap-1"
          >
            <Printer className="w-3.5 h-3.5" />
            Yazdır
          </button>
        </div>
        <div
          className="bg-white border border-navy-100 rounded-xl p-4 max-h-[70vh] overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </>
  )
}

// =============================================================================
// Yardımcı form bileşeni
// =============================================================================

function SmallField({
  label,
  children,
  className = '',
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="label text-xs">{label}</span>
      {children}
    </label>
  )
}

// X icon import edildi ama bu dosyada doğrudan kullanılmıyorsa lint için sessizleştir
void X
