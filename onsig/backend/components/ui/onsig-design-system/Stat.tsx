import * as React from 'react'
import { cn } from './cn'
import { Badge, type BadgeTone } from './Badge'

export interface StatProps {
  label: React.ReactNode
  value: React.ReactNode
  hint?: React.ReactNode
  /** Optional leading icon, normally 14px. */
  icon?: React.ReactNode
  /** Optional trend indicator. */
  trend?: {
    direction: 'up' | 'down' | 'flat'
    label: string
    tone?: BadgeTone
  }
  /** Slot under the value (sparkline / mini chart). */
  chart?: React.ReactNode
  /** Hairline at the right edge — for stat strips. */
  bordered?: boolean
  className?: string
}

const DIR_GLYPH = {
  up: '↑',
  down: '↓',
  flat: '→',
} as const

export function Stat({
  label,
  value,
  hint,
  icon,
  trend,
  chart,
  bordered,
  className,
}: StatProps) {
  return (
    <div
      className={cn(
        'flex flex-col justify-between gap-2 min-w-0',
        bordered && 'pr-5 mr-5 border-r border-divider',
        className
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {icon && (
          <span className="w-5 h-5 rounded grid place-items-center bg-ink-2 text-ink-9 [&>svg]:w-3.5 [&>svg]:h-3.5">
            {icon}
          </span>
        )}
        <p className="text-2xs uppercase tracking-[0.16em] font-semibold text-ink-7 truncate">
          {label}
        </p>
      </div>
      <div className="flex items-end justify-between gap-2 min-w-0">
        <p className="font-display text-3xl font-bold tracking-tightest text-ink-12 num leading-none truncate">
          {value}
        </p>
        {trend && (
          <Badge
            tone={
              trend.tone ??
              (trend.direction === 'up'
                ? 'success'
                : trend.direction === 'down'
                  ? 'danger'
                  : 'neutral')
            }
            size="xs"
          >
            <span aria-hidden>{DIR_GLYPH[trend.direction]}</span>
            {trend.label}
          </Badge>
        )}
      </div>
      {chart && <div className="mt-1">{chart}</div>}
      {hint && (
        <p className="text-xs text-ink-7 mt-0.5 truncate">{hint}</p>
      )}
    </div>
  )
}

/** A compact horizontal strip of stats. */
export function StatStrip({
  items,
  className,
}: {
  items: StatProps[]
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-stretch gap-y-4 divide-x divide-divider',
        className
      )}
    >
      {items.map((s, i) => (
        <div key={i} className="flex-1 min-w-[180px] px-5 first:pl-0 last:pr-0">
          <Stat {...s} />
        </div>
      ))}
    </div>
  )
}

/** A spark line built from a number array (very lightweight, no library). */
export function Sparkline({
  data,
  width = 80,
  height = 24,
  stroke = 'currentColor',
  fill = 'none',
  strokeWidth = 1.5,
  className,
}: {
  data: number[]
  width?: number
  height?: number
  stroke?: string
  fill?: string
  strokeWidth?: number
  className?: string
}) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const step = width / (data.length - 1)
  const points = data
    .map((v, i) => {
      const x = i * step
      const y = height - ((v - min) / range) * height
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
      aria-hidden
    >
      <polyline
        points={points}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
