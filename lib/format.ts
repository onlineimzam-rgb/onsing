import type { Currency } from './config'

export function formatPrice(
  price: number | null | undefined,
  currency: Currency = 'TRY',
  locale: 'tr' | 'en' = 'tr'
) {
  if (!price || price === 0) return locale === 'en' ? 'Price on request' : 'Fiyat sorunuz'
  const intl = locale === 'en' ? 'en-GB' : 'tr-TR'
  const num = new Intl.NumberFormat(intl, {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Number(price))
  const suffix = currency === 'EUR' ? '€' : 'TL'
  return `${num} ${suffix}`
}

/**
 * Fiyatı parça parça döndürür; tipografide tutar ve birim için farklı stil uygulamak
 * isteyen bileşenler kullanır.
 */
export function formatPriceParts(
  price: number | null | undefined,
  currency: Currency = 'TRY',
  locale: 'tr' | 'en' = 'tr'
): { amount: string; suffix: string; available: boolean } {
  if (!price || price === 0) {
    return {
      amount: '',
      suffix: '',
      available: false,
    }
  }
  const intl = locale === 'en' ? 'en-GB' : 'tr-TR'
  const amount = new Intl.NumberFormat(intl, {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Number(price))
  return {
    amount,
    suffix: currency === 'EUR' ? '€' : 'TL',
    available: true,
  }
}

export function formatNumber(n: number | null | undefined, locale: 'tr' | 'en' = 'tr') {
  if (n === null || n === undefined) return '-'
  return Number(n).toLocaleString(locale === 'en' ? 'en-GB' : 'tr-TR')
}

export function slugify(input: string): string {
  return input
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

export function generateReferenceNo(): string {
  const ts = Date.now().toString(36).toUpperCase().slice(-5)
  const rnd = Math.random().toString(36).toUpperCase().slice(2, 5)
  return `CUG-${ts}${rnd}`
}
