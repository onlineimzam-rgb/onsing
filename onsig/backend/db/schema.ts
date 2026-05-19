/**
 * OnSig — Drizzle ORM schema
 *
 * Every business table carries `tenant_id` (ADR-005). MVP runs as single tenant
 * with a default tenant row; multi-tenant UI lands in v0.2.
 *
 * Convention:
 *   - snake_case columns; camelCase property names.
 *   - All ids are `bigserial` (BIGINT auto-increment) for now; switch to UUID v7
 *     once Postgres 17 is GA on Neon.
 *   - Timestamps are TIMESTAMPTZ, default now().
 */

import { sql } from 'drizzle-orm'
import {
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core'

// ---------------------------------------------------------------------------
// Tenants — billing & isolation boundary
// ---------------------------------------------------------------------------
export const tenants = pgTable(
  'tenants',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    slug: varchar('slug', { length: 64 }).notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    plan: varchar('plan', { length: 32 }).notNull().default('free'),
    settings: jsonb('settings').$type<TenantSettings>().notNull().default({} as TenantSettings),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    slugUnique: uniqueIndex('idx_tenants_slug').on(t.slug),
  })
)

export interface TenantSettings {
  // Firma kimlik bilgileri
  legalName?: string
  taxId?: string // Vergi No / TC No
  taxOffice?: string
  address?: string
  city?: string
  phone?: string
  email?: string
  website?: string
  // Sektör/iş özelinde varsayılanlar
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

// ---------------------------------------------------------------------------
// Users — global identities (one user can belong to multiple tenants)
// ---------------------------------------------------------------------------
export const users = pgTable(
  'users',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    name: varchar('name', { length: 200 }).notNull(),
    email: varchar('email', { length: 200 }),
    phone: varchar('phone', { length: 40 }),
    passwordHash: text('password_hash'),
    totpSecret: text('totp_secret'),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    phoneVerifiedAt: timestamp('phone_verified_at', { withTimezone: true }),
    /**
     * Platform-wide role for SaaS operators. Distinct from tenant-level role.
     *   - none:        regular customer (default)
     *   - super_admin: full SaaS admin
     *   - support:     read-only + impersonation
     *   - finance:     read-only + billing actions
     *   - moderator:   read-only + risk actions
     */
    platformRole: varchar('platform_role', { length: 16 }).notNull().default('none'),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailUnique: uniqueIndex('idx_users_email').on(t.email),
    phoneIdx: index('idx_users_phone').on(t.phone),
    platformRoleIdx: index('idx_users_platform_role').on(t.platformRole),
  })
)

export type PlatformRole = 'none' | 'super_admin' | 'support' | 'finance' | 'moderator'

// ---------------------------------------------------------------------------
// Memberships — users x tenants with role
// ---------------------------------------------------------------------------
export const memberships = pgTable(
  'memberships',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    tenantId: integer('tenant_id').notNull(),
    userId: integer('user_id').notNull(),
    role: varchar('role', { length: 24 }).notNull().default('member'), // owner|admin|member
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantUserUnique: uniqueIndex('idx_memberships_tenant_user').on(t.tenantId, t.userId),
    tenantIdx: index('idx_memberships_tenant').on(t.tenantId),
  })
)

// ---------------------------------------------------------------------------
// Branches — physical / virtual offices under a tenant (optional)
// ---------------------------------------------------------------------------
export const branches = pgTable(
  'branches',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    tenantId: integer('tenant_id').notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    address: text('address'),
    city: varchar('city', { length: 120 }),
    phone: varchar('phone', { length: 40 }),
    email: varchar('email', { length: 200 }),
    licenseNo: varchar('license_no', { length: 120 }),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantIdx: index('idx_branches_tenant').on(t.tenantId),
  })
)

