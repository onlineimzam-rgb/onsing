'use client'

import * as React from 'react'

/**
 * Pure-SVG sparkline (no recharts) — used inside KPI cards. Recharts is
 * reserved for the heavier panels (multi-series area, bar, pie).
 */
export function Sparkline({
  values,
  width = 120,
  height = 28,
  stroke = '#7C77FF',
  fill = 'rgba(124, 119, 255, 0.15)',
  bare = false,
}: {
  values: number[]
  width?: number
  height?: number
  stroke?: string
  fill?: string
  /** Hide the area fill — just the line. */
  bare?: boolean
}) {
  if (values.length < 2) {
    return <svg width={width} height={height} aria-hidden />
  }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const stepX = width / (values.length - 1)
  const pts = values.map((v, i) => [
    i * stepX,
    height - ((v - min) / range) * (height - 4) - 2,
  ])
  const d = pts
    .map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`))
    .join(' ')
  const area = `${d} L${width},${height} L0,${height} Z`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="block"
    >
      {!bare && <path d={area} fill={fill} />}
      <path d={d} stroke={stroke} strokeWidth={1.5} fill="none" />
    </svg>
  )
}
