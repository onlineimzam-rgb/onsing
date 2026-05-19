'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  defaultSignerRoleForType,
  renderContractHtml,
  type ContractFormState,
  type ContractType,
} from '@/lib/contracts'

type SessionPayload = {
  ok: true
  status: string
  title: string
  contractType: ContractType
  body: string
  formSnapshot: ContractFormState | null
  signerName?: string | null
  signedAt?: string | Date | null
  signatureDataUrl?: string | null
}

const CANVAS_W = 800
const CANVAS_H = 280

export default function ContractSignPage({
  locale,
  token,
}: {
  locale: string
  token: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const hasInk = useRef(false)

  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [data, setData] = useState<SessionPayload | null>(null)

  const [signerName, setSignerName] = useState('')
  const [signerTc, setSignerTc] = useState('')
  const [signerEmail, setSignerEmail] = useState('')
  const [signerPhone, setSignerPhone] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const fetchSession = useCallback(async () => {
    const res = await fetch(`/api/contracts/sign/${encodeURIComponent(token)}/`, {
      cache: 'no-store',
    })
    const j = (await res.json()) as SessionPayload | { error: string }
    if (!res.ok || !('ok' in j)) {
      throw new Error(('error' in j && j.error) || 'Yüklenemedi')
    }
    return j
  }, [token])

  useEffect(() => {
    let cancelled = false
    fetchSession()
      .then((j) => {
        if (!cancelled) setData(j)
      })
      .catch((e) => {
        if (!cancelled) setErr((e as Error).message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [fetchSession])

  const isPending = data?.status === 'bekliyor'

  const documentHtml = useMemo(() => {
    if (!data?.formSnapshot) return null
    const form = data.formSnapshot
    const role = defaultSignerRoleForType(form.contractType)
    return renderContractHtml(form, {
      signatures:
        data.signatureDataUrl
          ? [
              {
                role,
                dataUrl: data.signatureDataUrl,
                signedName: data.signerName ?? null,
                signedAt: data.signedAt ?? null,
              },
            ]
          : [],
    })
  }, [data])

  const resetCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !isPending) return
    canvas.width = CANVAS_W
    canvas.height = CANVAS_H
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
    ctx.strokeStyle = '#0a1224'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    hasInk.current = false
  }, [isPending])

  useEffect(() => {
    if (!isPending) return
    const t = window.setTimeout(resetCanvas, 30)
    return () => window.clearTimeout(t)
  }, [isPending, resetCanvas])

  const pos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const r = canvas.getBoundingClientRect()
    let cx = 0
    let cy = 0
    if ('touches' in e && e.touches[0]) {
      cx = e.touches[0].clientX - r.left
      cy = e.touches[0].clientY - r.top
    } else {
      const me = e as React.MouseEvent
      cx = me.clientX - r.left
      cy = me.clientY - r.top
    }
    return { x: (cx / r.width) * CANVAS_W, y: (cy / r.height) * CANVAS_H }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPending) return
    drawing.current = true
    last.current = pos(e)
  }

  const endDraw = () => {
    drawing.current = false
    last.current = null
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current || !isPending) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !last.current) return
    if ('touches' in e) e.preventDefault()
    const p = pos(e)
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
    hasInk.current = true
  }

  const clearSig = () => resetCanvas()

  const submit = async () => {
    if (!acceptedTerms) {
      setErr('Önce metni okuduğunuzu onaylayın.')
      return
    }
    const canvas = canvasRef.current
    if (!canvas) return
    if (!hasInk.current) {
      setErr('Lütfen imza alanına çizim yapın.')
      return
    }
    let url = ''
    try {
      url = canvas.toDataURL('image/png')
    } catch {
      setErr('İmza oluşturulamadı.')
      return
    }

    setSubmitting(true)
    setErr(null)
    try {
      const res = await fetch(`/api/contracts/sign/${encodeURIComponent(token)}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signerName,
          signerTc,
          signerEmail,
          signerPhone,
          signaturePng: url,
          acceptedTerms: true,
        }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Kaydedilemedi')
      setDone(true)
      try {
        const fresh = await fetchSession()
        setData(fresh)
      } catch {
        /* yenilenemese de gönderim başarılı */
      }
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-navy-700">
        Belge yükleniyor…
      </div>
    )
  }

  if (err && !data) {
    return (
      <div className="container-custom py-16 max-w-lg mx-auto text-center">
        <p className="text-red-600 mb-4">{err}</p>
        <Link href={`/${locale}/`} className="text-gold-700 underline font-semibold">
          Ana sayfaya dön
        </Link>
      </div>
    )
  }

  if (!data?.ok) return null

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-navy-950">{data.title}</h1>
          <p className="text-sm text-navy-600 mt-1">
            Uzaktan imza — Çandarlı Uzman Gayrimenkul
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 text-amber-950 text-xs p-3 rounded-xl leading-relaxed">
          Bu sayfadaki imza, çizim ve onay kaydı{' '}
          <strong>bilgilendirme ve iş takibi</strong> amaçlıdır.
          <strong> 5070 sayılı Elektronik İmza Kanunu</strong> anlamında &quot;güvenli
          elektronik imza&quot; veya <strong>mobil imza / e-imza</strong> yerine geçmez. Kesin
          hukuki sonuç için gerekirse noter veya onaylı e-imza kullanılmalıdır.
        </div>

        <div className="card p-4 md:p-6">
          {documentHtml ? (
            <div
              className="max-h-[60vh] overflow-y-auto border border-navy-100 rounded-lg p-3 bg-white"
              dangerouslySetInnerHTML={{ __html: documentHtml }}
            />
          ) : (
            <pre className="text-xs md:text-sm text-navy-800 whitespace-pre-wrap font-sans leading-relaxed max-h-[60vh] overflow-y-auto border border-navy-100 rounded-lg p-3 bg-white">
              {data.body}
            </pre>
          )}
        </div>

        {!isPending && (
          <div className="card p-5 space-y-2">
            <p className="text-green-700 font-semibold">Bu belge imzalanmıştır.</p>
            {data.signerName && (
              <p className="text-sm text-navy-700">İmzalayan: {data.signerName}</p>
            )}
            {data.signedAt && (
              <p className="text-xs text-navy-500">
                Tarih: {new Date(data.signedAt).toLocaleString('tr-TR')}
              </p>
            )}
            <p className="text-xs text-navy-500">
              İmza görseli yukarıdaki belgenin imza alanına otomatik yerleştirilmiştir.
            </p>
            <Link
              href={`/${locale}/`}
              className="inline-block text-gold-700 font-semibold text-sm underline"
            >
              Ana sayfa
            </Link>
          </div>
        )}

        {isPending && done && (
          <div className="card p-6 text-center text-green-700 font-semibold">
            İmzanız kaydedildi. Ofisimiz en kısa sürede iletişime geçebilir.
          </div>
        )}

        {isPending && !done && (
          <div className="card p-5 space-y-4">
            <h2 className="font-display text-lg font-bold text-navy-950">İmza bilgileri</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="label">Ad Soyad *</span>
                <input
                  className="input"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="label">T.C. Kimlik No</span>
                <input
                  className="input"
                  maxLength={11}
                  value={signerTc}
                  onChange={(e) => setSignerTc(e.target.value.replace(/\D/g, ''))}
                />
              </label>
              <label className="block text-sm">
                <span className="label">E-posta</span>
                <input
                  type="email"
                  className="input"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="label">Telefon</span>
                <input
                  className="input"
                  value={signerPhone}
                  onChange={(e) => setSignerPhone(e.target.value)}
                />
              </label>
            </div>

            <div>
              <span className="label">İmza (parmak veya fare ile çizin)</span>
              <div className="border-2 border-navy-200 rounded-xl overflow-hidden bg-white touch-none">
                <canvas
                  ref={canvasRef}
                  className="w-full h-40 cursor-crosshair block"
                  onMouseDown={startDraw}
                  onMouseUp={endDraw}
                  onMouseLeave={endDraw}
                  onMouseMove={draw}
                  onTouchStart={startDraw}
                  onTouchEnd={endDraw}
                  onTouchMove={draw}
                />
              </div>
              <button
                type="button"
                onClick={clearSig}
                className="text-xs mt-2 text-gold-800 underline font-semibold"
              >
                İmzayı temizle
              </button>
            </div>

            <label className="flex items-start gap-2 text-sm text-navy-800 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1"
              />
              <span>
                Sözleşme metnini okudum; bilgilerimin doğru olduğunu ve bu çevrim içi imza
                kaydının güvenli e-imza yerine geçmediğini biliyorum.
              </span>
            </label>

            {err && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
                {err}
              </div>
            )}

            <button
              type="button"
              disabled={submitting}
              onClick={submit}
              className="btn-primary w-full sm:w-auto disabled:opacity-50"
            >
              {submitting ? 'Kaydediliyor…' : 'İmzayı Gönder'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
