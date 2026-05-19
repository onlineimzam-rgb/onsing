'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { LogOut } from 'lucide-react'
import { api } from '@/lib/client/api'

export default function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  function go() {
    start(async () => {
      try {
        await api('/api/auth/logout', { method: 'POST' })
      } catch {
        // ignore — cookies cleared regardless
      }
      router.push('/login')
      router.refresh()
    })
  }
  if (compact) {
    return (
      <button onClick={go} className="text-xs text-ink-muted hover:text-danger inline-flex items-center gap-1" disabled={pending}>
        <LogOut className="w-3.5 h-3.5" />
        Çıkış
      </button>
    )
  }
  return (
    <button onClick={go} className="btn-ghost w-full text-sm" disabled={pending}>
      <LogOut className="w-4 h-4" />
      {pending ? 'Çıkış yapılıyor…' : 'Çıkış yap'}
    </button>
  )
}
