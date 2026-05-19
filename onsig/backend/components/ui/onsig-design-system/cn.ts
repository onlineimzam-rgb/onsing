/**
 * Lightweight className joiner.
 *
 * We avoid pulling in `clsx`/`classnames` to keep the bundle lean — this
 * 8-liner gives us the same ergonomics for our needs.
 */
export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | Record<string, unknown>
  | ClassValue[]

export function cn(...values: ClassValue[]): string {
  const out: string[] = []
  const push = (v: ClassValue): void => {
    if (!v) return
    if (typeof v === 'string' || typeof v === 'number') {
      out.push(String(v))
      return
    }
    if (Array.isArray(v)) {
      v.forEach(push)
      return
    }
    if (typeof v === 'object') {
      for (const k in v) if (v[k]) out.push(k)
    }
  }
  values.forEach(push)
  return out.join(' ')
}
