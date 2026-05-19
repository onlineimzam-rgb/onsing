import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  Hash,
  ScrollText,
  Users,
} from 'lucide-react'

import {
  AdminAvatar,
  AdminBadge,
  Kpi,
  KpiGrid,
  MonoTag,
  Panel,
  PanelHeader,
  PanelSubTitle,
  UsageBar,
} from '@/components/admin/ui'
import { getTenantDetail, fmtTRY, fmtNumber, planPriceTRY } from '@/lib/admin'
import { TenantActions } from './TenantActions'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { id: string } }) {
  return { title: `Tenant #${params.id}` }
}

export default async function TenantDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const id = Number(params.id)
  if (!Number.isFinite(id)) notFound()

  const detail = await getTenantDetail(id)
  if (!detail) notFound()

  const { tenant, members, branches, contractsTotal, signSessionsTotal, subscription, recentInvoices } =
    detail

  const planPrice = subscription?.pricePerMonth ?? planPriceTRY(tenant.plan)

  return (
    <div className="space-y-6">
      {/* Top strip */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/admin/tenants"
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--a-text-3)] hover:text-[var(--a-text-1)]"
        >
          <ArrowLeft className="w-3 h-3" />
          Tüm tenants
        </Link>
        <TenantActions
          tenantId={tenant.id}
          tenantName={tenant.name}
          currentPlan={tenant.plan as 'free' | 'pro' | 'business' | 'enterprise'}
          subscription={
            subscription
              ? {
                  plan: subscription.plan as 'free' | 'pro' | 'business' | 'enterprise',
                  status: subscription.status as
                    | 'active'
                    | 'trialing'
                    | 'past_due'
                    | 'canceled'
                    | 'paused',
                  pricePerMonth: subscription.pricePerMonth ?? 0,
                  seats: subscription.seats ?? 1,
                }
              : null
          }
        />
      </div>

      {/* Header card */}
      <Panel elevated className="!p-0">
        <div className="p-5 sm:p-6 flex flex-wrap items-start gap-5">
          <AdminAvatar name={tenant.name} size={52} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-[20px] font-bold tracking-tightest text-[var(--a-text-1)]">
                {tenant.name}
              </h1>
              <AdminBadge tone="iris" dot>
                {tenant.plan}
              </AdminBadge>
              {subscription && (
                <AdminBadge
                  tone={
                    subscription.status === 'active'
                      ? 'success'
                      : subscription.status === 'trialing'
                        ? 'info'
                        : subscription.status === 'canceled'
                          ? 'danger'
                          : 'warning'
                  }
                  dot
                >
                  {subscription.status}
                </AdminBadge>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11.5px]">
              <MonoTag>#{tenant.id}</MonoTag>
              <MonoTag>@{tenant.slug}</MonoTag>
              <span className="text-[var(--a-text-4)] num">
                {fmtDate(tenant.createdAt)} oluşturuldu
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[var(--a-text-4)]">
              MRR
            </div>
            <div className="font-display text-[22px] tracking-tightest text-[var(--a-text-1)] num">
              {fmtTRY(planPrice)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-[var(--a-line)]">
          <CompanyFact
            label="Yasal ünvan"
            value={tenant.settings?.legalName ?? tenant.name}
          />
          <CompanyFact
            label="Vergi no"
            value={tenant.settings?.taxId ?? '—'}
            mono
          />
          <CompanyFact
            label="İletişim"
            value={tenant.settings?.email ?? tenant.settings?.phone ?? '—'}
            mono
          />
          <CompanyFact
            label="Şehir"
            value={tenant.settings?.city ?? '—'}
          />
        </div>
      </Panel>

      {/* KPI strip */}
      <KpiGrid cols={4}>
        <Kpi
          label="Toplam üye"
          value={fmtNumber(members.length)}
          icon={<Users className="w-3 h-3" />}
          hint={`${members.filter((m) => m.role === 'owner').length} owner`}
        />
        <Kpi
          label="Sözleşme"
          value={fmtNumber(contractsTotal)}
          icon={<ScrollText className="w-3 h-3" />}
        />
        <Kpi
          label="Sign sessions"
          value={fmtNumber(signSessionsTotal)}
          icon={<Hash className="w-3 h-3" />}
        />
        <Kpi
          label="Şubeler"
          value={fmtNumber(branches.length)}
          icon={<Building2 className="w-3 h-3" />}
        />
      </KpiGrid>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Members */}
        <Panel flush className="lg:col-span-2">
          <PanelHeader title="Üyeler" hint={`${members.length} üye`} />
          <div className="px-2 py-2">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[var(--a-text-4)]">
                  <th className="text-left px-2 py-1.5">İsim</th>
                  <th className="text-left px-2 py-1.5">E-posta</th>
                  <th className="text-left px-2 py-1.5">Rol</th>
                  <th className="text-right px-2 py-1.5">Son giriş</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center px-4 py-6 text-[var(--a-text-4)]">
                      Henüz üye yok.
                    </td>
                  </tr>
                ) : (
                  members.map((m) => (
                    <tr
                      key={m.membershipId}
                      className="border-t border-[var(--a-line)] hover:bg-white/[0.025]"
                    >
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2">
                          <AdminAvatar name={m.name} size={22} />
                          <span className="font-semibold text-[var(--a-text-1)]">
                            {m.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-[var(--a-text-3)] font-mono text-[11.5px]">
                        {m.email ?? '—'}
                      </td>
                      <td className="px-2 py-2">
                        <AdminBadge
                          tone={m.role === 'owner' ? 'iris' : 'neutral'}
                        >
                          {m.role}
                        </AdminBadge>
                      </td>
                      <td className="px-2 py-2 text-right text-[var(--a-text-4)] num">
                        {m.lastLoginAt ? fmtRelative(m.lastLoginAt) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Subscription block */}
        <Panel>
          <PanelSubTitle>Abonelik</PanelSubTitle>
          {subscription ? (
            <dl className="space-y-2.5 text-[12.5px]">
              <Row label="Plan" value={subscription.plan} mono />
              <Row label="Durum" value={subscription.status} />
              <Row
                label="Fiyat / ay"
                value={fmtTRY(subscription.pricePerMonth ?? 0)}
              />
              <Row label="Koltuk" value={String(subscription.seats)} mono />
              {subscription.currentPeriodEnd && (
                <Row
                  label="Sonraki yenileme"
                  value={fmtDate(subscription.currentPeriodEnd)}
                  mono
                />
              )}
              {subscription.trialEndsAt && (
                <Row
                  label="Deneme bitiş"
                  value={fmtDate(subscription.trialEndsAt)}
                  mono
                />
              )}
            </dl>
          ) : (
            <div className="text-[12px] text-[var(--a-text-4)]">
              Bu tenant&apos;ın bir abonelik kaydı yok. Plan &quot;{tenant.plan}&quot;
              olarak işaretli, fakat <code className="font-mono">subscriptions</code> tablosunda kayıt yok.
            </div>
          )}

          <div className="mt-5">
            <PanelSubTitle>Kullanım</PanelSubTitle>
            <div className="space-y-3 text-[12px]">
              <div>
                <div className="flex items-center justify-between mb-1 text-[var(--a-text-3)]">
                  <span>Sözleşme limiti</span>
                  <span className="num text-[var(--a-text-2)]">
                    {contractsTotal} / {tenant.plan === 'free' ? 5 : '∞'}
                  </span>
                </div>
                <UsageBar
                  value={contractsTotal}
                  max={tenant.plan === 'free' ? 5 : Math.max(50, contractsTotal)}
                  tone={
                    tenant.plan === 'free' && contractsTotal >= 5
                      ? 'danger'
                      : 'iris'
                  }
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1 text-[var(--a-text-3)]">
                  <span>Üye / koltuk</span>
                  <span className="num text-[var(--a-text-2)]">
                    {members.length} / {subscription?.seats ?? 5}
                  </span>
                </div>
                <UsageBar
                  value={members.length}
                  max={subscription?.seats ?? 5}
                />
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* Recent invoices */}
      <Panel flush>
        <PanelHeader title="Son faturalar" hint={`${recentInvoices.length} kayıt`} />
        <div className="px-2 py-2">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[var(--a-text-4)]">
                <th className="text-left px-2 py-1.5">No</th>
                <th className="text-left px-2 py-1.5">Durum</th>
                <th className="text-right px-2 py-1.5">Tutar</th>
                <th className="text-right px-2 py-1.5">KDV</th>
                <th className="text-right px-2 py-1.5">Düzenleme</th>
                <th className="text-right px-2 py-1.5">Ödeme</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center px-4 py-6 text-[var(--a-text-4)]">
                    Bu tenant için fatura kaydı yok.
                  </td>
                </tr>
              ) : (
                recentInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-t border-[var(--a-line)] hover:bg-white/[0.025]"
                  >
                    <td className="px-2 py-2">
                      <MonoTag>{inv.number}</MonoTag>
                    </td>
                    <td className="px-2 py-2">
                      <AdminBadge
                        tone={
                          inv.status === 'paid'
                            ? 'success'
                            : inv.status === 'past_due'
                              ? 'warning'
                              : inv.status === 'pending'
                                ? 'info'
                                : 'neutral'
                        }
                        dot
                      >
                        {inv.status}
                      </AdminBadge>
                    </td>
                    <td className="px-2 py-2 text-right num text-[var(--a-text-1)] font-semibold">
                      {fmtTRY(inv.total)}
                    </td>
                    <td className="px-2 py-2 text-right num text-[var(--a-text-3)]">
                      {fmtTRY(inv.tax)}
                    </td>
                    <td className="px-2 py-2 text-right num text-[var(--a-text-4)]">
                      {fmtDate(inv.issuedAt)}
                    </td>
                    <td className="px-2 py-2 text-right num text-[var(--a-text-4)]">
                      {inv.paidAt ? fmtDate(inv.paidAt) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}

function CompanyFact({
  label,
  value,
  mono,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="px-5 py-3 border-r last:border-r-0 border-[var(--a-line)]">
      <div className="text-[9.5px] uppercase tracking-[0.14em] font-semibold text-[var(--a-text-4)]">
        {label}
      </div>
      <div
        className={`mt-0.5 text-[12.5px] text-[var(--a-text-2)] truncate ${mono ? 'font-mono' : ''}`}
      >
        {value}
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  mono,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-[var(--a-text-3)]">{label}</dt>
      <dd className={`text-[var(--a-text-1)] num ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  )
}

function fmtDate(d: Date | string) {
  const dt = new Date(d)
  return dt.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtRelative(d: Date | string): string {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'şimdi'
  if (m < 60) return `${m}d`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}sa`
  const day = Math.floor(h / 24)
  return `${day}g önce`
}
