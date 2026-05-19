'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Briefcase,
  Calculator,
  Calendar,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Inbox,
  Loader2,
  Phone,
  Receipt,
  ScrollText,
  TrendingUp,
} from 'lucide-react'
import { getAdminKey } from './AdminLogin'
import { formatPrice } from '@/lib/format'

type Counters = {
  active_properties: number
  leads_7d: number
  leads_30d: number
  valuations_30d: number
  contracts_30d: number
  sales_completed: number
  sales_total: number
  tasks_open: number
  tasks_overdue: number
}

type MonthBar = {
  month: string
  sale_sum: string | number
  commission_sum: string | number
  cnt: number
}

type Dash = {
  counters: Counters | null
  thisMonthSales: Array<{
    currency: string
    commission_currency: string
    sale_sum: string | number
    commission_sum: string | number
    invoiced_sum: string | number
    cnt: number
  }>
  recentLeads: Array<{
    id: number
    name: string
    phone: string
    email: string | null
    intent: string
    district: string | null
    category: string | null
    status: string | null
    created_at: string
  }>
  upcomingTasks: Array<{
    id: number
    title: string
    due_at: string | null
    priority: string
    related_kind: string
    related_label: string | null
    status: string
  }>
  monthlySalesSeries: MonthBar[]
  stagesBreakdown: Array<{ stage: string; cnt: number }>
  leadIntents: Array<{ intent: string; cnt: number }>
  contracts: Array<{ status: string; cnt: number }>
}

const INTENT_LABELS: Record<string, string> = {
  alici: 'Alıcı',
  satici: 'Satıcı',
  kiraci: 'Kiracı',
  'kiralik-veren': 'Kiralık veren',
}

const STAGE_LABELS: Record<string, { label: string; cls: string }> = {
  sozlesme: { label: 'Sözleşme', cls: 'bg-amber-100 text-amber-800' },
  'tapu-bekliyor': { label: 'Tapu bekleniyor', cls: 'bg-sky-100 text-sky-800' },
  'fatura-bekliyor': { label: 'Fatura bekleniyor', cls: 'bg-indigo-100 text-indigo-800' },
  tamamlandi: { label: 'Tamamlandı', cls: 'bg-emerald-100 text-emerald-800' },
  iptal: { label: 'İptal', cls: 'bg-red-100 text-red-800' },
}

