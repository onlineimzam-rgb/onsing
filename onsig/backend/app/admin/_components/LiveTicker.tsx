'use client'

import * as React from 'react'
import { StatusDot, cn } from '@/components/admin/ui'

/**
 * LiveTicker — small heartbeat strip that pings /api/admin/health every 8s.
 * Updates the right-hand "all-systems-go" badge on the dashboard if the probes
 * fall out.
 */

interface HealthSnapshot {
  ok: boolean
  serverTime: string
  uptimeSec: number
  probes: { name: string; status: string; latencyMs: number | null; hint: string }[]
  overallLatencyMs: number
}

export function LiveTicker() {
  const [snap, setSnap] = React.useState<HealthSnapshot | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let stopped = false
    async function tick() {
      try {
        const r = await fetch('/api/admin/health', { cache: 'no-store' })
        if (!r.ok) throw new Error('bad')
        const data = (await r.json()) as HealthSnapshot
        if (!stopped) {
          setSnap(data)
          setError(null)
        }
      } catch (e) {
        if (!stopped) setError('Sağlık kontrolü başarısız')
      }
    }
    tick()
    const id = setInterval(tick, 8000)
    return () => {
      stopped = true
      clearInterval(id)
    }
  }, [])

  const allOk = snap?.probes.every((p) => p.status === 'operational' || p.status === 'not_configured')

  return (
    <div className="flex items-center gap-2 text-[11px] tabular-nums">
      <StatusDot tone={allOk ? 'success' : 'warning'} pulse />
      <span className="text-[var(--a-text-2)] font-semibold">
        {error ? 'Probe hatası' : allOk ? 'All systems operational' : 'Bazı servisler yapılandırılmadı'}
      </span>
      {snap?.overallLatencyMs != null && (
        <span className="text-[var(--a-text-4)] num">· {snap.overallLatencyMs}ms</span>
      )}
    </div>
  )
}

/**
 * Bigger inline health probe table — used in /admin/health and on the
 * dashboard sidebar.
 */
export function HealthProbes() {
  const [snap, setSnap] = React.useState<HealthSnapshot | null>(null)

  React.useEffect(() => {
    let stopped = false
    async function tick() {
      try {
        const r = await fetch('/api/admin/health', { cache: 'no-store' })
        if (!r.ok) return
        const data = (await r.json()) as HealthSnapshot
        if (!stopped) setSnap(data)
      } catch {
        /* swallow */
      }
    }
    tick()
    const id = setInterval(tick, 10000)
    return () => {
      stopped = true
      clearInterval(id)
    }
  }, [])

  return (
    <ul className="divide-y divide-[var(--a-line)]">
      {(snap?.probes ?? FALLBACK_PROBES).map((p) => {
        const tone =
          p.status === 'operational'
            ? 'success'
            : p.status === 'not_configured'
              ? 'warning'
              : p.status === 'down'
                ? 'danger'
                : 'neutral'
        return (
          <li
            key={p.name}
            className="flex items-center justify-between gap-3 py-2.5 first:pt-1 last:pb-1"
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <StatusDot tone={tone as 'success' | 'warning' | 'danger' | 'neutral'} />
              <span className="text-[12.5px] font-medium text-[var(--a-text-1)] truncate">
                {p.name}
              </span>
              <span className="text-[10.5px] text-[var(--a-text-4)] truncate">
                {p.hint}
              </span>
            </span>
            <span className="text-[11px] text-[var(--a-text-3)] num shrink-0">
              {p.latencyMs != null ? `${p.latencyMs}ms` : '—'}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

const FALLBACK_PROBES: HealthSnapshot['probes'] = [
  { name: 'PostgreSQL', status: 'operational', latencyMs: 0, hint: 'connecting…' },
  { name: 'Storage', status: 'operational', latencyMs: 0, hint: 'connecting…' },
  { name: 'Mail', status: 'operational', latencyMs: 0, hint: 'connecting…' },
  { name: 'SMS', status: 'operational', latencyMs: 0, hint: 'connecting…' },
  { name: 'PDF', status: 'operational', latencyMs: 0, hint: 'connecting…' },
]
