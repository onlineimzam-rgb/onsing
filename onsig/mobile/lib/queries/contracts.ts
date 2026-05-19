/**
 * Contract query hooks — wrap GET /api/contracts and GET /api/contracts/[id].
 *
 * The backend already returns the full template list alongside the items, so
 * we don't need a separate /templates round-trip.
 */
import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'

export type ContractStatus = 'taslak' | 'aktif' | 'tamamlandi' | 'iptal'

export interface ContractListItem {
  id: number
  sector: string
  templateKey: string
  templateLabel: string | null
  title: string | null
  status: ContractStatus
  createdAt: string
  updatedAt: string
}

export interface ContractsListResponse {
  ok: true
  items: ContractListItem[]
  templates: Array<{
    key: string
    sector: string
    label: string
    description?: string
  }>
}

export function useContractsList() {
  return useQuery({
    queryKey: ['contracts', 'list'],
    queryFn: () => api.get('contracts').json<ContractsListResponse>(),
    staleTime: 30_000,
  })
}

export interface ContractDetail {
  id: number
  tenantId: number
  branchId: number | null
  sector: string
  templateKey: string
  templateVersion: number
  title: string | null
  status: ContractStatus
  form: Record<string, unknown>
  renderedText: string
  createdBy: number | null
  createdAt: string
  updatedAt: string
  template: { key: string; sector: string; label: string; description?: string } | null
}

export interface SignSession {
  id: number
  role: string
  token: string
  status: 'bekliyor' | 'imzalandi' | 'iptal' | 'expired'
  recipientName: string | null
  recipientEmail: string | null
  recipientPhone: string | null
  signedAt: string | null
  expiresAt: string | null
  createdAt: string
}

export interface ContractDetailResponse {
  ok: true
  contract: ContractDetail
  signSessions: SignSession[]
}

export function useContract(id: number | null) {
  return useQuery({
    queryKey: ['contracts', 'detail', id],
    queryFn: () => api.get(`contracts/${id}`).json<ContractDetailResponse>(),
    enabled: Number.isFinite(id) && (id ?? 0) > 0,
    staleTime: 15_000,
  })
}
