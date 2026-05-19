/**
 * Button — premium variants for the OnSig app.
 *
 *  • primary  → solid ink (#0f0f12) with white text. The workhorse CTA.
 *  • brand    → vivid purple (#7d5af2) with a subtle brand glow. Used for
 *               commit-level actions ("İmzala", "Davetiye Gönder").
 *  • soft     → pale brand tint with brand-700 text — secondary CTA that
 *               still reads as primary intent.
 *  • outline  → white surface, hairline border, ink text — "Vazgeç" etc.
 *  • ghost    → no surface, no border, ink-700 text — inline links / icon
 *               buttons in toolbars.
 *  • danger   → solid red for destructive actions.
 *
 * Heights: 52px default (matches Material 3 expressive guidance for primary
 * buttons in mobile). `size="sm"` drops to 40px for compact rows.
 */
import { ActivityIndicator, Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native'

import { Icon, type MaterialIconName } from './icon'
import { haptic } from '@/lib/haptic'
import { shadows } from '@/lib/shadow'

export type ButtonVariant =
  | 'primary'
  | 'brand'
  | 'soft'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'dark'
  | 'accent'      // legacy alias of `brand` — used by auth screens
  | 'secondary'   // legacy alias of `outline`

interface ButtonProps {
  label: string
  onPress?: () => void
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  iconRight?: MaterialIconName | string
  iconLeft?: MaterialIconName | string
  className?: string
  fullWidth?: boolean
}

interface VariantSpec {
  container: string
  text: string
  iconColor: string
  spinner: string
  shadow?: StyleProp<ViewStyle>
}

const VARIANTS: Record<ButtonVariant, VariantSpec> = {
  primary: {
    container: 'bg-ink-900',
    text: 'text-white',
    iconColor: '#ffffff',
    spinner: '#ffffff',
    shadow: shadows.sm,
  },
  brand: {
    container: 'bg-brand-500',
    text: 'text-white',
    iconColor: '#ffffff',
    spinner: '#ffffff',
    shadow: shadows.brand,
  },
  soft: {
    container: 'bg-brand-50',
    text: 'text-brand-700',
    iconColor: '#5a30d0',
    spinner: '#5a30d0',
  },
  outline: {
    container: 'bg-card border border-hairline-strong',
    text: 'text-ink-900',
    iconColor: '#0f0f12',
    spinner: '#0f0f12',
  },
  ghost: {
    container: 'bg-transparent',
    text: 'text-ink-700',
    iconColor: '#2a2d33',
    spinner: '#2a2d33',
  },
  danger: {
    container: 'bg-danger-500',
    text: 'text-white',
    iconColor: '#ffffff',
    spinner: '#ffffff',
    shadow: shadows.sm,
  },
  // Legacy alias (kept for auth screens). Same visual as `brand`.
  dark: {
    container: 'bg-brand-600',
    text: 'text-white',
    iconColor: '#ffffff',
    spinner: '#ffffff',
    shadow: shadows.brand,
  },
  accent: {
    container: 'bg-brand-500',
    text: 'text-white',
    iconColor: '#ffffff',
    spinner: '#ffffff',
    shadow: shadows.brand,
  },
  secondary: {
    container: 'bg-card border border-hairline-strong',
    text: 'text-ink-900',
    iconColor: '#0f0f12',
    spinner: '#0f0f12',
  },
}

const SIZES = {
  sm: { height: 40, padding: 'px-3.5', text: 'text-[13px]', radius: 'rounded-xl', iconSize: 16 },
  md: { height: 52, padding: 'px-4',   text: 'text-[15px]', radius: 'rounded-2xl', iconSize: 18 },
  lg: { height: 60, padding: 'px-5',   text: 'text-[16px]', radius: 'rounded-2xl', iconSize: 20 },
} as const

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  iconLeft,
  iconRight,
  className,
  fullWidth = true,
}: ButtonProps) {
  const v = VARIANTS[variant]
  const s = SIZES[size]
  const isDisabled = disabled || loading

  return (
    <Pressable
      onPress={() => {
        if (isDisabled) return
        haptic.light()
        onPress?.()
      }}
      disabled={isDisabled}
      className={[
        'flex-row items-center justify-center gap-2',
        s.padding,
        s.radius,
        v.container,
        fullWidth ? 'w-full' : '',
        isDisabled ? 'opacity-50' : 'active:opacity-90',
        className ?? '',
      ].join(' ')}
      style={({ pressed }) => [
        { height: s.height, transform: [{ scale: pressed && !isDisabled ? 0.98 : 1 }] },
        v.shadow,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.spinner} />
      ) : (
        <View className="flex-row items-center gap-2">
          {iconLeft ? <Icon name={iconLeft} size={s.iconSize} color={v.iconColor} /> : null}
          <Text className={`font-inter-semibold ${s.text} ${v.text}`}>{label}</Text>
          {iconRight ? <Icon name={iconRight} size={s.iconSize} color={v.iconColor} /> : null}
        </View>
      )}
    </Pressable>
  )
}
