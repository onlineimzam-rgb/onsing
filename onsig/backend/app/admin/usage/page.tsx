import { sql } from 'drizzle-orm'
import { Cpu, Gauge, HardDrive, Mail, MessageSquare, Send } from 'lucide-react'

import {
  CHART_COLORS,
  Kpi,
  KpiGrid,
  LineChartTile,
  Panel,
  PanelHeader,
  UsageBar,
} from '@/components/admin/ui'
import { db, schema } from '@/db'
import { fmtNumber } from '@/lib/admin'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Usage' }

export default async function UsagePage() {
  const d30 = new Date(Date.now() - 30 * 24 * 3600_000)

  const d30Iso = d30.toISOString()
  const [otpEmail, otpSms, contractsDailyRaw, docs] = await Promise.all([
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(schema.otpCodes)
      .where(sql`channel = 'email' AND created_at >= ${d30Iso}::timestamptz`),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(schema.otpCodes)
      .where(sql`channel = 'sms' AND created_at >= ${d30Iso}::timestamptz`),
    db.execute<{ day: string; value: string }>(sql`
      SELECT to_char(date_trunc('day', created_at), 'DD Mon') AS day,
             COUNT(*)::text AS value
      FROM contracts
      WHERE created_at >= ${d30Iso}::timestamptz
      GROUP BY 1
      ORDER BY MIN(created_at)
    `),
    db
      .select({ c: sql<number>`count(*)::int`, sz: sql<number>`COALESCE(SUM(size_bytes), 0)::bigint` })
      .from(schema.documents),
  ])

  const sentMail = otpEmail[0]?.c ?? 0
  const sentSms = otpSms[0]?.c ?? 0
  const docCount = docs[0]?.c ?? 0
  const storageBytes = Number(docs[0]?.sz ?? 0)
  const storageMb = storageBytes / (1024 * 1024)

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[var(--a-text-4)]">
          Revenue · Usage
        </div>
        <h1 className="mt-1 font-display text-[22px] tracking-tightest text-[var(--a-text-1)]">
          Kullanım metrikleri
        </h1>
        <p className="mt-1 text-[12.5px] text-[var(--a-text-3)] max-w-md">
          OTP gönderimleri, sözleşme akışı ve depolama. Burada yer alan
          değerler tenant bazında ileride detaylandırılacak.
        </p>
      </div>

      <KpiGrid cols={4}>
        <Kpi label="E-posta · 30g" value={fmtNumber(sentMail)} icon={<Mail className="w-3 h-3" />} />
        <Kpi label="SMS · 30g" value={fmtNumber(sentSms)} icon={<MessageSquare className="w-3 h-3" />} />
        <Kpi label="Doküman" value={fmtNumber(docCount)} icon={<HardDrive className="w-3 h-3" />} />
        <Kpi
          label="Depolama"
          value={`${storageMb.toFixed(1)} MB`}
          icon={<HardDrive className="w-3 h-3" />}
          hint={`${(storageMb / 1024).toFixed(2)} GB`}
        />
      </KpiGrid>

      <Panel flush>
        <PanelHeader title="Sözleşme akışı · 30g" hint="Günlük sözleşme oluşturma" />
        <div className="px-3 pb-3">
          <LineChartTile
            data={contractsDailyRaw.map((r) => ({ label: r.day, contracts: Number(r.value) }))}
            series={[{ key: 'contracts', label: 'Sözleşme', color: CHART_COLORS.iris }]}
            height={220}
          />
        </div>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Panel>
          <PanelHeader title="Kanal kullanımı" hint="Plan limitlerine göre" />
          <div className="space-y-4 mt-3 text-[12.5px]">
            <UsageRow
              label="E-posta (Resend)"
              value={sentMail}
              max={5000}
              icon={<Mail className="w-3 h-3" />}
            />
            <UsageRow
              label="SMS (Netgsm)"
              value={sentSms}
              max={1000}
              icon={<MessageSquare className="w-3 h-3" />}
              tone={sentSms > 800 ? 'warning' : 'iris'}
            />
            <UsageRow
              label="Depolama"
              value={storageMb}
              max={2048}
              icon={<HardDrive className="w-3 h-3" />}
              suffix="MB"
            />
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="API kullanımı" hint="Stub · ileride gelecek" />
          <p className="mt-3 text-[12px] text-[var(--a-text-3)] leading-relaxed">
            API çağrı sayaçları (rate limiter ile birlikte) bir sonraki sürümde
            etkin olacak. Mevcut OnSig API&apos;ları herhangi bir tenant&apos;a
            başına çağrı limiti uygulamaz.
          </p>
          <ul className="mt-4 space-y-2 text-[12px] text-[var(--a-text-3)]">
            <li>· <code className="font-mono text-[var(--a-text-2)]">/api/contracts/*</code> — 0 / sn</li>
            <li>· <code className="font-mono text-[var(--a-text-2)]">/api/sign/*</code> — 0 / sn</li>
            <li>· <code className="font-mono text-[var(--a-text-2)]">/api/admin/*</code> — sınırsız</li>
          </ul>
        </Panel>
      </div>
    </div>
  )
}

function UsageRow({
  label,
  value,
  max,
  icon,
  suffix,
  tone = 'iris',
}: {
  label: string
  value: number
  max: number
  icon?: React.ReactNode
  suffix?: string
  tone?: 'iris' | 'success' | 'warning' | 'danger'
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-2 text-[var(--a-text-2)]">
          <span className="text-[var(--a-text-4)]">{icon}</span>
          {label}
        </span>
        <span className="num text-[var(--a-text-3)]">
          {fmtNumber(Math.round(value))}
          {suffix ? ` ${suffix}` : ''} / {fmtNumber(max)}
          {suffix ? ` ${suffix}` : ''}
        </span>
      </div>
      <UsageBar value={value} max={max} tone={tone} />
    </div>
  )
}