// ---------------------------------------------------------------------------
// Contracts — main document
// ---------------------------------------------------------------------------
export const contracts = pgTable(
  'contracts',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    tenantId: integer('tenant_id').notNull(),
    branchId: integer('branch_id'),
    sector: varchar('sector', { length: 32 }).notNull().default('real-estate'),
    templateKey: varchar('template_key', { length: 64 }).notNull(),
    templateVersion: integer('template_version').notNull().default(1),
    title: varchar('title', { length: 240 }),
    status: varchar('status', { length: 24 }).notNull().default('taslak'), // taslak|aktif|tamamlandi|iptal
    form: jsonb('form').notNull().default({}),
    renderedText: text('rendered_text').notNull().default(''),
    createdBy: integer('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantIdx: index('idx_contracts_tenant').on(t.tenantId),
    statusIdx: index('idx_contracts_status').on(t.tenantId, t.status),
    createdIdx: index('idx_contracts_created').on(t.tenantId, t.createdAt),
    branchIdx: index('idx_contracts_branch').on(t.branchId),
  })
)

// ---------------------------------------------------------------------------
// Sign sessions — one row per signer
// ---------------------------------------------------------------------------
export const signSessions = pgTable(
  'sign_sessions',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    tenantId: integer('tenant_id').notNull(),
    contractId: integer('contract_id').notNull(),
    role: varchar('role', { length: 32 }).notNull(),
    token: varchar('token', { length: 96 }).notNull(),
    recipientName: varchar('recipient_name', { length: 200 }),
    recipientEmail: varchar('recipient_email', { length: 200 }),
    recipientPhone: varchar('recipient_phone', { length: 40 }),
    status: varchar('status', { length: 24 }).notNull().default('bekliyor'), // bekliyor|imzalandi|iptal|expired
    signaturePng: text('signature_png'), // base64; later moved to blob URL
    signaturePngUrl: text('signature_png_url'),
    signerTc: varchar('signer_tc', { length: 11 }),
    signerIp: varchar('signer_ip', { length: 64 }),
    signerUserAgent: text('signer_user_agent'),
    signerGeoLat: varchar('signer_geo_lat', { length: 32 }),
    signerGeoLng: varchar('signer_geo_lng', { length: 32 }),
    signerAcceptedTerms: boolean('signer_accepted_terms').notNull().default(false),
    signerAcceptedKvkk: boolean('signer_accepted_kvkk').notNull().default(false),
    otpVerifiedAt: timestamp('otp_verified_at', { withTimezone: true }),
    signedAt: timestamp('signed_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tokenUnique: uniqueIndex('idx_sign_sessions_token').on(t.token),
    contractIdx: index('idx_sign_sessions_contract').on(t.contractId),
    tenantIdx: index('idx_sign_sessions_tenant').on(t.tenantId),
    statusIdx: index('idx_sign_sessions_status').on(t.tenantId, t.status),
  })
)

// ---------------------------------------------------------------------------
// One-time-password attempts (sign flow)
// ---------------------------------------------------------------------------
export const otpCodes = pgTable(
  'otp_codes',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    purpose: varchar('purpose', { length: 32 }).notNull(), // sign|login|verify_phone|verify_email
    channel: varchar('channel', { length: 16 }).notNull(), // sms|email
    target: varchar('target', { length: 200 }).notNull(), // phone or email
    codeHash: varchar('code_hash', { length: 128 }).notNull(),
    attempts: integer('attempts').notNull().default(0),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    targetIdx: index('idx_otp_target').on(t.purpose, t.target, t.createdAt),
  })
)

// ---------------------------------------------------------------------------
// Documents (PDF outputs, hash, timestamping)
// ---------------------------------------------------------------------------
export const documents = pgTable(
  'documents',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    tenantId: integer('tenant_id').notNull(),
    contractId: integer('contract_id').notNull(),
    kind: varchar('kind', { length: 32 }).notNull(), // pdf|audit_zip
    storageUrl: text('storage_url'),
    sha256Hex: varchar('sha256_hex', { length: 64 }).notNull(),
    tsaToken: text('tsa_token'),
    sizeBytes: integer('size_bytes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    contractIdx: index('idx_documents_contract').on(t.contractId),
    hashIdx: index('idx_documents_hash').on(t.sha256Hex),
  })
)

