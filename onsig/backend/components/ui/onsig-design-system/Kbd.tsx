import * as React from 'react'
import { cn } from './cn'

/**
 * Keyboard shortcut indicator. Renders one or more `<kbd>` chips, joined by
 * thin "+" separators. Use for inline hints next to actions.
 *
 *   <Kbd>⌘</Kbd> <Kbd>K</Kbd>
 *   <Shortcut keys={['⌘', 'K']} />
 */
export function Kbd({
  children,
  className,
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1',
        'rounded text-[10px] font-semibold font-mono uppercase tracking-tight',
        'bg-ink-2 text-ink-9',
        'shadow-[inset_0_-1px_0_rgba(11,15,27,0.10)] ring-1 ring-inset ring-divider',
        className
      )}
    >
      {children}
    </kbd>
  )
}

export function Shortcut({
  keys,
  className,
}: {
  keys: string[]
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {keys.map((k, i) => (
        <React.Fragment key={`${k}-${i}`}>
          <Kbd>{k}</Kbd>
        </React.Fragment>
      ))}
    </span>
  )
}
