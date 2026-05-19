import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  FileSignature,
  ScrollText,
  Clock3,
  CheckCircle2,
  Plus,
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Users,
  Building,
  Sparkles,
  Bell,
  Inbox,
} from 'lucide-react'
import { getOptionalUser, loadTenant } from '@/lib/session'
import {
  getDashboardStats,
  getPendingSignatures,
  getDailyContractCounts,
} from '@/lib/contracts'
import { listRecentAudit } from '@/lib/audit'
import {
  Card,
  CardHeader,
  Stat,
  Sparkline,
  Badge,
  Avatar,
  EmptyState,
  Timeline,
  Section,
  cn,
  type TimelineItem,
  type BadgeTone,
} from '@/components/ui/onsig-design-system'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dashboard · OnSig' }

// ─── label maps ───────────────────────────────────────────────────────────────
const TEMPLATE_LABEL: Record<string, string> = {
  kira: 'Kira',
  yetki: 'Yetki',
  'alim-satim': 'Alım-Satım',
  'yer-gosterme': 'Yer Gösterme',
  custom: 'Özel',
}

const STATUS_TONE: Record<string, BadgeTone> = {
  taslak: 'neutral',
  aktif: 'warning',
  tamamlandi: 'success',
  iptal: 'danger',
}
const STATUS_LABEL: Record<string, string> = {
  taslak: 'Taslak',
  aktif: 'Aktif',
  tamamlandi: 'Tamamlandı',
  iptal: 'İptal',
}

const ROLE_LABEL: Record<string, string> = {
  'kiraya-veren': 'Kiraya veren',
  kiraci: 'Kiracı',
  kefil: 'Kefil',
  'mal-sahibi': 'Mal sahibi',
  komisyoncu: 'Komisyoncu',
  satici: 'Satıcı',
  alici: 'Alıcı',
  'yer-goren': 'Gezen',
  'imzaci-1': '1. İmzacı',
  'imzaci-2': '2. İmzacı',
  'imzaci-3': '3. İmzacı',
  'imzaci-4': '4. İmzacı',
}

const EVENT_LABEL: Record<string, string> = {
  'contract.created': 'Sözleşme oluşturuldu',
  'contract.updated': 'Sözleşme güncellendi',
  'contract.cancelled': 'Sözleşme iptal edildi',
  'sign_session.created': 'İmza oturumu oluşturuldu',
  'sign_session.cancelled': 'İmza iptal edildi',
  'sign_session.otp_sent': 'OTP gönderildi',
  'sign_session.otp_verified': 'OTP doğrulandı',
  'sign_session.signed': 'İmza atıldı',
  'pdf.generated': 'PDF oluşturuldu',
  'tenant.updated': 'Firma bilgileri güncellendi',
  'branch.created': 'Şube eklendi',
  'branch.updated': 'Şube güncellendi',
  'branch.deleted': 'Şube silindi',
  'team.invite_created': 'Davet üretildi',
  'team.invite_revoked': 'Davet iptal edildi',
  'team.role_changed': 'Rol değiştirildi',
  'team.removed': 'Üye çıkarıldı',
  'user.login': 'Giriş yapıldı',
  'user.registered': 'Hesap oluşturuldu',
}

