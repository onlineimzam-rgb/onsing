'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, ShieldCheck, FileSignature, Send, Eye, RotateCcw } from 'lucide-react'
import SignatureCanvas from '@/components/SignatureCanvas'
import { Field, FormError } from '@/components/ui/Field'
import { api, ApiError } from '@/lib/client/api'

interface ContractProps {
  id: number
  status: string
  title: string | null
  templateKey: string
}
interface SessionProps {
  id: number
  role: string
  roleLabel: string
  status: string
  recipientName: string | null
  recipientEmail: string | null
  recipientPhone: string | null
  otpVerifiedAt: string | null
  signedAt: string | null
  expiresAt: string | null
  signaturePng: string | null
}

interface Props {
  token: string
  tenantName: string
  title: string
  body: string
  contract: ContractProps
  session: SessionProps
}

type Phase = 'consent' | 'otp' | 'sign' | 'confirm' | 'done'

export default function SignFlow({ token, tenantName, title, body, contract, session: initialSession }: Props) {
  const [session, setSession] = useState(initialSession)

  const [phase, setPhase] = useState<Phase>(() => {
    if (session.status === 'imzalandi') return 'done'
    if (session.otpVerifiedAt) return 'sign'
    return 'consent'
  })

  // ---- consent ----
  const [readToBottom, setReadToBottom] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedKvkk, setAcceptedKvkk] = useState(false)
  const bodyRef = useRef<HTMLElement | null>(null)

  // ---- otp ----
  const defaultChannel: 'email' | 'sms' = session.recipientEmail ? 'email' : 'sms'
  const defaultTarget = session.recipientEmail || session.recipientPhone || ''
  const [channel, setChannel] = useState<'email' | 'sms'>(defaultChannel)
  const [target, setTarget] = useState(defaultTarget)
  const [otpRequested, setOtpRequested] = useState(false)
  const [otpDevCode, setOtpDevCode] = useState<string | null>(null)
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // ---- signature ----
  const [signerName, setSignerName] = useState(session.recipientName || '')
  const [signerTc, setSignerTc] = useState('')
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null)
  const [geo, setGeo] = useState<{ lat: string; lng: string } | null>(null)
  const [signError, setSignError] = useState<string | null>(null)

  useEffect(() => {
    if (!('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ lat: String(pos.coords.latitude), lng: String(pos.coords.longitude) }),
      () => setGeo(null),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 8_000 }
    )
  }, [])

  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    function onScroll() {
      if (!el) return
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setReadToBottom(true)
    }
    el.addEventListener('scroll', onScroll)
    if (el.scrollHeight - el.clientHeight < 60) setReadToBottom(true)
    return () => el.removeEventListener('scroll', onScroll)
  }, [body])

  const canRequestOtp = readToBottom && acceptedTerms && acceptedKvkk && target.length >= 3
  const canSign = signerName.trim().length >= 3 && !!signatureDataUrl

  const isExpired = useMemo(() => {
    if (!session.expiresAt) return false
    return new Date(session.expiresAt) < new Date()
  }, [session.expiresAt])

  if (session.status === 'iptal' || isExpired) {
    return <BlockedScreen status={isExpired ? 'Bağlantının süresi dolmuş.' : 'Bu imza bağlantısı iptal edilmiş.'} />
  }

  // ----------------------------------------------------------------------------
  // Step 2 — request OTP
  // ----------------------------------------------------------------------------
  async function requestOtp() {
    setBusy(true)
    setOtpError(null)
    try {
      const res = await api<{ ok: true; devCode?: string; provider: string; delivered: boolean }>(
        `/api/sign/${token}/otp`,
        { method: 'POST', json: { channel, target } }
      )
      setOtpRequested(true)
      setOtpDevCode(res.devCode || null)
      setPhase('otp')
    } catch (e) {
      setOtpError(e instanceof ApiError ? e.message : 'Kod gönderilemedi.')
    } finally {
      setBusy(false)
    }
  }

  // ----------------------------------------------------------------------------
  // Step 3 — verify OTP
  // ----------------------------------------------------------------------------
  async function verifyOtp() {
    setBusy(true)
    setOtpError(null)
    try {
      await api(`/api/sign/${token}/otp/verify`, {
        method: 'POST',
        json: { channel, target, code: otp.trim() },
      })
      setSession((s) => ({ ...s, otpVerifiedAt: new Date().toISOString() }))
      setPhase('sign')
    } catch (e) {
      setOtpError(e instanceof ApiError ? e.message : 'Kod doğrulanamadı.')
    } finally {
      setBusy(false)
    }
  }

  // ----------------------------------------------------------------------------
  // Step 4 — submit signature
  // ----------------------------------------------------------------------------
  async function submitSignature() {
    if (!signatureDataUrl) return
    setBusy(true)
    setSignError(null)
    try {
      await api(`/api/sign/${token}`, {
        method: 'POST',
        json: {
          signerName: signerName.trim(),
          signerTc: signerTc.trim() || undefined,
          signerEmail: channel === 'email' ? target : session.recipientEmail || undefined,
          signerPhone: channel === 'sms' ? target : session.recipientPhone || undefined,
          signaturePng: signatureDataUrl,
          acceptedTerms: true,
          acceptedKvkk: true,
          geo,
        },
      })
      setSession((s) => ({
        ...s,
        status: 'imzalandi',
        signedAt: new Date().toISOString(),
        signaturePng: signatureDataUrl,
      }))
      setPhase('done')
    } catch (e) {
      setSignError(e instanceof ApiError ? e.message : 'İmza gönderilemedi.')
    } finally {
      setBusy(false)
    }
  }

  // ----------------------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand text-white grid place-items-center font-bold">S</div>
            <span className="font-display font-bold tracking-tight">OnSig</span>
          </div>
          <span className="text-xs text-ink-muted truncate">{tenantName}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="card">
          <p className="text-xs uppercase tracking-wider text-brand-deep font-semibold">{session.roleLabel}</p>
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight mt-1">{title}</h1>
          <p className="text-sm text-ink-muted mt-1">{contract.title || `Sözleşme #${contract.id}`}</p>
        </div>

        {phase === 'done' ? (
          <DoneScreen session={session} />
        ) : (
          <>
            <Stepper phase={phase} />

            <section className="card">
              <h2 className="font-display font-bold text-lg flex items-center gap-2 mb-2">
                <FileSignature className="w-4 h-4 text-brand" />
                Sözleşme metni
              </h2>
              <article
                ref={bodyRef}
                className="contract-body bg-slate-50 rounded-xl p-4 max-h-[420px] overflow-auto"
              >
                {body}
              </article>
              {!readToBottom && (
                <p className="text-xs text-amber-700 mt-2">
                  Devam etmek için tüm metni okumanız gerekir (en alta kaydırın).
                </p>
              )}
            </section>

            {phase === 'consent' && (
              <section className="card space-y-3">
                <Consent
                  checked={acceptedTerms}
                  onChange={setAcceptedTerms}
                  label="Sözleşme metnini okudum, anladım ve kabul ediyorum."
                />
                <Consent
                  checked={acceptedKvkk}
                  onChange={setAcceptedKvkk}
                  label={
                    <>
                      Kişisel verilerimin (ad, T.C. no, IP, lokasyon, imza görüntüsü) işlenmesine,{' '}
                      <a href="/kvkk" target="_blank" rel="noreferrer" className="text-brand hover:underline">KVKK aydınlatma metni</a>
                      {' '}kapsamında açık rıza veriyorum.
                    </>
                  }
                />
                <FormError message={otpError} />
                <Field label="Doğrulama kanalı">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setChannel('email')}
                      className={`flex-1 px-3 py-2 rounded-xl border text-sm ${channel === 'email' ? 'border-brand bg-brand text-white' : 'border-slate-200'}`}
                    >
                      E-posta
                    </button>
                    <button
                      type="button"
                      onClick={() => setChannel('sms')}
                      className={`flex-1 px-3 py-2 rounded-xl border text-sm ${channel === 'sms' ? 'border-brand bg-brand text-white' : 'border-slate-200'}`}
                    >
                      SMS
                    </button>
                  </div>
                </Field>
                <Field
                  label={channel === 'email' ? 'E-posta' : 'Telefon'}
                  hint={channel === 'email' ? 'OTP kodu bu adrese gönderilir.' : '+90... formatında.'}
                  required
                >
                  <input
                    type={channel === 'email' ? 'email' : 'tel'}
                    className="input"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                  />
                </Field>
                <button
                  type="button"
                  className="btn-primary w-full"
                  disabled={!canRequestOtp || busy}
                  onClick={requestOtp}
                >
                  {busy ? 'Kod gönderiliyor…' : 'Doğrulama kodu gönder'}
                </button>
              </section>
            )}

            {phase === 'otp' && (
              <section className="card space-y-3">
                <p className="text-sm">
                  {channel === 'email' ? 'E-posta' : 'SMS'} ile gönderilen 6 haneli kodu girin:{' '}
                  <span className="font-mono text-xs text-ink-muted">({target})</span>
                </p>
                {otpDevCode && (
                  <div className="rounded-xl bg-brand-soft text-brand-deep px-3 py-2 text-xs">
                    <span className="font-semibold">Dev modu</span> — gerçek SMS/Mail gönderilmedi.
                    Test kodunuz: <span className="font-mono text-base ml-1 font-bold">{otpDevCode}</span>
                  </div>
                )}
                <Field label="OTP" required>
                  <input
                    className="input font-mono text-center text-lg tracking-[.4em]"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••"
                    inputMode="numeric"
                  />
                </Field>
                <FormError message={otpError} />
                <div className="flex gap-2">
                  <button className="btn-ghost flex-1" disabled={busy} onClick={requestOtp}>
                    Yeniden gönder
                  </button>
                  <button className="btn-primary flex-1" disabled={busy || otp.length !== 6} onClick={verifyOtp}>
                    {busy ? 'Doğrulanıyor…' : 'Doğrula'}
                  </button>
                </div>
              </section>
            )}

            {phase === 'sign' && (
              <section className="card space-y-4">
                <div className="rounded-xl bg-emerald-50 text-emerald-700 text-sm px-3 py-2 inline-flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Doğrulama tamam. Şimdi imzalayın.
                </div>
                <Field label="Ad Soyad" required>
                  <input
                    className="input"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    autoComplete="name"
                  />
                </Field>
                <Field label="T.C. Kimlik No" hint="11 haneli (opsiyonel ama tavsiye edilir)">
                  <input
                    className="input"
                    inputMode="numeric"
                    value={signerTc}
                    onChange={(e) => setSignerTc(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  />
                </Field>
                <Field label="İmza" hint="Parmağınızla veya farenizle çizin">
                  <SignatureCanvas onChange={setSignatureDataUrl} />
                </Field>
                <FormError message={signError} />
                <button
                  className="btn-primary w-full text-base py-3"
                  disabled={!canSign}
                  onClick={() => {
                    setSignError(null)
                    setPhase('confirm')
                  }}
                >
                  <Eye className="w-4 h-4" />
                  İmzayı önizle
                </button>
                <p className="text-[11px] text-ink-muted text-center leading-relaxed">
                  Bir sonraki adımda imzanızı son hâliyle göreceksiniz ve onaylayınca gönderilecek.
                </p>
              </section>
            )}

            {phase === 'confirm' && (
              <section className="card space-y-4">
                <div className="rounded-xl bg-amber-50 text-amber-800 text-sm px-3 py-2 inline-flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Gönderilecek imzanızı kontrol edin.
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wider text-ink-muted font-semibold mb-1">İmzacı</p>
                  <p className="text-lg font-display font-bold">{signerName}</p>
                  {signerTc && (
                    <p className="text-xs text-ink-muted mt-0.5">T.C. son 4: ****{signerTc.slice(-4)}</p>
                  )}
                  <div className="mt-4 bg-white rounded-xl border border-slate-200 p-3 flex items-center justify-center min-h-[140px]">
                    {signatureDataUrl ? (
                      <img
                        src={signatureDataUrl}
                        alt="İmza önizleme"
                        className="max-h-40 max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-sm text-ink-muted">İmza bulunamadı, lütfen tekrar deneyin.</span>
                    )}
                  </div>
                  <p className="text-[11px] text-ink-muted mt-3 leading-relaxed">
                    Yukarıdaki imza ile birlikte adınız, T.C. numaranız, IP adresiniz, cihaz bilgileriniz
                    {geo ? ', GPS konumunuz' : ''} ve zaman damgası kalıcı audit kaydına eklenir.
                    Onayladıktan sonra geri alınamaz.
                  </p>
                </div>

                <FormError message={signError} />

                <div className="grid sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="btn-ghost w-full text-sm py-3 justify-center"
                    disabled={busy}
                    onClick={() => {
                      setSignatureDataUrl(null)
                      setPhase('sign')
                    }}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Tekrar çiz
                  </button>
                  <button
                    type="button"
                    className="btn-primary w-full text-sm py-3 justify-center"
                    disabled={busy || !signatureDataUrl}
                    onClick={submitSignature}
                  >
                    <Send className="w-4 h-4" />
                    {busy ? 'Gönderiliyor…' : 'Onayla ve Gönder'}
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function Stepper({ phase }: { phase: Phase }) {
  const steps: { key: Phase; label: string }[] = [
    { key: 'consent', label: 'Onay' },
    { key: 'otp', label: 'Kod' },
    { key: 'sign', label: 'İmza' },
    { key: 'done', label: 'Tamam' },
  ]
  // `confirm` is a micro-step inside "İmza"; keep that step highlighted.
  const effectivePhase: Phase = phase === 'confirm' ? 'sign' : phase
  const activeIdx = steps.findIndex((s) => s.key === effectivePhase)
  return (
    <ol className="flex items-center gap-2 px-1 text-xs">
      {steps.map((s, i) => {
        const done = i < activeIdx
        const active = i === activeIdx
        return (
          <li key={s.key} className="flex items-center gap-2 flex-1">
            <span
              className={`w-6 h-6 rounded-full grid place-items-center text-[11px] font-bold ${
                done ? 'bg-emerald-500 text-white' : active ? 'bg-brand text-white' : 'bg-slate-200 text-ink-muted'
              }`}
            >
              {done ? '✓' : i + 1}
            </span>
            <span className={`font-semibold ${active ? 'text-ink' : 'text-ink-muted'}`}>{s.label}</span>
            {i < steps.length - 1 && <span className="flex-1 h-px bg-slate-200" />}
          </li>
        )
      })}
    </ol>
  )
}

function Consent({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: React.ReactNode
}) {
  return (
    <label className="flex items-start gap-2 cursor-pointer">
      <input
        type="checkbox"
        className="mt-1 w-4 h-4 accent-brand"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-sm leading-relaxed">{label}</span>
    </label>
  )
}

function DoneScreen({ session }: { session: SessionProps }) {
  const url = session.signaturePng
    ? session.signaturePng.startsWith('data:')
      ? session.signaturePng
      : `data:image/png;base64,${session.signaturePng}`
    : null
  return (
    <section className="card text-center py-8">
      <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
      <h2 className="mt-3 font-display text-xl font-bold">İmzanız alındı.</h2>
      <p className="text-sm text-ink-muted mt-1">
        Tarih: {session.signedAt ? new Date(session.signedAt).toLocaleString('tr-TR') : '—'}
      </p>
      {url && (
        <div className="mt-4 mx-auto max-w-xs bg-white border border-slate-200 rounded-xl p-3">
          <img src={url} alt="İmza" className="max-h-24 mx-auto" />
        </div>
      )}
      <p className="text-xs text-ink-muted mt-6">
        Sözleşmenin diğer taraflarının da imzasını bekliyoruz. Tamamlandığında PDF kopyası e-posta ile gönderilir.
      </p>
    </section>
  )
}

function BlockedScreen({ status }: { status: string }) {
  return (
    <div className="min-h-screen bg-slate-50 grid place-items-center px-6">
      <div className="card max-w-md text-center py-10">
        <h2 className="font-display text-xl font-bold">{status}</h2>
        <p className="text-sm text-ink-muted mt-2">
          Yeni bir bağlantı için sözleşmeyi gönderen kişiyle iletişime geçin.
        </p>
      </div>
    </div>
  )
}
