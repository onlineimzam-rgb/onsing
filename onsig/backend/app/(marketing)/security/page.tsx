import type { Metadata } from 'next'
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  Database,
  Eye,
  FileCheck,
  Fingerprint,
  Gavel,
  Hash,
  KeyRound,
  Lock,
  RefreshCw,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'

import {
  Container,
  CTABand,
  Eyebrow,
  FeatureTile,
  GradientText,
  Section,
  SectionHeading,
  Quote,
} from '@/components/marketing/primitives'
import {
  FadeIn,
  FadeInItem,
  FadeInStagger,
} from '@/components/marketing/Motion'

export const metadata: Metadata = {
  title: 'Güvenlik — KVKK, audit zinciri ve elektronik delil',
  description:
    'OnSig güvenlik altyapısı: SHA-256 audit zinciri, KVKK uyumu, OTP doğrulama, Argon2 parola hash\'i, JWT oturumu, immutable kayıtlar, TBK & HMK uyumu.',
  alternates: { canonical: '/security' },
}

const PILLARS = [
  {
    icon: Hash,
    title: 'SHA-256 audit zinciri',
    description:
      'Her olay (oluşturma, OTP, imza, arşiv) önceki olayın hash\'i ile zincirlenir. Bir kayıt değişirse zincir kırılır ve dışarıdan doğrulanabilir.',
  },
  {
    icon: Fingerprint,
    title: 'Çok katmanlı kimlik doğrulama',
    description:
      'OTP (SMS/e-posta) + IP + UA + cihaz parmak izi. Her imzacı için üç katmanlı kanıt zinciri tutulur.',
  },
  {
    icon: Lock,
    title: 'Modern şifreleme',
    description:
      'Parolalar Argon2id ile hash\'lenir, oturumlar kısa ömürlü JWT ile sürdürülür. PDF/audit verisi at-rest şifrelenir.',
  },
  {
    icon: ShieldCheck,
    title: 'KVKK & açık rıza',
    description:
      'Aydınlatma metinleri, açık rıza onayı ve veri minimizasyonu varsayılan olarak aktif. Veri envanteri sürekli güncel.',
  },
  {
    icon: Gavel,
    title: 'Hukuki delil değeri',
    description:
      'TBK m.14 ve HMK m.199 çerçevesinde elektronik kayıt değerinde. Audit raporu mahkemede sunulabilir formatta üretilir.',
  },
  {
    icon: Database,
    title: 'TR lokasyonlu altyapı',
    description:
      'Veriler Türkiye lokasyonlu Postgres + nesne deposunda. Kurumsal müşteriler için kendi bulut hedefinize yönlendirme mümkündür.',
  },
] as const

const COMPLIANCE = [
  { name: 'KVKK', state: 'Uyumlu' },
  { name: 'GDPR', state: 'Uyumlu' },
  { name: 'ISO 27001', state: 'Yol haritasında' },
  { name: 'SOC 2 Type II', state: 'Yol haritasında' },
  { name: 'TBK / HMK', state: 'Elektronik delil' },
] as const

