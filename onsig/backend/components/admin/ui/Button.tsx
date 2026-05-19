import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from './cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type Size = 'xs' | 'sm' | 'md' | 'lg'

const VARIANT: Record<Variant, string> = {
  primary:
    'bg-[var(--a-accent-2)] hover:bg-[var(--a-accent)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] active:scale-[0.985]',
  secondary:
    'bg-[var(--a-panel-2)] hover:bg-[#1B2236] text-[var(--a-text-1)] ring-1 ring-[var(--a-line-2)]',
  ghost:
    'bg-transparent hover:bg-white/5 text-[var(--a-text-2)] hover:text-[var(--a-text-1)]',
  danger:
    'bg-[#2A0F15] hover:bg-[#3A1620] text-[var(--a-danger)] ring-1 ring-[#7F1D1D]/50',
  success:
    'bg-[#06231F] hover:bg-[#0A2E29] text-[var(--a-success)] ring-1 ring-[#134E4A]/60',
}

const SIZE: Record<Size, string> = {
  xs: 'h-6 px-2 text-[11px] gap-1 rounded-[5px]',
  sm: 'h-7 px-2.5 text-[12px] gap-1 rounded-[6px]',
  md: 'h-8 px-3 text-[13px] gap-1.5 rounded-[7px]',
  lg: 'h-9 px-3.5 text-[13px] gap-2 rounded-[8px]',
}

export interface AdminButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  iconOnly?: boolean
  loading?: boolean
}

export const AdminButton = React.forwardRef<HTMLButtonElement, AdminButtonProps>(
  function AdminButton(
    { variant = 'secondary', size = 'sm', iconOnly, loading, className, children, disabled, ...rest },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={rest.type ?? 'button'}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium tracking-tight',
          'transition-all duration-150',
          'disabled:opacity-50 disabled:pointer-events-none',
          VARIANT[variant],
          SIZE[size],
          iconOnly && '!px-0 !w-' + (size === 'lg' ? '9' : size === 'md' ? '8' : size === 'sm' ? '7' : '6'),
          className
        )}
        {...rest}
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {children}
      </button>
    )
  }
)

/** Icon-only square button. */
export const IconButton = React.forwardRef<
  HTMLButtonElement,
  Omit<AdminButtonProps, 'iconOnly'>
>(function IconButton({ size = 'sm', className, ...rest }, ref) {
  const square = size === 'lg' ? 'w-9' : size === 'md' ? 'w-8' : size === 'sm' ? 'w-7' : 'w-6'
  return (
    <AdminButton
      ref={ref}
      size={size}
      className={cn('!px-0', square, className)}
      {...rest}
    />
  )
})
