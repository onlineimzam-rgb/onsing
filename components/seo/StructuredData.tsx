import { SITE_CONFIG } from '@/lib/config'
import { getPublicSiteSettings } from '@/lib/settings'

export default async function StructuredData() {
  const settings = await getPublicSiteSettings()
  const logoUrl = settings.logoLightUrl.startsWith('http')
    ? settings.logoLightUrl
    : `${SITE_CONFIG.url}${settings.logoLightUrl}`
  const realEstateAgent = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: SITE_CONFIG.name,
    alternateName: SITE_CONFIG.shortName,
    url: SITE_CONFIG.url,
    logo: logoUrl,
    image: logoUrl,
    description:
      "Çandarlı, Dikili ve İzmir bölgesinde satılık-kiralık emlak, mülk değerleme ve yatırım danışmanlığı.",
    telephone: SITE_CONFIG.phone,
    email: SITE_CONFIG.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE_CONFIG.address.street,
      addressLocality: SITE_CONFIG.address.district,
      addressRegion: SITE_CONFIG.address.city,
      postalCode: SITE_CONFIG.address.postalCode,
      addressCountry: SITE_CONFIG.address.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: SITE_CONFIG.geo.lat,
      longitude: SITE_CONFIG.geo.lng,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '19:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '10:00',
        closes: '18:00',
      },
    ],
    sameAs: [SITE_CONFIG.social.instagram].filter(Boolean),
    areaServed: SITE_CONFIG.serviceAreas.map((a) => ({
      '@type': 'Place',
      name: a,
    })),
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: SITE_CONFIG.phone,
        contactType: 'sales',
        areaServed: 'TR',
        availableLanguage: ['Turkish', 'English'],
      },
      {
        '@type': 'ContactPoint',
        telephone: `+${SITE_CONFIG.whatsappNumber}`,
        contactType: 'customer support',
        areaServed: 'TR',
        availableLanguage: ['Turkish', 'English'],
      },
    ],
  }

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: logoUrl,
    sameAs: [SITE_CONFIG.social.instagram].filter(Boolean),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(realEstateAgent) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
    </>
  )
}
