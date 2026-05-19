import * as React from 'react'
import { cn } from './cn'

/**
 * Admin panel — dark surface card that replaces the `Card` component on the
 * SaaS-operator side. Heavier on data density and tighter padding than the
 * customer-facing Card.
 */
type Density = 'compact' | 'normal' | 'spacious'

const DENSITIES: Record<Density, string> = {
  compact: 'p-3',
  normal: 'p-4',
  spacious: 'p-5',
}

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  density?: Density
  /** Render with no padding so a custom layout can place its own children. */
  flush?: boolean
  /** Subtle inset shadow + brighter border. Used for primary tiles. */
  elevated?: boolean
}

export function Panel({
  density = 'normal',
  flush,
  elevated,
  className,
  children,
  ...rest
}: PanelProps) {
  return (
    <div
      className={cn(
        'relative rounded-[10px]',
        'bg-[var(--a-panel)] ring-1 ring-[var(--a-line)]',
        elevated && 'ring-[var(--a-line-2)] shadow-[0_0_0_1px_var(--a-line),_0_8px_24px_-8px_rgba(0,0,0,0.6)]',
        !flush && DENSITIES[density],
        className
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

export function PanelHeader({
  title,
  hint,
  actions,
  className,
}: {
  title: React.ReactNode
  hint?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 px-4 py-3 border-b border-[var(--a-line)]',
        className
      )}
    >
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[var(--a-text-3)] truncate">
          {title}
        </div>
        {hint && (
          <div className="mt-0.5 text-[11px] text-[var(--a-text-4)] truncate">
            {hint}
          </div>
        )}
      </div>
      {actions && <div className="flex items-center gap-1.5 shrink-0">{actions}</div>}
    </div>
  )
}

/** A thin section title divider used between sub-areas. */
export function PanelSubTitle({
  children,
  hint,
  className,
}: {
  children: React.ReactNode
  hint?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-1 py-2',
        className
      )}
    >
      <span className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[var(--a-text-3)]">
        {children}
      </span>
      {hint && (
        <span className="text-[11px] text-[var(--a-text-4)] num">{hint}</span>
      )}
    </div>
  )
}
