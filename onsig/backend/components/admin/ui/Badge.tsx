import * as React from 'react'
import { cn } from './cn'

type Tone =
  | 'neutral'
  | 'iris'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'outline'

const TONES: Record<Tone, string> = {
  neutral: 'bg-white/5 text-[var(--a-text-2)] ring-1 ring-[var(--a-line-2)]',
  iris:    'bg-[#1B1A4F] text-[#B7B3FF] ring-1 ring-[#3B3597]',
  success: 'bg-[#06231F] text-[#5EEAD4] ring-1 ring-[#134E4A]',
  warning: 'bg-[#251703] text-[#FBBF24] ring-1 ring-[#92400E]',
  danger:  'bg-[#2A0F15] text-[#FCA5A5] ring-1 ring-[#7F1D1D]',
  info:    'bg-[#062539] text-[#7DD3FC] ring-1 ring-[#0C4A6E]',
  outline: 'bg-transparent text-[var(--a-text-2)] ring-1 ring-[var(--a-line-2)]',
}

const DOT: Record<Tone, string> = {
  neutral: 'bg-[var(--a-text-4)]',
  iris:    'bg-[#A5A0FC]',
  success: 'bg-[#5EEAD4]',
  warning: 'bg-[#FBBF24]',
  danger:  'bg-[#FCA5A5]',
  info:    'bg-[#7DD3FC]',
  outline: 'bg-[var(--a-text-4)]',
}

export function AdminBadge({
  tone = 'neutral',
  dot,
  className,
  children,
}: {
  tone?: Tone
  dot?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 h-[18px] rounded-full text-[10.5px] font-semibold tracking-tight whitespace-nowrap',
        TONES[tone],
        className
      )}
    >
      {dot && <span className={cn('block w-1.5 h-1.5 rounded-full', DOT[tone])} />}
      {children}
    </span>
  )
}

/**
 * Tiny status dot, optionally with pulse animation. Use to indicate live state
 * (online, processing, error) next to a label or a metric.
 */
export function StatusDot({
  tone = 'success',
  pulse,
  className,
}: {
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  pulse?: boolean
  className?: string
}) {
  const palette: Record<typeof tone, string> = {
    success: 'bg-[#5EEAD4]',
    warning: 'bg-[#FBBF24]',
    danger: 'bg-[#FCA5A5]',
    info: 'bg-[#7DD3FC]',
    neutral: 'bg-[var(--a-text-5)]',
  }
  return (
    <span className={cn('relative inline-block', className)}>
      <span
        className={cn('block w-2 h-2 rounded-full', palette[tone])}
        aria-hidden
      />
      {pulse && (
        <span
          className={cn(
            'absolute inset-0 rounded-full animate-pulse-soft opacity-60',
            palette[tone]
          )}
          aria-hidden
        />
      )}
    </span>
  )
}
