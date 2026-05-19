import type { Metadata, Viewport } from 'next'
import './globals.css'

// Robots: we let marketing routes set their own `metadata.robots` to override
// when SEO is desired. Default here is "noindex" so signed-in screens, the
// admin console, and the public sign URL are NEVER picked up by Google.
//
// To open the marketing site for indexing in production, the
// `(marketing)` layout exports its own `metadata.robots = { index: true }`.
const indexable = process.env.NEXT_PUBLIC_SEO_INDEXABLE === 'true'

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  ),
  title: {
    default: 'OnSig — Online Sözleşme & İmza',
    template: '%s · OnSig',
  },
  description:
    'OnSig ile dakikalar içinde sözleşme oluşturun, link/QR ile her yerden imza alın. Zaman damgası, IP ve audit kaydı dahil.',
  applicationName: 'OnSig',
  robots: indexable
    ? { index: true, follow: true }
    : { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: '#5A3DF5',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  )
}
