import * as React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/components/ui/onsig-design-system'

/**
 * Reusable marketing primitives. These are intentionally _stateless_ React
 * Server Components — interactive bits live in /components/marketing/Motion.tsx.
 */

// ── Eyebrow ───────────────────────────────────────────────────────────────────
export function Eyebrow({
  children,
  tone = 'iris',
  className,
}: {
  children: React.ReactNode
  tone?: 'iris' | 'ink' | 'success'
  className?: string
}) {
  const tones: Record<string, string> = {
    iris: 'bg-iris-1 text-iris-11 ring-iris-3',
    ink: 'bg-ink-2 text-ink-11 ring-divider',
    success: 'bg-success-soft text-success-deep ring-success-soft',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ring-1 text-2xs font-semibold uppercase tracking-widest',
        tones[tone],
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          'block w-1.5 h-1.5 rounded-full',
          tone === 'iris' && 'bg-iris-9',
          tone === 'ink' && 'bg-ink-9',
          tone === 'success' && 'bg-success-deep'
        )}
      />
      {children}
    </span>
  )
}

// ── Section heading ───────────────────────────────────────────────────────────
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
}: {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  align?: 'left' | 'center'
  className?: string
}) {
  return (
    <div
      className={cn(
        'max-w-2xl',
        align === 'center' && 'mx-auto text-center',
        className
      )}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="mt-4 font-display text-display-md md:text-display-lg tracking-tightest text-balance text-ink-12">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-body-lg text-ink-8 leading-relaxed text-pretty">
          {description}
        </p>
      )}
    </div>
  )
}

// ── Gradient text ─────────────────────────────────────────────────────────────
export function GradientText({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'bg-gradient-to-br from-iris-11 via-iris-10 to-iris-9 bg-clip-text text-transparent',
        className
      )}
    >
      {children}
    </span>
  )
}

