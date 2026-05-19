import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileSignature,
  Fingerprint,
  Globe2,
  Hash,
  KeyRound,
  Lock,
  Mail,
  Pen,
  ScrollText,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TimerReset,
  Workflow,
} from 'lucide-react'

import { getOptionalUser } from '@/lib/session'
import { Accordion } from '@/components/marketing/Accordion'
import {
  FadeIn,
  FadeInItem,
  FadeInStagger,
  RevealLine,
} from '@/components/marketing/Motion'
import {
  CTABand,
  Container,
  Eyebrow,
  FeatureTile,
  GradientText,
  MarqueeLogos,
  Quote,
  Section,
  SectionHeading,
  StatTile,
  Step,
} from '@/components/marketing/primitives'
import { HeroShowcase } from './_components/HeroShowcase'
import { MobileShowcase } from './_components/MobileShowcase'
import { WorkflowPreview } from './_components/WorkflowPreview'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'OnSig — Online sözleşme ve e-imza, dakikalar içinde',
  description:
    'Sözleşmeyi hazırla, linki gönder, uzaktan imzalat. OTP doğrulamalı e-imza, SHA-256 audit zinciri, KVKK uyumu. Emlak ve KOBİ\'ler için tasarlandı.',
}

export default async function MarketingHomePage() {
  const session = await getOptionalUser()
  if (session) redirect('/dashboard')

  return (
    <>
      {/* ═════════════════ 1. HERO ═════════════════ */}
      <Section pad="xl" className="relative overflow-hidden" pattern="grid">
        {/* Aurora background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-32 h-[640px] bg-iris-hero opacity-[0.35]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-iris-9/15 blur-3xl"
        />
        <Container width="wide" className="relative">
          <div className="grid lg:grid-cols-[1.05fr,1fr] gap-14 lg:gap-20 items-center">
            <FadeIn duration={0.6}>
              <Eyebrow>Sözleşme · E-imza · Audit</Eyebrow>
              <h1 className="mt-5 font-display text-display-xl sm:text-display-2xl tracking-tightest text-balance text-ink-12">
                Sözleşmeyi dakikalar içinde,{' '}
                <GradientText>imza her yerden.</GradientText>
              </h1>
              <p className="mt-6 text-body-lg text-ink-8 leading-relaxed max-w-xl text-pretty">
                OnSig; emlak, hukuk, mali müşavirlik ve KOBİ&apos;ler için
                tasarlanmış online sözleşme ve e-imza platformudur. Her imza
                IP, zaman damgası ve SHA-256 audit zinciriyle birlikte saklanır.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/register" className="btn-primary btn-lg">
                  Ücretsiz başla
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/contact"
                  className="btn-secondary btn-lg"
                >
                  Demo talep et
                </Link>
                <Link
                  href="#nasil-calisir"
                  className="hidden sm:inline-flex items-center gap-1 px-3 h-10 text-sm font-semibold text-ink-9 hover:text-ink-12 transition-colors"
                >
                  Nasıl çalışır?
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Trust strip */}
              <ul className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-semibold text-ink-8">
                {[
                  { icon: ShieldCheck, label: 'KVKK uyumlu' },
                  { icon: Hash, label: 'SHA-256 audit zinciri' },
                  { icon: Fingerprint, label: 'OTP + parmak imza' },
                  { icon: Clock, label: 'Zaman damgası' },
                ].map((t) => {
                  const Icon = t.icon
                  return (
                    <li key={t.label} className="inline-flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-iris-10" />
                      {t.label}
                    </li>
                  )
                })}
              </ul>
            </FadeIn>

            <FadeIn duration={0.7} delay={0.1}>
              <HeroShowcase />
            </FadeIn>
          </div>
        </Container>
      </Section>

      {/* ═════════════════ 2. TRUSTED BY ═════════════════ */}
      <section className="relative py-12 border-y border-divider bg-paper/60">
        <Container>
          <div className="grid sm:grid-cols-[auto,1fr] gap-8 items-center">
            <div className="text-2xs uppercase tracking-widest font-semibold text-ink-7 max-w-[180px]">
              Türkiye&apos;de yüzlerce ofis ve KOBİ tarafından kullanılıyor
            </div>
            <MarqueeLogos
              items={[
                { name: 'Şahbaz Gayrimenkul' },
                { name: 'Karaca Hukuk' },
                { name: 'Atlas Yatırım' },
                { name: 'Mavi Pano' },
                { name: 'Ergin Müşavirlik' },
                { name: 'Doruk Lojistik' },
                { name: 'Nora & Co.' },
                { name: 'Aksan Mimarlık' },
              ]}
            />
          </div>
        </Container>
      </section>

      {/* ═════════════════ 3. HOW IT WORKS ═════════════════ */}
      <Section id="nasil-calisir" pad="lg">
        <Container>
          <SectionHeading
            eyebrow="Nasıl çalışır"
            title={
              <>
                Dört adım. <GradientText>Hukuken geçerli imza.</GradientText>
              </>
            }
            description="Şablonu seç, formu doldur, linki gönder, audit zinciriyle arşivle. Karşı taraf herhangi bir uygulama indirmek zorunda değil."
          />
          <FadeInStagger className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <FadeInItem>
              <Step
                index={1}
                title="Şablon seç ve doldur"
                description="Kira, yetki, alım-satım, yer gösterme veya özel şablon. Form alanları akıllı."
                icon={<FileSignature className="w-3.5 h-3.5" />}
              />
            </FadeInItem>
            <FadeInItem>
              <Step
                index={2}
                title="Link / QR gönder"
                description="SMS, WhatsApp veya e-posta. Tek bir tıkla imzacılara ulaş."
                icon={<Send className="w-3.5 h-3.5" />}
              />
            </FadeInItem>
            <FadeInItem>
              <Step
                index={3}
                title="OTP + Mobil imza"
                description="KVKK onayı, tek seferlik kod, parmak imza. Üç dakikada tamam."
                icon={<Pen className="w-3.5 h-3.5" />}
              />
            </FadeInItem>
            <FadeInItem>
              <Step
                index={4}
                title="Audit zinciri"
                description="SHA-256 hash zinciri, IP, zaman damgası, imzalı PDF arşivi."
                icon={<Hash className="w-3.5 h-3.5" />}
              />
            </FadeInItem>
          </FadeInStagger>
        </Container>
      </Section>

      {/* ═════════════════ 4. LIVE WORKFLOW PREVIEW ═════════════════ */}
      <Section pad="lg" className="bg-ink-1 border-y border-divider">
        <Container width="wide">
          <SectionHeading
            eyebrow="Canlı önizleme"
            title={
              <>
                Sürüklemeden, kuruluma gerek olmadan{' '}
                <GradientText>imzaya ulaş.</GradientText>
              </>
            }
            description="OnSig'in gerçek arayüzünden alınmış bir akış. Aşağıdaki adımlara tıklayarak veya bekleyerek tüm akışı gör."
          />
          <FadeIn className="mt-12">
            <WorkflowPreview />
          </FadeIn>
        </Container>
      </Section>

      {/* ═════════════════ 5. FEATURES GRID ═════════════════ */}
      <Section pad="lg">
        <Container>
          <div className="grid lg:grid-cols-[1fr,1fr] gap-12 items-end mb-12">
            <SectionHeading
              eyebrow="Platform"
              title={
                <>
                  Bir sözleşme platformundan beklediğin{' '}
                  <GradientText>her şey.</GradientText>
                </>
              }
            />
            <p className="text-body-lg text-ink-8 leading-relaxed max-w-xl">
              Hazır şablonlar, mobil imza, OTP doğrulama, audit zinciri ve PDF
              arşivleme — hepsi tek bir akıcı arayüzde.
            </p>
          </div>
          <FadeInStagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <FadeInItem key={f.title}>
                <FeatureTile
                  icon={<f.icon className="w-4 h-4" />}
                  title={f.title}
                  description={f.description}
                  tone="highlight"
                />
              </FadeInItem>
            ))}
          </FadeInStagger>
          <div className="mt-10">
            <Link
              href="/features"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-iris-11 hover:text-iris-12"
            >
              Tüm özellikleri incele
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Container>
      </Section>

      {/* ═════════════════ 6. SECURITY & AUDIT ═════════════════ */}
      <Section pad="lg" className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-x-0 inset-y-10 -z-10 rounded-3xl bg-ink-12"
        />
        <Container width="wide">
          <div className="relative rounded-3xl bg-ink-12 text-paper overflow-hidden">
            <div
              aria-hidden
              className="absolute inset-0 bg-grid-faint opacity-[0.07]"
            />
            <div
              aria-hidden
              className="absolute -top-40 -right-32 w-[440px] h-[440px] rounded-full bg-iris-9/30 blur-3xl"
            />

            <div className="relative grid lg:grid-cols-[1.1fr,1fr] gap-12 px-6 sm:px-12 lg:px-16 py-16 sm:py-20">
              <div>
                <Eyebrow tone="iris">Güvenlik & Audit</Eyebrow>
                <h2 className="mt-5 font-display text-display-md sm:text-display-lg tracking-tightest text-balance">
                  Her imza,{' '}
                  <span className="bg-gradient-to-br from-iris-3 via-paper to-iris-3 bg-clip-text text-transparent">
                    kanıtla
                  </span>{' '}
                  birlikte.
                </h2>
                <p className="mt-5 text-body-lg text-ink-5 leading-relaxed max-w-lg">
                  KVKK uyumlu altyapı, SHA-256 hash zinciri, IP &amp; zaman
                  damgası, OTP doğrulama, immutable audit log — hepsi varsayılan
                  olarak açık.
                </p>

                <ul className="mt-8 space-y-3.5 max-w-md">
                  {[
                    {
                      title: 'Chain of records',
                      desc: 'Her olay önceki olayın hash\'i ile zincirlenir.',
                    },
                    {
                      title: 'OTP + IP + UA',
                      desc: 'İmzacı kimliği üç katmanda doğrulanır.',
                    },
                    {
                      title: 'KVKK & Aydınlatma',
                      desc: 'Açık rıza ve aydınlatma metinleri dahili.',
                    },
                    {
                      title: 'Kanuni delil değeri',
                      desc: 'TBK 14 ve HMK 199 uyumlu elektronik kayıt.',
                    },
                  ].map((row) => (
                    <li key={row.title} className="flex items-start gap-3">
                      <span className="grid place-items-center w-6 h-6 rounded-full bg-iris-11/40 text-paper ring-1 ring-iris-9/40 shrink-0 mt-0.5">
                        <ShieldCheck className="w-3 h-3" />
                      </span>
                      <div>
                        <div className="font-semibold text-paper">
                          {row.title}
                        </div>
                        <div className="text-sm text-ink-5">{row.desc}</div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-10">
                  <Link
                    href="/security"
                    className="inline-flex items-center gap-1.5 px-4 h-10 rounded-md bg-paper text-ink-12 text-sm font-semibold hover:bg-ink-3 transition-colors shadow-md"
                  >
                    Güvenlik &amp; uyum
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Audit terminal */}
              <FadeIn duration={0.6}>
                <div className="relative rounded-card bg-[#0F1424] ring-1 ring-white/10 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-white/[0.02]">
                    <div className="flex items-center gap-1.5">
                      <span className="block w-2 h-2 rounded-full bg-white/15" />
                      <span className="block w-2 h-2 rounded-full bg-white/15" />
                      <span className="block w-2 h-2 rounded-full bg-white/15" />
                    </div>
                    <div className="text-2xs font-mono text-paper/40">
                      audit · chain
                    </div>
                    <span className="text-2xs text-success-soft font-mono">
                      ● verified
                    </span>
                  </div>
                  <div className="p-5 font-mono text-2xs space-y-2 leading-relaxed">
                    {[
                      {
                        evt: 'contract.created',
                        hash: 'a4e2f9c2…39c',
                        seq: '01',
                      },
                      {
                        evt: 'session.opened',
                        hash: '8b91c0a0…1f7',
                        seq: '02',
                      },
                      { evt: 'otp.sent', hash: '11ce…fa0', seq: '03' },
                      {
                        evt: 'otp.verified',
                        hash: 'd5fa90ee…b02',
                        seq: '04',
                      },
                      {
                        evt: 'signature.captured',
                        hash: '2199…a4b',
                        seq: '05',
                      },
                      {
                        evt: 'contract.signed',
                        hash: '6c87cd44…f24',
                        seq: '06',
                      },
                      { evt: 'pdf.archived', hash: '0fb112a3…aa9', seq: '07' },
                    ].map((row) => (
                      <div
                        key={row.seq}
                        className="flex items-center gap-3 px-3 py-1.5 rounded-md bg-white/[0.025] ring-1 ring-white/5"
                      >
                        <span className="text-paper/35 num">#{row.seq}</span>
                        <span className="text-iris-3 font-semibold">
                          {row.evt}
                        </span>
                        <span className="ml-auto text-paper/40">
                          {row.hash}
                        </span>
                      </div>
                    ))}
                    <div className="pt-2 mt-2 border-t border-white/10 text-success-soft">
                      → chain integrity OK · 7/7 records
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </Container>
      </Section>

      {/* ═════════════════ 7. MOBILE SIGNING SHOWCASE ═════════════════ */}
      <Section pad="lg">
        <Container>
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <SectionHeading
                eyebrow="Mobil imza"
                title={
                  <>
                    Karşı taraf{' '}
                    <GradientText>cebinden imzalar.</GradientText>
                  </>
                }
                description="Müşterin uygulama indirmek zorunda değil. Linki açar, KVKK onayı verir, SMS koduyla doğrular, parmağıyla imzalar. Hepsi 3 dakikadan kısa sürer."
              />
            </div>
            <div>
              <MobileShowcase />
            </div>
          </div>
        </Container>
      </Section>

      {/* ═════════════════ 8. STATS BAND ═════════════════ */}
      <section className="border-y border-divider bg-paper/60 py-16">
        <Container>
          <FadeInStagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-6">
            <FadeInItem>
              <StatTile
                value="3 dk"
                label="Ortalama imza süresi"
                hint="link açılışından arşive"
              />
            </FadeInItem>
            <FadeInItem>
              <StatTile
                value="99,98%"
                label="Sistem çalışma süresi"
                hint="son 90 gün"
              />
            </FadeInItem>
            <FadeInItem>
              <StatTile
                value="SHA-256"
                label="Hash zinciri"
                hint="immutable chain of records"
              />
            </FadeInItem>
            <FadeInItem>
              <StatTile
                value="0 ₺"
                label="Kurulum bedeli"
                hint="kredi kartı gerektirmez"
              />
            </FadeInItem>
          </FadeInStagger>
        </Container>
      </section>

      {/* ═════════════════ 9. SOCIAL PROOF + PRICING PREVIEW ═════════════════ */}
      <Section pad="lg">
        <Container width="wide">
          <div className="grid lg:grid-cols-[1.05fr,1fr] gap-12">
            <div>
              <Eyebrow>Müşterilerimiz</Eyebrow>
              <h2 className="mt-4 font-display text-display-md tracking-tightest text-balance text-ink-12">
                Sözleşmenin neresini hızlandırırsın diye merak etme. <br />
                <GradientText>Hepsini.</GradientText>
              </h2>

              <div className="mt-8 grid sm:grid-cols-2 gap-5">
                <Quote
                  quote="Üç kişilik ofiste haftada 40+ kira sözleşmesi yapıyoruz. OnSig sayesinde imza turuna gerek kalmadı. Müşteri sahada beklerken bile imza tamamlanıyor."
                  author="Çetin Şahbaz"
                  role="Kurucu"
                  company="Şahbaz Gayrimenkul"
                />
                <Quote
                  quote="Audit zinciri var diye hukukçumuz da rahatladı, biz de. PDF, IP, zaman damgası — hepsi tek bir kayıtta."
                  author="Av. Nora Karaca"
                  role="Yönetici Ortak"
                  company="Karaca Hukuk"
                />
              </div>
            </div>

            {/* Pricing preview */}
            <div className="relative">
              <Eyebrow tone="ink">Fiyatlandırma</Eyebrow>
              <h2 className="mt-4 font-display text-display-md tracking-tightest text-balance text-ink-12">
                İhtiyacın kadar.
                <br />
                <GradientText>Aylık, taahhütsüz.</GradientText>
              </h2>
              <div className="mt-8 space-y-3">
                {[
                  {
                    name: 'Başlangıç',
                    price: '0 ₺',
                    suffix: '/ ay',
                    desc: '5 sözleşme / ay · 1 kullanıcı',
                  },
                  {
                    name: 'Pro',
                    price: '699 ₺',
                    suffix: '/ ay',
                    desc: 'Sınırsız sözleşme · 5 kullanıcı · Şubeler',
                    highlight: true,
                  },
                  {
                    name: 'Kurumsal',
                    price: 'Görüşme',
                    suffix: '',
                    desc: 'SLA · özel SSO · API · özel domain',
                  },
                ].map((p) => (
                  <div
                    key={p.name}
                    className={`flex items-center justify-between gap-4 px-5 py-4 rounded-card ring-1 transition-all ${
                      p.highlight
                        ? 'bg-paper ring-iris-9/30 shadow-md'
                        : 'bg-paper ring-divider hover:ring-divider-strong'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-semibold tracking-tight text-ink-12">
                          {p.name}
                        </span>
                        {p.highlight && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-iris-1 text-iris-11 ring-1 ring-iris-3 text-2xs font-semibold">
                            <Sparkles className="w-2.5 h-2.5" />
                            Popüler
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-ink-7">{p.desc}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-lg font-bold tracking-tight text-ink-12 num">
                        {p.price}
                        <span className="text-xs text-ink-7 font-medium">
                          {p.suffix}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between">
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-iris-11 hover:text-iris-12"
                >
                  Plan detaylarına bak
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
                <span className="text-2xs text-ink-7">KDV dahil değildir</span>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ═════════════════ 10. FAQ ═════════════════ */}
      <Section pad="lg" className="bg-paper border-y border-divider">
        <Container width="narrow">
          <SectionHeading
            eyebrow="Sıkça Sorulan"
            title={
              <>
                Aklındaki bütün <GradientText>sorulara cevap.</GradientText>
              </>
            }
            align="center"
            className="mb-12 text-center mx-auto"
          />
          <Accordion
            items={[
              {
                id: 'kvkk',
                question: 'OnSig ile atılan imza hukuken geçerli mi?',
                answer:
                  'Evet. Türk Borçlar Kanunu ve HMK çerçevesinde elektronik kayıt değerinde tutulur. OTP doğrulama, IP, kullanıcı ajanı, zaman damgası ve SHA-256 hash zinciriyle birlikte saklanan kayıt, mahkemede elektronik delil olarak sunulabilir. Kurumsal müşterilerimiz için ek olarak Nitelikli Elektronik İmza (NES) entegrasyonu da mevcuttur.',
              },
              {
                id: 'app',
                question: 'Karşı taraf uygulama indirmek zorunda mı?',
                answer:
                  'Hayır. Karşı taraf yalnızca SMS / e-posta / WhatsApp ile gelen linki açar. İmza arayüzü mobil tarayıcıda çalışır; uygulama veya kayıt gerektirmez.',
              },
              {
                id: 'sektor',
                question: 'Sadece emlak mı kullanıyor?',
                answer:
                  'Hayır. Emlak için özel şablonlarımız (kira, yetki, alım-satım, yer gösterme) var, ama hukuk büroları, mali müşavirlik, lojistik ve KOBİ\'ler için özel şablon oluşturup kullanabilirsiniz.',
              },
              {
                id: 'audit',
                question: 'Audit zinciri ne işe yarar?',
                answer:
                  'Her olay (oluşturma, link açılışı, OTP, imza, arşiv) önceki kaydın hash\'i ile zincirlenir. Bir kayıt değiştirilirse zincir kırılır ve doğrulanabilir. Bu sayede sözleşmenin imza anındaki halinin sonradan değişmediği matematiksel olarak ispatlanır.',
              },
              {
                id: 'depolama',
                question: 'PDF\'ler nerede saklanıyor?',
                answer:
                  'Şu anda Türkiye lokasyonlu Neon Postgres + nesne depolama altyapımızı kullanıyoruz. Kurumsal müşteriler için kendi S3 / Wasabi / Azure Blob hedefinize yönlendirme mümkündür.',
              },
              {
                id: 'iptal',
                question: 'Aboneliği iptal etmek kolay mı?',
                answer:
                  'Evet — taahhüt yok. Hesap ayarlarınızdan tek tıkla iptal edebilir, döneminizin sonuna kadar kullanmaya devam edebilirsiniz. Verileriniz isteğe bağlı olarak indirilebilir.',
              },
            ]}
            defaultValue="kvkk"
          />
        </Container>
      </Section>

      {/* ═════════════════ 11. CTA FOOTER ═════════════════ */}
      <Section pad="lg">
        <Container>
          <CTABand
            title={
              <>
                Bir sonraki sözleşmeni{' '}
                <GradientText>OnSig ile imzala.</GradientText>
              </>
            }
            description="Kart bilgisi vermeden 14 gün boyunca Pro\u2019yu dene. Kurulum yok, eğitim gerektirmez."
          />
        </Container>
      </Section>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Static data
// ─────────────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: FileSignature,
    title: 'Online sözleşme oluşturucu',
    description:
      'Kira, yetki, alım-satım, yer gösterme veya özel şablon. Form alanları otomatik dolar, metin anında hazırlanır.',
  },
  {
    icon: Pen,
    title: 'E-imza & mobil imza',
    description:
      'Parmak veya stylus ile pürüzsüz vektör imza. Karşı taraf için kurulum yok, kayıt yok.',
  },
  {
    icon: KeyRound,
    title: 'OTP doğrulama',
    description:
      'SMS / e-posta ile tek seferlik kod. Kimlik üç katmanda doğrulanır: kanal, IP, cihaz.',
  },
  {
    icon: Hash,
    title: 'Audit zinciri',
    description:
      'SHA-256 hash chain ile her olay bir öncekine zincirlenir. Değiştirilemez kayıt.',
  },
  {
    icon: ScrollText,
    title: 'PDF arşivleme',
    description:
      'İmzalanmış PDF, imza görselleri, audit raporu ve IP/zaman damgası kalıcı arşivde.',
  },
  {
    icon: Smartphone,
    title: 'Mobil-first deneyim',
    description:
      'Müşteri telefonundan imzalar, ofiste iş hızlanır. iOS, Android, masaüstü uyumlu.',
  },
  {
    icon: ShieldCheck,
    title: 'KVKK uyumu',
    description:
      'Açık rıza, aydınlatma metinleri ve veri minimizasyonu varsayılan olarak aktif.',
  },
  {
    icon: Workflow,
    title: 'Emlak workflow\'ları',
    description:
      'Yer gösterme → yetki → kira → arşiv. Türk emlak ofisi gerçekliğine göre kurulu.',
  },
  {
    icon: Globe2,
    title: 'Web & mobil her yerden',
    description:
      'Sahada, ofiste veya yoldayken — aynı veri, aynı deneyim, aynı hız.',
  },
]
