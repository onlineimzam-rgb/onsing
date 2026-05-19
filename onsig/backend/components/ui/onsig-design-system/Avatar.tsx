import * as React from 'react'
import { cn } from './cn'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg'

const SIZE: Record<AvatarSize, string> = {
  xs: 'w-5 h-5 text-[10px]',
  sm: 'w-7 h-7 text-[11px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-11 h-11 text-sm',
}

/** Two-character initials from a name ("Bülent Demir" → "BD"). */
export function initialsOf(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

/**
 * Deterministic color picker from a string — so the same user/tenant always
 * gets the same avatar gradient regardless of session.
 */
const PALETTE: Array<[string, string]> = [
  ['#5E55E5', '#2A2495'], // iris
  ['#0EA5E9', '#0369A1'], // info
  ['#10B981', '#047857'], // success
  ['#F59E0B', '#B45309'], // warning
  ['#EF4444', '#B91C1C'], // danger
  ['#8B5CF6', '#5B21B6'], // violet
  ['#EC4899', '#9D174D'], // pink
  ['#14B8A6', '#0F766E'], // teal
]

function hash(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

export function avatarGradient(seed: string): string {
  const [a, b] = PALETTE[hash(seed) % PALETTE.length]!
  return `linear-gradient(135deg, ${a}, ${b})`
}

export interface AvatarProps {
  name?: string | null
  /** Used for the deterministic gradient — defaults to `name`. */
  seed?: string
  size?: AvatarSize
  src?: string | null
  className?: string
  /** Optional status dot (online / busy / signed etc). */
  status?: 'success' | 'warning' | 'danger' | 'iris' | null
}

const STATUS: Record<NonNullable<AvatarProps['status']>, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  iris: 'bg-iris-9',
}

export function Avatar({
  name,
  seed,
  size = 'md',
  src,
  className,
  status,
}: AvatarProps) {
  const gradient = avatarGradient(seed || name || 'OnSig')
  return (
    <span
      className={cn(
        'relative inline-grid place-items-center rounded-full font-semibold tracking-tight text-white',
        'shadow-ring shrink-0',
        SIZE[size],
        className
      )}
      style={src ? undefined : { backgroundImage: gradient }}
      aria-label={name ?? undefined}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name ?? ''}
          className="absolute inset-0 w-full h-full rounded-full object-cover"
        />
      ) : (
        <span aria-hidden>{initialsOf(name)}</span>
      )}
      {status && (
        <span
          aria-hidden
          className={cn(
            'absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-paper',
            STATUS[status],
            size === 'lg' ? 'w-3 h-3' : 'w-2.5 h-2.5'
          )}
        />
      )}
    </span>
  )
}

/** Stacked avatars — useful for "shared with N people" affordances. */
export function AvatarStack({
  names,
  size = 'sm',
  max = 4,
  className,
}: {
  names: string[]
  size?: AvatarSize
  max?: number
  className?: string
}) {
  const shown = names.slice(0, max)
  const extra = names.length - shown.length
  return (
    <div className={cn('inline-flex', className)}>
      {shown.map((n, i) => (
        <Avatar
          key={`${n}-${i}`}
          name={n}
          size={size}
          className={cn('ring-2 ring-paper', i !== 0 && '-ml-2')}
        />
      ))}
      {extra > 0 && (
        <span
          className={cn(
            'inline-grid place-items-center rounded-full ring-2 ring-paper bg-ink-2 text-ink-10 font-semibold',
            '-ml-2',
            SIZE[size]
          )}
        >
          +{extra}
        </span>
      )}
    </div>
  )
}
