'use client'

import * as React from 'react'
import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from 'framer-motion'

/**
 * Marketing motion vocabulary.
 *
 * The marketing surface uses a small, tightly-tuned set of motion verbs so that
 * every page feels consistent. Three knobs only:
 *
 *   - duration: 320ms (default) or 480ms (hero only)
 *   - ease:     emphasized ease-out (Apple/Stripe-style settle)
 *   - delay:    via `delay` prop or auto-staggered with <FadeInStagger />
 *
 * Every primitive respects `prefers-reduced-motion` and falls back to a static
 * render in that case.
 */

const EASE_EMPHASIZED = [0.16, 1, 0.3, 1] as const

// ── FadeIn ────────────────────────────────────────────────────────────────────
export interface FadeInProps extends HTMLMotionProps<'div'> {
  /** Translate-Y in px to start from. */
  y?: number
  /** Translate-X in px to start from. */
  x?: number
  /** Animation duration in seconds. */
  duration?: number
  /** Delay before the animation starts (seconds). */
  delay?: number
  /** When true, animation triggers as the element scrolls into view. */
  onView?: boolean
  /** Re-trigger every time the element enters view (default: once). */
  repeat?: boolean
}

export function FadeIn({
  y = 12,
  x = 0,
  duration = 0.45,
  delay = 0,
  onView = true,
  repeat = false,
  children,
  className,
  style,
  ...rest
}: FadeInProps) {
  const reduced = useReducedMotion()
  const hidden = reduced ? { opacity: 1, y: 0, x: 0 } : { opacity: 0, y, x }
  const shown = { opacity: 1, y: 0, x: 0 }

  return (
    <motion.div
      initial={hidden}
      {...(onView
        ? {
            whileInView: shown,
            viewport: { once: !repeat, margin: '-40px' },
          }
        : { animate: shown })}
      transition={{ duration, delay, ease: EASE_EMPHASIZED }}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

// ── FadeInStagger ─────────────────────────────────────────────────────────────
interface StaggerContext {
  duration: number
  ease: typeof EASE_EMPHASIZED
}
const StaggerCtx = React.createContext<StaggerContext | null>(null)

export function FadeInStagger({
  children,
  className,
  delay = 0,
  duration = 0.42,
  stagger = 0.06,
  onView = true,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  stagger?: number
  onView?: boolean
}) {
  const reduced = useReducedMotion()

  const containerVariants: Variants = {
    hidden: {},
    show: {
      transition: {
        delayChildren: delay,
        staggerChildren: reduced ? 0 : stagger,
      },
    },
  }

  return (
    <StaggerCtx.Provider value={{ duration, ease: EASE_EMPHASIZED }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        {...(onView
          ? { whileInView: 'show', viewport: { once: true, margin: '-40px' } }
          : { animate: 'show' })}
        className={className}
      >
        {children}
      </motion.div>
    </StaggerCtx.Provider>
  )
}

export function FadeInItem({
  children,
  className,
  y = 12,
  as = 'div',
}: {
  children: React.ReactNode
  className?: string
  y?: number
  as?: 'div' | 'li' | 'article' | 'section'
}) {
  const ctx = React.useContext(StaggerCtx)
  const reduced = useReducedMotion()
  const variants: Variants = {
    hidden: reduced ? { opacity: 1, y: 0 } : { opacity: 0, y },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: ctx?.duration ?? 0.42,
        ease: EASE_EMPHASIZED,
      },
    },
  }
  const Tag = motion[as] as typeof motion.div
  return (
    <Tag variants={variants} className={className}>
      {children}
    </Tag>
  )
}

// ── Reveal underline ──────────────────────────────────────────────────────────
/**
 * Animates a horizontal underline from left to right when in view. Use behind
 * "section title" overlines for a Linear-style activation.
 */
export function RevealLine({
  className,
  delay = 0,
}: {
  className?: string
  delay?: number
}) {
  const reduced = useReducedMotion()
  return (
    <motion.span
      initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.7, ease: EASE_EMPHASIZED, delay }}
      style={{ originX: 0 }}
      className={['block h-px bg-divider-strong', className].join(' ')}
      aria-hidden
    />
  )
}

// ── ParallaxBlob ──────────────────────────────────────────────────────────────
/**
 * Subtle, decorative blob that drifts as the viewport scrolls. Use sparingly —
 * one per section at most, behind a glass element.
 */
export function ParallaxBlob({
  className,
  speed = 30,
}: {
  className?: string
  speed?: number
}) {
  const reduced = useReducedMotion()
  const [scrollY, setScrollY] = React.useState(0)
  React.useEffect(() => {
    if (reduced) return
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [reduced])
  return (
    <span
      aria-hidden
      className={className}
      style={{
        transform: `translate3d(0, ${(-scrollY / 1000) * speed}px, 0)`,
        willChange: 'transform',
      }}
    />
  )
}
