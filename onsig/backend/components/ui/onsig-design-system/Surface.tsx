import * as React from 'react'
import { cn } from './cn'

/**
 * Surface — a soft sub-region inside a card. Useful for highlighting a single
 * area without introducing a full card border (which would compete with the
 * parent card). Variants:
 *   - default: faint inset
 *   - sunken:  slightly darker (e.g. log viewers, code blocks)
 *   - tint:    iris-tinted (e.g. callouts, "what's new" rows)
 *   - line:    just a hairline rule (no fill)
 */

export type SurfaceVariant = 'default' | 'sunken' | 'tint' | 'line'

const VARIANT: Record<SurfaceVariant, string> = {
  default: 'bg-ink-2',
  sunken: 'bg-ink-3 ring-1 ring-inset ring-divider',
  tint: 'bg-iris-1 ring-1 ring-inset ring-iris-3/60',
  line: 'ring-1 ring-inset ring-divider',
}

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant
}

export function Surface({
  variant = 'default',
  className,
  ...rest
}: SurfaceProps) {
  return (
    <div
      className={cn('rounded-md p-3', VARIANT[variant], className)}
      {...rest}
    />
  )
}

/** A horizontal rule that respects the divider token. */
export function Divider({
  className,
  vertical,
}: {
  className?: string
  vertical?: boolean
}) {
  return (
    <span
      aria-hidden
      className={cn(
        vertical
          ? 'inline-block w-px h-full bg-divider'
          : 'block h-px w-full bg-divider',
        className
      )}
    />
  )
}
