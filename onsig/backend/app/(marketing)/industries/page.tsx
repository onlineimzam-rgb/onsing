import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  Building2,
  Briefcase,
  Calculator,
  FileSignature,
  HandHelping,
  Home,
  Pen,
  Receipt,
  ScrollText,
  ShieldCheck,
  Truck,
  Users,
} from 'lucide-react'

import {
  Container,
  CTABand,
  Eyebrow,
  FeatureTile,
  GradientText,
  Section,
  SectionHeading,
} from '@/components/marketing/primitives'
import {
  FadeIn,
  FadeInItem,
  FadeInStagger,
} from '@/components/marketing/Motion'

export const metadata: Metadata = {
  title: 'Sektörler — emlak, hukuk, mali müşavirlik ve KOBİ',
  description:
    'OnSig her sektörde işine yarar. Emlak ofisleri için kira & yetki, hukuk büroları için vekaletname, mali müşavirler için sözleşme arşivi, KOBİ\'ler için satış.',
  alternates: { canonical: '/industries' },
}

const INDUSTRIES = [
  {
    id: 'emlak',
    icon: Home,
    label: 'Emlak',
    title: 'Sahada bekleyen müşteri yok.',
    description:
      'Yer gösterme, yetki, kira, alım-satım — Türk emlak gerçekliğine göre kurulu workflow.',
    bullets: [
      'Hazır kira & yetki şablonları',
      'Yer gösterme süreçleri',
      'WhatsApp/SMS gönderim',
      'Şubeye özel künye',
    ],
    accent: 'iris',
  },
  {
    id: 'avukat',
    icon: Briefcase,
    label: 'Hukuk büroları',
    title: 'Vekaletname ve sözleşme, doğrudan müvekkilin telefonunda.',
    description:
      'Müvekkil sahada veya yurtdışında bile imzalayabilir. Audit zinciriyle delil değeri yüksek.',
    bullets: [
      'Vekaletname şablonları',
      'Çoklu imzacı sırası',
      'TBK & HMK uyumlu audit',
      'PDF arşiv + sertifika sayfası',
    ],
    accent: 'ink',
  },
  {
    id: 'muhasebe',
    icon: Calculator,
    label: 'Mali müşavirlik',
    title: 'Müşteri sözleşmesi, hizmet sözleşmesi, vekalet — hepsi tek panelde.',
    description:
      'Mali müşavirlerin yıllık müşteri sözleşmelerini saatler yerine dakikalarda toplayın.',
    bullets: [
      'Toplu gönderim',
      'Sözleşme yenileme hatırlatma',
      'Şirket bazlı arşiv',
      'KVKK aydınlatma metni',
    ],
    accent: 'iris',
  },
  {
    id: 'lojistik',
    icon: Truck,
    label: 'Lojistik & Nakliye',
    title: 'Teslim, taşıma ve sevk sözleşmeleri sahada imzalanır.',
    description:
      'Sürücü, müşteri, depocu — herkes mobil cihazından imzalar. Audit zinciri operasyonu korur.',
    bullets: [
      'Hızlı tek-tıkla şablon',
      'Konum bazlı kayıt',
      'Birden fazla şube',
      'Filo bazlı raporlama',
    ],
    accent: 'ink',
  },
  {
    id: 'kobi',
    icon: Building2,
    label: 'KOBİ & Hizmet',
    title: 'Müşteri sözleşmesi, NDA, satış — hepsi tek bir akışta.',
    description:
      'Küçük ve orta ölçekli işletmeler için “tak-çalıştır” sözleşme altyapısı.',
    bullets: [
      'Özel sözleşme şablonu',
      'Marka logosu + renk',
      '5 kullanıcı dahil',
      'Şube desteği',
    ],
    accent: 'iris',
  },
  {
    id: 'insan-kaynaklari',
    icon: Users,
    label: 'İnsan kaynakları',
    title: 'Personel sözleşmeleri ve onaylar dakikalar içinde.',
    description:
      'İş başlangıcı, izin, KVKK bilgilendirme — her yeni çalışan için akıcı bir süreç.',
    bullets: [
      'Çalışan kayıt akışı',
      'KVKK aydınlatma',
      'Toplu davet',
      'Departman bazlı arşiv',
    ],
    accent: 'ink',
  },
] as const

