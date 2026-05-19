import type { Config } from 'tailwindcss'

/**
 * OnSig design tokens.
 *
 * The palette is intentionally NOT another pastel SaaS template. We lean on:
 *   - a tightly-stepped neutral scale (`ink-1` → `ink-12`) for premium hierarchy
 *   - a single signature accent (`iris-9`, a Stripe/Linear-leaning indigo)
 *   - subtle, multi-stop elevation shadows
 *   - tight type ramp (Inter Tight for display) with friction-free spacing
 *
 * Existing class aliases (`brand`, `brand-deep`, `brand-soft`, `ink`, `ink-muted`)
 * are preserved so already-written pages keep working while they migrate to the
 * full scale.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Neutral scale (warm-neutral, near-black at the top) ────────────
        // Keys are written as strings to keep Tailwind JIT happy in TS configs.
        ink: {
          '1': '#FBFBFD',
          '2': '#F6F7F9',
          '3': '#EFF0F4',
          '4': '#E5E7EC',
          '5': '#D2D5DD',
          '6': '#A7ABB7',
          '7': '#7D8294',
          '8': '#5C6173',
          '9': '#3F4658',
          '10': '#262C3E',
          '11': '#161B2A',
          '12': '#0B0F1B',
          DEFAULT: '#0B0F1B', // legacy alias → ink-12
          muted: '#5C6173',   // legacy alias → ink-8
        },

        // ── Iris accent (single signature color, used sparingly) ───────────
        iris: {
          '1': '#F6F5FF',
          '2': '#EDECFF',
          '3': '#DCDAFE',
          '4': '#C3C0FE',
          '5': '#A5A0FC',
          '6': '#8782F8',
          '7': '#7069F0',
          '8': '#5E55E5',
          '9': '#4F46E5',
          '10': '#3B33C0',
          '11': '#2A2495',
        },

        // ── Legacy aliases for already-written pages ───────────────────────
        brand: {
          DEFAULT: '#5E55E5',
          deep: '#3B33C0',
          soft: '#EDECFF',
        },

        paper: '#FFFFFF',
        // Tailwind JIT'in `surface-1`/`surface-2` child key'leri yüzünden bare
        // `bg-surface` class'ı bazı durumlarda DEFAULT olmadığında üretilemiyor.
        // `DEFAULT` ile birlikte tam bir namespace olarak veriyoruz.
        surface: {
          DEFAULT: '#FBFBFD',
          '1': '#F6F7F9',
          '2': '#EFF0F4',
        },

        divider: 'rgba(8, 13, 27, 0.06)',
        'divider-strong': 'rgba(8, 13, 27, 0.10)',

        // ── Status tokens ──────────────────────────────────────────────────
        success: {
          DEFAULT: '#10B981',
          soft: '#E6FAF1',
          deep: '#047857',
        },
        warning: {
          DEFAULT: '#F59E0B',
          soft: '#FEF6E1',
          deep: '#B45309',
        },
        danger: {
          DEFAULT: '#EF4444',
          soft: '#FEECEC',
          deep: '#B91C1C',
        },
        info: {
          DEFAULT: '#0EA5E9',
          soft: '#E1F4FE',
          deep: '#0369A1',
        },

        // legacy semantic aliases
        ok: '#10B981',
        warn: '#F59E0B',
      },

      fontFamily: {
        sans: [
          'InterVariable',
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
        display: [
          '"Inter Tight"',
          'InterVariable',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          '"SF Mono"',
          'ui-monospace',
          'Menlo',
          'monospace',
        ],
        serif: [
          '"Source Serif Pro"',
          '"Source Serif"',
          'Charter',
          'Georgia',
          'serif',
        ],
      },

      fontSize: {
        // Slightly tighter line-heights than Tailwind defaults for denser UI.
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],
        xs: ['0.75rem', { lineHeight: '1.05rem', letterSpacing: '0.005em' }],
        sm: ['0.8125rem', { lineHeight: '1.15rem' }],
        base: ['0.875rem', { lineHeight: '1.35rem' }],
        md: ['0.9375rem', { lineHeight: '1.45rem' }],
        lg: ['1.0625rem', { lineHeight: '1.55rem', letterSpacing: '-0.005em' }],
        xl: ['1.1875rem', { lineHeight: '1.65rem', letterSpacing: '-0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '1.85rem', letterSpacing: '-0.015em' }],
        '3xl': ['1.875rem', { lineHeight: '2.15rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.375rem', { lineHeight: '2.55rem', letterSpacing: '-0.025em' }],
        '5xl': ['3rem', { lineHeight: '3.2rem', letterSpacing: '-0.03em' }],
        // ── Marketing / editorial scale (display + body) ────────────────────
        'body-md': ['1rem', { lineHeight: '1.55rem' }],
        'body-lg': [
          '1.125rem',
          { lineHeight: '1.75rem', letterSpacing: '-0.005em' },
        ],
        'display-sm': [
          '2rem',
          { lineHeight: '2.2rem', letterSpacing: '-0.025em' },
        ],
        'display-md': [
          '2.5rem',
          { lineHeight: '2.65rem', letterSpacing: '-0.03em' },
        ],
        'display-lg': [
          '3.25rem',
          { lineHeight: '3.4rem', letterSpacing: '-0.035em' },
        ],
        'display-xl': [
          '3.75rem',
          { lineHeight: '3.85rem', letterSpacing: '-0.04em' },
        ],
        'display-2xl': [
          '4.5rem',
          { lineHeight: '4.5rem', letterSpacing: '-0.045em' },
        ],
      },

      letterSpacing: {
        tightest: '-0.04em',
      },

      borderRadius: {
        xs: '4px',
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
        xl: '14px',
        '2xl': '18px',
        '3xl': '24px',
        card: '14px',
        pill: '999px',
      },

      boxShadow: {
        xs: '0 1px 0 rgba(11, 15, 27, 0.04)',
        sm: '0 1px 2px rgba(11, 15, 27, 0.04), 0 1px 1px rgba(11, 15, 27, 0.03)',
        DEFAULT:
          '0 1px 2px rgba(11, 15, 27, 0.04), 0 4px 12px rgba(11, 15, 27, 0.05)',
        md: '0 2px 4px rgba(11, 15, 27, 0.04), 0 8px 24px rgba(11, 15, 27, 0.06)',
        lg: '0 6px 16px rgba(11, 15, 27, 0.06), 0 16px 48px rgba(11, 15, 27, 0.08)',
        pop: '0 12px 32px rgba(11, 15, 27, 0.10), 0 28px 64px rgba(11, 15, 27, 0.12)',
        ring: '0 0 0 1px rgba(11, 15, 27, 0.06), 0 1px 2px rgba(11, 15, 27, 0.04)',
        'ring-strong':
          '0 0 0 1px rgba(11, 15, 27, 0.10), 0 1px 2px rgba(11, 15, 27, 0.04)',
        'inner-line': 'inset 0 1px 0 rgba(255, 255, 255, 0.55)',
        glow: '0 0 0 4px rgba(94, 85, 229, 0.16)',
        card: '0 1px 2px rgba(11, 15, 27, 0.04), 0 4px 12px rgba(11, 15, 27, 0.06)',
        sidebar:
          '0 1px 2px rgba(11, 15, 27, 0.05), 0 24px 48px -24px rgba(11, 15, 27, 0.18)',
      },

      transitionTimingFunction: {
        emphasized: 'cubic-bezier(0.16, 1, 0.3, 1)',
        gentle: 'cubic-bezier(0.4, 0, 0.2, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      transitionDuration: {
        50: '50ms',
        120: '120ms',
        180: '180ms',
        220: '220ms',
        320: '320ms',
        420: '420ms',
      },

      backdropBlur: {
        xs: '2px',
        glass: '14px',
      },

      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(8px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'translate(-50%, -50%) scale(0.96)' },
          to: { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },

      animation: {
        'fade-in': 'fade-in 180ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-up': 'slide-up 220ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in-right':
          'slide-in-right 220ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in': 'scale-in 180ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-soft': 'pulse-soft 1.8s ease-in-out infinite',
        shimmer: 'shimmer 1.6s linear infinite',
        'accordion-down':
          'accordion-down 260ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'accordion-up': 'accordion-up 220ms cubic-bezier(0.4, 0, 0.2, 1) both',
        marquee: 'marquee 32s linear infinite',
      },

      backgroundImage: {
        'grid-faint':
          'linear-gradient(rgba(11, 15, 27, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(11, 15, 27, 0.04) 1px, transparent 1px)',
        'dotted-faint':
          'radial-gradient(rgba(11, 15, 27, 0.08) 1px, transparent 1px)',
        'iris-radial':
          'radial-gradient(120% 80% at 0% 0%, rgba(94, 85, 229, 0.18) 0%, rgba(94, 85, 229, 0) 60%)',
        'iris-hero':
          'linear-gradient(135deg, #0B0F1B 0%, #161B2A 45%, #2A2495 100%)',
      },

      backgroundSize: {
        'grid-md': '32px 32px',
        'dotted-md': '24px 24px',
      },
    },
  },
  plugins: [],
}

export default config
