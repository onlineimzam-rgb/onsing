/**
 * OnSig Mobile — Tailwind/NativeWind tokens
 *
 * Design language: Stripe + Linear + Notion + Revolut + DocuSign — premium
 * enterprise SaaS. Clean, soft depth (no glassmorphism), purpose-built scales
 * for ink, brand purple, and the success/warn/danger semantic ramps.
 *
 * Two parallel token sets live here:
 *   • Modern tokens (`canvas`, `card`, `ink-*`, `brand-*`, …) — used by every
 *     in-app screen rewritten in the Phase 2.5 polish pass.
 *   • Legacy M3 tokens (`surface-container-*`, `secondary`, `tertiary`, …) —
 *     still consumed by Phase 0 auth screens (splash/onboarding/login). They
 *     stay until those screens are rebuilt against the new tokens.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // ═══════════════════════════════════════════════════════════════════
        // MODERN PREMIUM TOKENS — Stripe/Linear inspired
        // ═══════════════════════════════════════════════════════════════════

        // ─── Surfaces ───────────────────────────────────────────────────────
        canvas: '#f6f7fb',           // page background — cool off-white
        card: '#ffffff',             // resting card surface
        'card-pressed': '#fafbfd',   // active-state surface
        subtle: '#f1f3f8',           // chips, hover, skeleton base, secondary surfaces
        'subtle-hover': '#eaecf3',
        hairline: '#ecedf2',         // 1px borders, dividers (8% ink-900)
        'hairline-strong': '#dde0e8',// emphasised borders

        // ─── Ink (text + dividers) — anchored on #0f0f12 ────────────────────
        'ink-900': '#0f0f12',        // headings, primary text
        'ink-800': '#1a1c20',
        'ink-700': '#2a2d33',        // strong secondary
        'ink-600': '#494d55',        // body
        'ink-500': '#6b7280',        // secondary, captions
        'ink-400': '#9097a3',        // tertiary, hint
        'ink-300': '#b9bec6',        // muted icon
        'ink-200': '#d9dce2',        // strong divider
        'ink-100': '#ecedf2',        // soft divider
        'ink-50':  '#f6f7fb',        // tinted surface (== canvas)

        // ─── Brand (purple) — primary CTA + status ──────────────────────────
        'brand-50':  '#f5f3ff',
        'brand-100': '#ede8ff',
        'brand-200': '#dbd1fe',
        'brand-300': '#bba9fc',
        'brand-400': '#9c83f9',
        'brand-500': '#7d5af2',      // primary
        'brand-600': '#6b3fe6',      // hover
        'brand-700': '#5a30d0',      // pressed
        'brand-800': '#4720a8',
        'brand-900': '#3a1e9a',

        // ─── Semantic ramps ─────────────────────────────────────────────────
        'success-50':  '#ecfdf5',
        'success-100': '#d1fae5',
        'success-500': '#10b981',
        'success-600': '#059669',
        'success-700': '#047857',

        'warn-50':  '#fffbeb',
        'warn-100': '#fef3c7',
        'warn-500': '#f59e0b',
        'warn-600': '#d97706',
        'warn-700': '#b45309',

        'danger-50':  '#fef2f2',
        'danger-100': '#fee2e2',
        'danger-500': '#ef4444',
        'danger-600': '#dc2626',
        'danger-700': '#b91c1c',

        'info-50':  '#eff6ff',
        'info-500': '#3b82f6',
        'info-700': '#1d4ed8',

        // ═══════════════════════════════════════════════════════════════════
        // LEGACY M3 TOKENS (kept for auth/onboarding screens)
        // ═══════════════════════════════════════════════════════════════════

        // Surface (light)
        surface: '#f6f7fb',
        'surface-dim': '#d9dadb',
        'surface-bright': '#ffffff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#fafbfd',
        'surface-container': '#f1f3f8',
        'surface-container-high': '#e7e9f0',
        'surface-container-highest': '#dee1ea',
        'surface-variant': '#e1e3e4',
        'surface-tint': '#5e5e5e',

        // On-surface (text/ink) — points to new ink scale
        'on-surface': '#0f0f12',
        'on-surface-variant': '#494d55',
        'inverse-surface': '#2e3132',
        'inverse-on-surface': '#f0f1f2',
        outline: '#6b7280',
        'outline-variant': '#dde0e8',

        // Primary (Black / Graphite) — used by dark CTAs
        primary: '#0f0f12',
        'on-primary': '#ffffff',
        'primary-container': '#1a1c20',
        'on-primary-container': '#9097a3',
        'inverse-primary': '#c6c6c6',
        'primary-fixed': '#e2e2e2',
        'primary-fixed-dim': '#c6c6c6',
        'on-primary-fixed': '#1b1b1b',
        'on-primary-fixed-variant': '#474747',

        // Secondary (Vivid Purple — points to new brand ladder)
        secondary: '#7d5af2',
        'on-secondary': '#ffffff',
        'secondary-container': '#6b3fe6',
        'on-secondary-container': '#ffffff',
        'secondary-fixed': '#ede8ff',
        'secondary-fixed-dim': '#dbd1fe',
        'on-secondary-fixed': '#3a1e9a',
        'on-secondary-fixed-variant': '#5a30d0',

        // Tertiary (Emerald — completed signatures)
        tertiary: '#047857',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#ecfdf5',
        'on-tertiary-container': '#047857',
        'tertiary-fixed': '#d1fae5',
        'tertiary-fixed-dim': '#10b981',
        'on-tertiary-fixed': '#047857',
        'on-tertiary-fixed-variant': '#065f46',

        // Error
        error: '#dc2626',
        'on-error': '#ffffff',
        'error-container': '#fee2e2',
        'on-error-container': '#b91c1c',

        // Background (light default) — UPDATED to canvas
        background: '#f6f7fb',
        'on-background': '#0f0f12',

        // Dark variants (for OTP / onboarding / splash)
        'dark-bg': '#0f1115',
        'dark-bg-gradient-to': '#1c1f26',
        'dark-surface': '#1c1f26',
        'dark-surface-elevated': '#22262e',
        'dark-on-surface': '#f0f1f2',
        'dark-on-surface-variant': '#9ca3af',
        'dark-outline': '#2e3338',
      },
      fontFamily: {
        'inter': ['Inter_400Regular'],
        'inter-medium': ['Inter_500Medium'],
        'inter-semibold': ['Inter_600SemiBold'],
        'inter-bold': ['Inter_700Bold'],
        'geist': ['Geist_500Medium'],
        'geist-semibold': ['Geist_600SemiBold'],
      },
      fontSize: {
        // Modern premium scale (use these in new screens)
        'display':  ['34px', { lineHeight: '40px', letterSpacing: '-1.0px', fontWeight: '700' }],
        'h1':       ['26px', { lineHeight: '32px', letterSpacing: '-0.6px', fontWeight: '700' }],
        'h2':       ['20px', { lineHeight: '26px', letterSpacing: '-0.3px', fontWeight: '600' }],
        'h3':       ['16px', { lineHeight: '22px', letterSpacing: '-0.2px', fontWeight: '600' }],
        'body':     ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-md':  ['15px', { lineHeight: '22px', fontWeight: '400' }],
        'body-sm':  ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'label':    ['11px', { lineHeight: '14px', letterSpacing: '0.6px', fontWeight: '600' }],
        'caption':  ['11px', { lineHeight: '14px', fontWeight: '500' }],
        'mono-data':['13px', { lineHeight: '18px', fontWeight: '500' }],
        // Legacy aliases (used by auth screens — keep for compat)
        'display-lg': ['48px', { lineHeight: '56px', letterSpacing: '-0.96px', fontWeight: '700' }],
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.32px', fontWeight: '600' }],
        'headline-lg-mobile': ['24px', { lineHeight: '32px', letterSpacing: '-0.24px', fontWeight: '600' }],
        'title-md': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body-lg':  ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'label-caps': ['12px', { lineHeight: '16px', letterSpacing: '0.6px', fontWeight: '600' }],
      },
      spacing: {
        'unit': '4px',
        'stack-sm': '8px',
        'stack-md': '16px',
        'stack-lg': '32px',
        'gutter': '24px',
        'container-padding-mobile': '20px',
        'container-padding-desktop': '40px',
      },
      borderRadius: {
        'sm': '6px',
        DEFAULT: '8px',
        'md': '10px',
        'lg': '14px',
        'xl': '18px',
        '2xl': '22px',
        '3xl': '28px',
        'full': '9999px',
      },
      boxShadow: {
        'card': '0 1px 2px rgba(15,15,18,0.04)',
        'card-md': '0 4px 16px rgba(15,15,18,0.06)',
        'card-lg': '0 8px 28px rgba(15,15,18,0.08)',
        'floating': '0 12px 32px rgba(15,15,18,0.12)',
        'glow-brand': '0 8px 24px rgba(125, 90, 242, 0.28)',
        'glow-success': '0 8px 24px rgba(16, 185, 129, 0.18)',
      },
    },
  },
  plugins: [],
}
