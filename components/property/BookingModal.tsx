'use client'

import { useState } from 'react'
import { CalendarCheck, Loader2, X, Phone, Mail } from 'lucide-react'
import { useI18n } from '@/lib/i18n/I18nProvider'

export default function BookingModal({
  open,
  onClose,
  property,
}: {
  open: boolean
  onClose: () => void
  property: {
    id: number
    title: string
    reference_no?: string | null
    district?: string | null
    category?: string | null
  }
}) {
  const { locale } = useI18n()
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    preferred_date: '',
    preferred_time: '',
    note: '',
  })

  if (!open) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.name.trim() || !form.phone.trim()) {
      setError(locale === 'en' ? 'Name and phone are required.' : 'Ad ve telefon zorunludur.')
      return
    }
    setSubmitting(true)
    try {
      const slot = [form.preferred_date, form.preferred_time].filter(Boolean).join(' ')
      const message =
        (locale === 'en'
          ? `Property viewing request: ${property.title} (${property.reference_no || '-'})`
          : `Yer gösterme talebi: ${property.title} (${property.reference_no || '-'})`) +
        (slot ? ` · ${slot}` : '') +
        (form.note.trim() ? `\n${form.note.trim()}` : '')

      const res = await fetch('/api/leads/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'alici',
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          district: property.district || null,
          category: property.category || null,
          location_note: `İlan #${property.reference_no || property.id}`,
          message,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gönderilemedi')
      setSuccess(true)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/55 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col">
        <div className="px-5 py-4 border-b border-navy-100 flex items-start justify-between gap-3 flex-shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold text-gold-800 tracking-wider">
              {locale === 'en' ? 'Property Viewing' : 'Yer Gösterme Talebi'}
            </p>
            <h3 className="font-display text-lg font-bold text-navy-950 truncate">{property.title}</h3>
            {property.reference_no && (
              <p className="text-xs text-navy-500 mt-0.5 font-mono">{property.reference_no}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-navy-50 text-navy-600"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center space-y-3 flex-1">
            <CalendarCheck className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="font-display text-xl font-bold text-navy-950">
              {locale === 'en' ? 'Request received' : 'Talebiniz alındı'}
            </h4>
            <p className="text-sm text-navy-600">
              {locale === 'en'
                ? 'Our agent will contact you shortly to confirm the appointment.'
                : 'Ofisimiz en kısa sürede sizinle iletişime geçip randevu saatini kesinleştirecek.'}
            </p>
            <button type="button" onClick={onClose} className="btn-primary w-full">
              {locale === 'en' ? 'Close' : 'Kapat'}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-3 overflow-y-auto flex-1">
            <Field label={locale === 'en' ? 'Full name' : 'Ad Soyad'}>
              <input
                className="input text-sm"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={locale === 'en' ? 'Phone' : 'Telefon'}>
                <input
                  className="input text-sm"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  required
                />
              </Field>
              <Field label={locale === 'en' ? 'Email (optional)' : 'E-posta (ops.)'}>
                <input
                  className="input text-sm"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </Field>
              <Field label={locale === 'en' ? 'Date' : 'Tarih'}>
                <input
                  className="input text-sm"
                  type="date"
                  value={form.preferred_date}
                  onChange={(e) => setForm((f) => ({ ...f, preferred_date: e.target.value }))}
                  min={new Date().toISOString().slice(0, 10)}
                />
              </Field>
              <Field label={locale === 'en' ? 'Time' : 'Saat'}>
                <input
                  className="input text-sm"
                  type="time"
                  value={form.preferred_time}
                  onChange={(e) => setForm((f) => ({ ...f, preferred_time: e.target.value }))}
                />
              </Field>
            </div>
            <Field label={locale === 'en' ? 'Note (optional)' : 'Not (ops.)'}>
              <textarea
                className="input text-sm min-h-[80px]"
                placeholder={
                  locale === 'en'
                    ? 'Anything our agent should know before the visit?'
                    : 'Ziyaret öncesi bilmemiz gereken bir şey var mı?'
                }
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              />
            </Field>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full inline-flex items-center justify-center gap-1 mt-1"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarCheck className="w-4 h-4" />}
              {locale === 'en' ? 'Request appointment' : 'Randevu talep et'}
            </button>

            <div className="pt-2 border-t border-navy-100 flex items-center justify-center gap-2 text-xs text-navy-500">
              <Phone className="w-3 h-3" />
              {locale === 'en' ? 'Prefer voice? Just call us.' : 'Telefonla aramayı tercih ederseniz arayın.'}
              <Mail className="w-3 h-3 ml-2" />
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-navy-700 mb-1">{label}</span>
      {children}
    </label>
  )
}
