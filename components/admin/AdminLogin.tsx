'use client'

import { useState, type FormEvent } from 'react'
import { Lock, Loader2 } from 'lucide-react'

const STORAGE_KEY = 'cugm_admin_key'

export function getAdminKey(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEY)
}

export function setAdminKey(key: string) {
  localStorage.setItem(STORAGE_KEY, key)
}

export function clearAdminKey() {
  localStorage.removeItem(STORAGE_KEY)
}

export default function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/properties/?limit=1', {
        headers: { 'x-admin-key': key },
      })
      if (!res.ok) {
        if (res.status === 401) {
          setError('Geçersiz anahtar')
        } else {
          setError('Bir hata oluştu')
        }
        return
      }
      setAdminKey(key)
      onSuccess()
    } catch {
      setError('Bağlantı hatası')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-950 to-navy-900 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8"
      >
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-gold-gradient flex items-center justify-center mb-4 shadow-gold">
            <Lock className="w-6 h-6 text-navy-950" />
          </div>
          <h1 className="font-display text-xl font-bold text-navy-950">Admin Girişi</h1>
          <p className="text-sm text-navy-500 mt-1">Çandarlı Uzman Gayrimenkul</p>
        </div>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="ADMIN_KEY"
          className="w-full input mb-3"
          autoFocus
        />
        {error && (
          <div className="text-red-600 text-sm text-center mb-3">{error}</div>
        )}
        <button
          type="submit"
          disabled={loading || !key}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Giriş Yap'}
        </button>
      </form>
    </div>
  )
}
