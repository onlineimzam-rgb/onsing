import * as React from 'react'
import { cn } from './cn'

/** Tenant / user avatar that derives a deterministic color from a seed. */
export function AdminAvatar({
  name,
  size = 24,
  className,
}: {
  name: string
  size?: number
  className?: string
}) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
  const hue = hash(name) % 360
  return (
    <span
      className={cn(
        'inline-grid place-items-center rounded-full font-semibold ring-1 ring-white/10',
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(9, Math.floor(size / 2.3)),
        background: `linear-gradient(135deg, hsl(${hue} 45% 35%), hsl(${(hue + 30) % 360} 50% 22%))`,
        color: '#F1F3F8',
      }}
      aria-hidden
    >
      {initials || '?'}
    </span>
  )
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

/** Inline monospaced ID / hash chip. */
export function MonoTag({
  children,
  className,
  truncate,
}: {
  children: React.ReactNode
  className?: string
  truncate?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 h-[18px] rounded-[4px] font-mono text-[11px]',
        'bg-white/[0.04] text-[var(--a-text-2)] ring-1 ring-[var(--a-line)]',
        truncate && 'max-w-[140px] truncate',
        className
      )}
    >
      {children}
    </span>
  )
}

/** Inline percentage bar — used in usage tables. */
export function UsageBar({
  value,
  max,
  tone = 'iris',
}: {
  value: number
  max: number
  tone?: 'iris' | 'success' | 'warning' | 'danger'
}) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))
  const colors: Record<typeof tone, string> = {
    iris: 'bg-[var(--a-accent)]',
    success: 'bg-[#2DD4BF]',
    warning: 'bg-[#F59E0B]',
    danger: 'bg-[#F87171]',
  }
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <span
          className={cn('block h-full', colors[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] text-[var(--a-text-3)] num tabular-nums shrink-0">
        {pct.toFixed(0)}%
      </span>
    </div>
  )
}

/** Empty state block, dark-only variant. */
export function AdminEmpty({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-14 px-6',
        className
      )}
    >
      {icon && (
        <span className="mb-3 grid place-items-center w-10 h-10 rounded-full bg-white/5 text-[var(--a-text-3)]">
          {icon}
        </span>
      )}
      <div className="font-display text-[15px] font-semibold tracking-tight text-[var(--a-text-1)]">
        {title}
      </div>
      {description && (
        <div className="mt-1.5 text-[12.5px] text-[var(--a-text-3)] max-w-sm leading-relaxed">
          {description}
        </div>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
