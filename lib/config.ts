export const SITE_CONFIG = {
  name: 'Çandarlı Uzman Gayrimenkul',
  shortName: 'Çandarlı Uzman GM',
  tagline: 'Yatırımlarınıza değer katar',
  taglineEn: 'We add value to your investments',
  url: 'https://www.candarliuzmangm.com.tr',
  domain: 'candarliuzmangm.com.tr',
  // Tek numara: hem sabit/cep hem WhatsApp
  phone: '+90 507 487 59 89',
  phoneRaw: '+905074875989',
  phoneDisplay: '0 507 487 59 89',
  whatsappNumber: '905074875989',
  whatsappDisplay: '0 507 487 59 89',
  email: 'info@candarliuzmangm.com.tr',
  address: {
    street: 'Çandarlı Mahallesi, Hürriyet Meydanı No:30/A',
    district: 'Çandarlı',
    city: 'Dikili / İzmir',
    postalCode: '35040',
    country: 'TR',
    full: 'Çandarlı Mah. Hürriyet Meydanı No:30/A, Dikili / İzmir',
  },
  // Ofis adresi koordinatı — Çandarlı Hürriyet Meydanı
  geo: {
    lat: 38.935890978233566,
    lng: 26.934972418472654,
  },
  hours: {
    weekdays: '09:00 - 19:00',
    saturday: '10:00 - 18:00',
    sunday: 'Randevu ile',
  },
  social: {
    instagram: 'https://www.instagram.com/candarliuzmangm/',
    instagramHandle: 'candarliuzmangm',
    facebook: '',
    youtube: '',
    linkedin: '',
  },
  serviceAreas: [
    'Çandarlı',
    'Dikili',
    'Bademli',
    'İzmir',
    'Türkiye geneli',
    'Yunanistan (yakında)',
  ],
} as const

export const mapsUrls = {
  search: `https://www.google.com/maps/search/?api=1&query=${SITE_CONFIG.geo.lat},${SITE_CONFIG.geo.lng}`,
  directions: `https://www.google.com/maps/dir/?api=1&destination=${SITE_CONFIG.geo.lat},${SITE_CONFIG.geo.lng}`,
  embed: `https://www.google.com/maps/embed/v1/place?q=${SITE_CONFIG.geo.lat},${SITE_CONFIG.geo.lng}`,
}

// Para birimi seçenekleri
export const CURRENCIES = ['TRY', 'EUR'] as const
export type Currency = (typeof CURRENCIES)[number]

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  TRY: '₺',
  EUR: '€',
}

// Property type / category
export const PROPERTY_TYPES = ['satilik', 'kiralik', 'gunluk-kiralik'] as const
export type PropertyType = (typeof PROPERTY_TYPES)[number]

export const PROPERTY_CATEGORIES = [
  'daire',
  'villa',
  'mustakil-ev',
  'yazlik',
  'rezidans',
  'is-yeri',
  'ofis',
  'dukkan',
  'arsa',
  'tarla',
  'bag-bahce',
  'turistik-tesis',
] as const
export type PropertyCategory = (typeof PROPERTY_CATEGORIES)[number]

export const PROPERTY_STATUS = ['aktif', 'satildi', 'kiralandi', 'rezerve', 'pasif'] as const
export type PropertyStatus = (typeof PROPERTY_STATUS)[number]
