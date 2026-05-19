/**
 * OnSig design tokens — single source of truth.
 *
 * Tokens are exposed in three shapes:
 *   1. `tokens` object   — TS runtime values (charts, canvas, SVG, dynamic CSS)
 *   2. `--onsig-*` vars  — emitted in `globals.css` for the customer app
 *   3. `--a-*` vars      — emitted under `.admin-shell` for the operator console
 *
 * IMPORTANT: Tailwind classes are still the primary consumption channel. Pull
 * from this object only when authoring a primitive that needs a token at
 * runtime (e.g. dynamic Recharts colors). Do NOT mirror tokens into per-file
 * constants — extend this module instead.
 *
 * Naming conventions
 * ──────────────────
 *   color.ink.{1..12}      neutral scale, light surface (1) → ink black (12)
 *   color.iris.{1..11}     primary brand scale
 *   color.admin.*          dark operator-console surface scale
 *   color.semantic.{key}   success/warning/danger/info with {bg,fg,solid,ring}
 *
 * Edit checklist
 * ──────────────
 *   1. Update the token here.
 *   2. Mirror the Tailwind class in `tailwind.config.ts` (color/spacing).
 *   3. Mirror the CSS var in `globals.css` (if it ships as a `--onsig-*` var).
 *   4. Bump `tokens.version` so consumers can detect drift.
 */

