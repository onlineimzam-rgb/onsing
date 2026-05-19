import * as React from 'react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from './cn'

/**
 * KPI card for the SaaS admin home. Shows a single metric with optional
 * delta-vs-previous and a tiny sparkline slot.
 */
export interface KpiProps {
  label: React.ReactNode
  value: React.ReactNode
  /** Sub-label shown right under the value (e.g. unit, period). */
  hint?: React.ReactNode
  /** Delta in percent. +ve = up, -ve = down. */
  deltaPct?: number
  /** When true, "down" is considered good (churn, errors). */
  deltaInverse?: boolean
  /** Icon shown top-right. */
  icon?: React.ReactNode
  /** Tiny chart shown below the value. */
  chart?: React.ReactNode
  className?: string
}

export function Kpi({
  label,
  value,
  hint,
  deltaPct,
  deltaInverse,
  icon,
  chart,
  className,
}: KpiProps) {
  return (
    <div
      className={cn(
        'relative px-4 py-4 rounded-[10px] bg-[var(--a-panel)] ring-1 ring-[var(--a-line)] overflow-hidden',
        'hover:ring-[var(--a-line-2)] transition-colors duration-180',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[var(--a-text-3)] truncate">
          {label}
        </span>
        {icon && (
          <span className="grid place-items-center w-6 h-6 rounded-md bg-white/5 text-[var(--a-text-3)]">
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-display text-[26px] leading-none tracking-tightest text-[var(--a-text-1)] num">
          {value}
        </span>
        {hint && (
          <span className="text-[11px] text-[var(--a-text-4)] num">{hint}</span>
        )}
      </div>
      {typeof deltaPct === 'number' && (
        <div className="mt-1.5">
          <Delta value={deltaPct} inverse={deltaInverse} />
        </div>
      )}
      {chart && <div className="mt-3 -mx-1">{chart}</div>}
    </div>
  )
}

function Delta({ value, inverse }: { value: number; inverse?: boolean }) {
  const up = value > 0
  const flat = value === 0
  const positive = inverse ? !up : up
  const tone = flat
    ? 'text-[var(--a-text-4)] bg-white/[0.04] ring-[var(--a-line)]'
    : positive
      ? 'text-[#5EEAD4] bg-[#06231F] ring-[#134E4A]/70'
      : 'text-[#FCA5A5] bg-[#2A0F15] ring-[#7F1D1D]/60'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 h-[18px] rounded-full text-[11px] font-semibold ring-1 num',
        tone
      )}
    >
      {flat ? (
        <Minus className="w-3 h-3" />
      ) : up ? (
        <ArrowUpRight className="w-3 h-3" />
      ) : (
        <ArrowDownRight className="w-3 h-3" />
      )}
      {value > 0 ? '+' : ''}
      {value.toFixed(1)}%
    </span>
  )
}

/** Stat grid wrapper used in the admin dashboard. */
export function KpiGrid({
  children,
  cols = 4,
}: {
  children: React.ReactNode
  cols?: 2 | 3 | 4 | 5
}) {
  const COLS = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
    5: 'sm:grid-cols-2 lg:grid-cols-5',
  } as const
  return (
    <div className={cn('grid grid-cols-1 gap-3', COLS[cols])}>{children}</div>
  )
}
