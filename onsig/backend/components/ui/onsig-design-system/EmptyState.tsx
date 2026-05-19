import * as React from 'react'
import { cn } from './cn'

export interface EmptyStateProps {
  /** Decorative icon (rendered inside a soft pill). */
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
  /** A subtle dotted background for emphasis (e.g. empty dashboards). */
  pattern?: boolean
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  pattern,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'text-center px-6 py-12 rounded-card border border-dashed border-divider-strong relative overflow-hidden',
        pattern && 'dotted-bg',
        className
      )}
    >
      {icon && (
        <div className="relative inline-grid place-items-center w-12 h-12 rounded-2xl bg-iris-1 text-iris-10 mx-auto mb-3 shadow-ring [&>svg]:w-5 [&>svg]:h-5">
          {icon}
          <span className="absolute inset-0 rounded-2xl ring-1 ring-iris-3/60" />
        </div>
      )}
      <h3 className="font-display text-base font-semibold tracking-tight text-ink-12">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-sm text-ink-7 max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5 inline-flex">{action}</div>}
    </div>
  )
}
