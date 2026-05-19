/**
 * Turkish-aware slug generator.
 *
 * Used when creating a tenant from a "Firma adı" field at signup. Keeps URLs
 * predictable (no diacritics, no spaces) and survives Postgres' 64-char slug
 * limit. Collisions are caller's responsibility — usually we suffix `-2`,
 * `-3` etc. when uniqueness fails.
 *
 * Examples:
 *   "Çandarlı Uzman Gayrimenkul" → "candarli-uzman-gayrimenkul"
 *   "ABC İnşaat A.Ş."            → "abc-insaat-a-s"
 *   "  ışık  & cam  "            → "isik-cam"
 */

const TR_MAP: Record<string, string> = {
  ı: 'i',
  İ: 'i',
  ş: 's',
  Ş: 's',
  ğ: 'g',
  Ğ: 'g',
  ü: 'u',
  Ü: 'u',
  ö: 'o',
  Ö: 'o',
  ç: 'c',
  Ç: 'c',
}

export function slugify(input: string, maxLength = 64): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split('')
    .map((ch) => TR_MAP[ch] ?? ch)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, maxLength)
}

/**
 * Produce a slug that doesn't collide with `existing`. Suffixes `-2`, `-3`,
 * ... up to `maxAttempts`. Throws if exhausted (extremely unlikely for any
 * sane signup volume).
 */
export function uniqueSlug(
  base: string,
  existing: Set<string>,
  maxAttempts = 100
): string {
  const root = slugify(base) || 'workspace'
  if (!existing.has(root)) return root
  for (let i = 2; i < maxAttempts; i++) {
    const candidate = `${root}-${i}`.slice(0, 64)
    if (!existing.has(candidate)) return candidate
  }
  throw new Error(`could not allocate unique slug for "${base}" within ${maxAttempts} attempts`)
}
