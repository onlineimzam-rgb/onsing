'use client'

import * as React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  AdminBadge,
  AdminButton,
  AdminInput,
  AdminSwitch,
  IconButton,
  MonoTag,
  Panel,
  PanelHeader,
  Toolbar,
  ToolbarLeft,
  ToolbarRight,
} from '@/components/admin/ui'

export interface FlagRow {
  id: number
  key: string
  description: string | null
  enabled: boolean
  tenantId: number | null
  rolloutPct: number
  updatedAt: string
}

export function FeatureFlagsTable({ initial }: { initial: FlagRow[] }) {
  const [flags, setFlags] = React.useState<FlagRow[]>(initial)
  const [creating, setCreating] = React.useState(false)
  const [newKey, setNewKey] = React.useState('')
  const [newDesc, setNewDesc] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [pendingId, setPendingId] = React.useState<number | null>(null)

  async function toggle(flag: FlagRow, value: boolean) {
    setPendingId(flag.id)
    const prev = flag.enabled
    setFlags((curr) =>
      curr.map((f) => (f.id === flag.id ? { ...f, enabled: value } : f))
    )
    try {
      const res = await fetch(`/api/admin/feature-flags/${flag.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: value }),
      })
      if (!res.ok) throw new Error('toggle failed')
    } catch {
      setFlags((curr) =>
        curr.map((f) => (f.id === flag.id ? { ...f, enabled: prev } : f))
      )
      setError('Güncelleme başarısız.')
    } finally {
      setPendingId(null)
    }
  }

  async function updateRollout(flag: FlagRow, pct: number) {
    setFlags((curr) =>
      curr.map((f) => (f.id === flag.id ? { ...f, rolloutPct: pct } : f))
    )
    await fetch(`/api/admin/feature-flags/${flag.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rolloutPct: pct }),
    })
  }

  async function removeFlag(flag: FlagRow) {
    if (!window.confirm(`"${flag.key}" silinsin mi?`)) return
    setFlags((curr) => curr.filter((f) => f.id !== flag.id))
    await fetch(`/api/admin/feature-flags/${flag.id}`, { method: 'DELETE' })
  }

  async function create() {
    setError(null)
    if (newKey.trim().length < 2) {
      setError('Anahtar en az 2 karakter olmalı.')
      return
    }
    const res = await fetch('/api/admin/feature-flags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: newKey.trim(),
        description: newDesc.trim() || null,
        enabled: false,
        rolloutPct: 0,
      }),
    })
    if (!res.ok) {
      setError('Oluşturulamadı.')
      return
    }
    const json = await res.json()
    setFlags((curr) => [
      {
        id: json.flag.id,
        key: json.flag.key,
        description: json.flag.description,
        enabled: json.flag.enabled,
        tenantId: json.flag.tenantId ?? null,
        rolloutPct: json.flag.rolloutPct,
        updatedAt: new Date(json.flag.updatedAt).toISOString(),
      },
      ...curr,
    ])
    setCreating(false)
    setNewKey('')
    setNewDesc('')
  }

  return (
    <Panel flush>
      <Toolbar>
        <ToolbarLeft>
          <span className="text-[12px] text-[var(--a-text-3)]">
            <span className="font-semibold text-[var(--a-text-1)]">{flags.length}</span> bayrak
          </span>
          {error && (
            <span className="text-[11px] text-[var(--a-danger)]">{error}</span>
          )}
        </ToolbarLeft>
        <ToolbarRight>
          <AdminButton
            variant="primary"
            size="sm"
            onClick={() => setCreating((v) => !v)}
          >
            <Plus className="w-3 h-3" />
            Yeni flag
          </AdminButton>
        </ToolbarRight>
      </Toolbar>

      {creating && (
        <div className="px-4 py-3 bg-[var(--a-bg-elev)] border-b border-[var(--a-line)] flex flex-wrap items-center gap-2">
          <AdminInput
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="anahtar (örn: bulk_invite)"
            className="w-[200px]"
          />
          <AdminInput
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="kısa açıklama"
            className="flex-1 min-w-[240px]"
          />
          <AdminButton variant="primary" size="sm" onClick={create}>
            Oluştur
          </AdminButton>
          <AdminButton variant="ghost" size="sm" onClick={() => setCreating(false)}>
            İptal
          </AdminButton>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="bg-[var(--a-bg-elev)]">
              {['Anahtar', 'Açıklama', 'Scope', 'Rollout', 'Aktif', 'Güncellendi', ''].map(
                (c) => (
                  <th
                    key={c}
                    className="px-3 py-2 text-left text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[var(--a-text-3)] border-b border-[var(--a-line)]"
                  >
                    {c}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {flags.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-12 text-[12px] text-[var(--a-text-4)]"
                >
                  Henüz feature flag yok. Sağ üstten ekleyin.
                </td>
              </tr>
            ) : (
              flags.map((f) => (
                <tr
                  key={f.id}
                  className="border-b border-[var(--a-line)] hover:bg-white/[0.025] transition-colors"
                >
                  <td className="px-3 py-2">
                    <MonoTag>{f.key}</MonoTag>
                  </td>
                  <td className="px-3 py-2 text-[var(--a-text-2)] truncate max-w-[360px]">
                    {f.description ?? <span className="text-[var(--a-text-5)]">—</span>}
                  </td>
                  <td className="px-3 py-2">
                    <AdminBadge tone={f.tenantId ? 'iris' : 'neutral'}>
                      {f.tenantId ? `tenant #${f.tenantId}` : 'global'}
                    </AdminBadge>
                  </td>
                  <td className="px-3 py-2 w-[180px]">
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={f.rolloutPct}
                        onChange={(e) =>
                          updateRollout(f, Number(e.target.value))
                        }
                        className="flex-1 accent-[var(--a-accent-2)]"
                      />
                      <span className="num text-[11px] text-[var(--a-text-3)] w-9 text-right">
                        {f.rolloutPct}%
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <AdminSwitch
                      checked={f.enabled}
                      onCheckedChange={(v) => toggle(f, v)}
                      disabled={pendingId === f.id}
                    />
                  </td>
                  <td className="px-3 py-2 text-[var(--a-text-4)] num text-[11.5px]">
                    {new Date(f.updatedAt).toLocaleString('tr-TR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <IconButton
                      size="xs"
                      variant="ghost"
                      onClick={() => removeFlag(f)}
                      aria-label="Sil"
                    >
                      <Trash2 className="w-3 h-3" />
                    </IconButton>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