export const tokens = {
  version: '1.1.0',

  // ───────────────────────────────────────────────────────────────────────
  // Color
  // ───────────────────────────────────────────────────────────────────────
  color: {
    /** Neutral / "ink" scale — light surface (1) to near-black (12). */
    ink: {
      '1':  '#FBFBFD',
      '2':  '#F6F7F9',
      '3':  '#EFF0F4',
      '4':  '#E5E7EC',
      '5':  '#D2D5DD',
      '6':  '#A7ABB7',
      '7':  '#7D8294',
      '8':  '#5C6173',
      '9':  '#3F4658',
      '10': '#262C3E',
      '11': '#161B2A',
      '12': '#0B0F1B',
    },
    /** Primary brand "iris" — used for the hero gradient and the CTAs. */
    iris: {
      '1':  '#F6F5FF',
      '2':  '#EDECFF',
      '3':  '#DCDAFE',
      '4':  '#C3C0FE',
      '5':  '#A5A0FC',
      '6':  '#8782F8',
      '7':  '#7069F0',
      '8':  '#5E55E5',
      '9':  '#4F46E5',
      '10': '#3B33C0',
      '11': '#2A2495',
    },
    paper: '#FFFFFF',
    surface: '#FBFBFD',
    divider: 'rgba(8, 13, 27, 0.06)',
    dividerStrong: 'rgba(8, 13, 27, 0.10)',

    /** Operator-console dark scale. Mirrored as `--a-*` under `.admin-shell`. */
    admin: {
      bg:     '#0A0D14',
      bgElev: '#0E121C',
      panel:  '#121724',
      panel2: '#161C2D',
      line:   'rgba(255,255,255,0.06)',
      line2:  'rgba(255,255,255,0.10)',
      line3:  'rgba(255,255,255,0.16)',
      text1:  '#F1F3F8',
      text2:  '#C4CAD9',
      text3:  '#8B92A6',
      text4:  '#5A6276',
      text5:  '#3F465A',
      accent: '#7C77FF',
      accent2:'#5E55E5',
    },

    /** Semantic colors — each tone ships bg/fg/solid/ring quartet. */
    semantic: {
      success: { bg: '#E6FAF1', fg: '#047857', solid: '#10B981', ring: 'rgba(16,185,129,0.20)' },
      warning: { bg: '#FEF6E1', fg: '#B45309', solid: '#F59E0B', ring: 'rgba(245,158,11,0.20)' },
      danger:  { bg: '#FEECEC', fg: '#B91C1C', solid: '#EF4444', ring: 'rgba(239,68,68,0.20)' },
      info:    { bg: '#E1F4FE', fg: '#0369A1', solid: '#0EA5E9', ring: 'rgba(14,165,233,0.20)' },
    },

    /** Chart-only palette — kept in `chart-tokens.ts` for RSC compatibility. */
    chart: {
      iris:     '#7C77FF',
      irisDim:  '#5E55E5',
      teal:     '#2DD4BF',
      amber:    '#F59E0B',
      rose:     '#F87171',
      sky:      '#38BDF8',
      slate:    '#64748B',
      emerald:  '#10B981',
      violet:   '#A78BFA',
      fuchsia:  '#E879F9',
    },
  },

  // ───────────────────────────────────────────────────────────────────────
  // Spacing & layout
  // ───────────────────────────────────────────────────────────────────────
  /**
   * 4-pt baseline. Opinions:
   *   - dense UI prefers 2–6 (8–24px) over 8+
   *   - layout shell uses 8/10/12/16 (32/40/48/64) for the outer chrome
   *   - admin DS uses 1–4 (4–16px) primarily — see `density` below
   */
  space: {
    '0':   '0px',
    '0.5': '2px',
    '1':   '4px',
    '1.5': '6px',
    '2':   '8px',
    '2.5': '10px',
    '3':   '12px',
    '3.5': '14px',
    '4':   '16px',
    '5':   '20px',
    '6':   '24px',
    '7':   '28px',
    '8':   '32px',
    '10':  '40px',
    '12':  '48px',
    '16':  '64px',
    '20':  '80px',
    '24':  '96px',
    '32':  '128px',
  },

  /** Densities used by tables / panels / list rows. */
  density: {
    compact:  { rowH: 28, gutter: 8,  fontSize: 12.5 },
    normal:   { rowH: 36, gutter: 12, fontSize: 13   },
    spacious: { rowH: 44, gutter: 16, fontSize: 14   },
  },

  // ───────────────────────────────────────────────────────────────────────
  // Radius
  // ───────────────────────────────────────────────────────────────────────
  radius: {
    xs:  '4px',
    sm:  '6px',
    md:  '10px',
    lg:  '12px',
    xl:  '14px',
    '2xl': '18px',
    '3xl': '24px',
    pill: '9999px',
  },

  // ───────────────────────────────────────────────────────────────────────
  // Shadows (light app)
  // ───────────────────────────────────────────────────────────────────────
  shadow: {
    xs:  '0 1px 0 rgba(11, 15, 27, 0.04)',
    sm:  '0 1px 2px rgba(11, 15, 27, 0.04), 0 1px 1px rgba(11, 15, 27, 0.03)',
    md:  '0 2px 4px rgba(11, 15, 27, 0.04), 0 8px 24px rgba(11, 15, 27, 0.06)',
    lg:  '0 6px 16px rgba(11, 15, 27, 0.06), 0 16px 48px rgba(11, 15, 27, 0.08)',
    pop: '0 12px 32px rgba(11, 15, 27, 0.10), 0 28px 64px rgba(11, 15, 27, 0.12)',
    ring:       '0 0 0 1px rgba(11, 15, 27, 0.06), 0 1px 2px rgba(11, 15, 27, 0.04)',
    ringStrong: '0 0 0 1px rgba(11, 15, 27, 0.10), 0 1px 2px rgba(11, 15, 27, 0.04)',
    glow: '0 0 0 4px rgba(94, 85, 229, 0.16)',
    /** Dark-mode operator-console shadows. */
    admin: {
      ring: '0 0 0 1px rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.32)',
      pop:  '0 12px 32px -8px rgba(0,0,0,0.60)',
      glow: '0 0 0 4px rgba(124,119,255,0.28)',
    },
  },

  // ───────────────────────────────────────────────────────────────────────
  // Typography
  // ───────────────────────────────────────────────────────────────────────
  type: {
    family: {
      display: '"Inter Tight", InterVariable, Inter, system-ui, sans-serif',
      sans:    'InterVariable, Inter, system-ui, sans-serif',
      mono:    '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, monospace',
      serif:   '"Source Serif Pro", "Source Serif", Charter, Georgia, serif',
    },
    /** Scale (pixels). Hooked into Tailwind via `theme.fontSize`. */
    size: {
      '2xs':  11,
      xs:     12,
      sm:     13,
      base:   14,
      md:     15,
      lg:     17,
      xl:     19,
      '2xl':  24,
      '3xl':  30,
      '4xl':  38,
      '5xl':  48,
      /** Marketing-only display sizes. */
      displaySm:  32,
      displayMd:  40,
      displayLg:  52,
      displayXl:  60,
      display2xl: 72,
    },
    weight:  { regular: 400, medium: 500, semibold: 600, bold: 700 },
    tracking:{
      tightest: '-0.04em',
      tight:    '-0.02em',
      snug:     '-0.01em',
      normal:   '0em',
      loose:    '0.04em',
      overline: '0.16em',
    },
    leading: {
      none:    1.0,
      tight:   1.15,
      snug:    1.35,
      normal:  1.5,
      relaxed: 1.65,
      loose:   1.8,
    },
  },

  // ───────────────────────────────────────────────────────────────────────
  // Z-index — a single, well-ordered scale prevents stacking wars.
  // ───────────────────────────────────────────────────────────────────────
  z: {
    base:        0,
    raised:      10,   // hover overlays, list-item highlight rings
    sidebar:     20,
    topbar:      30,
    sticky:      35,
    dropdown:    40,
    popover:     45,
    overlay:     50,   // dialog backdrop
    modal:       55,
    sheet:       55,   // right-side detail drawer
    toast:       65,
    tooltip:     70,
    cmdPalette:  80,
    inspector:   90,
    devOverlay:  9999,
  },

  // ───────────────────────────────────────────────────────────────────────
  // Breakpoints — must match `tailwind.config.ts` `theme.screens`.
  // ───────────────────────────────────────────────────────────────────────
  breakpoint: {
    sm:  640,
    md:  768,
    lg:  1024,
    xl:  1280,
    '2xl': 1536,
  },

  // ───────────────────────────────────────────────────────────────────────
  // Motion — duration & easing primitives.
  // The full motion vocabulary lives in `./motion.ts`.
  // ───────────────────────────────────────────────────────────────────────
  motion: {
    duration: {
      instant:    50,
      micro:     120,
      base:      180,
      emphasized:220,
      pronounced:320,
      narrative: 420,
    },
    easing: {
      emphasized: 'cubic-bezier(0.16, 1, 0.3, 1)',
      gentle:     'cubic-bezier(0.4, 0, 0.2, 1)',
      spring:     'cubic-bezier(0.34, 1.56, 0.64, 1)',
      linear:     'linear',
    },
  },

  // ───────────────────────────────────────────────────────────────────────
  // Iconography — Lucide as the single icon source.
  // ───────────────────────────────────────────────────────────────────────
  icon: {
    size: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
    },
    strokeWidth: 1.75,
  },

  // ───────────────────────────────────────────────────────────────────────
  // Focus / interaction
  // ───────────────────────────────────────────────────────────────────────
  focus: {
    ringColor:   'rgba(94, 85, 229, 0.55)',
    ringOffset:  2,
    ringWidth:   2,
    ringRadius:  6,
  },

  // ───────────────────────────────────────────────────────────────────────
  // Container widths
  // ───────────────────────────────────────────────────────────────────────
  container: {
    app:        '72rem',   // 1152px — customer app card
    marketing:  '76rem',   // 1216px — landing pages
    admin:      '88rem',   // 1408px — operator console
    article:    '40rem',   // 640px  — legal docs, blog posts
  },
} as const

// ── Legacy named exports (kept for existing imports) ────────────────────────
export const color  = tokens.color
export const space  = tokens.space
export const radius = tokens.radius
export const shadow = tokens.shadow
export const type   = tokens.type

export type Tokens       = typeof tokens
export type ColorTokens  = typeof tokens.color
export type SpaceTokens  = typeof tokens.space
export type RadiusTokens = typeof tokens.radius
export type ShadowTokens = typeof tokens.shadow
export type TypeTokens   = typeof tokens.type
export type ZTokens      = typeof tokens.z
