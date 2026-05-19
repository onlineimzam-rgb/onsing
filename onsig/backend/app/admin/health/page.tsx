import { Activity, Cpu, Database, FileText, Mail, MessageSquare, Server } from 'lucide-react'
import {
  Kpi,
  KpiGrid,
  MonoTag,
  Panel,
  PanelHeader,
  PanelSubTitle,
  StatusDot,
  cn,
} from '@/components/admin/ui'
import { sql } from 'drizzle-orm'
import { db, schema } from '@/db'
import { HealthProbes } from '../_components/LiveTicker'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'System health' }

export default async function HealthPage() {
  // server-side DB metrics (fast queries)
  const [tenants, contracts, sessions, docs, audit, pgSizeRows] = await Promise.all([
    db.select({ c: sql<number>`count(*)::int` }).from(schema.tenants),
    db.select({ c: sql<number>`count(*)::int` }).from(schema.contracts),
    db.select({ c: sql<number>`count(*)::int` }).from(schema.signSessions),
    db.select({ c: sql<number>`count(*)::int` }).from(schema.documents),
    db.select({ c: sql<number>`count(*)::int` }).from(schema.auditLogs),
    db.execute<{ size: string; version: string }>(sql`
      SELECT pg_size_pretty(pg_database_size(current_database())) AS size, version() AS version
    `),
  ])

  const meta = pgSizeRows[0]
  const env = process.env.NODE_ENV ?? 'development'

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[var(--a-text-4)]">
          System · Health
        </div>
        <h1 className="mt-1 font-display text-[22px] tracking-tightest text-[var(--a-text-1)]">
          Sistem sağlığı
        </h1>
        <p className="mt-1 text-[12.5px] text-[var(--a-text-3)] max-w-md">
          Tüm bağımlılıkların canlı durumu. Probe&apos;lar her 10 saniyede bir
          yenilenir.
        </p>
      </div>

      <KpiGrid cols={4}>
        <Kpi
          label="Tenant"
          value={tenants[0]?.c ?? 0}
          icon={<Server className="w-3 h-3" />}
        />
        <Kpi
          label="Sözleşme"
          value={contracts[0]?.c ?? 0}
          icon={<FileText className="w-3 h-3" />}
        />
        <Kpi
          label="Sign session"
          value={sessions[0]?.c ?? 0}
          icon={<Activity className="w-3 h-3" />}
        />
        <Kpi
          label="Audit log"
          value={audit[0]?.c ?? 0}
          icon={<Database className="w-3 h-3" />}
        />
      </KpiGrid>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Panel className="lg:col-span-2">
          <PanelSubTitle hint="Her 10s yenilenir">Servis durumu</PanelSubTitle>
          <HealthProbes />
        </Panel>

        <Panel>
          <PanelSubTitle>Runtime</PanelSubTitle>
          <dl className="space-y-2.5 text-[12.5px]">
            <Row label="Environment" value={env.toUpperCase()} />
            <Row label="Node" value={process.version} mono />
            <Row label="Process up" value={`${Math.round(process.uptime())}s`} mono />
            <Row label="DB size" value={meta?.size ?? '—'} mono />
            <Row label="DB doc rows" value={String(docs[0]?.c ?? 0)} mono />
          </dl>
          <div className="mt-4 text-[10.5px] text-[var(--a-text-4)] font-mono break-all leading-relaxed">
            {meta?.version ?? '—'}
          </div>
        </Panel>
      </div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-[var(--a-text-3)]">{label}</dt>
      <dd className={`text-[var(--a-text-1)] num ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  )
}
