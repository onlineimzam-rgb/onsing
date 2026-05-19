'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail } from 'lucide-react'
import { api, ApiError } from '@/lib/client/api'
import { Field, FormError } from '@/components/ui/Field'

export default function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams?.get('invite') ?? null

  const [name, setName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api('/api/auth/register', {
        method: 'POST',
        json: {
          name,
          companyName: inviteToken ? null : companyName,
          email,
          phone: phone || null,
          password,
          invite: inviteToken,
        },
      })
      startTransition(() => {
        router.push('/dashboard')
        router.refresh()
      })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Bağlantı hatası.')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {inviteToken && (
        <div className="rounded-xl border border-brand/30 bg-brand-soft/40 px-4 py-3 text-sm text-brand-deep flex items-start gap-2">
          <Mail className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Davetli olarak kayıt oluyorsun.</p>
            <p className="text-xs mt-0.5">
              Hesabını oluşturduğunda otomatik olarak davet eden firmanın ekibine eklenirsin.
            </p>
          </div>
        </div>
      )}
      <Field label="Ad Soyad" required>
        <input
          required
          minLength={2}
          autoComplete="name"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      {!inviteToken && (
        <Field label="Firma adı" hint="Çalışma alanın bu isimle açılır." required>
          <input
            required
            minLength={2}
            maxLength={200}
            autoComplete="organization"
            className="input"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Örn. Çandarlı Uzman Gayrimenkul"
          />
        </Field>
      )}
      <Field label="E-posta" required>
        <input
          type="email"
          required
          autoComplete="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Field label="Telefon" hint="İsteğe bağlı (+90...)">
        <input
          type="tel"
          autoComplete="tel"
          className="input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+905XXXXXXXXX"
        />
      </Field>
      <Field label="Şifre" hint="En az 8 karakter." required>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <FormError message={error} />
      <button
        type="submit"
        className="btn-primary btn-lg w-full"
        disabled={isPending}
      >
        {isPending ? 'Hesap açılıyor…' : 'Hesabı oluştur'}
      </button>
      <p className="text-center text-xs text-ink-7 pt-1">
        Hesabınız var mı?{' '}
        <Link
          href="/login"
          className="text-iris-10 font-semibold hover:text-iris-11 hover:underline underline-offset-2"
        >
          Giriş yap
        </Link>
      </p>
    </form>
  )
}
