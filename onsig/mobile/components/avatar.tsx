/**
 * Avatar — initials on a hash-stable gradient.
 *
 * Looks identical to Slack/Linear's profile avatars: a duotone gradient from
 * one of five curated palettes, picked deterministically from the user's
 * name so the same person always renders the same colour. Bold white initials
 * with a tight character ceiling (2) keep the disc legible at all sizes.
 *
 * The `subtle` variant skips the gradient and renders as a tinted brand chip —
 * useful for tertiary contexts (recipients on a contract detail row, etc.)
 * where a gradient would dominate the layout.
 */
import { LinearGradient } from 'expo-linear-gradient'
import { Text, View } from 'react-native'

interface AvatarProps {
  name?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'gradient' | 'subtle' | 'soft'
  status?: 'online' | 'signed' | 'pending' | null
}

const SIZES = {
  xs: { box: 24, font: 9 },
  sm: { box: 32, font: 11 },
  md: { box: 40, font: 13 },
  lg: { box: 48, font: 16 },
  xl: { box: 64, font: 22 },
} as const

const PALETTES: [string, string][] = [
  ['#9c83f9', '#5a30d0'], // brand purple
  ['#34d399', '#047857'], // emerald
  ['#fbbf24', '#b45309'], // amber
  ['#fb7185', '#b91c1c'], // rose
  ['#60a5fa', '#1d4ed8'], // blue
  ['#f472b6', '#9d174d'], // pink
  ['#22d3ee', '#0e7490'], // cyan
]

function paletteFor(name?: string | null): [string, string] {
  if (!name) return PALETTES[0]!
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return PALETTES[hash % PALETTES.length]!
}

function initials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase()
}

const STATUS_COLOR = {
  online: '#10b981',
  signed: '#10b981',
  pending: '#f59e0b',
} as const

export function Avatar({ name, size = 'md', variant = 'gradient', status }: AvatarProps) {
  const dim = SIZES[size]
  const text = initials(name)

  const body =
    variant === 'gradient' ? (
      <LinearGradient
        colors={paletteFor(name)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: dim.box,
          height: dim.box,
          borderRadius: dim.box / 2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          className="font-inter-bold text-white"
          style={{ fontSize: dim.font, includeFontPadding: false }}
        >
          {text}
        </Text>
      </LinearGradient>
    ) : variant === 'soft' ? (
      <View
        className="bg-brand-100 items-center justify-center"
        style={{ width: dim.box, height: dim.box, borderRadius: dim.box / 2 }}
      >
        <Text
          className="font-inter-bold text-brand-700"
          style={{ fontSize: dim.font, includeFontPadding: false }}
        >
          {text}
        </Text>
      </View>
    ) : (
      <View
        className="bg-subtle border border-hairline items-center justify-center"
        style={{ width: dim.box, height: dim.box, borderRadius: dim.box / 2 }}
      >
        <Text
          className="font-inter-semibold text-ink-700"
          style={{ fontSize: dim.font, includeFontPadding: false }}
        >
          {text}
        </Text>
      </View>
    )

  if (!status) return body

  const dot = Math.max(8, Math.round(dim.box * 0.28))
  return (
    <View>
      {body}
      <View
        className="absolute right-0 bottom-0 border-2 border-card rounded-full"
        style={{
          width: dot,
          height: dot,
          backgroundColor: STATUS_COLOR[status],
        }}
      />
    </View>
  )
}

export { paletteFor as avatarPaletteFor }
