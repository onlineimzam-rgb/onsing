import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowUpRight,
  Building2,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from 'lucide-react'

import {
  Container,
  Eyebrow,
  GradientText,
  Section,
} from '@/components/marketing/primitives'
import { FadeIn } from '@/components/marketing/Motion'
import { ContactForm } from './ContactForm'

export const metadata: Metadata = {
  title: 'İletişim — satış, destek ve iş ortaklığı',
  description:
    'OnSig ile iletişime geç. Demo talep et, satışla görüş, teknik destek al veya iş ortaklığı için yaz.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <>
      <Section pad="xl" pattern="grid" className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-20 h-[420px] bg-iris-hero opacity-[0.25]"
        />
        <Container className="relative">
          <FadeIn>
            <div className="max-w-3xl">
              <Eyebrow>İletişim</Eyebrow>
              <h1 className="mt-5 font-display text-display-lg sm:text-display-xl tracking-tightest text-balance text-ink-12">
                Bir mesaj uzaktayız.{' '}
                <GradientText>24 saatte dönüş.</GradientText>
              </h1>
              <p className="mt-5 text-body-lg text-ink-8 leading-relaxed max-w-2xl">
                Ürünü görmek, satışla konuşmak veya teknik destek almak istiyorsan
                form üzerinden bize ulaş. Acil durum için aşağıdaki kanalları da
                kullanabilirsin.
              </p>
            </div>
          </FadeIn>
        </Container>
      </Section>

      <Section pad="lg" className="bg-ink-1 border-y border-divider">
        <Container width="wide">
          <div className="grid lg:grid-cols-[1fr,1.2fr] gap-12">
            {/* Channels */}
            <div className="space-y-5">
              <ChannelCard
                icon={<MessageCircle className="w-4 h-4" />}
                title="Satış görüşmesi"
                description="Planlar, kurumsal teklif, demo."
                action={{
                  label: 'satis@onsig.app',
                  href: 'mailto:satis@onsig.app',
                }}
              />
              <ChannelCard
                icon={<Mail className="w-4 h-4" />}
                title="Teknik destek"
                description="Hesap, fatura veya kullanım."
                action={{
                  label: 'destek@onsig.app',
                  href: 'mailto:destek@onsig.app',
                }}
                id="destek"
              />
              <ChannelCard
                icon={<Phone className="w-4 h-4" />}
                title="Telefon"
                description="İş günlerinde 09:00 — 18:00."
                action={{ label: '+90 212 000 00 00', href: 'tel:+902120000000' }}
                id="satis"
              />
              <ChannelCard
                icon={<MapPin className="w-4 h-4" />}
                title="Ofis"
                description="İstanbul · 4. Levent"
                action={{
                  label: 'Yol tarifi al',
                  href: 'https://maps.google.com',
                }}
              />

              <div className="p-5 rounded-card bg-paper ring-1 ring-divider">
                <div className="flex items-center gap-2 text-xs font-semibold text-ink-9">
                  <span className="grid place-items-center w-5 h-5 rounded-full bg-success-soft text-success-deep">
                    <Clock className="w-3 h-3" />
                  </span>
                  Yanıt süresi
                </div>
                <div className="mt-2 text-sm text-ink-11 leading-relaxed">
                  Mesai saatlerinde ortalama{' '}
                  <span className="font-semibold text-ink-12">2 saat</span> içinde
                  dönüş yapıyoruz. Aksi takdirde en geç 24 saat içinde mutlaka
                  ulaşırız.
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="p-7 sm:p-9 rounded-card bg-paper ring-1 ring-divider shadow-card">
              <div className="mb-7">
                <Eyebrow>Form</Eyebrow>
                <h2 className="mt-3 font-display text-display-sm tracking-tightest text-ink-12">
                  Bize biraz anlat.
                </h2>
              </div>
              <ContactForm />
            </div>
          </div>
        </Container>
      </Section>

      {/* Footer CTA */}
      <Section pad="lg">
        <Container width="narrow">
          <div className="text-center">
            <Eyebrow>Hızlı yol</Eyebrow>
            <h2 className="mt-4 font-display text-display-md tracking-tightest text-balance text-ink-12">
              Mesaj yazmaya gerek yok.
              <br />
              <GradientText>Ücretsiz hesap aç ve dene.</GradientText>
            </h2>
            <p className="mt-4 text-body-lg text-ink-8 leading-relaxed">
              Pro deneme süresinde tüm özellikler açık. Kredi kartı istemiyoruz.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register" className="btn-primary btn-lg">
                Ücretsiz başla
              </Link>
              <Link href="/pricing" className="btn-secondary btn-lg">
                Planları gör
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}

function ChannelCard({
  icon,
  title,
  description,
  action,
  id,
}: {
  icon: React.ReactNode
  title: string
  description: string
  action: { label: string; href: string }
  id?: string
}) {
  return (
    <Link
      id={id}
      href={action.href}
      className="group block p-5 rounded-card bg-paper ring-1 ring-divider hover:ring-divider-strong hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-4">
        <span className="grid place-items-center w-10 h-10 rounded-md bg-iris-1 text-iris-11 ring-1 ring-iris-3 shrink-0">
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold tracking-tight text-ink-12">
            {title}
          </div>
          <div className="mt-0.5 text-xs text-ink-7">{description}</div>
          <div className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-iris-11 group-hover:text-iris-12">
            {action.label}
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </Link>
  )
}
