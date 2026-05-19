/**
 * OnSig motion system.
 *
 * Three motion families, ranked by purpose:
 *   1. `subtle`     — micro-interactions on buttons, badges, icons (≤ 180ms)
 *   2. `emphasized` — layout-level reveals (220–320ms, asymmetric ease-out)
 *   3. `narrative`  — onboarding / hero animations (420ms+, opt-in only)
 *
 * Reduced motion
 * ──────────────
 * Always honour `prefers-reduced-motion: reduce`. There are three escape routes:
 *   - CSS:           `@media (prefers-reduced-motion: reduce)` block — used in
 *                    `globals.css` and `tailwind.config.ts` animations.
 *   - Framer Motion: wrap your component in `<MotionConfig reducedMotion="user">`
 *                    or import variants via `withReducedMotion(variants)` below.
 *   - Raw JS:        check `prefersReducedMotion()` and pass `disabled` to your
 *                    animator.
 *
 * The exported variants are designed to feel right at the *default* speed and
 * to feel almost-instant at reduced motion (0–60ms cross-fade), without ever
 * fully disappearing (so the user still gets state change feedback).
 */

import type { Transition, Variants } from 'framer-motion'

// ─────────────────────────────────────────────────────────────────────────
// Easing & duration (mirrors tokens.motion.*)
// ─────────────────────────────────────────────────────────────────────────

export const easing = {
  /** Strong ease-out — UI reveals "settle into place". Default for reveals. */
  emphasized: [0.16, 1, 0.3, 1] as const,
  /** Material-ish balanced curve. Use for hover / press color changes. */
  gentle:     [0.4, 0, 0.2, 1] as const,
  /** A touch of overshoot for celebratory affordances. */
  spring:     [0.34, 1.56, 0.64, 1] as const,
  /** Linear — for shimmer / progress only. */
  linear:     'linear' as const,
} as const

/** CSS-string equivalents of the easing curves for direct use in `transition`. */
export const easingCSS = {
  emphasized: 'cubic-bezier(0.16, 1, 0.3, 1)',
  gentle:     'cubic-bezier(0.4, 0, 0.2, 1)',
  spring:     'cubic-bezier(0.34, 1.56, 0.64, 1)',
  linear:     'linear',
} as const

export const duration = {
  instant:    0.05,
  micro:      0.12,
  base:       0.18,
  emphasized: 0.22,
  pronounced: 0.32,
  narrative:  0.42,
  /** Storytelling reveals on the homepage. Never used in product UI. */
  cinematic:  0.62,
} as const

/** Millisecond equivalents — useful when calling `setTimeout` or CSS. */
export const durationMs = {
  instant:    50,
  micro:     120,
  base:      180,
  emphasized:220,
  pronounced:320,
  narrative: 420,
  cinematic: 620,
} as const

// ─────────────────────────────────────────────────────────────────────────
// CSS transitions — read these from non-framer code (Tailwind `transition`)
// ─────────────────────────────────────────────────────────────────────────

export const transition = {
  button: `all ${durationMs.base}ms ${easingCSS.emphasized}`,
  card:   `transform ${durationMs.emphasized}ms ${easingCSS.emphasized}, box-shadow ${durationMs.base}ms ${easingCSS.gentle}, border-color ${durationMs.base}ms ${easingCSS.gentle}`,
  tone:   `background-color ${durationMs.base}ms ${easingCSS.gentle}, color ${durationMs.base}ms ${easingCSS.gentle}`,
  layout: `width ${durationMs.pronounced}ms ${easingCSS.emphasized}, transform ${durationMs.pronounced}ms ${easingCSS.emphasized}, opacity ${durationMs.base}ms ${easingCSS.gentle}`,
  /** Use on the sidebar/sheet drawer transforms. */
  drawer: `transform ${durationMs.pronounced}ms ${easingCSS.emphasized}, opacity ${durationMs.emphasized}ms ${easingCSS.gentle}`,
} as const

// ─────────────────────────────────────────────────────────────────────────
// Framer Motion variants — the canonical reveal library.
//
// Naming convention:
//   - `fade*`   — opacity only
//   - `rise*`   — opacity + translateY
//   - `slide*`  — translateX/Y across the viewport
//   - `pop*`    — scale + opacity (celebratory)
//   - `stagger` — orchestrates a parent + child reveal
// ─────────────────────────────────────────────────────────────────────────

const baseTransition: Transition = {
  duration: duration.emphasized,
  ease: easing.emphasized,
}