// ---------------------------------------------------------------------------
// Team invites — invitation tokens for joining a tenant
// ---------------------------------------------------------------------------
export const teamInvites = pgTable(
  'team_invites',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    tenantId: integer('tenant_id').notNull(),
    email: varchar('email', { length: 200 }).notNull(),
    role: varchar('role', { length: 24 }).notNull().default('member'), // owner|admin|member
    token: varchar('token', { length: 96 }).notNull(),
    invitedBy: integer('invited_by'),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    consumedByUserId: integer('consumed_by_user_id'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tokenUnique: uniqueIndex('idx_team_invites_token').on(t.token),
    tenantIdx: index('idx_team_invites_tenant').on(t.tenantId),
  })
)

// ---------------------------------------------------------------------------
// Audit logs — chain-of-records (ADR-001 audit trail)
// ---------------------------------------------------------------------------
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    tenantId: integer('tenant_id').notNull(),
    actorId: integer('actor_id'),
    entityKind: varchar('entity_kind', { length: 32 }).notNull(),
    entityId: integer('entity_id').notNull(),
    eventType: varchar('event_type', { length: 64 }).notNull(),
    metadata: jsonb('metadata').notNull().default({}),
    ip: varchar('ip', { length: 64 }),
    userAgent: text('user_agent'),
    geoLat: varchar('geo_lat', { length: 32 }),
    geoLng: varchar('geo_lng', { length: 32 }),
    hashPrev: varchar('hash_prev', { length: 64 }),
    recordHash: varchar('record_hash', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    tenantIdx: index('idx_audit_tenant').on(t.tenantId, t.createdAt),
    entityIdx: index('idx_audit_entity').on(t.entityKind, t.entityId),
    hashIdx: uniqueIndex('idx_audit_record_hash').on(t.recordHash),
  })
)

// ---------------------------------------------------------------------------
// Subscriptions — billing-side state for a tenant (one row per active sub)
// ---------------------------------------------------------------------------
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    tenantId: integer('tenant_id').notNull(),
    plan: varchar('plan', { length: 32 }).notNull(), // free|pro|business|enterprise
    status: varchar('status', { length: 24 }).notNull().default('active'), // active|trialing|past_due|canceled|paused
    pricePerMonth: integer('price_per_month').notNull().default(0), // TRY (kuruş cinsinden saklamak yerine direkt TRY)
    seats: integer('seats').notNull().default(1),
    currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
    trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
    canceledAt: timestamp('canceled_at', { withTimezone: true }),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantIdx: index('idx_subscriptions_tenant').on(t.tenantId),
    statusIdx: index('idx_subscriptions_status').on(t.status),
  })
)

// ---------------------------------------------------------------------------
// Invoices — billing artifacts (cron-generated; manually closable)
// ---------------------------------------------------------------------------
export const invoices = pgTable(
  'invoices',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    tenantId: integer('tenant_id').notNull(),
    subscriptionId: integer('subscription_id'),
    number: varchar('number', { length: 64 }).notNull(),
    status: varchar('status', { length: 24 }).notNull().default('pending'), // pending|paid|past_due|void|refunded
    total: integer('total').notNull().default(0), // TRY (net)
    tax: integer('tax').notNull().default(0),
    issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
    dueAt: timestamp('due_at', { withTimezone: true }),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    numberUnique: uniqueIndex('idx_invoices_number').on(t.number),
    tenantIdx: index('idx_invoices_tenant').on(t.tenantId),
    statusIdx: index('idx_invoices_status').on(t.status),
  })
)

// ---------------------------------------------------------------------------
// Feature flags — platform-wide on/off toggles, optionally per-tenant scoped
// ---------------------------------------------------------------------------
export const featureFlags = pgTable(
  'feature_flags',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    key: varchar('key', { length: 80 }).notNull(),
    description: text('description'),
    enabled: boolean('enabled').notNull().default(false),
    /** When non-null, the flag is enabled only for that single tenant. */
    tenantId: integer('tenant_id'),
    /** Rollout 0..100. */
    rolloutPct: integer('rollout_pct').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    keyTenantUnique: uniqueIndex('idx_feature_flags_key_tenant').on(t.key, t.tenantId),
  })
)

