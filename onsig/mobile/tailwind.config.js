/**
 * OnSig Mobile — Tailwind/NativeWind tokens
 *
 * Source of truth: `stitch_onsig_premium_mobil_aray_z/onsig_design_system/DESIGN.md`
 * Brand: "High-Performance Legal" — Linear/Stripe inspired, glassmorphism accents.
 *
 * Note on dark screens: OTP/onboarding/splash use a deep obsidian background
 * (`#0f1115` radial → `#1c1f26`). For those screens we expose `dark.*` tokens
 * that are explicit (no `dark:` prefix needed) so a screen can render in dark
 * even when the system is in light mode (and vice-versa).
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // ─── Surface (light) ────────────────────────────────────────────────
        surface: '#f8f9fa',
        'surface-dim': '#d9dadb',
        'surface-bright': '#f8f9fa',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f3f4f5',
        'surface-container': '#edeeef',
        'surface-container-high': '#e7e8e9',
        'surface-container-highest': '#e1e3e4',
        'surface-variant': '#e1e3e4',
        'surface-tint': '#5e5e5e',

        // ─── On-surface (text/ink) ──────────────────────────────────────────
        'on-surface': '#191c1d',
        'on-surface-variant': '#4c4546',
        'inverse-surface': '#2e3132',
        'inverse-on-surface': '#f0f1f2',
        outline: '#7e7576',
        'outline-variant': '#cfc4c5',

        // ─── Primary (Black / Graphite) ─────────────────────────────────────
        primary: '#000000',
        'on-primary': '#ffffff',
        'primary-container': '#1b1b1b',
        'on-primary-container': '#848484',
        'inverse-primary': '#c6c6c6',
        'primary-fixed': '#e2e2e2',
        'primary-fixed-dim': '#c6c6c6',
        'on-primary-fixed': '#1b1b1b',
        'on-primary-fixed-variant': '#474747',

        // ─── Secondary (Vivid Purple — "İmzala" actions) ────────────────────
        secondary: '#6b38d4',
        'on-secondary': '#ffffff',
        'secondary-container': '#8455ef',
        'on-secondary-container': '#fffbff',
        'secondary-fixed': '#e9ddff',
        'secondary-fixed-dim': '#d0bcff',
        'on-secondary-fixed': '#23005c',
        'on-secondary-fixed-variant': '#5516be',

        // ─── Tertiary (Emerald — completed signatures, success) ─────────────
        tertiary: '#000000',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#002113',
        'on-tertiary-container': '#009668',
        'tertiary-fixed': '#6ffbbe',
        'tertiary-fixed-dim': '#4edea3',
        'on-tertiary-fixed': '#002113',
        'on-tertiary-fixed-variant': '#005236',

        // ─── Error ──────────────────────────────────────────────────────────
        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',

        // ─── Background (light default) ─────────────────────────────────────
        background: '#f8f9fa',
        'on-background': '#191c1d',

        // ─── Dark variants (for OTP / onboarding / splash) ─────────────────
        // Don't add as a "dark:" colorScheme — use explicitly like `bg-dark-bg`.
        'dark-bg': '#0f1115',
        'dark-bg-gradient-to': '#1c1f26',
        'dark-surface': '#1c1f26',
        'dark-surface-elevated': '#22262e',
        'dark-on-surface': '#f0f1f2',
        'dark-on-surface-variant': '#9ca3af',
        'dark-outline': '#2e3338',
      },
      fontFamily: {
        // Loaded via @expo-google-fonts/* in app/_layout.tsx
        'inter': ['Inter_400Regular'],
        'inter-medium': ['Inter_500Medium'],
        'inter-semibold': ['Inter_600SemiBold'],
        'inter-bold': ['Inter_700Bold'],
        'geist': ['Geist_500Medium'],
        'geist-semibold': ['Geist_600SemiBold'],
      },
      fontSize: {
        // DESIGN.md typography scale
        'display-lg': ['48px', { lineHeight: '56px', letterSpacing: '-0.96px', fontWeight: '700' }],
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.32px', fontWeight: '600' }],
        'headline-lg-mobile': ['24px', { lineHeight: '32px', letterSpacing: '-0.24px', fontWeight: '600' }],
        'title-md': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'label-caps': ['12px', { lineHeight: '16px', letterSpacing: '0.6px', fontWeight: '600' }],
        'mono-data': ['13px', { lineHeight: '18px', fontWeight: '500' }],
      },
      spacing: {
        // 4px baseline grid + named tokens from DESIGN.md
        'unit': '4px',
        'stack-sm': '8px',
        'stack-md': '16px',
        'stack-lg': '32px',
        'gutter': '24px',
        'container-padding-mobile': '16px',
        'container-padding-desktop': '40px',
      },
      borderRadius: {
        // DESIGN.md "Soft-Modern" geometric language
        'sm': '4px',
        DEFAULT: '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '32px',
        '3xl': '48px',
        'full': '9999px',
      },
      boxShadow: {
        // Layered Sophistication — soft diffused shadows for floating elements
        'card': '0 1px 2px rgba(0,0,0,0.04)',
        'floating': '0 8px 32px rgba(0,0,0,0.08)',
        'glow-secondary': '0 0 40px rgba(132, 85, 239, 0.25)',
        'glow-success': '0 0 32px rgba(78, 222, 163, 0.2)',
      },
    },
  },
  plugins: [],
}
