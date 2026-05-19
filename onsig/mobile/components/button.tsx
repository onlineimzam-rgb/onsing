/**
 * Button — Primary / Secondary / Accent (DESIGN.md §Components → Buttons).
 *
 * - `primary`   → Solid black (#000) with white text. Hover lightens 10%.
 * - `secondary` → White bg + 1px outline-variant border (used for "Vazgeç" etc.).
 * - `accent`    → Vivid purple (`secondary` token) for "İmzala", "Gönder".
 * - `dark`      → Same as accent but optimized for dark backgrounds (OTP).
 *
 * Press effect mimics the spec: scale 0.98 + slight opacity dip.
 */
import * as Haptics from 'expo-haptics'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'

import { Icon, type MaterialIconName } from './icon'

type Variant = 'primary' | 'secondary' | 'accent' | 'dark'

interface ButtonProps {
  label: string
  onPress?: () => void
  variant?: Variant
  loading?: boolean
  disabled?: boolean
  iconRight?: MaterialIconName | string
  iconLeft?: MaterialIconName | string
  className?: string
}

const VARIANTS: Record<
  Variant,
  { container: string; text: string; iconColor: string; spinner: string }
> = {
  primary: {
    container: 'bg-primary',
    text: 'text-on-primary',
    iconColor: '#ffffff',
    spinner: '#ffffff',
  },
  secondary: {
    container: 'bg-surface-container-lowest border border-outline-variant',
    text: 'text-on-surface',
    iconColor: '#191c1d',
    spinner: '#191c1d',
  },
  accent: {
    container: 'bg-secondary-container shadow-glow-secondary',
    text: 'text-on-secondary-container',
    iconColor: '#ffffff',
    spinner: '#ffffff',
  },
  dark: {
    container: 'bg-secondary-container shadow-glow-secondary',
    text: 'text-white',
    iconColor: '#ffffff',
    spinner: '#ffffff',
  },
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  iconLeft,
  iconRight,
  className,
}: ButtonProps) {
  const v = VARIANTS[variant]
  const isDisabled = disabled || loading

  return (
    <Pressable
      onPress={() => {
        if (isDisabled) return
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
        onPress?.()
      }}
      disabled={isDisabled}
      className={[
        'h-[60px] rounded-2xl flex-row items-center justify-center gap-2 active:opacity-90',
        v.container,
        isDisabled ? 'opacity-40' : '',
        className ?? '',
      ].join(' ')}
      style={({ pressed }) => ({
        transform: [{ scale: pressed && !isDisabled ? 0.98 : 1 }],
      })}
    >
      {loading ? (
        <ActivityIndicator color={v.spinner} />
      ) : (
        <View className="flex-row items-center gap-2">
          {iconLeft ? <Icon name={iconLeft} size={20} color={v.iconColor} /> : null}
          <Text className={`font-inter-semibold text-[17px] ${v.text}`}>{label}</Text>
          {iconRight ? <Icon name={iconRight} size={20} color={v.iconColor} /> : null}
        </View>
      )}
    </Pressable>
  )
}
