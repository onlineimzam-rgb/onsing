'use client'

import * as React from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CHART_COLORS } from './chart-tokens'

// Re-exported for callers that imported it from this module historically.
export { CHART_COLORS } from './chart-tokens'

/**
 * Recharts wrappers for the admin surface. Each chart applies the dark theme
 * tokens and standardizes tooltip styling so dashboards stay consistent.
 */

const AXIS_PROPS = {
  stroke: 'rgba(255,255,255,0.1)',
  tick: { fill: '#8B92A6', fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: 'rgba(255,255,255,0.1)' },
} as const

const GRID_PROPS = {
  stroke: 'rgba(255,255,255,0.05)',
  strokeDasharray: '3 3',
  vertical: false,
} as const

const TOOLTIP_PROPS = {
  contentStyle: {
    background: '#0F1424',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 8,
    color: '#F1F3F8',
    fontSize: 12,
    boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
    padding: '8px 10px',
  } as React.CSSProperties,
  labelStyle: {
    color: '#8B92A6',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: 4,
  } as React.CSSProperties,
  itemStyle: {
    color: '#F1F3F8',
    fontSize: 12,
    fontVariantNumeric: 'tabular-nums' as const,
  } as React.CSSProperties,
  cursor: { stroke: 'rgba(124,119,255,0.25)', strokeWidth: 1 },
} as const

export interface SeriesPoint {
  [key: string]: number | string
}

// ── Area Chart ───────────────────────────────────────────────────────────────
export function AreaChartTile({
  data,
  series,
  height = 220,
  xKey = 'label',
}: {
  data: SeriesPoint[]
  series: { key: string; label: string; color: string }[]
  height?: number
  xKey?: string
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, left: 0, right: 8, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey={xKey} {...AXIS_PROPS} />
        <YAxis {...AXIS_PROPS} width={36} />
        <Tooltip {...TOOLTIP_PROPS} />
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={1.75}
            fill={`url(#grad-${s.key})`}
            activeDot={{ r: 3, strokeWidth: 0, fill: s.color }}
            dot={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ── Line Chart ───────────────────────────────────────────────────────────────
export function LineChartTile({
  data,
  series,
  height = 220,
  xKey = 'label',
}: {
  data: SeriesPoint[]
  series: { key: string; label: string; color: string; dashed?: boolean }[]
  height?: number
  xKey?: string
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, left: 0, right: 8, bottom: 0 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey={xKey} {...AXIS_PROPS} />
        <YAxis {...AXIS_PROPS} width={36} />
        <Tooltip {...TOOLTIP_PROPS} />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={1.75}
            strokeDasharray={s.dashed ? '4 3' : undefined}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0, fill: s.color }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

// ── Bar Chart ────────────────────────────────────────────────────────────────
export function BarChartTile({
  data,
  series,
  height = 220,
  xKey = 'label',
  stacked = false,
}: {
  data: SeriesPoint[]
  series: { key: string; label: string; color: string }[]
  height?: number
  xKey?: string
  stacked?: boolean
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, left: 0, right: 8, bottom: 0 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey={xKey} {...AXIS_PROPS} />
        <YAxis {...AXIS_PROPS} width={36} />
        <Tooltip {...TOOLTIP_PROPS} cursor={{ fill: 'rgba(124,119,255,0.06)' }} />
        {series.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            stackId={stacked ? 'stack' : undefined}
            fill={s.color}
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Pie Chart (donut) ────────────────────────────────────────────────────────
export function DonutTile({
  data,
  height = 220,
  centerLabel,
  centerValue,
}: {
  data: { name: string; value: number; color: string }[]
  height?: number
  centerLabel?: React.ReactNode
  centerValue?: React.ReactNode
}) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Tooltip {...TOOLTIP_PROPS} cursor={false} />
          <Pie
            data={data}
            innerRadius={62}
            outerRadius={86}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="text-center">
            <div className="font-display text-[22px] tracking-tightest text-[var(--a-text-1)] num leading-none">
              {centerValue}
            </div>
            <div className="mt-1 text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[var(--a-text-3)]">
              {centerLabel}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

