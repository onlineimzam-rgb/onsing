import type { MetadataRoute } from 'next'

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://onsig.app'

/**
 * robots.txt for OnSig. Marketing surface is open to crawlers; authenticated
 * app surface and sign tokens are explicitly disallowed.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/features', '/pricing', '/security', '/industries', '/contact', '/login', '/register'],
        disallow: [
          '/api/',
          '/dashboard',
          '/contracts',
          '/settings',
          '/billing',
          '/sign/',
          '/verify/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
