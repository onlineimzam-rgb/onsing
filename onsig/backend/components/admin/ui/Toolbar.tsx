'use client'

import * as React from 'react'
import { Search, X } from 'lucide-react'
import { cn } from './cn'

/**
 * Admin search input — used inside tables, panels, modals.
 */
export function AdminInput({
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...rest}
      className={cn(
        'h-7 px-2.5 text-[12.5px] rounded-[6px]',
        'bg-[#0F1424] ring-1 ring-[var(--a-line-2)] text-[var(--a-text-1)]',
        'placeholder:text-[var(--a-text-4)]',
        'focus:outline-none focus:ring-[var(--a-accent)]',
        'transition-colors duration-150',
        className
      )}
    />
  )
}

export function AdminSelect({
  className,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...rest}
      className={cn(
        'h-7 px-2 pr-7 text-[12.5px] rounded-[6px] appearance-none',
        'bg-[#0F1424] ring-1 ring-[var(--a-line-2)] text-[var(--a-text-1)]',
        "bg-[url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'><path fill='%238B92A6' d='M5 6.7L1.5 3.2 2.6 2l2.4 2.4L7.4 2l1.1 1.1z'/></svg>\")] bg-no-repeat",
        'bg-[length:10px] bg-[right_8px_center]',
        'focus:outline-none focus:ring-[var(--a-accent)]',
        className
      )}
    />
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Ara...',
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cn('relative inline-flex items-center w-full max-w-[280px]', className)}>
      <Search className="absolute left-2.5 w-3.5 h-3.5 text-[var(--a-text-4)] pointer-events-none" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'h-7 w-full pl-7 pr-7 text-[12.5px] rounded-[6px]',
          'bg-[#0F1424] ring-1 ring-[var(--a-line-2)] text-[var(--a-text-1)]',
          'placeholder:text-[var(--a-text-4)]',
          'focus:outline-none focus:ring-[var(--a-accent)] transition-colors'
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-1.5 grid place-items-center w-5 h-5 text-[var(--a-text-4)] hover:text-[var(--a-text-1)]"
          aria-label="Aramayı temizle"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

/**
 * FilterChip — single-select toggle pill that drives a filter URL param.
 */
export function FilterChip({
  active,
  onClick,
  children,
  count,
}: {
  active?: boolean
  onClick?: () => void
  children: React.ReactNode
  count?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 h-7 px-2.5 text-[12px] rounded-[6px] font-medium tracking-tight',
        'transition-colors duration-150',
        active
          ? 'bg-[#15172A] text-[var(--a-text-1)] ring-1 ring-[var(--a-line-3)] shadow-[inset_0_0_0_1px_rgba(124,119,255,0.25)]'
          : 'text-[var(--a-text-3)] hover:text-[var(--a-text-1)] hover:bg-white/5 ring-1 ring-transparent'
      )}
    >
      {children}
      {typeof count === 'number' && (
        <span
          className={cn(
            'inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-semibold num',
            active
              ? 'bg-[var(--a-accent-2)] text-white'
              : 'bg-white/5 text-[var(--a-text-3)]'
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}

export function Toolbar({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-4 py-2.5 border-b border-[var(--a-line)] bg-[var(--a-bg-elev)]',
        className
      )}
    >
      {children}
    </div>
  )
}

export function ToolbarLeft({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2 min-w-0 flex-wrap">{children}</div>
}

export function ToolbarRight({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-1.5 shrink-0">{children}</div>
}