const EVENT_TONE: Record<string, BadgeTone> = {
  'contract.created': 'iris',
  'contract.updated': 'neutral',
  'contract.cancelled': 'danger',
  'sign_session.created': 'info',
  'sign_session.cancelled': 'danger',
  'sign_session.signed': 'success',
  'sign_session.otp_verified': 'iris',
  'pdf.generated': 'neutral',
  'tenant.updated': 'neutral',
  'branch.created': 'success',
  'team.invite_created': 'iris',
  'team.role_changed': 'warning',
  'user.login': 'neutral',
  'user.registered': 'success',
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function fmtRelative(d: Date | string): string {
  const date = new Date(d)
  const diff = Date.now() - date.getTime()
  const min = Math.round(diff / 60000)
  if (min < 1) return 'az önce'
  if (min < 60) return `${min} dk önce`
  const h = Math.round(min / 60)
  if (h < 24) return `${h} sa önce`
  const d2 = Math.round(h / 24)
  if (d2 < 7) return `${d2} gün önce`
  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// ─── page ─────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const session = await getOptionalUser()
  if (!session) redirect('/login')

  const [stats, tenant, recent, pendingSigs, daily] = await Promise.all([
    getDashboardStats(session.tenantId),
    loadTenant(session.tenantId),
    listRecentAudit(session.tenantId, 8),
    getPendingSignatures(session.tenantId, 5),
    getDailyContractCounts(session.tenantId, 14),
  ])

  const PLAN_QUOTA: Record<string, number> = {
    free: 10,
    pro: 100,
    enterprise: Infinity,
  }
  const plan = (tenant?.plan ?? 'free').toLowerCase()
  const quota = PLAN_QUOTA[plan] ?? 10
  const usedThisMonth = stats.contracts.thisMonth
  const quotaPct =
    quota === Infinity
      ? 0
      : Math.min(100, Math.round((usedThisMonth / Math.max(1, quota)) * 100))

  const templateBreakdown = Object.entries(stats.contracts.byTemplate)
    .map(([k, v]) => ({ key: k, label: TEMPLATE_LABEL[k] ?? k, count: v }))
    .sort((a, b) => b.count - a.count)
  const totalTemplates = templateBreakdown.reduce((a, b) => a + b.count, 0) || 1

  const timelineItems: TimelineItem[] = recent.map((r) => ({
    id: r.id,
    title: EVENT_LABEL[r.eventType] ?? r.eventType,
    description: `${r.entityKind} #${r.entityId}`,
    timestamp: r.createdAt,
    tone: EVENT_TONE[r.eventType] ?? 'neutral',
  }))

  return (
    <div className="space-y-6">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-iris-hero text-paper p-6 sm:p-8 shadow-pop">
        <div
          aria-hidden
          className="absolute inset-0 bg-grid-faint bg-grid-md opacity-[0.05]"
        />
        <div
          aria-hidden
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-iris-9 blur-3xl opacity-30"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 right-1/3 w-72 h-72 rounded-full bg-iris-6 blur-3xl opacity-15"
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-2xs uppercase tracking-[0.18em] font-semibold text-paper/60">
              <Sparkles className="w-3 h-3 text-iris-3" />
              {tenant?.name ?? 'OnSig'}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tightest mt-2 text-balance">
              Sözleşmelerin canlı paneli.
            </h1>
            <p className="text-paper/70 text-sm mt-2 max-w-md leading-relaxed">
              Bekleyen imzalar, oluşturulan dokümanlar ve audit zinciri — hepsi
              gerçek zamanlı, hepsi tek ekranda.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              href="/contracts"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg text-sm font-semibold bg-white/10 text-paper hover:bg-white/15 backdrop-blur-glass ring-1 ring-white/15 transition-all"
            >
              <ScrollText className="w-4 h-4" />
              Tüm sözleşmeler
            </Link>
            <Link
              href="/contracts/new"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg text-sm font-semibold bg-paper text-ink-12 hover:bg-ink-1 shadow-md transition-all active:scale-[0.985]"
            >
              <Plus className="w-4 h-4" />
              Yeni sözleşme
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stat strip ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card padding="md" className="!p-4">
          <Stat
            icon={<ScrollText className="w-3.5 h-3.5" />}
            label="Sözleşme"
            value={stats.contracts.total}
            hint={`${stats.contracts.thisMonth} bu ay`}
            chart={
              <Sparkline
                data={daily.length ? daily : [0, 0]}
                width={120}
                height={28}
                stroke="#5E55E5"
                strokeWidth={1.75}
              />
            }
          />
        </Card>
        <Card padding="md" className="!p-4">
          <Stat
            icon={<Clock3 className="w-3.5 h-3.5" />}
            label="Bekleyen imza"
            value={stats.signSessions.pending}
            hint={
              stats.signSessions.cancelled
                ? `${stats.signSessions.cancelled} iptal`
                : 'Tüm imzalar güncel'
            }
            trend={
              stats.signSessions.pending > 0
                ? {
                    direction: 'up',
                    label: 'işlem bekliyor',
                    tone: 'warning',
                  }
                : undefined
            }
          />
        </Card>
        <Card padding="md" className="!p-4">
          <Stat
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            label="Tamamlanan"
            value={stats.signSessions.completed}
            hint={`${stats.signSessions.completedThisMonth} bu ay`}
            trend={
              stats.signSessions.completedThisMonth > 0
                ? {
                    direction: 'up',
                    label: `+${stats.signSessions.completedThisMonth}`,
                    tone: 'success',
                  }
                : undefined
            }
          />
        </Card>
        <Card padding="md" className="!p-4">
          <Stat
            icon={<ShieldCheck className="w-3.5 h-3.5" />}
            label="Aktif sözleşme"
            value={stats.contracts.byStatus.aktif ?? 0}
            hint={`${stats.contracts.byStatus.taslak ?? 0} taslak`}
          />
        </Card>
      </div>

      {/* ── Two-column: queue + breakdown ─────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Pending queue */}
        <Card className="lg:col-span-2" padding="none">
          <div className="px-5 pt-5 pb-3 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-warning" />
                <p className="text-2xs uppercase tracking-[0.16em] font-semibold text-ink-7">
                  İmza kuyruğu
                </p>
              </div>
              <h2 className="font-display text-lg font-semibold tracking-tightest text-ink-12 mt-1">
                Bekleyen imzalar
                <span className="ml-2 text-ink-7 font-medium text-sm num">
                  · {stats.signSessions.pending}
                </span>
              </h2>
            </div>
            <Link
              href="/contracts"
              className="inline-flex items-center gap-1 text-xs font-semibold text-ink-9 hover:text-iris-10 transition-colors"
            >
              Sözleşmelerde gör
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {pendingSigs.length === 0 ? (
            <div className="px-5 pb-5">
              <EmptyState
                icon={<Inbox />}
                title="Bekleyen imza yok"
                description="İmza istediğin bir sözleşmen olursa burada gerçek zamanlı olarak listelenir."
                pattern
              />
            </div>
          ) : (
            <ul className="divide-y divide-divider">
              {pendingSigs.map((p) => {
                const sinceMs = Date.now() - new Date(p.createdAt).getTime()
                const stale = sinceMs > 1000 * 60 * 60 * 24 * 3
                return (
                  <li key={p.sessionId}>
                    <Link
                      href={`/contracts/${p.contractId}`}
                      className="group flex items-center gap-3 px-5 py-3 hover:bg-ink-1 transition-colors"
                    >
                      <Avatar
                        name={p.recipientName || p.recipientEmail || p.role}
                        size="md"
                        status={stale ? 'warning' : null}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-ink-12 truncate">
                            {p.recipientName ||
                              p.recipientEmail ||
                              p.recipientPhone ||
                              'Alıcı bilgisi eksik'}
                          </p>
                          <Badge tone="neutral" size="xs">
                            {ROLE_LABEL[p.role] ?? p.role}
                          </Badge>
                        </div>
                        <p className="text-2xs text-ink-7 truncate mt-0.5">
                          {p.contractTitle ||
                            TEMPLATE_LABEL[p.templateKey] ||
                            'Sözleşme'}
                          {' · '}
                          {fmtRelative(p.createdAt)}
                        </p>
                      </div>
                      <Badge
                        tone={stale ? 'warning' : 'info'}
                        size="sm"
                        dot
                      >
                        {stale ? 'Geç kalıyor' : 'Bekliyor'}
                      </Badge>
                      <ArrowRight className="w-3.5 h-3.5 text-ink-6 group-hover:text-ink-12 group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        {/* Plan + breakdown stack */}
        <div className="space-y-4">
          {/* Plan card */}
          <Card variant="legal" padding="md" className="relative overflow-hidden">
            <div className="flex items-center gap-2">
              <p className="section-overline">Plan</p>
              <Badge tone="iris" size="xs">
                {plan.toUpperCase()}
              </Badge>
            </div>
            <p className="font-display text-2xl font-bold tracking-tightest text-ink-12 mt-2 num">
              {usedThisMonth}
              <span className="text-ink-7 font-medium text-base">
                {' '}
                /{' '}
                {quota === Infinity ? (
                  <span aria-label="sınırsız">∞</span>
                ) : (
                  quota
                )}
              </span>
            </p>
            <p className="text-xs text-ink-7 mt-1">Bu ay oluşturulan sözleşme</p>

            {quota !== Infinity && (
              <div className="mt-3 h-1.5 rounded-pill bg-ink-3 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-pill transition-all duration-420 ease-emphasized',
                    quotaPct > 80
                      ? 'bg-gradient-to-r from-warning to-danger'
                      : 'bg-gradient-to-r from-iris-7 to-iris-10'
                  )}
                  style={{ width: `${quotaPct}%` }}
                />
              </div>
            )}

            <Link
              href="/billing"
              className="mt-4 inline-flex items-center justify-between w-full h-9 px-3 rounded-md bg-ink-12 text-paper hover:bg-ink-11 text-xs font-semibold transition-colors"
            >
              <span>Plan seçeneklerini gör</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </Card>

          {/* Template breakdown */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-ink-9" />
                <p className="section-overline">Dağılım</p>
              </div>
              <span className="text-2xs text-ink-7 num">
                {stats.contracts.total} toplam
              </span>
            </div>
            {templateBreakdown.length === 0 ? (
              <p className="text-xs text-ink-7">Henüz veri yok.</p>
            ) : (
              <ul className="space-y-2.5">
                {templateBreakdown.map((t) => {
                  const pct = Math.round((t.count / totalTemplates) * 100)
                  return (
                    <li key={t.key}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-ink-12">
                          {t.label}
                        </span>
                        <span className="text-ink-7 num">
                          {t.count}{' '}
                          <span className="text-2xs text-ink-7">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-1.5 rounded-pill bg-ink-3 overflow-hidden">
                        <div
                          className="h-full rounded-pill bg-gradient-to-r from-iris-7 to-iris-10"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* ── Three-up: recent contracts + audit timeline + quick actions ──── */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Recent contracts */}
        <Card className="lg:col-span-2" padding="none">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div>
              <p className="section-overline">Son aktivite</p>
              <h2 className="font-display text-lg font-semibold tracking-tightest text-ink-12 mt-1">
                Son oluşturulan sözleşmeler
              </h2>
            </div>
            <Link
              href="/contracts"
              className="inline-flex items-center gap-1 text-xs font-semibold text-ink-9 hover:text-iris-10 transition-colors"
            >
              Tümünü gör
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {stats.recentContracts.length === 0 ? (
            <div className="px-5 pb-5">
              <EmptyState
                icon={<FileSignature />}
                title="Henüz sözleşme yok"
                description="İlk sözleşmeni oluşturduğunda burada özet görünür."
                action={
                  <Link
                    href="/contracts/new"
                    className="btn-primary"
                  >
                    <Plus className="w-4 h-4" />
                    Yeni sözleşme
                  </Link>
                }
              />
            </div>
          ) : (
            <ul className="divide-y divide-divider">
              {stats.recentContracts.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/contracts/${c.id}`}
                    className="group flex items-center gap-3 px-5 py-3 hover:bg-ink-1 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-md bg-ink-2 text-ink-9 grid place-items-center shrink-0">
                      <FileSignature className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink-12 truncate group-hover:text-iris-10 transition-colors">
                        {c.title ||
                          TEMPLATE_LABEL[c.templateKey] ||
                          'Başlıksız sözleşme'}
                      </p>
                      <p className="text-2xs text-ink-7 truncate mt-0.5">
                        <span className="font-mono">#{c.id}</span> ·{' '}
                        {TEMPLATE_LABEL[c.templateKey] ?? c.templateKey} ·{' '}
                        {fmtRelative(c.createdAt)}
                      </p>
                    </div>
                    <Badge
                      tone={STATUS_TONE[c.status] ?? 'neutral'}
                      size="sm"
                      dot
                    >
                      {STATUS_LABEL[c.status] ?? c.status}
                    </Badge>
                    <ArrowRight className="w-3.5 h-3.5 text-ink-6 group-hover:text-ink-12 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Activity timeline */}
        <Card padding="md">
          <CardHeader
            overline="Audit zinciri"
            title="Canlı akış"
            actions={
              <Link
                href="/audit"
                className="text-xs font-semibold text-ink-9 hover:text-iris-10 transition-colors inline-flex items-center gap-1"
              >
                Detay
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            }
          />
          {timelineItems.length === 0 ? (
            <p className="text-xs text-ink-7">Henüz olay yok.</p>
          ) : (
            <Timeline items={timelineItems} />
          )}
        </Card>
      </div>

      {/* ── Quick actions row ─────────────────────────────────────────────── */}
      <Section
        overline="Hızlı aksiyon"
        title="Bir sonraki adımın"
        description="Sık kullanılan akışlar — tek tıkla ulaş."
        size="md"
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction
            href="/contracts/new"
            icon={<FileSignature className="w-4 h-4" />}
            label="Yeni sözleşme"
            sub="Şablon seç, başla"
            tone="primary"
          />
          <QuickAction
            href="/settings/branches"
            icon={<Building className="w-4 h-4" />}
            label="Şube ekle"
            sub="Çok lokasyonlu yapı"
          />
          <QuickAction
            href="/settings/team"
            icon={<Users className="w-4 h-4" />}
            label="Ekip yönet"
            sub="Davet & roller"
          />
          <QuickAction
            href="/audit"
            icon={<ShieldCheck className="w-4 h-4" />}
            label="Zinciri denetle"
            sub="SHA-256 doğrulama"
          />
        </div>
      </Section>
    </div>
  )
}

// ─── local component ─────────────────────────────────────────────────────────
function QuickAction({
  href,
  icon,
  label,
  sub,
  tone = 'neutral',
}: {
  href: string
  icon: React.ReactNode
  label: string
  sub: string
  tone?: 'neutral' | 'primary'
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group relative overflow-hidden rounded-card border p-4 transition-all duration-220 ease-emphasized',
        tone === 'primary'
          ? 'bg-ink-12 text-paper border-ink-12 hover:bg-ink-11 shadow-md'
          : 'bg-paper border-divider hover:border-divider-strong hover:-translate-y-0.5 hover:shadow-md'
      )}
    >
      <div
        className={cn(
          'w-9 h-9 grid place-items-center rounded-md mb-3',
          tone === 'primary'
            ? 'bg-white/10 text-paper'
            : 'bg-iris-1 text-iris-10'
        )}
      >
        {icon}
      </div>
      <p
        className={cn(
          'font-semibold tracking-tight text-sm',
          tone === 'primary' ? 'text-paper' : 'text-ink-12'
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          'text-2xs mt-0.5',
          tone === 'primary' ? 'text-paper/60' : 'text-ink-7'
        )}
      >
        {sub}
      </p>
      <ArrowUpRight
        className={cn(
          'w-3.5 h-3.5 absolute top-3 right-3 transition-all',
          tone === 'primary'
            ? 'text-paper/40 group-hover:text-paper'
            : 'text-ink-6 group-hover:text-iris-10 group-hover:-translate-y-0.5 group-hover:translate-x-0.5'
        )}
      />
    </Link>
  )
}
