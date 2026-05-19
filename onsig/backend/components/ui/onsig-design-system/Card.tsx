import * as React from 'react'
import { cn } from './cn'

export type CardVariant =
  | 'default'
  | 'elevated'
  | 'interactive'
  | 'outline'
  | 'glass'
  | 'gradient'
  | 'legal'
  | 'dark'

export type CardPadding = 'none' | 'sm' | 'md' | 'lg'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: CardPadding
  /** Render as a different tag (e.g. `as="a"`, `as="article"`). */
  as?: 'div' | 'a' | 'article' | 'section' | 'li' | 'button'
  /** When true the card slightly lifts on hover (independent of variant). */
  interactive?: boolean
}

const PADDING: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
}

const VARIANT: Record<CardVariant, string> = {
  default:
    'bg-paper border border-divider shadow-sm',
  elevated:
    'bg-paper border border-divider shadow-md',
  interactive:
    'bg-paper border border-divider shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-divider-strong transition-all duration-220 ease-emphasized cursor-pointer',
  outline:
    'bg-paper border border-divider-strong shadow-none',
  glass:
    'bg-white/70 border border-white/40 shadow-sm backdrop-blur-glass',
  gradient:
    'bg-iris-radial bg-paper border border-divider shadow-sm',
  legal:
    'bg-paper border border-divider shadow-sm relative overflow-hidden before:content-[\'\'] before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-iris-9 before:via-iris-6 before:to-iris-3',
  dark:
    'bg-ink-12 text-ink-1 border border-white/8 shadow-pop',
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      as: Tag = 'div',
      interactive,
      className,
      ...rest
    },
    ref
  ) => {
    const Comp = Tag as 'div'
    return (
      <Comp
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn(
          'rounded-card',
          VARIANT[variant],
          PADDING[padding],
          interactive &&
            variant !== 'interactive' &&
            'cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all duration-220 ease-emphasized',
          className
        )}
        {...rest}
      />
    )
  }
)
Card.displayName = 'Card'

/** A flush container for a divided list/table inside a card. */
export function CardList({
  className,
  ...rest
}: React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul
      className={cn('divide-y divide-divider', className)}
      {...rest}
    />
  )
}

/** Compact, sticky-feel card header with overline + title + actions. */
export function CardHeader({
  overline,
  title,
  description,
  actions,
  className,
}: {
  overline?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 mb-4',
        className
      )}
    >
      <div className="min-w-0">
        {overline && (
          <p className="text-2xs uppercase tracking-[0.16em] font-semibold text-ink-7">
            {overline}
          </p>
        )}
        <h3 className="section-title mt-0.5 truncate">{title}</h3>
        {description && (
          <p className="text-xs text-ink-7 mt-1 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="shrink-0 flex items-center gap-1.5">{actions}</div>}
    </div>
  )
}
