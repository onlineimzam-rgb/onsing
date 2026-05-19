import type { MetadataRoute } from 'next'

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://onsig.app'

/**
 * Sitemap for the marketing surface. Authenticated app routes (`/dashboard`,
 * `/contracts`, ...) are intentionally NOT exposed — they require login and
 * have no value for crawlers.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  const marketingPages: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '/', priority: 1.0, freq: 'weekly' },
    { path: '/features', priority: 0.9, freq: 'monthly' },
    { path: '/pricing', priority: 0.95, freq: 'monthly' },
    { path: '/security', priority: 0.8, freq: 'monthly' },
    { path: '/industries', priority: 0.85, freq: 'monthly' },
    { path: '/contact', priority: 0.7, freq: 'yearly' },
    { path: '/login', priority: 0.4, freq: 'yearly' },
    { path: '/register', priority: 0.6, freq: 'yearly' },
  ]

  return marketingPages.map((p) => ({
    url: `${BASE_URL}${p.path}`,
    lastModified,
    changeFrequency: p.freq,
    priority: p.priority,
  }))
}