// ---------------------------------------------------------------------------
// Support tickets — minimal MVP stub for the admin's "Support" surface
// ---------------------------------------------------------------------------
export const supportTickets = pgTable(
  'support_tickets',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    tenantId: integer('tenant_id'),
    userId: integer('user_id'),
    subject: varchar('subject', { length: 240 }).notNull(),
    body: text('body').notNull(),
    status: varchar('status', { length: 24 }).notNull().default('open'), // open|pending|resolved|closed
    priority: varchar('priority', { length: 16 }).notNull().default('normal'), // low|normal|high|urgent
    assignedTo: integer('assigned_to'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index('idx_support_status').on(t.status),
    tenantIdx: index('idx_support_tenant').on(t.tenantId),
  })
)

// ---------------------------------------------------------------------------
// Risk events — fraud / abuse / rate-limit hits surfaced in the admin panel
// ---------------------------------------------------------------------------
export const riskEvents = pgTable(
  'risk_events',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    tenantId: integer('tenant_id'),
    kind: varchar('kind', { length: 48 }).notNull(), // otp_failed|rate_limit|signature_mismatch|suspicious_ip|...
    severity: varchar('severity', { length: 16 }).notNull().default('low'), // low|medium|high|critical
    description: text('description'),
    ip: varchar('ip', { length: 64 }),
    userAgent: text('user_agent'),
    entityKind: varchar('entity_kind', { length: 32 }),
    entityId: integer('entity_id'),
    metadata: jsonb('metadata').notNull().default({}),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    kindIdx: index('idx_risk_kind').on(t.kind),
    severityIdx: index('idx_risk_severity').on(t.severity, t.createdAt),
    tenantIdx: index('idx_risk_tenant').on(t.tenantId),
  })
)

// ---------------------------------------------------------------------------
// Platform audit log — admin actions (impersonate, plan change, flag toggle)
// ---------------------------------------------------------------------------
export const platformAuditLogs = pgTable(
  'platform_audit_logs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    actorId: integer('actor_id').notNull(),
    actorRole: varchar('actor_role', { length: 16 }).notNull(),
    eventType: varchar('event_type', { length: 64 }).notNull(),
    entityKind: varchar('entity_kind', { length: 32 }).notNull(),
    entityId: integer('entity_id'),
    metadata: jsonb('metadata').notNull().default({}),
    ip: varchar('ip', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    actorIdx: index('idx_platform_audit_actor').on(t.actorId, t.createdAt),
    eventIdx: index('idx_platform_audit_event').on(t.eventType),
  })
)

// Convenience type exports
export type Tenant = typeof tenants.$inferSelect
export type NewTenant = typeof tenants.$inferInsert
export type User = typeof users.$inferSelect
export type Branch = typeof branches.$inferSelect
export type NewBranch = typeof branches.$inferInsert
export type Contract = typeof contracts.$inferSelect
export type NewContract = typeof contracts.$inferInsert
export type SignSession = typeof signSessions.$inferSelect
export type NewSignSession = typeof signSessions.$inferInsert
export type TeamInvite = typeof teamInvites.$inferSelect
export type NewTeamInvite = typeof teamInvites.$inferInsert
export type AuditLog = typeof auditLogs.$inferSelect
export type NewAuditLog = typeof auditLogs.$inferInsert
export type Subscription = typeof subscriptions.$inferSelect
export type NewSubscription = typeof subscriptions.$inferInsert
export type Invoice = typeof invoices.$inferSelect
export type NewInvoice = typeof invoices.$inferInsert
export type FeatureFlag = typeof featureFlags.$inferSelect
export type NewFeatureFlag = typeof featureFlags.$inferInsert
export type SupportTicket = typeof supportTickets.$inferSelect
export type NewSupportTicket = typeof supportTickets.$inferInsert
export type RiskEvent = typeof riskEvents.$inferSelect
export type NewRiskEvent = typeof riskEvents.$inferInsert
export type PlatformAuditLog = typeof platformAuditLogs.$inferSelect
export type NewPlatformAuditLog = typeof platformAuditLogs.$inferInsert
