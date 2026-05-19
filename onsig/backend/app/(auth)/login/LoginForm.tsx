'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { api, ApiError } from '@/lib/client/api'
import { Field, FormError } from '@/components/ui/Field'

export default function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const nextParam = params?.get('next') ?? null
  const next = nextParam && nextParam.startsWith('/') ? nextParam : '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api('/api/auth/login', { method: 'POST', json: { email, password } })
      startTransition(() => {
        router.push(next)
        router.refresh()
      })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Bağlantı hatası.')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="E-posta" htmlFor="email" required>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Field label="Şifre" htmlFor="password" required>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
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
        {isPending ? 'Yönlendiriliyor…' : 'Giriş yap'}
      </button>
      <p className="text-center text-xs text-ink-7 pt-1">
        Hesabınız yok mu?{' '}
        <Link
          href="/register"
          className="text-iris-10 font-semibold hover:text-iris-11 hover:underline underline-offset-2"
        >
          14 günlük denemeyi başlat
        </Link>
      </p>
    </form>
  )
}
