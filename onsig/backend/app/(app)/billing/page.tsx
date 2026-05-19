import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Check,
  Sparkles,
  Crown,
  Building,
  Zap,
  HelpCircle,
} from 'lucide-react'
import { getOptionalUser, loadTenant } from '@/lib/session'
import { getDashboardStats } from '@/lib/contracts'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Plan & abonelik · OnSig' }

interface Plan {
  id: 'free' | 'pro' | 'enterprise'
  name: string
  price: string
  priceSuffix: string
  description: string
  highlight?: boolean
  quota: { contracts: number | 'sınırsız' }
  features: string[]
  icon: React.ReactNode
  accent: string
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '₺0',
    priceSuffix: '/ ay',
    description: 'Başlangıç. Tek kullanıcı, küçük emlak ofisleri için.',
    quota: { contracts: 10 },
    features: [
      'Aylık 10 sözleşme',
      '4 hazır şablon (Kira, Yetki, Alım-Satım, Yer Gösterme)',
      'Online imza + OTP doğrulama',
      'PDF üretimi & SHA-256 audit',
      'E-posta bildirimi',
    ],
    icon: <Sparkles className="w-5 h-5" />,
    accent: 'from-slate-500 to-slate-700',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₺499',
    priceSuffix: '/ ay',
    description: 'Büyüyen ofis. Marka kişiselleştirmesi ve SMS dahil.',
    quota: { contracts: 100 },
    features: [
      'Aylık 100 sözleşme',
      'Sınırsız imzacı oturumu',
      'SMS ile OTP',
      'Marka kişiselleştirmesi (logo, renk)',
      'Özel sözleşme şablonu (yakında)',
      'Öncelikli destek',
    ],
    highlight: true,
    icon: <Crown className="w-5 h-5" />,
    accent: 'from-violet-500 to-fuchsia-500',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Teklif',
    priceSuffix: '',
    description: 'Çok şubeli ofisler, franchise ve diğer sektörler.',
    quota: { contracts: 'sınırsız' },
    features: [
      'Sınırsız sözleşme & şube',
      'Çok kullanıcılı yönetim & roller',
      'Tek imzalı oturum (SSO)',
      'Özel sektör şablonları',
      'KVKK & nitelikli imza entegrasyonu',
      'SLA & adanmış destek',
    ],
    icon: <Building className="w-5 h-5" />,
    accent: 'from-amber-500 to-orange-500',
  },
]

export default async function BillingPage() {
  const session = await getOptionalUser()
  if (!session) redirect('/login')

  const [tenant, stats] = await Promise.all([
    loadTenant(session.tenantId),
    getDashboardStats(session.tenantId),
  ])
  const currentPlan = (tenant?.plan ?? 'free').toLowerCase() as Plan['id']
  const plan = PLANS.find((p) => p.id === currentPlan) ?? PLANS[0]!
  const usedThisMonth = stats.contracts.thisMonth
  const quota = typeof plan.quota.contracts === 'number' ? plan.quota.contracts : Infinity
  const pct = quota === Infinity ? 0 : Math.min(100, Math.round((usedThisMonth / quota) * 100))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Plan ve abonelik</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          Aktif planını gör, ihtiyacın büyüdükçe yükseltme talebi gönder.
        </p>
      </div>

      {/* current plan + usage */}
      <div className="card relative overflow-hidden">
        <div
          className={`absolute -top-16 -right-16 w-56 h-56 rounded-full bg-gradient-to-br ${plan.accent} opacity-10`}
        />
        <div className="relative grid sm:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-xl bg-gradient-to-br ${plan.accent} text-white grid place-items-center`}
              >
                {plan.icon}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-ink-muted">Aktif plan</p>
                <p className="font-display text-2xl font-bold">{plan.name}</p>
              </div>
            </div>
            <p className="text-sm text-ink-muted mt-3">{plan.description}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-ink-muted">Bu ay kullanım</p>
            <p className="font-display text-2xl font-bold mt-1">
              {usedThisMonth}{' '}
              <span className="text-sm font-medium text-ink-muted">
                / {typeof plan.quota.contracts === 'number' ? plan.quota.contracts : 'sınırsız'}{' '}
                sözleşme
              </span>
            </p>
            {quota !== Infinity && (
              <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${pct > 80 ? 'bg-rose-500' : 'bg-brand'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            )}
            <div className="text-xs text-ink-muted mt-2 flex items-center gap-4">
              <span>Toplam: {stats.contracts.total}</span>
              <span>Bekleyen imza: {stats.signSessions.pending}</span>
              <span>Tamamlanan imza: {stats.signSessions.completed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* plan grid */}
      <div className="grid lg:grid-cols-3 gap-4">
        {PLANS.map((p) => {
          const isCurrent = p.id === currentPlan
          return (
            <div
              key={p.id}
              className={`card relative overflow-hidden ${
                p.highlight ? 'border-brand shadow-md ring-1 ring-brand/30' : ''
              }`}
            >
              {p.highlight && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold bg-brand text-white px-2 py-0.5 rounded-full">
                  <Zap className="w-3 h-3" />
                  En çok tercih edilen
                </span>
              )}
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.accent} text-white grid place-items-center`}
              >
                {p.icon}
              </div>
              <h3 className="mt-3 font-display text-xl font-bold tracking-tight">{p.name}</h3>
              <p className="text-sm text-ink-muted mt-0.5">{p.description}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-3xl font-bold">{p.price}</span>
                {p.priceSuffix && (
                  <span className="text-sm text-ink-muted">{p.priceSuffix}</span>
                )}
              </div>
              <ul className="mt-4 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                {isCurrent ? (
                  <button
                    disabled
                    className="btn-secondary w-full justify-center cursor-default"
                  >
                    <Check className="w-4 h-4" />
                    Aktif plan
                  </button>
                ) : p.id === 'enterprise' ? (
                  <a
                    href="mailto:satis@onsig.app?subject=Enterprise%20teklif%20talebi"
                    className="btn-primary w-full justify-center"
                  >
                    Teklif iste
                  </a>
                ) : (
                  <a
                    href={`mailto:satis@onsig.app?subject=Plan%20yükseltme%3A%20${p.name}`}
                    className="btn-primary w-full justify-center"
                  >
                    Bu plana geç
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* FAQ / hint */}
      <div className="card bg-slate-50 border-dashed">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 grid place-items-center text-ink-muted shrink-0">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div className="text-sm text-ink-muted leading-relaxed">
            <p className="font-semibold text-ink">Plan değişikliği nasıl uygulanır?</p>
            <p className="mt-1">
              Şu an ödeme entegrasyonu kapalı — yükseltme talepleri ekibimize e-posta olarak iletilir
              ve fatura/sözleşme süreciyle aktivasyon manuel yapılır. Aboneliğinizle ilgili her şey için{' '}
              <a className="text-brand hover:underline" href="mailto:destek@onsig.app">
                destek@onsig.app
              </a>{' '}
              adresine yazabilirsiniz.
            </p>
            <p className="mt-2 text-xs">
              Detaylı plan karşılaştırması için{' '}
              <Link className="text-brand hover:underline" href="/dashboard">
                dashboard
              </Link>
              'a dön.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
