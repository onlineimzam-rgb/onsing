import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle, FileCheck, MapPin, Clock, Shield, ScrollText } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface VerifyResponse {
  ok: boolean
  document?: { id: number; sha256: string; sizeBytes: number; createdAt: string }
  contract?: { id: number; title: string | null; templateTitle: string; status: string; createdAt: string }
  tenant?: string | null
  auditChain?: { ok: boolean; brokenAt: number | null; totalEntries: number; relevantEntries: number }
  signatures?: {
    role: string
    roleLabel: string
    status: string
    signerName: string | null
    signerTcMasked: string | null
    signedAt: string | null
    ipMasked: string | null
    userAgent: string | null
    geoApprox: { lat: string; lng: string } | null
    acceptedTerms: boolean
    acceptedKvkk: boolean
  }[]
  events?: {
    id: number
    seq: number
    eventType: string
    entityKind: string
    entityId: number | null
    createdAt: string
    ipMasked: string | null
  }[]
  error?: { code?: string; message?: string }
}

async function fetchVerify(hash: string): Promise<VerifyResponse | null> {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  const res = await fetch(`${base}/api/d/${hash}`, { cache: 'no-store' })
  if (res.status === 404) return { ok: false, error: { code: 'not_found' } }
  if (!res.ok) return null
  return (await res.json()) as VerifyResponse
}

export default async function VerifyPage({ params }: { params: { hash: string } }) {
  const data = await fetchVerify(params.hash)

  if (!data) {
    return (
      <Shell>
        <BadCard title="Bağlantı hatası" message="Sunucu yanıt vermiyor." />
      </Shell>
    )
  }
  if (!data.ok) {
    return (
      <Shell>
        <BadCard
          title="Eşleşen sözleşme bulunamadı"
          message="Bu SHA-256 hash'i veritabanımızda kayıtlı değil. Hash'i doğru kopyaladığınızdan emin olun."
          hash={params.hash}
        />
      </Shell>
    )
  }

  const chainOk = data.auditChain?.ok
  return (
    <Shell>
      <section className={`card border-l-4 ${chainOk ? 'border-emerald-500' : 'border-rose-500'}`}>
        <div className="flex items-start gap-3">
          {chainOk ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
          ) : (
            <XCircle className="w-8 h-8 text-rose-500 shrink-0" />
          )}
          <div>
            <h1 className="font-display text-xl font-bold">
              {chainOk ? 'Sözleşme orijinal' : 'Audit zincirinde tutarsızlık var!'}
            </h1>
            <p className="text-sm text-ink-muted mt-1">
              {data.contract?.templateTitle} · {data.contract?.title || `#${data.contract?.id}`}
            </p>
            <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-6 text-sm">
              <Detail label="Firma" value={data.tenant} />
              <Detail label="Belge ID" value={`#${data.document?.id}`} />
              <Detail label="Oluşturma" value={data.contract?.createdAt ? new Date(data.contract.createdAt).toLocaleString('tr-TR') : null} />
              <Detail label="Durum" value={data.contract?.status} />
              <Detail label="Audit kayıtları" value={`${data.auditChain?.relevantEntries} / ${data.auditChain?.totalEntries} toplam`} />
              <Detail label="Boyut" value={`${data.document?.sizeBytes?.toLocaleString('tr-TR')} byte`} />
            </dl>
            <div className="mt-3">
              <span className="text-xs uppercase tracking-wider text-ink-muted">SHA-256</span>
              <p className="font-mono text-[11px] break-all bg-slate-50 rounded-lg p-2 mt-1">{data.document?.sha256}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="font-display font-bold text-lg flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-brand" />
          İmzalar
        </h2>
        <ul className="mt-3 space-y-3">
          {(data.signatures || []).map((s, i) => (
            <li key={i} className="border border-slate-100 rounded-xl p-3 bg-slate-50/50">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <p className="font-semibold text-sm">{s.roleLabel}</p>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    s.status === 'imzalandi' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {s.status === 'imzalandi' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {s.status === 'imzalandi' ? 'İmzalandı' : 'Bekliyor'}
                </span>
              </div>
              <p className="text-sm text-ink mt-1">{s.signerName || '(isim girilmedi)'}</p>
              {s.signerTcMasked && (
                <p className="text-xs text-ink-muted">T.C.: {s.signerTcMasked}</p>
              )}
              {s.signedAt && (
                <p className="text-xs text-ink-muted">İmza: {new Date(s.signedAt).toLocaleString('tr-TR')}</p>
              )}
              {s.ipMasked && (
                <p className="text-xs text-ink-muted">IP: {s.ipMasked}</p>
              )}
              {s.geoApprox && (
                <p className="text-xs text-ink-muted inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {s.geoApprox.lat}, {s.geoApprox.lng}
                </p>
              )}
              {(s.acceptedTerms || s.acceptedKvkk) && (
                <p className="text-[11px] text-emerald-700 mt-1">
                  ✓ Sözleşme {s.acceptedTerms && 'okundu'}{s.acceptedTerms && s.acceptedKvkk && ' · '}{s.acceptedKvkk && 'KVKK onaylandı'}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="font-display font-bold text-lg flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand" />
          Audit zinciri
          {chainOk ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              Sağlam
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-semibold">
              <XCircle className="w-3 h-3" />
              Kırılma var
            </span>
          )}
        </h2>
        <p className="text-xs text-ink-muted mt-1">
          Her audit kaydı, bir önceki kaydın hash'iyle birleştirilerek SHA-256 ile zincirlenir.
        </p>
        <ol className="mt-3 space-y-1 text-xs font-mono max-h-72 overflow-auto bg-slate-50 rounded-xl p-3">
          {(data.events || []).map((e) => (
            <li key={e.id} className="flex items-center gap-2 py-0.5">
              <span className="text-ink-muted w-10 shrink-0">#{e.seq}</span>
              <span className="font-semibold text-brand">{e.eventType}</span>
              <span className="text-ink-muted">→</span>
              <span>{e.entityKind}#{e.entityId}</span>
              <span className="text-ink-muted ml-auto whitespace-nowrap">{new Date(e.createdAt).toLocaleString('tr-TR')}</span>
            </li>
          ))}
        </ol>
      </section>

      <p className="text-center text-xs text-ink-muted">
        OnSig doğrulama portalı · imzalı sözleşmenin yasal değeri için{' '}
        <Link href="/" className="text-brand hover:underline">platforma</Link> bakın.
      </p>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand text-white grid place-items-center font-bold">S</div>
            <span className="font-display font-bold">OnSig</span>
          </Link>
          <span className="text-xs text-ink-muted">Sözleşme doğrulama</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">{children}</main>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-ink-muted">{label}</dt>
      <dd className="text-sm font-semibold text-ink">{value ?? '—'}</dd>
    </div>
  )
}

function BadCard({ title, message, hash }: { title: string; message: string; hash?: string }) {
  return (
    <section className="card text-center py-10">
      <XCircle className="w-12 h-12 mx-auto text-rose-500" />
      <h1 className="mt-3 font-display text-xl font-bold">{title}</h1>
      <p className="text-sm text-ink-muted mt-2">{message}</p>
      {hash && <p className="mt-4 text-xs font-mono break-all text-ink-muted/70">{hash}</p>}
    </section>
  )
}