// ── Container ─────────────────────────────────────────────────────────────────
export function Container({
  children,
  className,
  width = 'default',
}: {
  children: React.ReactNode
  className?: string
  width?: 'default' | 'narrow' | 'wide'
}) {
  return (
    <div
      className={cn(
        'mx-auto px-5 sm:px-6 lg:px-8',
        width === 'narrow' && 'max-w-3xl',
        width === 'default' && 'max-w-6xl',
        width === 'wide' && 'max-w-7xl',
        className
      )}
    >
      {children}
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────
export function Section({
  children,
  className,
  id,
  pad = 'lg',
  pattern,
}: {
  children: React.ReactNode
  className?: string
  id?: string
  pad?: 'sm' | 'md' | 'lg' | 'xl'
  pattern?: 'grid' | 'dotted' | 'none'
}) {
  const pads: Record<string, string> = {
    sm: 'py-14',
    md: 'py-20',
    lg: 'py-24 sm:py-28',
    xl: 'py-28 sm:py-36',
  }
  return (
    <section
      id={id}
      className={cn(
        'relative',
        pads[pad],
        pattern === 'grid' && 'bg-grid-faint',
        pattern === 'dotted' && 'bg-dotted-faint',
        className
      )}
    >
      {children}
    </section>
  )
}

// ── Stat tile ─────────────────────────────────────────────────────────────────
export function StatTile({
  value,
  label,
  hint,
}: {
  value: React.ReactNode
  label: React.ReactNode
  hint?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="font-display text-display-md tracking-tightest text-ink-12 num">
        {value}
      </div>
      <div className="text-sm font-medium text-ink-9">{label}</div>
      {hint && <div className="text-2xs text-ink-7">{hint}</div>}
    </div>
  )
}

// ── Marquee Logos ─────────────────────────────────────────────────────────────
export function MarqueeLogos({ items }: { items: { name: string }[] }) {
  // We render the list twice so the CSS animation loops seamlessly.
  const doubled = [...items, ...items]
  return (
    <div
      className="relative overflow-hidden"
      style={{
        maskImage:
          'linear-gradient(to right, transparent 0, black 8%, black 92%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent 0, black 8%, black 92%, transparent 100%)',
      }}
    >
      <div className="flex w-max gap-12 animate-marquee">
        {doubled.map((item, i) => (
          <div
            key={`${item.name}-${i}`}
            className="shrink-0 px-4 py-3 text-ink-7 hover:text-ink-11 transition-colors"
          >
            <span className="font-display text-base font-bold tracking-tightest opacity-80">
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Feature tile ──────────────────────────────────────────────────────────────
export function FeatureTile({
  icon,
  title,
  description,
  tone = 'default',
}: {
  icon: React.ReactNode
  title: React.ReactNode
  description: React.ReactNode
  tone?: 'default' | 'highlight'
}) {
  return (
    <div
      className={cn(
        'group relative p-6 rounded-card transition-all duration-220',
        'bg-paper ring-1 ring-divider hover:ring-divider-strong',
        'hover:shadow-md hover:-translate-y-0.5'
      )}
    >
      {tone === 'highlight' && (
        <span
          aria-hidden
          className="absolute -inset-px rounded-card pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-iris-2 via-transparent to-transparent"
        />
      )}
      <div className="relative">
        <div className="grid place-items-center w-10 h-10 rounded-lg bg-iris-1 text-iris-11 ring-1 ring-iris-3">
          {icon}
        </div>
        <h3 className="mt-5 font-display text-base font-semibold tracking-tight text-ink-12">
          {title}
        </h3>
        <p className="mt-2 text-sm text-ink-8 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

// ── CTA band ──────────────────────────────────────────────────────────────────
export function CTABand({
  title,
  description,
  primaryHref = '/register',
  primaryLabel = 'Ücretsiz başla',
  secondaryHref = '/contact',
  secondaryLabel = 'Satışla görüş',
}: {
  title: React.ReactNode
  description?: React.ReactNode
  primaryHref?: string
  primaryLabel?: string
  secondaryHref?: string
  secondaryLabel?: string
}) {
  return (
    <div className="relative isolate overflow-hidden rounded-3xl bg-ink-12 text-paper">
      <div
        aria-hidden
        className="absolute inset-0 bg-grid-faint opacity-[0.08]"
      />
      <div
        aria-hidden
        className="absolute -top-32 -right-24 w-[360px] h-[360px] rounded-full bg-iris-9/30 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-32 -left-24 w-[360px] h-[360px] rounded-full bg-iris-11/20 blur-3xl"
      />
      <div className="relative px-6 py-14 sm:px-14 sm:py-20 max-w-4xl">
        <h2 className="font-display text-display-md sm:text-display-lg tracking-tightest text-balance text-paper">
          {title}
        </h2>
        {description && (
          <p className="mt-4 text-body-lg text-ink-5 max-w-xl">{description}</p>
        )}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={primaryHref}
            className="inline-flex items-center gap-1.5 h-11 px-5 rounded-md bg-paper text-ink-12 font-semibold text-sm hover:bg-ink-3 transition-colors shadow-lg"
          >
            {primaryLabel}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href={secondaryHref}
            className="inline-flex items-center gap-1.5 h-11 px-5 rounded-md bg-ink-11/40 ring-1 ring-paper/15 text-paper font-semibold text-sm hover:bg-ink-11/55 transition-colors backdrop-blur-glass"
          >
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Step ──────────────────────────────────────────────────────────────────────
export function Step({
  index,
  title,
  description,
  icon,
}: {
  index: number
  title: React.ReactNode
  description: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <div className="relative">
      <div className="flex items-center gap-3">
        <span className="grid place-items-center w-8 h-8 rounded-full bg-paper ring-1 ring-divider-strong text-ink-9 font-display font-semibold text-sm shadow-xs num">
          {String(index).padStart(2, '0')}
        </span>
        {icon && (
          <span className="grid place-items-center w-8 h-8 rounded-md bg-iris-1 text-iris-11 ring-1 ring-iris-3">
            {icon}
          </span>
        )}
      </div>
      <h3 className="mt-5 font-display text-base font-semibold tracking-tight text-ink-12">
        {title}
      </h3>
      <p className="mt-2 text-sm text-ink-8 leading-relaxed max-w-[28ch]">
        {description}
      </p>
    </div>
  )
}

// ── Quote ─────────────────────────────────────────────────────────────────────
export function Quote({
  quote,
  author,
  role,
  company,
}: {
  quote: React.ReactNode
  author: string
  role?: string
  company?: string
}) {
  return (
    <figure className="p-6 sm:p-8 rounded-card bg-paper ring-1 ring-divider">
      <blockquote className="font-display text-lg sm:text-xl tracking-tight text-ink-12 leading-snug text-balance">
        <span className="text-iris-9 select-none">“</span>
        {quote}
        <span className="text-iris-9 select-none">”</span>
      </blockquote>
      <figcaption className="mt-5 pt-5 border-t border-divider flex items-center gap-3 text-sm">
        <div className="grid place-items-center w-9 h-9 rounded-full bg-iris-hero text-paper font-semibold text-xs ring-1 ring-iris-11/30">
          {author
            .split(' ')
            .map((s) => s[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div className="leading-tight">
          <div className="font-semibold text-ink-12">{author}</div>
          {(role || company) && (
            <div className="text-xs text-ink-7">
              {role}
              {role && company ? ' · ' : ''}
              {company}
            </div>
          )}
        </div>
      </figcaption>
    </figure>
  )
}
