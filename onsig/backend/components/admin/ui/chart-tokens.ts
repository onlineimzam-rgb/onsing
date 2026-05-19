/**
 * Chart palette — kept in a server-importable module so it can be referenced
 * from both server components (pages) and client components (recharts wrappers)
 * without RSC manifest issues.
 */
export const CHART_COLORS = {
  iris: '#7C77FF',
  irisDim: '#5E55E5',
  teal: '#2DD4BF',
  amber: '#F59E0B',
  rose: '#F87171',
  sky: '#38BDF8',
  slate: '#64748B',
  emerald: '#10B981',
  violet: '#A78BFA',
  fuchsia: '#E879F9',
} as const

export type ChartColor = keyof typeof CHART_COLORS