export const variants = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: duration.base, ease: easing.gentle } },
  },

  /** Default "appears from below" for cards, KPI tiles, hero subtext. */
  riseIn: {
    hidden:  { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: baseTransition },
  },

  /** Larger lift, narrative timing. Use for marketing hero blocks only. */
  riseInLg: {
    hidden:  { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: duration.narrative, ease: easing.emphasized } },
  },

  /** Right-side drawer / sheet. */
  slideInRight: {
    hidden:  { x: '100%' },
    visible: { x: 0, transition: { duration: duration.pronounced, ease: easing.emphasized } },
    exit:    { x: '100%', transition: { duration: duration.base, ease: easing.gentle } },
  },

  slideInLeft: {
    hidden:  { x: '-100%' },
    visible: { x: 0, transition: { duration: duration.pronounced, ease: easing.emphasized } },
    exit:    { x: '-100%', transition: { duration: duration.base, ease: easing.gentle } },
  },

  /** Dialog content reveal. Pair with a fading backdrop. */
  popIn: {
    hidden:  { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1, transition: { duration: duration.emphasized, ease: easing.spring } },
    exit:    { opacity: 0, scale: 0.98, transition: { duration: duration.base, ease: easing.gentle } },
  },

  /** Toast / notification slide-in from the top. */
  toastIn: {
    hidden:  { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: duration.emphasized, ease: easing.emphasized } },
    exit:    { opacity: 0, y: -20, transition: { duration: duration.base, ease: easing.gentle } },
  },
} satisfies Record<string, Variants>

/** Stagger orchestrator — apply to the parent wrapper. */
export const stagger = {
  /** Standard 60ms cascade. Use for KPI grids, feature cards, marketing tiles. */
  default: {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
  },
  /** Quicker 30ms cascade — tight lists, audit feed items. */
  fast: {
    hidden: {},
    visible: { transition: { staggerChildren: 0.03, delayChildren: 0.02 } },
  },
  /** Theatrical 120ms cascade — hero rows on marketing pages. */
  narrative: {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
  },
} satisfies Record<string, Variants>

// ─────────────────────────────────────────────────────────────────────────
// Hover / press states (utility builders)
// ─────────────────────────────────────────────────────────────────────────

/** Subtle hover lift for interactive cards. */
export const hoverLift = {
  rest: { y: 0, boxShadow: '0 0 0 1px rgba(11,15,27,0.06), 0 1px 2px rgba(11,15,27,0.04)' },
  hover: { y: -2, boxShadow: '0 12px 32px rgba(11,15,27,0.10), 0 28px 64px rgba(11,15,27,0.12)' },
  transition: { duration: duration.emphasized, ease: easing.emphasized },
}

/** Button press feedback. */
export const tapPress = {
  whileTap: { scale: 0.985 },
  transition: { duration: duration.micro, ease: easing.gentle },
}

// ─────────────────────────────────────────────────────────────────────────
// Reduced-motion helpers
// ─────────────────────────────────────────────────────────────────────────

/** Returns `true` when the OS reports `prefers-reduced-motion: reduce`. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/**
 * Wrap a variants object so its `visible` state becomes a near-instant
 * cross-fade when the user opted out of motion. The element still transitions
 * (so the state change is perceivable) but without any spatial motion.
 */
export function withReducedMotion<V extends Variants>(v: V): V {
  if (typeof window === 'undefined') return v
  if (!prefersReducedMotion()) return v
  // Strip transforms from `visible`, keep opacity, force a short cross-fade.
  const flatten = (variant: unknown) => {
    if (variant && typeof variant === 'object') {
      const { x, y, scale, rotate, ...rest } = variant as Record<string, unknown>
      return { ...rest, transition: { duration: 0.05, ease: 'linear' } }
    }
    return variant
  }
  return Object.fromEntries(Object.entries(v).map(([k, val]) => [k, flatten(val)])) as V
}

/**
 * Helper for raw CSS — appends a `prefers-reduced-motion` override that nukes
 * the transition. Use sparingly; CSS already opts out globally in `globals.css`.
 */
export function reduceMotion(t: string): string {
  return `@media (prefers-reduced-motion: reduce) { transition: none; } ${t}`
}

// ─────────────────────────────────────────────────────────────────────────
// Keyframe registry (Tailwind <-> CSS reference)
//
// The keyframes themselves live in `tailwind.config.ts`. This object exists
// so consumers can discover available animations and pick the correct
// `animate-*` class.
// ─────────────────────────────────────────────────────────────────────────

export const keyframes = {
  'fade-in':         { duration: 180, easing: 'gentle',     family: 'subtle'     },
  'fade-out':        { duration: 180, easing: 'gentle',     family: 'subtle'     },
  'slide-up':        { duration: 220, easing: 'emphasized', family: 'emphasized' },
  'slide-down':      { duration: 220, easing: 'emphasized', family: 'emphasized' },
  'slide-in-right':  { duration: 320, easing: 'emphasized', family: 'emphasized' },
  'scale-in':        { duration: 220, easing: 'spring',     family: 'emphasized' },
  'pulse-soft':      { duration: 1600, easing: 'gentle',    family: 'subtle'     },
  shimmer:           { duration: 1400, easing: 'linear',    family: 'subtle'     },
  'accordion-down':  { duration: 260, easing: 'emphasized', family: 'emphasized' },
  'accordion-up':    { duration: 220, easing: 'gentle',     family: 'emphasized' },
  marquee:           { duration: 32000, easing: 'linear',   family: 'subtle'     },
} as const

export type KeyframeName = keyof typeof keyframes
export type MotionFamily = 'subtle' | 'emphasized' | 'narrative'