export default function IndustriesPage() {
  return (
    <>
      <Section pad="xl" pattern="grid" className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-20 h-[420px] bg-iris-hero opacity-[0.30]"
        />
        <Container className="relative">
          <FadeIn>
            <div className="max-w-3xl">
              <Eyebrow>Sektörler</Eyebrow>
              <h1 className="mt-5 font-display text-display-lg sm:text-display-xl tracking-tightest text-balance text-ink-12">
                Sektörüne göre <GradientText>kurulu workflow.</GradientText>
              </h1>
              <p className="mt-5 text-body-lg text-ink-8 leading-relaxed max-w-2xl">
                Emlak, hukuk, mali müşavirlik, lojistik, KOBİ ve insan kaynakları
                için hazır şablonlar ve sektöre özel akışlar. Hepsi tek bir
                arayüzde.
              </p>
            </div>
          </FadeIn>
        </Container>
      </Section>

      {/* Industries detailed */}
      {INDUSTRIES.map((ind, i) => {
        const reverse = i % 2 === 1
        return (
          <section
            key={ind.id}
            id={ind.id}
            className={`py-20 sm:py-24 ${i % 2 === 1 ? 'bg-ink-1 border-y border-divider' : ''}`}
          >
            <Container>
              <div
                className={`grid lg:grid-cols-[1.05fr,1fr] gap-12 lg:gap-16 items-center ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}
              >
                <FadeIn>
                  <Eyebrow tone={ind.accent === 'iris' ? 'iris' : 'ink'}>
                    <ind.icon className="w-3 h-3" />
                    {ind.label}
                  </Eyebrow>
                  <h2 className="mt-4 font-display text-display-md tracking-tightest text-balance text-ink-12 max-w-xl">
                    {ind.title}
                  </h2>
                  <p className="mt-5 text-body-lg text-ink-8 leading-relaxed max-w-xl">
                    {ind.description}
                  </p>
                  <ul className="mt-7 grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
                    {ind.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex items-center gap-2 text-sm font-medium text-ink-11"
                      >
                        <span className="grid place-items-center w-4 h-4 rounded-full bg-iris-1 text-iris-11 ring-1 ring-iris-3 shrink-0">
                          <ShieldCheck className="w-2.5 h-2.5" />
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-9">
                    <Link
                      href="/register"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-iris-11 hover:text-iris-12"
                    >
                      {ind.label} için ücretsiz başla
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </FadeIn>

                {/* Illustration card */}
                <FadeIn delay={0.05}>
                  <div className="relative overflow-hidden rounded-card bg-paper ring-1 ring-divider shadow-card">
                    <div className="px-5 py-3 border-b border-divider flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="block w-2 h-2 rounded-full bg-ink-4" />
                        <span className="block w-2 h-2 rounded-full bg-ink-4" />
                        <span className="block w-2 h-2 rounded-full bg-ink-4" />
                      </div>
                      <div className="text-2xs font-mono text-ink-7">
                        onsig.app · {ind.label.toLowerCase()}
                      </div>
                      <span className="block w-2 h-2 rounded-full bg-success-deep animate-pulse-soft" />
                    </div>
                    <div className="p-6 space-y-3">
                      {[
                        { title: 'Yeni sözleşme · ' + ind.label },
                        { title: 'İmza linki gönderildi' },
                        { title: 'OTP doğrulandı' },
                        { title: 'PDF arşivlendi' },
                      ].map((row, idx) => (
                        <div
                          key={row.title}
                          className="flex items-center gap-3 px-3.5 py-3 rounded-md bg-ink-1 ring-1 ring-divider"
                        >
                          <span className="grid place-items-center w-7 h-7 rounded-full bg-paper ring-1 ring-divider text-ink-9 num text-xs font-bold">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className="text-sm font-medium text-ink-12">
                            {row.title}
                          </span>
                          <span className="ml-auto text-2xs text-success-deep font-semibold">
                            ✓
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="px-6 py-4 border-t border-divider bg-iris-hero text-paper">
                      <div className="text-2xs uppercase tracking-widest font-semibold opacity-80">
                        Sonuç
                      </div>
                      <div className="mt-0.5 font-display font-semibold tracking-tight">
                        Sözleşme &lt; 3 dakikada imzalı
                      </div>
                    </div>
                  </div>
                </FadeIn>
              </div>
            </Container>
          </section>
        )
      })}

      {/* Workflow grid */}
      <Section pad="lg">
        <Container>
          <SectionHeading
            eyebrow="Ortak ihtiyaçlar"
            title={
              <>
                Sektör farketmeksizin{' '}
                <GradientText>aynı temel ihtiyaç.</GradientText>
              </>
            }
            description="Her sektörde aynı şeye ihtiyacın var: hızlı sözleşme, uzaktan imza, kanıtlanabilir audit."
          />
          <FadeInStagger className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: FileSignature,
                title: 'Hızlı oluşturma',
                description: 'Şablon seç, formu doldur, hazır.',
              },
              {
                icon: Pen,
                title: 'Mobil imza',
                description: 'Karşı taraf cebinden imzalar.',
              },
              {
                icon: HandHelping,
                title: 'KVKK uyumu',
                description: 'Aydınlatma + açık rıza dahili.',
              },
              {
                icon: Receipt,
                title: 'Şube bazlı künye',
                description: 'Her şubenin kendi imza künyesi.',
              },
              {
                icon: ScrollText,
                title: 'PDF arşiv',
                description: 'Aranabilir, indirilebilir, paylaşılabilir.',
              },
              {
                icon: ShieldCheck,
                title: 'Audit zinciri',
                description: 'Olayların matematiksel ispatı.',
              },
            ].map((it) => (
              <FadeInItem key={it.title}>
                <FeatureTile
                  icon={<it.icon className="w-4 h-4" />}
                  title={it.title}
                  description={it.description}
                />
              </FadeInItem>
            ))}
          </FadeInStagger>
        </Container>
      </Section>

      <Section pad="lg" className="bg-ink-1 border-t border-divider">
        <Container>
          <CTABand
            title={
              <>
                Sektörün için <GradientText>en doğru şablon</GradientText>{' '}
                seninle bir tıklık uzakta.
              </>
            }
          />
        </Container>
      </Section>
    </>
  )
}
