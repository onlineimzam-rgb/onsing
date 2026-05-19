'use client'

import * as React from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

type Topic = 'demo' | 'sales' | 'support' | 'partnership'

const TOPICS: { id: Topic; label: string; description: string }[] = [
  {
    id: 'demo',
    label: 'Ürün demosu',
    description: '30 dakikalık canlı demo gösterimi.',
  },
  {
    id: 'sales',
    label: 'Satış görüşmesi',
    description: 'Plan, fiyat ve sözleşme.',
  },
  {
    id: 'support',
    label: 'Teknik destek',
    description: 'Hesap, fatura veya kullanım sorunu.',
  },
  {
    id: 'partnership',
    label: 'İş ortaklığı',
    description: 'Entegrasyon, beyaz etiket, reseller.',
  },
]

/**
 * Lightweight contact form. The submit handler simply fakes a network call —
 * once a real /api/contact endpoint exists we'll wire it up.
 */
export function ContactForm() {
  const [topic, setTopic] = React.useState<Topic>('demo')
  const [submitting, setSubmitting] = React.useState(false)
  const [done, setDone] = React.useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 800))
    setSubmitting(false)
    setDone(true)
  }

  if (done) {
    return (
      <div className="p-8 rounded-card bg-paper ring-1 ring-divider text-center">
        <div className="mx-auto grid place-items-center w-12 h-12 rounded-full bg-success-soft text-success-deep ring-1 ring-success-soft">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <h3 className="mt-5 font-display text-lg font-bold tracking-tight text-ink-12">
          Mesajını aldık.
        </h3>
        <p className="mt-2 text-sm text-ink-8 max-w-md mx-auto">
          24 saat içinde dönüş yapacağız. E-posta kutunu kontrol etmeyi unutma —
          spam klasörüne düşmüş olabilir.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-7">
      <div>
        <label className="block text-xs font-semibold text-ink-11 mb-2">
          Konu
        </label>
        <div className="grid sm:grid-cols-2 gap-2">
          {TOPICS.map((t) => {
            const active = topic === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTopic(t.id)}
                className={`text-left p-3.5 rounded-md ring-1 transition-all ${
                  active
                    ? 'bg-iris-1 ring-iris-9/40 shadow-sm'
                    : 'bg-paper ring-divider hover:ring-divider-strong'
                }`}
              >
                <div
                  className={`text-sm font-semibold ${
                    active ? 'text-iris-11' : 'text-ink-12'
                  }`}
                >
                  {t.label}
                </div>
                <div className="text-2xs text-ink-7 mt-0.5">{t.description}</div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <FieldBlock label="Ad Soyad" htmlFor="name" required>
          <input id="name" name="name" required className="input" />
        </FieldBlock>
        <FieldBlock label="Şirket" htmlFor="company">
          <input id="company" name="company" className="input" />
        </FieldBlock>
        <FieldBlock label="E-posta" htmlFor="email" required>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="input"
          />
        </FieldBlock>
        <FieldBlock label="Telefon" htmlFor="phone">
          <input id="phone" name="phone" className="input" />
        </FieldBlock>
      </div>

      <FieldBlock label="Mesajın" htmlFor="message" required>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className="input resize-y"
          placeholder="Bize biraz daha bilgi ver — şirketin, sözleşme sayın, sektörün..."
        />
      </FieldBlock>

      <label className="flex items-start gap-2.5 text-xs text-ink-8 leading-relaxed">
        <input type="checkbox" required className="mt-0.5" />
        KVKK aydınlatma metnini okudum ve iletişim için açık rıza veriyorum.
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary btn-lg w-full justify-center disabled:opacity-60"
      >
        {submitting ? 'Gönderiliyor…' : 'Mesajı gönder'}
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  )
}

function FieldBlock({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-semibold text-ink-11 mb-1.5"
      >
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
