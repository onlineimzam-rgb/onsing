/** Minimal `cn` helper for the admin surface. */
export function cn(
  ...args: Array<string | number | null | undefined | false | Record<string, boolean | null | undefined>>
): string {
  const out: string[] = []
  for (const a of args) {
    if (!a) continue
    if (typeof a === 'string' || typeof a === 'number') {
      out.push(String(a))
    } else if (typeof a === 'object') {
      for (const [k, v] of Object.entries(a)) {
        if (v) out.push(k)
      }
    }
  }
  return out.join(' ')
}
