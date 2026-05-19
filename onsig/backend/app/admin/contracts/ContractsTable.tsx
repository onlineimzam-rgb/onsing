'use client'

import * as React from 'react'
import Link from 'next/link'
import { Download } from 'lucide-react'
import {
  AdminBadge,
  AdminButton,
  Column,
  DataTable,
  FilterChip,
  MonoTag,
  Panel,
  SearchInput,
  Toolbar,
  ToolbarLeft,
  ToolbarRight,
} from '@/components/admin/ui'

export interface ContractRow {
  id: number
  tenantId: number
  tenantName: string
  templateKey: string
  status: string
  title: string | null
  createdAt: string
}

const STATUSES = ['all', 'taslak', 'aktif', 'tamamlandi', 'iptal'] as const

const STATUS_TONE: Record<string, 'neutral' | 'iris' | 'success' | 'warning' | 'danger'> = {
  taslak: 'neutral',
  aktif: 'iris',
  tamamlandi: 'success',
  iptal: 'danger',
}

export function ContractsTable({ rows }: { rows: ContractRow[] }) {
  const [status, setStatus] = React.useState<(typeof STATUSES)[number]>('all')
  const [query, setQuery] = React.useState('')

  const filtered = React.useMemo(() => {
    return rows.filter((r) => {
      if (status !== 'all' && r.status !== status) return false
      if (query) {
        const q = query.toLowerCase()
        return (
          r.tenantName.toLowerCase().includes(q) ||
          r.templateKey.toLowerCase().includes(q) ||
          (r.title ?? '').toLowerCase().includes(q) ||
          String(r.id).includes(q)
        )
      }
      return true
    })
  }, [rows, status, query])

  const statusCounts = React.useMemo(() => {
    const m = new Map<string, number>()
    rows.forEach((r) => m.set(r.status, (m.get(r.status) ?? 0) + 1))
    return m
  }, [rows])

  const columns: Column<ContractRow>[] = [
    {
      id: 'id',
      header: 'ID',
      cell: (r) => <MonoTag>#{r.id}</MonoTag>,
      sortValue: (r) => r.id,
    },
    {
      id: 'tenant',
      header: 'Tenant',
      cell: (r) => (
        <Link
          href={`/admin/tenants/${r.tenantId}`}
          className="text-[var(--a-text-2)] hover:text-[var(--a-accent)] truncate font-medium"
        >
          {r.tenantName}
        </Link>
      ),
      sortValue: (r) => r.tenantName,
    },
    {
      id: 'title',
      header: 'Başlık',
      cell: (r) => (
        <span className="text-[var(--a-text-1)] truncate block max-w-[280px]">
          {r.title ?? <span className="text-[var(--a-text-5)]">(başlıksız)</span>}
        </span>
      ),
      sortValue: (r) => r.title ?? '',
    },
    {
      id: 'template',
      header: 'Şablon',
      cell: (r) => <MonoTag>{r.templateKey}</MonoTag>,
      sortValue: (r) => r.templateKey,
    },
    {
      id: 'status',
      header: 'Durum',
      cell: (r) => (
        <AdminBadge tone={STATUS_TONE[r.status] ?? 'neutral'} dot>
          {r.status}
        </AdminBadge>
      ),
      sortValue: (r) => r.status,
    },
    {
      id: 'createdAt',
      header: 'Oluşturulma',
      align: 'right',
      cell: (r) => (
        <span className="text-[11.5px] text-[var(--a-text-4)] num">
          {new Date(r.createdAt).toLocaleString('tr-TR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
      sortValue: (r) => r.createdAt,
    },
  ]

  return (
    <Panel flush>
      <Toolbar>
        <ToolbarLeft>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Tenant, şablon, başlık..."
          />
          <span className="h-6 w-px bg-[var(--a-line)] mx-1" />
          {STATUSES.map((s) => (
            <FilterChip
              key={s}
              active={status === s}
              onClick={() => setStatus(s)}
              count={s === 'all' ? rows.length : statusCounts.get(s) ?? 0}
            >
              {s === 'all' ? 'Hepsi' : s}
            </FilterChip>
          ))}
        </ToolbarLeft>
        <ToolbarRight>
          <AdminButton variant="secondary" size="sm">
            <Download className="w-3 h-3" />
            CSV
          </AdminButton>
        </ToolbarRight>
      </Toolbar>

      <DataTable<ContractRow>
        rows={filtered}
        columns={columns}
        getRowId={(r) => r.id}
        density="compact"
      />
    </Panel>
  )
}