export default function DashboardAdmin({ onJumpTab }: { onJumpTab?: (tab: string) => void } = {}) {
  const [data, setData] = useState<Dash | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const key = getAdminKey()
    if (!key) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/dashboard/', { headers: { 'x-admin-key': key } })
      const json = await res.json()
      setData(json)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const monthTotals = useMemo(() => {
    if (!data) return { sale: 0, commission: 0, invoiced: 0, cnt: 0 }
    let sale = 0
    let commission = 0
    let invoiced = 0
    let cnt = 0
    for (const row of data.thisMonthSales) {
      sale += Number(row.sale_sum || 0)
      commission += Number(row.commission_sum || 0)
      invoiced += Number(row.invoiced_sum || 0)
      cnt += row.cnt
    }
    return { sale, commission, invoiced, cnt }
  }, [data])

  const seriesMax = useMemo(() => {
    if (!data?.monthlySalesSeries?.length) return 0
    return data.monthlySalesSeries.reduce((m, r) => Math.max(m, Number(r.sale_sum || 0)), 0)
  }, [data])

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gold-500" />
      </div>
    )
  }

  const c = data.counters

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <h3 className="font-display text-xl font-bold text-navy-950 flex items-center gap-2">
          <Activity className="w-6 h-6 text-gold-600" />
          Komuta Merkezi
        </h3>
        <p className="text-sm text-navy-600 mt-1">
          Son 7-30 gündeki talep / değerleme / sözleşme / satış özetleri ve yaklaşan görevler.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          icon={Inbox}
          label="Yeni talepler (7g)"
          value={`${c?.leads_7d ?? 0}`}
          sub={`30g: ${c?.leads_30d ?? 0}`}
          accent="bg-navy-50 text-navy-900 border-navy-200"
          onClick={() => onJumpTab?.('leads')}
        />
        <KpiCard
          icon={Calculator}
          label="Değerleme (30g)"
          value={`${c?.valuations_30d ?? 0}`}
          sub="başvuru"
          accent="bg-amber-50 text-amber-900 border-amber-200"
          onClick={() => onJumpTab?.('valuations')}
        />
        <KpiCard
          icon={ScrollText}
          label="Sözleşme (30g)"
          value={`${c?.contracts_30d ?? 0}`}
          sub={`toplam aşama`}
          accent="bg-indigo-50 text-indigo-900 border-indigo-200"
          onClick={() => onJumpTab?.('contracts')}
        />
        <KpiCard
          icon={Briefcase}
          label="Satış"
          value={`${c?.sales_completed ?? 0}`}
          sub={`${c?.sales_total ?? 0} kayıt · ${c?.sales_completed ?? 0} tamam`}
          accent="bg-emerald-50 text-emerald-900 border-emerald-200"
          onClick={() => onJumpTab?.('sales')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <BigStat
          icon={CircleDollarSign}
          label="Bu ay satış"
          big={formatPrice(monthTotals.sale, 'TRY')}
          mid={`${monthTotals.cnt} işlem`}
          accent="bg-gold-50 text-gold-900 border-gold-200"
        />
        <BigStat
          icon={Receipt}
          label="Bu ay komisyon"
          big={formatPrice(monthTotals.commission, 'TRY')}
          mid={`Fatura kesilen: ${formatPrice(monthTotals.invoiced, 'TRY')}`}
          accent="bg-emerald-50 text-emerald-900 border-emerald-200"
        />
        <BigStat
          icon={ClipboardList}
          label="Açık görevler"
          big={`${c?.tasks_open ?? 0}`}
          mid={
            (c?.tasks_overdue ?? 0) > 0
              ? `${c?.tasks_overdue ?? 0} gecikmiş!`
              : 'Hepsi planında'
          }
          accent={
            (c?.tasks_overdue ?? 0) > 0
              ? 'bg-red-50 text-red-900 border-red-200'
              : 'bg-navy-50 text-navy-900 border-navy-200'
          }
          onClick={() => onJumpTab?.('tasks')}
        />
      </div>

      <section className="card p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h4 className="font-display text-lg font-bold text-navy-950 inline-flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gold-500" />
            Son 6 ay satış grafiği
          </h4>
        </div>
        {data.monthlySalesSeries.length === 0 ? (
          <p className="text-sm text-navy-500">Bu zaman aralığında işlem yok.</p>
        ) : (
          <div className="flex items-end gap-3 h-44 px-2">
            {data.monthlySalesSeries.map((row) => {
              const v = Number(row.sale_sum || 0)
              const h = seriesMax > 0 ? Math.max(4, Math.round((v / seriesMax) * 160)) : 4
              return (
                <div key={row.month} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <div
                    className="w-full max-w-[60px] rounded-t-lg bg-gold-gradient relative"
                    style={{ height: `${h}px` }}
                    title={`${formatPrice(v, 'TRY')} · ${row.cnt} işlem`}
                  >
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-navy-700 whitespace-nowrap">
                      {row.cnt}
                    </span>
                  </div>
                  <div className="text-[10px] text-navy-500 font-mono">{row.month.slice(2)}</div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <section className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-display text-lg font-bold text-navy-950 inline-flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gold-500" />
              Yaklaşan görevler
            </h4>
            <button
              type="button"
              onClick={() => onJumpTab?.('tasks')}
              className="text-xs text-gold-700 font-semibold hover:underline"
            >
              Tümünü gör
            </button>
          </div>
          {data.upcomingTasks.length === 0 ? (
            <p className="text-sm text-navy-500">Açık görev yok.</p>
          ) : (
            <ul className="space-y-2">
              {data.upcomingTasks.map((t) => {
                const overdue = t.due_at && new Date(t.due_at) < new Date()
                return (
                  <li
                    key={t.id}
                    className={`flex items-start justify-between gap-2 p-3 rounded-xl border ${
                      overdue ? 'border-red-200 bg-red-50/60' : 'border-navy-100 bg-white'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-navy-950 truncate flex items-center gap-1">
                        {overdue && <AlertTriangle className="w-3.5 h-3.5 text-red-600" />}
                        {t.title}
                      </p>
                      <p className="text-xs text-navy-500 truncate">
                        {t.related_label || INTENT_LABELS[t.related_kind] || t.related_kind}
                        {t.due_at ? ` · ${new Date(t.due_at).toLocaleString('tr-TR')}` : ' · tarih yok'}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        t.priority === 'yuksek'
                          ? 'bg-red-100 text-red-800'
                          : t.priority === 'dusuk'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-gold-100 text-gold-800'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-display text-lg font-bold text-navy-950 inline-flex items-center gap-2">
              <Inbox className="w-5 h-5 text-gold-500" />
              Son talepler
            </h4>
            <button
              type="button"
              onClick={() => onJumpTab?.('leads')}
              className="text-xs text-gold-700 font-semibold hover:underline"
            >
              Tümünü gör
            </button>
          </div>
          {data.recentLeads.length === 0 ? (
            <p className="text-sm text-navy-500">Talep yok.</p>
          ) : (
            <ul className="space-y-2">
              {data.recentLeads.map((l) => (
                <li
                  key={l.id}
                  className="flex items-start justify-between gap-2 p-3 rounded-xl border border-navy-100 bg-white"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-navy-950 truncate">{l.name}</p>
                    <p className="text-xs text-navy-500 truncate">
                      {INTENT_LABELS[l.intent] || l.intent}
                      {l.category ? ` · ${l.category}` : ''}
                      {l.district ? ` · ${l.district}` : ''}
                    </p>
                  </div>
                  <a
                    href={`tel:${l.phone}`}
                    className="text-xs px-2 py-1 rounded-lg bg-gold-100 text-gold-800 font-semibold inline-flex items-center gap-1 shrink-0"
                  >
                    <Phone className="w-3 h-3" /> Ara
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-4">
          <h4 className="font-display text-lg font-bold text-navy-950 mb-3 inline-flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-gold-500" />
            İş süreç dağılımı
          </h4>
          {data.stagesBreakdown.length === 0 ? (
            <p className="text-sm text-navy-500">Henüz iş kaydı yok.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {data.stagesBreakdown.map((s) => {
                const meta = STAGE_LABELS[s.stage] || { label: s.stage, cls: 'bg-navy-100 text-navy-800' }
                return (
                  <li key={s.stage} className={`text-xs px-2 py-1 rounded-full font-semibold ${meta.cls}`}>
                    {meta.label}: {s.cnt}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="card p-4">
          <h4 className="font-display text-lg font-bold text-navy-950 mb-3 inline-flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-gold-500" />
            Talep kaynak dağılımı (30g)
          </h4>
          {data.leadIntents.length === 0 ? (
            <p className="text-sm text-navy-500">Veri yok.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {data.leadIntents.map((row) => (
                <li
                  key={row.intent}
                  className="text-xs px-2 py-1 rounded-full bg-navy-50 text-navy-800 font-semibold"
                >
                  {INTENT_LABELS[row.intent] || row.intent}: {row.cnt}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  onClick,
}: {
  icon: typeof Activity
  label: string
  value: string
  sub?: string
  accent: string
  onClick?: () => void
}) {
  const Tag = onClick ? 'button' : ('div' as any)
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left ${accent} ${onClick ? 'hover:shadow transition-shadow cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
        <Icon className="w-4 h-4" />
      </div>
      <p className="font-display text-2xl font-bold leading-tight">{value}</p>
      {sub && <p className="text-[11px] mt-0.5 opacity-80">{sub}</p>}
    </Tag>
  )
}

function BigStat({
  icon: Icon,
  label,
  big,
  mid,
  accent,
  onClick,
}: {
  icon: typeof Activity
  label: string
  big: string
  mid: string
  accent: string
  onClick?: () => void
}) {
  const Tag = onClick ? 'button' : ('div' as any)
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left ${accent} ${onClick ? 'hover:shadow transition-shadow cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
        <Icon className="w-4 h-4" />
      </div>
      <p className="font-display text-xl font-bold leading-tight">{big}</p>
      <p className="text-[11px] mt-0.5 opacity-80">{mid}</p>
    </Tag>
  )
}
