import * as React from 'react'
import { cn } from './cn'

export type BadgeTone =
  | 'neutral'
  | 'iris'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'ink'

export type BadgeSize = 'xs' | 'sm' | 'md'

const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-ink-2 text-ink-10 ring-1 ring-inset ring-divider',
  iris: 'bg-iris-1 text-iris-11 ring-1 ring-inset ring-iris-3',
  success: 'bg-success-soft text-success-deep ring-1 ring-inset ring-success/20',
  warning: 'bg-warning-soft text-warning-deep ring-1 ring-inset ring-warning/20',
  danger: 'bg-danger-soft text-danger-deep ring-1 ring-inset ring-danger/20',
  info: 'bg-info-soft text-info-deep ring-1 ring-inset ring-info/20',
  ink: 'bg-ink-12 text-paper ring-1 ring-inset ring-white/10',
}

const DOT_TONE: Record<BadgeTone, string> = {
  neutral: 'bg-ink-7',
  iris: 'bg-iris-9',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  ink: 'bg-paper',
}

const SIZE: Record<BadgeSize, string> = {
  xs: 'h-4 px-1.5 text-[10px] gap-1',
  sm: 'h-5 px-1.5 text-[11px] gap-1',
  md: 'h-6 px-2 text-xs gap-1.5',
}

export interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  tone?: BadgeTone
  size?: BadgeSize
  dot?: boolean
  /** Render an outlined chip instead of a tinted background. */
  outline?: boolean
  children: React.ReactNode
}

export function Badge({
  tone = 'neutral',
  size = 'sm',
  dot,
  outline,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold tracking-tight whitespace-nowrap',
        SIZE[size],
        outline
          ? 'bg-transparent ring-1 ring-inset ring-divider-strong text-ink-10'
          : TONE[tone],
        className
      )}
      {...rest}
    >
      {dot && (
        <span
          aria-hidden
          className={cn(
            'inline-block w-1.5 h-1.5 rounded-full',
            DOT_TONE[tone]
          )}
        />
      )}
      {children}
    </span>
  )
}

/** A pill — looks like a badge but with subtle drop shadow for emphasis. */
export function Pill({
  tone = 'neutral',
  size = 'sm',
  children,
  className,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill font-semibold tracking-tight whitespace-nowrap',
        'shadow-ring',
        SIZE[size],
        TONE[tone],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  )
}

/** A dot indicator only — for status columns / list rows. */
export function StatusDot({
  tone = 'neutral',
  pulse,
  className,
}: {
  tone?: BadgeTone
  pulse?: boolean
  className?: string
}) {
  return (
    <span aria-hidden className={cn('relative inline-flex', className)}>
      <span className={cn('inline-block w-2 h-2 rounded-full', DOT_TONE[tone])} />
      {pulse && (
        <span
          className={cn(
            'absolute inset-0 inline-block w-2 h-2 rounded-full opacity-60 animate-ping',
            DOT_TONE[tone]
          )}
        />
      )}
    </span>
  )
}
