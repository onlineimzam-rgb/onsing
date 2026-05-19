import * as React from 'react'
import { cn } from './cn'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'dark'
  | 'danger'
  | 'success'
  | 'link'

export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    'text-white bg-gradient-to-b from-iris-8 to-iris-10 ' +
    'shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_1px_2px_rgba(11,15,27,0.18),0_4px_12px_rgba(94,85,229,0.25)] ' +
    'hover:from-iris-7 hover:to-iris-9 hover:shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_2px_4px_rgba(11,15,27,0.16),0_8px_24px_rgba(94,85,229,0.30)] ' +
    'active:scale-[0.985]',
  secondary:
    'text-ink-11 bg-paper shadow-ring hover:shadow-ring-strong ' +
    'hover:bg-ink-1 hover:text-ink-12 active:scale-[0.985]',
  ghost:
    'text-ink-9 bg-transparent hover:bg-ink-2 hover:text-ink-12 active:bg-ink-3',
  dark:
    'text-paper bg-ink-12 shadow-[0_1px_0_rgba(255,255,255,0.10)_inset,0_1px_2px_rgba(11,15,27,0.30)] ' +
    'hover:bg-ink-11 active:scale-[0.985]',
  danger:
    'text-danger-deep bg-danger-soft ' +
    'shadow-[inset_0_0_0_1px_rgba(239,68,68,0.22)] ' +
    'hover:bg-[#fde0e0] hover:shadow-[inset_0_0_0_1px_rgba(239,68,68,0.32)] ' +
    'active:scale-[0.985]',
  success:
    'text-success-deep bg-success-soft ' +
    'shadow-[inset_0_0_0_1px_rgba(16,185,129,0.22)] ' +
    'hover:bg-[#d8f5e7] hover:shadow-[inset_0_0_0_1px_rgba(16,185,129,0.34)] ' +
    'active:scale-[0.985]',
  link:
    'text-iris-10 bg-transparent hover:text-iris-11 underline-offset-2 hover:underline',
}

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-[12px] rounded gap-1',
  md: 'h-9 px-3.5 text-[13px] rounded-md gap-1.5',
  lg: 'h-11 px-5 text-sm rounded-lg gap-2',
}

const BASE =
  'relative inline-flex items-center justify-center font-semibold tracking-tight ' +
  'transition-all duration-180 ease-emphasized select-none whitespace-nowrap ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iris-9/40 ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-paper ' +
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none'

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Span entire row width. */
  block?: boolean
  loading?: boolean
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
  children?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      block,
      loading,
      leadingIcon,
      trailingIcon,
      className,
      children,
      disabled,
      ...rest
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          BASE,
          VARIANT[variant],
          SIZE[size],
          block && 'w-full',
          loading && 'cursor-progress',
          className
        )}
        {...rest}
      >
        {loading ? (
          <Spinner />
        ) : (
          leadingIcon && <span className="shrink-0">{leadingIcon}</span>
        )}
        {children}
        {!loading && trailingIcon && <span className="shrink-0">{trailingIcon}</span>}
      </button>
    )
  }
)

function Spinner() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="w-3.5 h-3.5 animate-spin"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="8" cy="8" r="6" opacity="0.25" />
      <path d="M14 8a6 6 0 0 1-6 6" strokeLinecap="round" />
    </svg>
  )
}

// ── IconButton ──────────────────────────────────────────────────────────────
export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Required for accessibility — describes the icon. */
  'aria-label': string
  children: React.ReactNode
}

const ICON_SIZE: Record<ButtonSize, string> = {
  sm: 'w-7 h-7 rounded',
  md: 'w-9 h-9 rounded-md',
  lg: 'w-11 h-11 rounded-lg',
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { variant = 'ghost', size = 'md', className, children, ...rest },
    ref
  ) {
    return (
      <button
        ref={ref}
        className={cn(
          BASE,
          VARIANT[variant],
          ICON_SIZE[size],
          'p-0 inline-grid place-items-center',
          className
        )}
        {...rest}
      >
        {children}
      </button>
    )
  }
)

// ── ButtonGroup ─────────────────────────────────────────────────────────────
export function ButtonGroup({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center [&>*]:rounded-none [&>*]:shadow-none ' +
          '[&>*:first-child]:rounded-l-md [&>*:last-child]:rounded-r-md ' +
          '[&>*:not(:first-child)]:-ml-px ' +
          '[&>*]:relative hover:[&>*]:z-10 focus-within:[&>*]:z-10',
        className
      )}
    >
      {children}
    </div>
  )
}
