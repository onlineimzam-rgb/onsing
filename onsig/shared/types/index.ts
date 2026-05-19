/**
 * OnSig — Çekirdek tipler
 * Bu dosya frontend (mobil + web) ve backend tarafından paylaşılır.
 * NOT: Şu an placeholder; nihai şema `onsig/docs/ARCHITECTURE.md` "Veri modeli" bölümünden ilerletilecek.
 */

export type Plan = 'free' | 'starter' | 'pro' | 'business' | 'enterprise'
export type MemberRole = 'owner' | 'admin' | 'member'

export interface Tenant {
  id: string
  name: string
  plan: Plan
  createdAt: string
  settings: TenantSettings
}

export interface TenantSettings {
  competentCourt?: string
  brokerageLicenseNo?: string
  defaultLocale?: 'tr' | 'en'
  brand?: {
    logoUrl?: string | null
    primaryColor?: string | null
    senderName?: string | null
    senderEmail?: string | null
  }
}

export interface User {
  id: string
  name: string
  email: string | null
  phone: string | null
  createdAt: string
}

export interface Membership {
  tenantId: string
  userId: string
  role: MemberRole
}

export type ContractStatus = 'taslak' | 'aktif' | 'tamamlandi' | 'iptal'
export type SignSessionStatus = 'bekliyor' | 'imzalandi' | 'iptal' | 'expired'

export interface Contract {
  id: string
  tenantId: string
  templateKey: string
  sector: SectorKey
  title: string | null
  status: ContractStatus
  form: Record<string, unknown>
  renderedText: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface SignSession {
  id: string
  contractId: string
  tenantId: string
  role: string
  token: string
  recipientName: string | null
  recipientEmail: string | null
  recipientPhone: string | null
  status: SignSessionStatus
  signaturePngUrl: string | null
  signerTc: string | null
  signerIp: string | null
  signerUserAgent: string | null
  signerGeo: { lat: number; lng: number } | null
  signedAt: string | null
  expiresAt: string | null
  createdAt: string
}

export interface AuditLog {
  id: string
  tenantId: string
  actorId: string | null
  entityKind: 'contract' | 'sign_session' | 'document' | 'user' | 'tenant'
  entityId: string
  eventType: string
  metadata: Record<string, unknown>
  ip: string | null
  userAgent: string | null
  geo: { lat: number; lng: number } | null
  hashPrev: string | null
  recordHash: string
  createdAt: string
}

export type SectorKey = 'real-estate' | 'freelance' | 'business' | 'education' | 'health' | 'other'
