/**
 * Dashboard query hooks — wrap GET /api/dashboard/summary.
 *
 * Refetches when the screen regains focus (handled by Expo Router) and every
 * 60s while mounted so the "Komuta Merkezi" feels live without a websocket.
 */
import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'

export interface DashboardSummary {
  ok: true
  stats: {
    pending: number
    completed: number
    pendingNew: number
    weekly: number[] // 7 entries, oldest → newest
    weeklyCompleted: number
  }
  liveFeed: Array<{
    id: number
    kind: 'signed' | 'sent' | 'viewed'
    actor: string | null
    contractId: number
    contractTitle: string
    at: string
  }>
  criticalActions: Array<{
    contractId: number
    title: string
    recipientName: string | null
    severity: 'high' | 'medium' | 'low'
    createdAt: string
  }>
  me: {
    user: { id: number; name: string; email: string } | null
    tenant: { id: number; name: string; slug: string } | null
  }
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => api.get('dashboard/summary').json<DashboardSummary>(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}