export default function SecurityPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink-12 text-paper">
        <div aria-hidden className="absolute inset-0 bg-grid-faint opacity-[0.07]" />
        <div
          aria-hidden
          className="absolute -top-32 -right-24 w-[480px] h-[480px] rounded-full bg-iris-9/30 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-24 w-[400px] h-[400px] rounded-full bg-iris-11/25 blur-3xl"
        />
        <Container className="relative py-28 sm:py-36">
          <FadeIn>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-iris-9/30 text-paper ring-1 ring-iris-9/40 text-2xs font-semibold uppercase tracking-widest">
              <ShieldCheck className="w-3 h-3" />
              Güvenlik
            </span>
            <h1 className="mt-5 font-display text-display-lg sm:text-display-xl tracking-tightest text-balance max-w-3xl">
              Her imza, <GradientText>kanıtla birlikte.</GradientText>
            </h1>
            <p className="mt-5 text-body-lg text-ink-5 leading-relaxed max-w-2xl">
              OnSig&apos;in tüm altyapısı &quot;güvenlik varsayılan olarak açık&quot;
              ilkesiyle kurulu: KVKK uyumlu, audit zincirli ve hukuki delil
              değerinde elektronik kayıt.
            </p>
            <div className="mt-10 flex flex-wrap gap-4 text-xs font-semibold">
              {[
                { icon: ShieldCheck, label: 'KVKK uyumlu' },
                { icon: Hash, label: 'SHA-256 audit chain' },
                { icon: Gavel, label: 'TBK & HMK uyumu' },
                { icon: Lock, label: 'Argon2 + JWT' },
                { icon: Database, label: 'TR data residency' },
              ].map((t) => {
                const Icon = t.icon
                return (
                  <span
                    key={t.label}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-paper/5 ring-1 ring-paper/10"
                  >
                    <Icon className="w-3 h-3 text-iris-3" />
                    {t.label}
                  </span>
                )
              })}
            </div>
          </FadeIn>
        </Container>
      </section>

      {/* Pillars grid */}
      <Section pad="lg" id="audit">
        <Container>
          <SectionHeading
            eyebrow="Güvenlik kolonları"
            title={
              <>
                Altı kolonlu <GradientText>güven mimarisi.</GradientText>
              </>
            }
            description="Sözleşmenin hukuki ve teknik geçerliliği için ihtiyacın olan her şey, kutudan açık."
          />
          <FadeInStagger className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PILLARS.map((p) => (
              <FadeInItem key={p.title}>
                <FeatureTile
                  icon={<p.icon className="w-4 h-4" />}
                  title={p.title}
                  description={p.description}
                  tone="highlight"
                />
              </FadeInItem>
            ))}
          </FadeInStagger>
        </Container>
      </Section>

      {/* Audit chain explained */}
      <Section pad="lg" className="bg-ink-1 border-y border-divider">
        <Container width="wide">
          <div className="grid lg:grid-cols-[1.1fr,1fr] gap-12 items-start">
            <div>
              <Eyebrow>Audit chain</Eyebrow>
              <h2 className="mt-4 font-display text-display-md tracking-tightest text-balance text-ink-12">
                Chain of records, <GradientText>matematiksel ispat.</GradientText>
              </h2>
              <p className="mt-5 text-body-lg text-ink-8 leading-relaxed max-w-xl">
                Her olay, önceki olayın SHA-256 hash&apos;i ile birleştirilip
                yeniden hash\u2019lenir. Bu şekilde herhangi bir kaydı geriye dönük
                değiştirmek, sonraki tüm hash\u2019leri kırar.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  {
                    title: 'Immutable',
                    desc: 'Kayıtlar yalnızca eklenir, asla güncellenmez.',
                  },
                  {
                    title: 'Verifiable',
                    desc: 'Audit raporu, dış bir doğrulayıcıyla bağımsız doğrulanabilir.',
                  },
                  {
                    title: 'Auditable',
                    desc: 'Her kayıt: olay, aktör, IP, UA, zaman, prev_hash, curr_hash.',
                  },
                ].map((row) => (
                  <li key={row.title} className="flex items-start gap-3">
                    <span className="grid place-items-center w-6 h-6 rounded-full bg-iris-1 text-iris-11 ring-1 ring-iris-3 shrink-0 mt-0.5">
                      <BadgeCheck className="w-3 h-3" />
                    </span>
                    <div>
                      <div className="font-semibold text-ink-12">
                        {row.title}
                      </div>
                      <div className="text-sm text-ink-8">{row.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <FadeIn>
              <div className="relative rounded-card bg-[#0F1424] ring-1 ring-white/10 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.45)] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-white/[0.02]">
                  <div className="flex items-center gap-1.5">
                    <span className="block w-2 h-2 rounded-full bg-white/15" />
                    <span className="block w-2 h-2 rounded-full bg-white/15" />
                    <span className="block w-2 h-2 rounded-full bg-white/15" />
                  </div>
                  <div className="text-2xs font-mono text-paper/40">
                    chain · KS-2087
                  </div>
                  <span className="text-2xs text-success-soft font-mono">
                    ● verified
                  </span>
                </div>
                <div className="p-5 font-mono text-2xs leading-relaxed text-paper/85 space-y-2">
                  <Row
                    seq="01"
                    evt="contract.created"
                    actor="Çetin Şahbaz"
                    hash="a4e2…39c"
                  />
                  <Row
                    seq="02"
                    evt="contract.published"
                    actor="Çetin Şahbaz"
                    hash="91fa…b08"
                  />
                  <Row
                    seq="03"
                    evt="session.opened"
                    actor="Bülent K."
                    hash="8b91…1f7"
                  />
                  <Row seq="04" evt="otp.sent" actor="—" hash="11ce…fa0" />
                  <Row
                    seq="05"
                    evt="otp.verified"
                    actor="Bülent K."
                    hash="d5fa…b02"
                  />
                  <Row
                    seq="06"
                    evt="contract.signed"
                    actor="Bülent K."
                    hash="6c87…f24"
                  />
                  <Row
                    seq="07"
                    evt="pdf.archived"
                    actor="OnSig"
                    hash="0fb1…aa9"
                  />
                  <div className="pt-2 mt-2 border-t border-white/10 text-success-soft">
                    → chain integrity OK · 7/7 records
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </Container>
      </Section>

      {/* KVKK / Compliance section */}
      <Section pad="lg" id="kanuni-delil">
        <Container>
          <div className="grid lg:grid-cols-[1fr,1.1fr] gap-12">
            <SectionHeading
              eyebrow="Uyumluluk"
              title={
                <>
                  Uyumluluk, <GradientText>başarısızlık değil avantaj.</GradientText>
                </>
              }
              description="KVKK, TBK, HMK uyumlu altyapı ve uluslararası standartlara doğru ilerleyen yol haritası."
            />
            <ul className="space-y-2.5">
              {COMPLIANCE.map((c) => (
                <li
                  key={c.name}
                  className="flex items-center justify-between px-5 py-4 rounded-card bg-paper ring-1 ring-divider hover:ring-divider-strong transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid place-items-center w-9 h-9 rounded-md bg-iris-1 text-iris-11 ring-1 ring-iris-3">
                      <BadgeCheck className="w-4 h-4" />
                    </span>
                    <div className="font-display font-semibold tracking-tight text-ink-12">
                      {c.name}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-semibold ${
                      c.state === 'Uyumlu' ||
                      c.state === 'Elektronik delil'
                        ? 'bg-success-soft text-success-deep ring-1 ring-success-soft'
                        : 'bg-warning-soft text-warning-deep ring-1 ring-warning-soft'
                    }`}
                  >
                    {(c.state === 'Uyumlu' ||
                      c.state === 'Elektronik delil') && (
                      <span className="block w-1.5 h-1.5 rounded-full bg-success-deep" />
                    )}
                    {c.state}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {/* Practices grid */}
      <Section pad="lg" className="bg-ink-1 border-t border-divider">
        <Container>
          <SectionHeading
            eyebrow="Uygulamalar"
            title={
              <>
                Günlük operasyonda <GradientText>güvenlik pratikleri.</GradientText>
              </>
            }
          />
          <FadeInStagger className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: KeyRound,
                title: 'En az ayrıcalık',
                description:
                  'Rol bazlı izinler: Owner / Admin / Üye. Erişim kapsamı net.',
              },
              {
                icon: UserCheck,
                title: 'Oturum izleme',
                description:
                  'Tüm oturumlar IP + UA ile loglanır, şüpheli erişim alarmı verir.',
              },
              {
                icon: RefreshCw,
                title: 'Periyodik yedek',
                description:
                  'Günde 4 noktada Postgres + nesne deposu yedeği.',
              },
              {
                icon: Eye,
                title: 'Veri minimizasyonu',
                description:
                  'İhtiyaç fazlası alan istemiyoruz; istenilen veri tek tek tanımlı.',
              },
              {
                icon: FileCheck,
                title: 'İmza önizleme',
                description:
                  'Karşı taraf imzasını gönderim öncesi onaylar, yanlış imza engellenir.',
              },
              {
                icon: Clock,
                title: 'Zaman damgası',
                description:
                  'UTC + Türkiye zaman dilimi, NTP\u2019den eşitlenmiş kayıt.',
              },
            ].map((p) => (
              <FadeInItem key={p.title}>
                <FeatureTile
                  icon={<p.icon className="w-4 h-4" />}
                  title={p.title}
                  description={p.description}
                />
              </FadeInItem>
            ))}
          </FadeInStagger>
        </Container>
      </Section>

      {/* Quote */}
      <Section pad="md">
        <Container width="narrow">
          <Quote
            quote="Audit zinciri sayesinde hukukçumuz da rahatladı. PDF, IP, zaman damgası ve hash chain — bir tek dosyada her şey hazır."
            author="Av. Nora Karaca"
            role="Yönetici Ortak"
            company="Karaca Hukuk"
          />
        </Container>
      </Section>

      <Section pad="lg">
        <Container>
          <CTABand
            title={
              <>
                Sözleşmen <GradientText>kanıtla birlikte</GradientText> arşivlensin.
              </>
            }
            description="OnSig, KVKK uyumlu altyapısıyla 14 gün ücretsiz."
          />
        </Container>
      </Section>
    </>
  )
}

function Row({
  seq,
  evt,
  actor,
  hash,
}: {
  seq: string
  evt: string
  actor: string
  hash: string
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded-md bg-white/[0.025] ring-1 ring-white/5">
      <span className="text-paper/35 num">#{seq}</span>
      <span className="text-iris-3 font-semibold whitespace-nowrap">{evt}</span>
      <span className="ml-2 text-paper/55 truncate">{actor}</span>
      <span className="ml-auto text-paper/40">{hash}</span>
    </div>
  )
}
