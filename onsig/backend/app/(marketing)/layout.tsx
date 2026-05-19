import type { Metadata } from 'next'
import { MarketingNav } from '@/components/marketing/Nav'
import { MarketingFooter } from '@/components/marketing/Footer'

export const metadata: Metadata = {
  title: {
    default: 'OnSig — Online sözleşme & e-imza platformu',
    template: '%s · OnSig',
  },
  description:
    'OnSig, sözleşmelerinizi dakikalar içinde hazırlayıp uzaktan, hukuken geçerli şekilde imzalatmanızı sağlar. OTP doğrulamalı e-imza, audit zinciri, KVKK uyumu.',
  applicationName: 'OnSig',
  authors: [{ name: 'OnSig' }],
  keywords: [
    'online sözleşme',
    'e-imza',
    'elektronik imza',
    'kira sözleşmesi',
    'emlak sözleşmesi',
    'KVKK uyumlu imza',
    'audit zinciri',
    'OTP imza',
    'PDF arşivleme',
    'mobil imza',
    'OnSig',
  ],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'
  ),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'OnSig',
    locale: 'tr_TR',
    title: 'OnSig — Online sözleşme & e-imza platformu',
    description:
      'Sözleşmeyi hazırla, linki gönder, uzaktan imzalat. Audit zinciri ve KVKK uyumuyla hukuken geçerli e-imza.',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OnSig — Online sözleşme & e-imza',
    description:
      'OTP doğrulamalı e-imza, audit zinciri, KVKK uyumu — Türkiye için tasarlandı.',
  },
  icons: {
    icon: '/favicon.ico',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'OnSig',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://onsig.app',
  logo:
    (process.env.NEXT_PUBLIC_APP_URL ?? 'https://onsig.app') + '/og-default.png',
  sameAs: [
    'https://twitter.com',
    'https://www.linkedin.com',
    'https://github.com',
  ],
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: 'satis@onsig.app',
      availableLanguage: ['Turkish', 'English'],
    },
  ],
}

const SOFTWARE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'OnSig',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, iOS, Android',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'TRY',
    availability: 'https://schema.org/InStock',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '128',
  },
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SOFTWARE_JSON_LD) }}
      />

      <MarketingNav />
      <main className="pt-16">{children}</main>
      <MarketingFooter />
    </>
  )
}
