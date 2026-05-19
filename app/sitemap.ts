import type { MetadataRoute } from 'next'
import { SITE_CONFIG } from '@/lib/config'
import { locales } from '@/lib/i18n/config'

const PAGES = [
  '',
  'emlak',
  'hizmetler',
  'mulk-degerleme',
  'portfoy-toplama',
  'blog',
  'galeri',
  'hakkimizda',
  'iletisim',
  'gizlilik',
  'kvkk',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  const entries: MetadataRoute.Sitemap = []
  for (const locale of locales) {
    for (const page of PAGES) {
      entries.push({
        url: `${SITE_CONFIG.url}/${locale}${page ? `/${page}` : ''}/`,
        lastModified,
        changeFrequency: page === '' || page === 'emlak' ? 'daily' : 'weekly',
        priority: page === '' ? 1.0 : page === 'emlak' ? 0.95 : 0.7,
      })
    }
  }
  return entries
}
