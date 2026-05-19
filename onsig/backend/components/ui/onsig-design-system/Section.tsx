import * as React from 'react'
import { cn } from './cn'

export interface SectionProps {
  overline?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
  children?: React.ReactNode
  /** Render the title in display 2xl (for page-level sections). */
  size?: 'sm' | 'md' | 'lg'
}

const TITLE_SIZE: Record<NonNullable<SectionProps['size']>, string> = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-2xl',
}

export function Section({
  overline,
  title,
  description,
  actions,
  className,
  children,
  size = 'md',
}: SectionProps) {
  return (
    <section className={cn('space-y-3', className)}>
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          {overline && (
            <p className="text-2xs uppercase tracking-[0.16em] font-semibold text-ink-7">
              {overline}
            </p>
          )}
          <h2
            className={cn(
              'font-display font-semibold tracking-tightest text-ink-12 mt-0.5',
              TITLE_SIZE[size]
            )}
          >
            {title}
          </h2>
          {description && (
            <p className="text-sm text-ink-7 mt-1 leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-1.5">{actions}</div>}
      </header>
      {children}
    </section>
  )
}
