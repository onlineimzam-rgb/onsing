import type { Metadata } from 'next'
import {
  ArrowRight,
  ClipboardCheck,
  Database,
  FileSignature,
  Files,
  Fingerprint,
  Globe2,
  Hash,
  History,
  KeyRound,
  Layers,
  Pen,
  ScrollText,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  Workflow,
} from 'lucide-react'

import {
  CTABand,
  Container,
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
  title: 'Özellikler — sözleşme, e-imza ve audit zinciri',
  description:
    'OnSig özellikleri: online sözleşme oluşturucu, e-imza, OTP doğrulama, SHA-256 audit zinciri, PDF arşivleme, mobil imza, KVKK uyumlu altyapı, ekip & şube yönetimi.',
  alternates: { canonical: '/features' },
}

const SECTIONS = [
  {
    eyebrow: 'Sözleşme',
    title: 'Sözleşmeyi sıfırdan değil, hızlı kur.',
    description:
      'Türkiye gerçekliğine uygun hazır şablonlar ve özel şablon imkânı. Form alanları otomatik metni besler — kopyala-yapıştır yok.',
    items: [
      {
        icon: FileSignature,
        title: 'Hazır şablon kütüphanesi',
        description:
          'Kira, yetki, alım-satım, yer gösterme. Türk emlak gerçekliğine göre kurulu.',
      },
      {
        icon: Layers,
        title: 'Özel sözleşme şablonu',
        description:
          'Kendi sözleşme metnini yapıştır, imzacıları belirle, gönder.',
      },
      {
        icon: Files,
        title: 'Tek tıkla çoğaltma',
        description:
          'Benzer bir sözleşmeyi dakikalar içinde yeniden oluştur.',
      },
    ],
  },
  {
    eyebrow: 'İmza',
    title: 'Karşı tarafa kurulum dayatmaz.',
    description:
      'Linki aç, KVKK onayı ver, SMS koduyla doğrula, parmağınla imzala. Üç dakikadan kısa.',
    items: [
      {
        icon: Smartphone,
        title: 'Mobil-first imza',
        description:
          'iOS, Android, masaüstü — uygulama indirme veya kayıt yok.',
      },
      {
        icon: Pen,
        title: 'Pürüzsüz vektör imza',
        description:
          'Bezier eğri tabanlı imza pad, tekrar dene / önizle / onayla.',
      },
      {
        icon: KeyRound,
        title: 'OTP doğrulama',
        description:
          'SMS / e-posta tek seferlik kod ile çift faktörlü kimlik.',
      },
    ],
  },
  {
    eyebrow: 'Audit',
    title: 'Her olay, hash zinciriyle.',
    description:
      'SHA-256 chain of records; oluşturma, gönderme, OTP, imza ve arşivleme adımları birbiriyle zincirlenir.',
    items: [
      {
        icon: Hash,
        title: 'SHA-256 chain of records',
        description:
          'Bir kayıt değişirse zincir kırılır, doğrulanabilir.',
      },
      {
        icon: Fingerprint,
        title: 'IP + Cihaz + UA',
        description:
          'Her olayda IP, kullanıcı ajanı ve cihaz parmak izi tutulur.',
      },
      {
        icon: History,
        title: 'Olay zaman çizelgesi',
        description:
          'Sözleşmeye bağlı tüm olaylar tek bir sıralı feed olarak görüntülenir.',
      },
    ],
  },
  {
    eyebrow: 'Arşiv',
    title: 'PDF + audit raporu, her yerden erişilebilir.',
    description:
      'İmzalanmış PDF, imza görselleri ve audit raporu kalıcı arşivde.',
    items: [
      {
        icon: ScrollText,
        title: 'İmzalı PDF arşivi',
        description:
          'Noto Sans, Türkçe karakter desteği, sayfa filigranı, hash chip.',
      },
      {
        icon: Database,
        title: 'Otomatik yedek',
        description:
          'Postgres + nesne deposu çift yedek. Felaket senaryosuna hazır.',
      },
      {
        icon: Globe2,
        title: 'Erişim her yerden',
        description:
          'Sahada, ofiste, mobilde — aynı veri, aynı hız.',
      },
    ],
  },
  {
    eyebrow: 'Yönetim',
    title: 'Ekip, şube, rol — tek panelde.',
    description:
      'Davet et, rol ata, şube oluştur. Sözleşmeler doğru şubenin künyesiyle gider.',
    items: [
      {
        icon: Users,
        title: 'Çok kullanıcılı ekip',
        description:
          'Owner / Admin / Üye rolleri. Davet linki ile katılım.',
      },
      {
        icon: Workflow,
        title: 'Şube & lokasyon',
        description:
          'Şubeye özel künye, adres, lisans. Sözleşmeye otomatik gömülür.',
      },
      {
        icon: ClipboardCheck,
        title: 'Onay akışı',
        description:
          'Çoklu imzacı sırası ve durumu görülebilir.',
      },
    ],
  },
  {
    eyebrow: 'Güvenlik',
    title: 'Varsayılan olarak güvenli.',
    description:
      'KVKK, açık rıza, veri minimizasyonu, role-based access — kutudan çıkar gibi açık.',
    items: [
      {
        icon: ShieldCheck,
        title: 'KVKK uyumu',
        description:
          'Açık rıza, aydınlatma metinleri, veri envanteri.',
      },
      {
        icon: KeyRound,
        title: 'Argon2 + JWT',
        description:
          'Modern parola hash\'i, kısa ömürlü oturum jetonları.',
      },
      {
        icon: Sparkles,
        title: 'Sızıntı koruması',
        description:
          'Rate limit, brute-force koruması, oturum izleme.',
      },
    ],
  },
] as const

export default function FeaturesPage() {
  return (
    <>
      {/* Hero */}
      <Section pad="xl" className="relative overflow-hidden" pattern="grid">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-20 h-[460px] bg-iris-hero opacity-[0.30]"
        />
        <Container className="relative">
          <FadeIn>
            <div className="max-w-3xl">
              <Eyebrow>Özellikler</Eyebrow>
              <h1 className="mt-5 font-display text-display-lg sm:text-display-xl tracking-tightest text-balance text-ink-12">
                Bir sözleşme platformundan{' '}
                <GradientText>her şey.</GradientText>
              </h1>
              <p className="mt-5 text-body-lg text-ink-8 leading-relaxed max-w-2xl">
                Sözleşme oluşturmaktan audit zincirine kadar OnSig&apos;in tüm
                özellikleri. Hepsi tek bir akıcı arayüzde, hepsi varsayılan
                olarak açık.
              </p>
            </div>
          </FadeIn>
        </Container>
      </Section>

      {/* Feature sections */}
      {SECTIONS.map((s, i) => (
        <Section
          key={s.title}
          pad="lg"
          className={i % 2 === 1 ? 'bg-ink-1 border-y border-divider' : ''}
        >
          <Container>
            <div className="grid lg:grid-cols-[1fr,1fr] gap-12 items-end mb-12">
              <SectionHeading
                eyebrow={s.eyebrow}
                title={s.title}
                description={s.description}
              />
            </div>
            <FadeInStagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {s.items.map((it) => (
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
      ))}

      {/* CTA */}
      <Section pad="lg">
        <Container>
          <CTABand
            title={
              <>
                Bütün bu özellikler, <GradientText>ücretsiz başlangıçla.</GradientText>
              </>
            }
            description="Pro deneme süresinde tam erişim. Kart bilgisi gerektirmez."
          />
        </Container>
      </Section>
    </>
  )
}
