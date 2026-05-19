import * as React from 'react'
import { cn } from './cn'
import { Badge, type BadgeTone } from './Badge'

/**
 * Components tailored for legal-tech surfaces: contracts, sign sessions, audit
 * trails. They share a "documentary" voice — serifs only where they add
 * gravitas, dense metadata, monospaced hashes/IDs.
 */

// ── PageWatermark ─────────────────────────────────────────────────────────────
/** A subtle diagonal "DRAFT / IPTAL" stamp behind a card. */
export function PageWatermark({
  label,
  rotate = -12,
  className,
}: {
  label: string
  rotate?: number
  className?: string
}) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none select-none absolute inset-0 grid place-items-center',
        className
      )}
    >
      <span
        className="font-display font-bold tracking-tightest text-[120px] uppercase text-ink-12/[0.04]"
        style={{ transform: `rotate(${rotate}deg)` }}
      >
        {label}
      </span>
    </div>
  )
}

// ── Hash chip ─────────────────────────────────────────────────────────────────
/** A monospaced, truncated hash — for chain-of-records / audit views. */
export function HashChip({
  value,
  length = 8,
  className,
}: {
  value: string
  length?: number
  className?: string
}) {
  const short = value.length > length ? `${value.slice(0, length)}…${value.slice(-4)}` : value
  return (
    <span
      title={value}
      className={cn(
        'inline-flex items-center gap-1 rounded bg-ink-2 text-ink-10',
        'px-1.5 h-5 text-[11px] font-mono ring-1 ring-inset ring-divider',
        className
      )}
    >
      <span aria-hidden className="w-1 h-1 rounded-full bg-iris-9" />
      {short}
    </span>
  )
}

// ── SignerRow ─────────────────────────────────────────────────────────────────
export interface SignerRowProps {
  role: string
  name?: string | null
  email?: string | null
  phone?: string | null
  signedAt?: Date | string | null
  status: 'pending' | 'sent' | 'verified' | 'signed' | 'cancelled' | 'expired'
  className?: string
  action?: React.ReactNode
}

const SIGN_STATUS: Record<
  SignerRowProps['status'],
  { label: string; tone: BadgeTone }
> = {
  pending: { label: 'Bekliyor', tone: 'neutral' },
  sent: { label: 'Gönderildi', tone: 'info' },
  verified: { label: 'OTP doğrulandı', tone: 'iris' },
  signed: { label: 'İmzalandı', tone: 'success' },
  cancelled: { label: 'İptal', tone: 'danger' },
  expired: { label: 'Süresi doldu', tone: 'warning' },
}

function fmtDateTime(d: Date | string | null | undefined): string {
  if (!d) return ''
  try {
    return new Date(d).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(d)
  }
}

export function SignerRow({
  role,
  name,
  email,
  phone,
  signedAt,
  status,
  action,
  className,
}: SignerRowProps) {
  const meta = SIGN_STATUS[status]
  return (
    <div
      className={cn(
        'flex items-center gap-3 py-3 first:pt-0 last:pb-0',
        className
      )}
    >
      <div
        className={cn(
          'w-9 h-9 rounded-md grid place-items-center text-[11px] font-bold uppercase tracking-tight',
          status === 'signed' ? 'bg-success-soft text-success-deep' : 'bg-ink-2 text-ink-9'
        )}
      >
        {role.slice(0, 2)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink-12 truncate">{name || '—'}</p>
        <p className="text-2xs text-ink-7 truncate">
          {role}
          {(email || phone) && ' · '}
          {email}
          {email && phone && ' · '}
          {phone}
        </p>
      </div>
      <div className="text-right shrink-0">
        <Badge tone={meta.tone} size="sm" dot>
          {meta.label}
        </Badge>
        {signedAt && (
          <p className="text-2xs text-ink-7 mt-0.5 num">{fmtDateTime(signedAt)}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

// ── Timeline ─────────────────────────────────────────────────────────────────
export interface TimelineItem {
  id: string | number
  title: React.ReactNode
  description?: React.ReactNode
  /** ISO date or Date object — used for `<time>` and the visible label. */
  timestamp?: Date | string | null
  /** Status tone (drives the bullet color). */
  tone?: BadgeTone
  /** Render a custom bullet (overrides tone). */
  bullet?: React.ReactNode
  href?: string
}

const BULLET_TONE: Record<BadgeTone, string> = {
  neutral: 'bg-ink-5',
  iris: 'bg-iris-9 ring-iris-3',
  success: 'bg-success ring-success/20',
  warning: 'bg-warning ring-warning/20',
  danger: 'bg-danger ring-danger/20',
  info: 'bg-info ring-info/20',
  ink: 'bg-ink-12',
}

export function Timeline({
  items,
  className,
}: {
  items: TimelineItem[]
  className?: string
}) {
  return (
    <ol className={cn('relative pl-5', className)}>
      <span
        aria-hidden
        className="absolute left-[7px] top-1 bottom-1 w-px bg-divider-strong"
      />
      {items.map((it) => (
        <li
          key={it.id}
          className="relative py-2.5 first:pt-0 last:pb-0 group"
        >
          <span
            aria-hidden
            className={cn(
              'absolute -left-[19px] top-3 w-2.5 h-2.5 rounded-full ring-4 ring-paper',
              BULLET_TONE[it.tone ?? 'neutral']
            )}
          >
            {it.bullet}
          </span>
          <p className="text-sm font-medium text-ink-12 leading-snug">
            {it.title}
          </p>
          {it.description && (
            <p className="text-xs text-ink-7 mt-0.5">{it.description}</p>
          )}
          {it.timestamp && (
            <p className="text-2xs text-ink-7 mt-1 num">
              {fmtDateTime(it.timestamp)}
            </p>
          )}
        </li>
      ))}
    </ol>
  )
}
