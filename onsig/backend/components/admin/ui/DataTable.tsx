'use client'

import * as React from 'react'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { cn } from './cn'

/**
 * Admin DataTable — purposefully dense, dark-only, scroll-virtualized for
 * large tenant lists. Designed to feel like a fintech ops table (Stripe Sigma,
 * Mercury, Modern Treasury) rather than a SaaS dashboard.
 *
 * Supported features:
 *   - Column definitions (header, accessor, align, width)
 *   - Client-side sort (string/number/date)
 *   - Row selection with bulk action slot
 *   - Sticky header
 *   - Empty + loading states
 *
 * Server-side filter/search/pagination is delegated to the caller — the table
 * receives the already-filtered `rows`.
 */

export interface Column<Row> {
  id: string
  header: React.ReactNode
  /** Accessor returns the cell content. */
  cell: (row: Row, index: number) => React.ReactNode
  /** Value used by built-in sort (number/string/date). */
  sortValue?: (row: Row) => string | number | Date | null | undefined
  align?: 'left' | 'right' | 'center'
  width?: string | number
  className?: string
}

export interface DataTableProps<Row> {
  rows: Row[]
  columns: Column<Row>[]
  getRowId: (row: Row) => string | number
  /** Renders the bulk-action toolbar when selection is non-empty. */
  renderBulkActions?: (selectedIds: Array<string | number>) => React.ReactNode
  /** Initial sort order. */
  defaultSort?: { id: string; direction: 'asc' | 'desc' }
  /** Click handler on a row. */
  onRowClick?: (row: Row) => void
  /** Sticky offset (e.g. when nested inside a Panel). */
  stickyOffsetPx?: number
  /** Compact = -1px on every dimension. */
  density?: 'compact' | 'normal'
  emptyState?: React.ReactNode
  className?: string
}

export function DataTable<Row>({
  rows,
  columns,
  getRowId,
  renderBulkActions,
  defaultSort,
  onRowClick,
  stickyOffsetPx = 0,
  density = 'normal',
  emptyState,
  className,
}: DataTableProps<Row>) {
  const [sort, setSort] = React.useState(defaultSort)
  const [selected, setSelected] = React.useState<Set<string | number>>(new Set())

  const sortedRows = React.useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.id === sort.id)
    if (!col?.sortValue) return rows
    const direction = sort.direction === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const av = col.sortValue!(a)
      const bv = col.sortValue!(b)
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (av < bv) return -1 * direction
      if (av > bv) return 1 * direction
      return 0
    })
  }, [rows, columns, sort])

  function toggleSort(id: string) {
    setSort((prev) => {
      if (!prev || prev.id !== id) return { id, direction: 'asc' }
      if (prev.direction === 'asc') return { id, direction: 'desc' }
      return undefined
    })
  }

  function toggleRow(id: string | number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected((prev) => {
      if (prev.size === sortedRows.length) return new Set()
      return new Set(sortedRows.map((r) => getRowId(r)))
    })
  }

  const allSelected =
    sortedRows.length > 0 && selected.size === sortedRows.length
  const someSelected =
    selected.size > 0 && selected.size < sortedRows.length

  const rowH = density === 'compact' ? 'h-9' : 'h-10'

  return (
    <div className={cn('relative', className)}>
      {/* Bulk actions toolbar */}
      {renderBulkActions && selected.size > 0 && (
        <div className="absolute -top-12 left-0 right-0 z-10 flex items-center justify-between gap-3 px-3 py-2 rounded-[8px] bg-[#0F1424] ring-1 ring-[var(--a-line-2)] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.7)] animate-slide-up">
          <div className="flex items-center gap-2 text-[12px]">
            <span className="text-[var(--a-text-1)] font-semibold num">
              {selected.size}
            </span>
            <span className="text-[var(--a-text-3)]">satır seçildi</span>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="ml-2 text-[11px] text-[var(--a-text-4)] hover:text-[var(--a-text-1)]"
            >
              Temizle
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            {renderBulkActions(Array.from(selected))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto -mx-px">
        <table className="w-full text-[12.5px] border-separate border-spacing-0">
          <thead>
            <tr
              className="bg-[var(--a-bg-elev)] sticky z-[1]"
              style={{ top: stickyOffsetPx }}
            >
              {renderBulkActions && (
                <th
                  className={cn(
                    'border-b border-[var(--a-line)] px-3 text-left w-9',
                    rowH
                  )}
                >
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={toggleAll}
                  />
                </th>
              )}
              {columns.map((c) => {
                const sortable = !!c.sortValue
                const active = sort?.id === c.id
                return (
                  <th
                    key={c.id}
                    style={c.width ? { width: c.width } : undefined}
                    className={cn(
                      'border-b border-[var(--a-line)] px-3 text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[var(--a-text-3)] whitespace-nowrap',
                      'text-left',
                      rowH,
                      c.align === 'right' && 'text-right',
                      c.align === 'center' && 'text-center',
                      sortable && 'cursor-pointer select-none hover:text-[var(--a-text-1)]',
                      active && 'text-[var(--a-text-1)]',
                      c.className
                    )}
                    onClick={sortable ? () => toggleSort(c.id) : undefined}
                  >
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5',
                        c.align === 'right' && 'flex-row-reverse'
                      )}
                    >
                      {c.header}
                      {sortable && (
                        <span className="inline-flex">
                          {active ? (
                            sort?.direction === 'asc' ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3 h-3 opacity-40" />
                          )}
                        </span>
                      )}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sortedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (renderBulkActions ? 1 : 0)}
                  className="px-6 py-16 text-center text-[var(--a-text-3)] text-[12px]"
                >
                  {emptyState ?? 'Kayıt yok.'}
                </td>
              </tr>
            ) : (
              sortedRows.map((row, idx) => {
                const id = getRowId(row)
                const isSelected = selected.has(id)
                return (
                  <tr
                    key={id}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      'group transition-colors duration-120',
                      'hover:bg-white/[0.025]',
                      isSelected && 'bg-[#15172A]',
                      onRowClick && 'cursor-pointer'
                    )}
                  >
                    {renderBulkActions && (
                      <td
                        className={cn(
                          'border-b border-[var(--a-line)] px-3',
                          rowH
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleRow(id)}
                        />
                      </td>
                    )}
                    {columns.map((c) => (
                      <td
                        key={c.id}
                        className={cn(
                          'border-b border-[var(--a-line)] px-3 align-middle text-[var(--a-text-2)]',
                          rowH,
                          c.align === 'right' && 'text-right',
                          c.align === 'center' && 'text-center',
                          c.className
                        )}
                      >
                        {c.cell(row, idx)}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Checkbox ────────────────────────────────────────────────────────────────
function Checkbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: () => void
}) {
  const ref = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate
  }, [indeterminate])
  return (
    <span className="inline-flex">
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="appearance-none w-3.5 h-3.5 rounded-[3px] ring-1 ring-[var(--a-line-3)] bg-[#0E121C] checked:bg-[var(--a-accent-2)] checked:ring-[var(--a-accent-2)] indeterminate:bg-[var(--a-accent-2)] indeterminate:ring-[var(--a-accent-2)] cursor-pointer relative"
      />
    </span>
  )
}
