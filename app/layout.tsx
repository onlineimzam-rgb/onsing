import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const SITE_URL = 'https://www.candarliuzmangm.com.tr'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Çandarlı Uzman Gayrimenkul | Yatırımlarınıza Değer Katar',
    template: '%s | Çandarlı Uzman Gayrimenkul',
  },
  description:
    "Çandarlı, Dikili ve İzmir bölgesinde satılık, kiralık daire, villa, arsa ve yatırımlık gayrimenkuller. 30+ yıllık tecrübe ile hayalinizdeki mülkü bulun.",
  keywords: [
    'Çandarlı emlak',
    'Çandarlı gayrimenkul',
    'Dikili emlak',
    'Çandarlı satılık',
    'Çandarlı kiralık',
    'İzmir yazlık',
    'Bademli emlak',
    'denize sıfır arsa',
    'Yunanistan yatırım',
    'yabancıya satılık ev',
  ],
  alternates: {
    canonical: '/',
    languages: {
      'tr-TR': '/tr',
      'en-US': '/en',
    },
  },
  openGraph: {
    title: 'Çandarlı Uzman Gayrimenkul',
    description:
      "Çandarlı, Dikili ve İzmir bölgesinde gayrimenkul alım-satım, kiralama ve değerleme. Yatırımlarınıza değer katar.",
    url: SITE_URL,
    siteName: 'Çandarlı Uzman Gayrimenkul',
    type: 'website',
    locale: 'tr_TR',
    alternateLocale: ['en_US'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Çandarlı Uzman Gayrimenkul',
    description: "Yatırımlarınıza değer katar.",
  },
  icons: {
    icon: [{ url: '/logo-light.png', type: 'image/png' }],
    apple: '/logo-light.png',
    shortcut: '/logo-light.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  category: 'real estate',
}

export const viewport: Viewport = {
  themeColor: '#0a1224',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" className={`${inter.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  )
}
