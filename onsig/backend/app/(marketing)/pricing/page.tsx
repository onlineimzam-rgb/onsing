import type { Metadata } from 'next'
import { Fragment } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Check,
  Minus,
  Sparkles,
} from 'lucide-react'

import { Accordion } from '@/components/marketing/Accordion'
import {
  FadeIn,
  FadeInItem,
  FadeInStagger,
} from '@/components/marketing/Motion'
import {
  Container,
  CTABand,
  Eyebrow,
  GradientText,
  Section,
  SectionHeading,
} from '@/components/marketing/primitives'

export const metadata: Metadata = {
  title: 'Fiyatlandırma — taahhütsüz, esnek planlar',
  description:
    'OnSig fiyatlandırması: ücretsiz Başlangıç, KOBİ\'ler için Pro ve özel SLA / SSO sunan Kurumsal. Aylık, taahhütsüz.',
  alternates: { canonical: '/pricing' },
}

type Plan = {
  key: 'free' | 'pro' | 'business'
  name: string
  badge?: string
  price: string
  suffix: string
  description: string
  cta: { label: string; href: string }
  highlight?: boolean
  features: string[]
}

const PLANS: Plan[] = [
  {
    key: 'free',
    name: 'Başlangıç',
    price: '0 ₺',
    suffix: '/ ay',
    description: 'Bireysel kullanıcı ve denemeler için ideal.',
    cta: { label: 'Ücretsiz başla', href: '/register' },
    features: [
      '5 sözleşme / ay',
      '1 kullanıcı',
      'OTP doğrulamalı imza',
      'PDF arşivi',
      'Temel audit zinciri',
      'E-posta desteği',
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    badge: 'En popüler',
    price: '699 ₺',
    suffix: '/ ay',
    description: 'KOBİ ve büyüyen ofisler için tam kapsam.',
    cta: { label: 'Pro\u2019yu dene', href: '/register' },
    highlight: true,
    features: [
      'Sınırsız sözleşme',
      '5 kullanıcı dahil (+ ek kullanıcı 99 ₺)',
      'Şube & lokasyon yönetimi',
      'Özel sözleşme şablonu',
      'Genişletilmiş audit raporları',
      'Öncelikli destek',
      'WhatsApp & SMS gönderim',
      'Marka logosu ve renk',
    ],
  },
  {
    key: 'business',
    name: 'Kurumsal',
    price: 'Görüşme',
    suffix: '',
    description: 'Hukuk, gayrimenkul yatırım ve büyük yapılar için.',
    cta: { label: 'Satışla görüş', href: '/contact' },
    features: [
      'Sınırsız her şey',
      'Özel SSO / SAML',
      'API & webhook erişimi',
      'Özel domain & beyaz etiket',
      'Özel SLA (99.95%)',
      'Adanmış müşteri başarısı',
      'KVKK & ISO 27001 evrak desteği',
      'Veri lokalizasyonu (TR)',
    ],
  },
]

const COMPARE: { group: string; rows: { name: string; values: (boolean | string)[] }[] }[] = [
  {
    group: 'Sözleşme',
    rows: [
      { name: 'Aylık sözleşme limiti', values: ['5', 'Sınırsız', 'Sınırsız'] },
      { name: 'Özel sözleşme şablonu', values: [false, true, true] },
      { name: 'Şube & lokasyon', values: [false, true, true] },
    ],
  },
  {
    group: 'İmza',
    rows: [
      { name: 'OTP doğrulama', values: [true, true, true] },
      { name: 'WhatsApp & SMS', values: [false, true, true] },
      { name: 'Çoklu imzacı sırası', values: [true, true, true] },
    ],
  },
  {
    group: 'Audit & Arşiv',
    rows: [
      { name: 'SHA-256 hash chain', values: [true, true, true] },
      { name: 'Genişletilmiş audit raporu', values: [false, true, true] },
      { name: 'Veri lokalizasyonu (TR)', values: [false, false, true] },
    ],
  },
  {
    group: 'Ekip',
    rows: [
      { name: 'Kullanıcı sayısı', values: ['1', '5+', 'Sınırsız'] },
      { name: 'Rol & izin yönetimi', values: [false, true, true] },
      { name: 'Beyaz etiket', values: [false, false, true] },
    ],
  },
  {
    group: 'Destek',
    rows: [
      { name: 'E-posta desteği', values: [true, true, true] },
      { name: 'Öncelikli destek', values: [false, true, true] },
      { name: 'Adanmış müşteri başarısı', values: [false, false, true] },
      { name: 'Özel SLA', values: [false, false, true] },
    ],
  },
]

export default function PricingPage() {
  return (
    <>
      {/* Hero + plan grid */}
      <Section pad="xl" className="relative overflow-hidden" pattern="grid">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-20 h-[420px] bg-iris-hero opacity-[0.30]"
        />
        <Container className="relative">
          <FadeIn>
            <div className="max-w-2xl">
              <Eyebrow>Fiyatlandırma</Eyebrow>
              <h1 className="mt-5 font-display text-display-lg sm:text-display-xl tracking-tightest text-balance text-ink-12">
                İhtiyacın kadar.{' '}
                <GradientText>Aylık. Taahhütsüz.</GradientText>
              </h1>
              <p className="mt-5 text-body-lg text-ink-8 leading-relaxed max-w-xl">
                Bireysel kullanım için ücretsiz, KOBİ&apos;ler için tek planlı
                Pro, kurumsal müşteriler için özel teklif. Her planda audit
                zinciri varsayılan olarak açık.
              </p>
            </div>
          </FadeIn>

          {/* Plan cards */}
          <div className="mt-14 grid lg:grid-cols-3 gap-5">
            {PLANS.map((p) => (
              <PlanCard key={p.key} plan={p} />
            ))}
          </div>

          <p className="mt-8 text-xs text-ink-7 text-center">
            Tüm fiyatlara KDV (%20) dahil değildir · taahhüt yok · istediğin zaman iptal
          </p>
        </Container>
      </Section>

      {/* Comparison table */}
      <Section pad="lg" className="bg-ink-1 border-y border-divider">
        <Container>
          <SectionHeading
            eyebrow="Karşılaştırma"
            title={
              <>
                Plan farkları, <GradientText>tek bakışta.</GradientText>
              </>
            }
            description="Aşağıdaki tablo, üç planda neyin olduğunu yan yana gösterir."
          />
          <div className="mt-10 overflow-x-auto -mx-5 sm:mx-0">
            <table className="min-w-[640px] w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left text-2xs uppercase tracking-widest font-semibold text-ink-7 px-4 py-3 w-[40%]">
                    Özellik
                  </th>
                  {PLANS.map((p) => (
                    <th
                      key={p.key}
                      className={`text-left text-2xs uppercase tracking-widest font-semibold px-4 py-3 ${
                        p.highlight ? 'text-iris-11' : 'text-ink-7'
                      }`}
                    >
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((g) => (
                  <Fragment key={g.group}>
                    <tr>
                      <td
                        colSpan={4}
                        className="text-2xs uppercase tracking-widest font-semibold text-ink-10 bg-paper px-4 pt-7 pb-2"
                      >
                        {g.group}
                      </td>
                    </tr>
                    {g.rows.map((row) => (
                      <tr
                        key={`${g.group}-${row.name}`}
                        className="border-t border-divider bg-paper"
                      >
                        <td className="px-4 py-3 font-medium text-ink-12">
                          {row.name}
                        </td>
                        {row.values.map((v, i) => (
                          <td
                            key={i}
                            className={`px-4 py-3 ${
                              PLANS[i].highlight ? 'bg-iris-1/30' : ''
                            }`}
                          >
                            {typeof v === 'boolean' ? (
                              v ? (
                                <span className="inline-grid place-items-center w-5 h-5 rounded-full bg-success-soft text-success-deep">
                                  <Check className="w-3 h-3" />
                                </span>
                              ) : (
                                <span className="inline-grid place-items-center w-5 h-5 rounded-full bg-ink-2 text-ink-6">
                                  <Minus className="w-3 h-3" />
                                </span>
                              )
                            ) : (
                              <span className="font-semibold text-ink-12 num">
                                {v}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section pad="lg">
        <Container width="narrow">
          <SectionHeading
            eyebrow="Fiyatlandırma SSS"
            title={
              <>
                Faturalandırma hakkında <GradientText>en sık sorulanlar.</GradientText>
              </>
            }
            align="center"
            className="mb-10 mx-auto text-center"
          />
          <Accordion
            items={[
              {
                id: 'iptal',
                question: 'İptal koşulları neler?',
                answer:
                  'Taahhüt yok. Hesap ayarlarınızdan tek tıkla iptal edebilir, döneminizin sonuna kadar Pro\u2019yu kullanmaya devam edebilirsiniz. İptal sonrası dilerseniz tüm verilerinizi (sözleşme, PDF, audit log) indirebilirsiniz.',
              },
              {
                id: 'kdv',
                question: 'Fiyatlara KDV dahil mi?',
                answer:
                  'Hayır, tüm liste fiyatları KDV hariçtir. Faturanız %20 KDV ile düzenlenir.',
              },
              {
                id: 'fatura',
                question: 'Şirket adına fatura kesilebilir mi?',
                answer:
                  'Evet. Hesap ayarlarından şirket ünvanı, VKN ve vergi dairesi bilgilerinizi tanımlayabilirsiniz. Aylık otomatik e-fatura üretiriz.',
              },
              {
                id: 'limit',
                question: 'Pro\u2019da gerçekten sınırsız sözleşme mi var?',
                answer:
                  'Evet. Adil kullanım çerçevesinde Pro\u2019da aylık sözleşme limiti yok. Aylık 5.000 üzeri sözleşme atılması durumunda Kurumsal plana yönlendiririz.',
              },
              {
                id: 'kurumsal',
                question: 'Kurumsal plan kaç para?',
                answer:
                  'Kurumsal plan ihtiyacınıza göre tasarlanır. Tipik olarak 2.500 ₺ / ay\u2019dan başlar; kullanıcı sayısı, SLA ve özel entegrasyon ihtiyaçları toplam maliyeti belirler.',
              },
              {
                id: 'sms',
                question: 'SMS gönderim ücreti dahil mi?',
                answer:
                  'Pro\u2019da ayda 250 SMS gönderim dahildir; ek paketler 100 SMS için 49 ₺\u2019dir. WhatsApp gönderim ücretsizdir.',
              },
            ]}
          />
        </Container>
      </Section>

      {/* CTA */}
      <Section pad="lg" className="bg-ink-1 border-t border-divider">
        <Container>
          <CTABand
            title={
              <>
                Hangi plan sana uygun, <GradientText>5 dakikada keşfet.</GradientText>
              </>
            }
            description="Ücretsiz hesap aç, Pro\u2019yu 14 gün dene; istersen Başlangıç\u2019a kal."
          />
        </Container>
      </Section>
    </>
  )
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <div
      className={`relative rounded-card p-7 sm:p-8 transition-all duration-220 ${
        plan.highlight
          ? 'bg-ink-12 text-paper ring-1 ring-iris-9/40 shadow-[0_30px_60px_-25px_rgba(11,15,27,0.45)]'
          : 'bg-paper text-ink-12 ring-1 ring-divider hover:shadow-md'
      }`}
    >
      {plan.highlight && (
        <>
          <div
            aria-hidden
            className="absolute inset-0 -z-10 rounded-card bg-grid-faint opacity-[0.08]"
          />
          <div
            aria-hidden
            className="absolute -top-24 -right-12 w-[280px] h-[280px] -z-10 rounded-full bg-iris-9/30 blur-3xl"
          />
        </>
      )}

      {plan.badge && (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-semibold uppercase tracking-widest ${
            plan.highlight
              ? 'bg-iris-9/30 text-paper ring-1 ring-iris-9/40'
              : 'bg-iris-1 text-iris-11 ring-1 ring-iris-3'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          {plan.badge}
        </span>
      )}

      <div className="mt-4">
        <div
          className={`text-2xs uppercase tracking-widest font-semibold ${
            plan.highlight ? 'text-iris-3' : 'text-ink-7'
          }`}
        >
          {plan.name}
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="font-display text-display-md tracking-tightest num">
            {plan.price}
          </span>
          {plan.suffix && (
            <span
              className={`text-sm font-medium ${
                plan.highlight ? 'text-ink-5' : 'text-ink-7'
              }`}
            >
              {plan.suffix}
            </span>
          )}
        </div>
        <p
          className={`mt-3 text-sm leading-relaxed ${
            plan.highlight ? 'text-ink-5' : 'text-ink-8'
          }`}
        >
          {plan.description}
        </p>
      </div>

      <Link
        href={plan.cta.href}
        className={
          plan.highlight
            ? 'mt-8 inline-flex items-center gap-1.5 h-11 w-full justify-center rounded-md bg-paper text-ink-12 text-sm font-semibold hover:bg-ink-3 transition-colors'
            : 'mt-8 btn-secondary btn-lg w-full justify-center'
        }
      >
        {plan.cta.label}
        <ArrowRight className="w-4 h-4" />
      </Link>

      <ul className="mt-7 space-y-2.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <span
              className={`mt-0.5 grid place-items-center w-4 h-4 rounded-full shrink-0 ${
                plan.highlight
                  ? 'bg-iris-9/30 text-iris-3 ring-1 ring-iris-9/40'
                  : 'bg-success-soft text-success-deep'
              }`}
            >
              <Check className="w-2.5 h-2.5" />
            </span>
            <span
              className={
                plan.highlight ? 'text-paper' : 'text-ink-11 leading-relaxed'
              }
            >
              {f}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
